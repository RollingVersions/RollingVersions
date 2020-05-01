import React from 'react';
import GitHubMarkdown from '../GitHubMarkdown/async';
import TextareaAutosize from 'react-textarea-autosize';

export interface ChangeInputProps {
  title: string;
  body: string;
  disabled: boolean;
  readOnly: boolean;
  onChange: (log: {title: string; body: string}) => void;
  onFocus?: () => void;
  onBlur?: () => void;
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
    const [focused, setFocused] = React.useState(false);

    React.useEffect(() => {
      // This is debounced because as the user tabs
      // from title to body the browser fires
      // blur on title before firing focus on body
      const handle = setTimeout(() => {
        const $focused = titleFocus.focused || bodyFocus.focused;
        if ($focused !== focused) {
          setFocused($focused);
          if ($focused && onFocus) onFocus();
          if (!$focused && onBlur) onBlur();
          if (!$focused) {
            if (!title.trim() && body.trim() && titleRef.current) {
              titleRef.current.focus();
            }
          }
        }
      }, 0);
      return () => clearTimeout(handle);
    }, [titleFocus.focused, bodyFocus.focused]);

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
    const showBody = !!(body.trim() || (focused && title.trim()));
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
                  onChange({title: e.target.value.replace(/\r?\n/g, ''), body});
                }}
                onFocus={titleFocus.onFocus}
                onBlur={titleFocus.onBlur}
              />
            )}
          </div>

          {showBody && (
            <>
              <div className={`bg-gray-300 mx-1`} style={{height: 2}} />
              {(focused || body.trim()) && (
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
                        onChange({title, body: e.target.value});
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
