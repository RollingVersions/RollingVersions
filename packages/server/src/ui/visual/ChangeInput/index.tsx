import React from 'react';
import GitHubMarkdown from '../GitHubMarkdown/async';
import TextareaAutosize from 'react-textarea-autosize';
import useChanges from '../../hooks/useChanges';

export interface ChangeInputProps {
  localId: number;
  title: string;
  body: string;
  disabled: boolean;
  readOnly: boolean;
  onChange: (changeSetEntry: {
    localId: number;
    title: string;
    body: string;
  }) => void;
  onFocus?: (id: number) => void;
  onBlur?: (id: number) => void;
}

export interface ChangeInputListProps {
  children: React.ReactNode;
}

export function ChangeInputList({children}: ChangeInputListProps) {
  return (
    <ul className="max-w-2xl w-full pl-0">
      {React.Children.map(children, (child, i) => (
        <li className={`${i === 0 ? '' : 'mt-4'} flex w-full`}>
          <div className="flex items-center mr-2" style={{height: 40}}>
            <div>•</div>
          </div>
          <div className="flex-grow flex-shrink overflow-hidden">{child}</div>
        </li>
      ))}
    </ul>
  );
}

const inc = (n: number) => n + 1;
const dec = (n: number) => n - 1;

function useTrackFocus() {
  const [count, setCount] = React.useState(0);
  const onFocus = React.useCallback(() => setCount(inc), []);
  const onBlur = React.useCallback(() => setCount(dec), []);
  return {focused: count !== 0, onFocus, onBlur};
}
type MakeRefMutable<T> = T extends React.RefObject<infer S>
  ? React.MutableRefObject<S | null>
  : unknown;
const ChangeInput = React.forwardRef<HTMLTextAreaElement, ChangeInputProps>(
  function ChangeInput(
    {
      localId,
      title,
      body,
      disabled,
      readOnly,
      onChange,
      onFocus,
      onBlur,
    }: ChangeInputProps,
    ref,
  ) {
    const titleRef = React.useRef<HTMLTextAreaElement | null>(null);
    const titleFocus = useTrackFocus();
    const bodyFocus = useTrackFocus();

    const isFocused = titleFocus.focused || bodyFocus.focused;
    const [isFocusedDebounced, setIsFocusedDebounced] = React.useState(
      isFocused,
    );
    // delay handling blur a tiny bit so that we don't handle blur when tabbing between fields, but ensure focus is always immediate
    React.useLayoutEffect(() => {
      if (isFocused) {
        setIsFocusedDebounced(true);
        return undefined;
      } else {
        const timeout = setTimeout(() => {
          setIsFocusedDebounced(false);
        }, 15);
        return () => clearTimeout(timeout);
      }
    }, [isFocused]);

    useChanges(() => {
      if (isFocused) {
        if (onFocus) onFocus(localId);
      } else {
        if (onBlur) onBlur(localId);

        if (!title.trim() && body.trim() && titleRef.current) {
          titleRef.current.focus();
        }
      }
    }, [isFocusedDebounced]);

    if (readOnly) {
      return (
        <div>
          <div className="p-2">
            <GitHubMarkdown inline>{title}</GitHubMarkdown>
          </div>
          {body.trim() && (
            <div className="p-2">
              <GitHubMarkdown>{body}</GitHubMarkdown>
            </div>
          )}
        </div>
      );
    }
    const showBody = !!(body.trim() || (isFocusedDebounced && title.trim()));
    return (
      <div style={{minHeight: 113}}>
        <div className={`rounded-lg bg-white ${disabled ? `opacity-50` : ``}`}>
          <div
            className="relative text-md"
            style={{
              // hack to prevent any jumping from happening
              minHeight: 47,
              // marginBottom: titleFocus.focused ? -5 : 0,
            }}
          >
            {!titleFocus.focused && (
              <div className="p-2">
                {title ? (
                  <GitHubMarkdown inline>{title}</GitHubMarkdown>
                ) : (
                  <span className="text-gray-500">Change title</span>
                )}
              </div>
            )}
            {!disabled && (
              <TextareaAutosize
                aria-label="Change title"
                inputRef={(textArea) => {
                  if (typeof ref === 'function') ref(textArea);
                  else if (ref) {
                    (ref as MakeRefMutable<typeof ref>).current = textArea;
                  }
                  titleRef.current = textArea;
                }}
                className={
                  'inset-0 p-2 resize-none w-full rounded-t-lg opacity-0 focus:opacity-100 focus:outline-none' +
                  (titleFocus.focused ? '' : ' absolute') +
                  (body.trim() && !title.trim()
                    ? ' outline-none border-2 border-red-700'
                    : '')
                }
                value={title}
                onKeyPress={(e) => {
                  if (e.charCode === 13) {
                    e.preventDefault();
                  }
                }}
                onChange={(e) => {
                  onChange({
                    localId,
                    title: e.target.value.replace(/\r?\n/g, ''),
                    body,
                  });
                }}
                onFocus={titleFocus.onFocus}
                onBlur={titleFocus.onBlur}
              />
            )}
          </div>

          {showBody && (
            <>
              <div className={`bg-gray-300 mx-1`} style={{height: 2}} />
              {(isFocusedDebounced || body.trim()) && (
                <div
                  className="relative"
                  style={{
                    minHeight: '4rem',
                  }}
                >
                  {!bodyFocus.focused && (
                    <div className="p-2">
                      {body ? (
                        <GitHubMarkdown>{body}</GitHubMarkdown>
                      ) : (
                        <span className="text-gray-500">Optional details</span>
                      )}
                    </div>
                  )}
                  {!disabled && (
                    <TextareaAutosize
                      aria-label="Optional detailed change description"
                      className={`${
                        bodyFocus.focused ? '' : 'absolute '
                      }inset-0 p-2 resize-none w-full rounded-b-lg opacity-0 focus:opacity-100 focus:outline-none`}
                      value={body}
                      onFocus={bodyFocus.onFocus}
                      onBlur={bodyFocus.onBlur}
                      onChange={(e) => {
                        onChange({localId, title, body: e.target.value});
                      }}
                    />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  },
);

export default ChangeInput;
