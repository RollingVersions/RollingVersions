import React, {useEffect} from 'react';

import type ChangeSet from '@rollingversions/change-set';
import type {ChangeTypeID} from '@rollingversions/config';

import getLocalId from '../../utils/getLocalId';
import ChangeInput, {ChangeInputList} from '../ChangeInput';

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
  type: ChangeTypeID;
  title: string;
  changes: ChangeSet<{localId: number}>;
  disabled: boolean;
  readOnly: boolean;
  onChange: (
    update: (
      before: ChangeSet<{localId: number}>,
    ) => ChangeSet<{localId: number}>,
  ) => void;
}
function Changes({
  type,
  title,
  changes,
  disabled,
  readOnly,
  onChange,
}: ChangesProps) {
  const [newID, setNewID] = React.useState<number>();
  const [adding, setAdding] = React.useState(false);
  const isMouseDownRef = useIsMouseDownRef();
  const [focusCount, setFocusCount] = React.useState(0);

  useEffect(() => {
    if (focusCount === 0 && changes.length === 0) {
      setNewID(undefined);
    }
  }, [focusCount === 0 && changes.length === 0]);

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
              localId={entry.localId}
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
                }
                onChange(
                  (changes): ChangeSet<{localId: number}> => {
                    let found = false;
                    const updated = changes.map((c) => {
                      if (c.localId === entry.localId) {
                        found = true;
                        return {type, ...update};
                      }
                      return c;
                    });
                    if (found) {
                      return updated;
                    } else {
                      return [...changes, {type, ...update}];
                    }
                  },
                );
              }}
              onFocus={() => setFocusCount(inc)}
              onBlur={() => {
                setFocusCount(dec);
                let removed = false;
                const remove = () => {
                  if (removed) return;
                  removed = true;
                  document.removeEventListener('mouseup', remove);
                  if (!entry.title && !entry.body && entry.localId !== newID) {
                    onChange((changes) => changes.filter((c) => c !== entry));
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

function inc(v: number) {
  return v + 1;
}
function dec(v: number) {
  return v - 1;
}
