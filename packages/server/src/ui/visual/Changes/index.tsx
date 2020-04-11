import React from 'react';
import {ChangeLogEntry} from 'rollingversions/lib/types';
import ChangeInput, {ChangeInputList} from '../ChangeInput';
import getLocalId from '../../utils/getLocalId';

export interface ChangesProps {
  title: string;
  changes: (ChangeLogEntry & {localId: number})[];
  disabled: boolean;
  onChange: (changes: (ChangeLogEntry & {localId: number})[]) => void;
}
function Changes({title, changes, disabled, onChange}: ChangesProps) {
  const [newID, setNewID] = React.useState(() => getLocalId());
  return (
    <>
      <h3 className="font-sans text-xl text-blue-800 font-light mb-2 mt-6">
        {title}
      </h3>
      <div className="pt-2">
        <ChangeInputList>
          {[
            ...changes,
            ...(disabled ? [] : [{localId: newID, title: '', body: ''}]),
          ].map((entry) => (
            <ChangeInput
              key={entry.localId}
              title={entry.title}
              body={entry.body}
              disabled={disabled}
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
              onBlur={() => {
                if (!entry.title && !entry.body && entry.localId !== newID) {
                  onChange(changes.filter((c) => c !== entry));
                }
              }}
            />
          ))}
        </ChangeInputList>
      </div>
    </>
  );
}

export default React.memo(Changes);
