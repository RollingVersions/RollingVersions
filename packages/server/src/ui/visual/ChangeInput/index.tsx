import React from 'react';
import GitHubMarkdown from '../GitHubMarkdown/async';
import TextareaAutosize from 'react-textarea-autosize';
interface ChangeInputProps {
  title: string;
  body: string;
  disabled: boolean;
  onChange: (log: {title: string; body: string}) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}
interface ChangeInputListProps {
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
export default React.forwardRef<HTMLTextAreaElement, ChangeInputProps>(
  function ChangeInput(
    {title, body, disabled, onChange, onFocus, onBlur}: ChangeInputProps,
    ref,
  ) {
    const titleFocus = useTrackFocus();
    const bodyFocus = useTrackFocus();
    const focusedRef = React.useRef(false);
    React.useEffect(() => {
      // This is debounced because as the user tabs
      // from title to body the browser fires
      // blur on title before firing focus on body
      const handle = setTimeout(() => {
        const focused = titleFocus.focused || bodyFocus.focused;
        if (focused !== focusedRef.current) {
          focusedRef.current = focused;
          if (focused && onFocus) onFocus();
          if (!focused && onBlur) onBlur();
        }
      }, 0);
      return () => clearTimeout(handle);
    }, [titleFocus.focused, bodyFocus.focused]);
    return (
      <div className="rounded-lg bg-white">
        <div
          className="relative text-md"
          style={{
            minHeight: 40,
            // hack to prevent any jumping from happening
            marginBottom: titleFocus.focused ? -4 : 0,
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
              inputRef={ref || undefined}
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
              onBlur={(e) => {
                titleFocus.onBlur();
                if (!e.target.value.trim()) {
                  if (body.trim()) {
                    e.target.focus();
                  } else {
                    // TODO
                  }
                }
              }}
            />
          )}
        </div>
        <div className="bg-gray-300 mx-1" style={{height: 2}} />
        <div className="relative" style={{minHeight: '4rem'}}>
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
      </div>
    );
  },
);
