import React from 'react';
import PackageChangeSet, {PackageChangeSetProps} from '../PackageChangeSet';
import SaveChangeLogFooter from '../SaveChangeLogFooter';
import getLocalId from '../../utils/getLocalId';
import {
  PullRequestState,
  ChangeSet,
  ChangeLogEntry,
} from 'rollingversions/lib/types';

function mapChangeSet<T, S>(
  changes: ChangeSet<T>,
  fn: (c: ChangeLogEntry & T) => S,
) {
  return {
    breaking: changes.breaking.map(fn),
    feat: changes.feat.map(fn),
    refactor: changes.refactor.map(fn),
    fix: changes.fix.map(fn),
    perf: changes.perf.map(fn),
  };
}

function getState(packages: PullRequestState['packages']) {
  return [...packages]
    .map(([packageName, {changes, info}]) => ({
      packageName,
      changes: mapChangeSet(changes, (c) => ({
        ...c,
        localId: getLocalId(),
      })),
      info,
    }))
    .sort(({packageName: a}, {packageName: b}) => (a < b ? -1 : 1));
}

export interface PullRequestPageProps {
  headSha: string | undefined;
  readOnly: boolean;
  saving: boolean;
  packages: PullRequestState['packages'];
  unreleasedPackages: string[];
  onSave: (changes: {packageName: string; changes: ChangeSet}[]) => void;
}
export default function PullRequestPage({
  headSha,
  readOnly,
  saving,
  packages,
  unreleasedPackages,
  onSave,
}: PullRequestPageProps) {
  const [initialState] = React.useState(() => getState(packages));
  const [state, setState] = React.useState(initialState);

  const onChange: PackageChangeSetProps['onChange'] = React.useCallback(
    (packageName, update) => {
      setState((s) =>
        s.map((pkg) =>
          pkg.packageName === packageName
            ? {...pkg, changes: update(pkg.changes)}
            : pkg,
        ),
      );
    },
    [setState],
  );

  return (
    <>
      <div className="pb-16 pt-4 px-8">
        {state
          .filter(({info}) => info.length !== 0)
          .map(({packageName, changes, info}) => (
            <PackageChangeSet
              key={packageName}
              disabled={
                readOnly || !unreleasedPackages.includes(packageName) || saving
              }
              packageName={packageName}
              packageInfo={info}
              changes={changes}
              onChange={onChange}
            />
          ))}
      </div>
      {!readOnly && headSha && (
        <SaveChangeLogFooter
          disabled={saving}
          onClick={() => {
            if (saving) return;
            const oldState = new Map(
              initialState.map(
                ({packageName, changes}) => [packageName, changes] as const,
              ),
            );
            onSave(
              state
                .filter(
                  ({packageName, changes}) =>
                    oldState.get(packageName) !== changes,
                )
                .map(({packageName, changes}) => ({
                  packageName,
                  changes: mapChangeSet(changes, ({localId, ...c}) => c),
                })),
            );
          }}
        />
      )}
    </>
  );
}
