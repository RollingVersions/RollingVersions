import React from 'react';
import {ChangeLogEntry} from 'rollingversions/lib/types';
import ChangeInput, {ChangeInputList} from '../ChangeInput';
import getLocalId from '../../utils/getLocalId';

function useIsMouseDownRef() {
  const mouseDownRef = React.useRef(false);
  React.useEffect(() => {
    const onMouseDown = () => {
      mouseDownRef.current = true;
    };
    const onMouseUp = () => {
      mouseDownRef.current = false;
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, []);
  return mouseDownRef;
}
export interface ChangesProps {
  title: string;
  changes: (ChangeLogEntry & {localId: number})[];
  disabled: boolean;
  readOnly: boolean;
  onChange: (changes: (ChangeLogEntry & {localId: number})[]) => void;
}
function Changes({title, changes, disabled, readOnly, onChange}: ChangesProps) {
  const [newID, setNewID] = React.useState<number>();
  const [adding, setAdding] = React.useState(false);
  const isMouseDownRef = useIsMouseDownRef();
  const focusCountRef = React.useRef(0);

  if (!changes.length && readOnly) {
    return null;
  }
  return (
    <div>
      <div className="flex justify-between items-baseline">
        <h3 className="font-sans text-xl text-gray-800 font-light mt-4">
          {title}
        </h3>
        {!readOnly && !newID && (
          <button
            className={`-m-6 p-6 flex flex-grow justify-end focus:outline-none focus:underline ${
              disabled ? `opacity-50` : ``
            }`}
            disabled={disabled}
            onClick={() => {
              setNewID(getLocalId());
              setAdding(true);
            }}
          >
            Add
          </button>
        )}
      </div>
      <div className="pt-2">
        <ChangeInputList>
          {[
            ...changes,
            ...(disabled || newID === undefined
              ? []
              : [{localId: newID, title: '', body: ''}]),
          ].map((entry) => (
            <ChangeInput
              key={entry.localId}
              ref={(input) => {
                if (input && adding && entry.localId === newID) {
                  input.focus();
                  setAdding(false);
                }
              }}
              title={entry.title}
              body={entry.body}
              disabled={disabled}
              readOnly={readOnly}
              onChange={(update) => {
                if (entry.localId === newID) {
                  setNewID(getLocalId());
                  onChange([...changes, {...entry, ...update}]);
                } else {
                  onChange(
                    changes.map((c) =>
                      c.localId === entry.localId ? {...c, ...update} : c,
                    ),
                  );
                }
              }}
              onFocus={() => {
                focusCountRef.current++;
              }}
              onBlur={() => {
                focusCountRef.current--;
                let removed = false;
                const remove = () => {
                  if (removed) return;
                  removed = true;
                  document.removeEventListener('mouseup', remove);
                  if (!entry.title && !entry.body && entry.localId !== newID) {
                    const newChanges = changes.filter((c) => c !== entry);
                    onChange(newChanges);
                    if (!newChanges.length && !focusCountRef.current) {
                      setNewID(undefined);
                    }
                  } else if (!changes.length && !focusCountRef.current) {
                    setNewID(undefined);
                  }
                };
                if (isMouseDownRef.current) {
                  setTimeout(remove, 1000);
                  document.addEventListener('mouseup', remove);
                } else {
                  setTimeout(remove, 100);
                }
              }}
            />
          ))}
        </ChangeInputList>
      </div>
    </div>
  );
}

export default React.memo(Changes);
