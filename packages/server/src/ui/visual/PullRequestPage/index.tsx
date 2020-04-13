import React from 'react';
import PackageChangeSet, {PackageChangeSetProps} from '../PackageChangeSet';
import SaveChangeLogFooter from '../SaveChangeLogFooter';
import {
  PackagePullChangeLog,
  ChangeLogEntry,
} from '@rollingversions/utils/lib/PullChangeLog';
import getLocalId from '../../utils/getLocalId';

function getState(packages: PackagePullChangeLog[]) {
  const results: Record<
    string,
    undefined | (ChangeLogEntry & {localId: number})[]
  > = {};
  packages.forEach((pkg) => {
    results[pkg.packageName] = pkg.changes.map((c) => ({
      ...c,
      localId: getLocalId(),
    }));
  });
  return results;
}
const entryValueIsNotUndefined = <S, T>(
  v: [S, T],
): v is [S, Exclude<T, undefined>] => v[1] !== undefined;

export interface PullRequestPageProps {
  headSha: string | undefined;
  readOnly: boolean;
  saving: boolean;
  currentVersions: Record<
    string,
    PackageChangeSetProps['packageInfo'] | undefined
  >;
  packages: PackagePullChangeLog[];
  onSave: (changes: PackagePullChangeLog[]) => void;
}
export default function PullRequestPage({
  headSha,
  readOnly,
  saving,
  currentVersions,
  packages,
  onSave,
}: PullRequestPageProps) {
  const [state, setState] = React.useState(() => getState(packages));
  return (
    <div className="pb-16 pt-4 px-8">
      <h1>ChangeLog</h1>
      {Object.entries(currentVersions)
        .slice()
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .filter(entryValueIsNotUndefined)
        .map(([packageName, packageInfo]) => (
          <PackageChangeSet
            key={packageName}
            disabled={readOnly || saving}
            packageName={packageName}
            packageInfo={packageInfo}
            changes={state[packageName] || []}
            onChange={(changes) => {
              setState((s) => ({...s, [packageName]: changes}));
            }}
          />
        ))}
      {!readOnly && headSha && (
        <SaveChangeLogFooter
          disabled={saving}
          headSha={headSha}
          onClick={() => {
            if (saving) return;
            onSave(
              Object.entries(state)
                .filter(entryValueIsNotUndefined)
                .map(
                  ([packageName, changes]): PackagePullChangeLog => ({
                    packageName,
                    changes: changes.map(({localId, ...rest}) => rest),
                  }),
                ),
            );
          }}
        />
      )}
    </div>
  );
}
