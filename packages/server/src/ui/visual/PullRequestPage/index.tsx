import React from 'react';
import PackageChangeSet, {PackageChangeSetProps} from '../PackageChangeSet';
import SaveChangeLogFooter from '../SaveChangeLogFooter';
import getLocalId from '../../utils/getLocalId';
import {
  PullRequestState,
  ChangeSet,
  ChangeLogEntry,
} from 'rollingversions/lib/types';
import Permission from '../../../server/permissions/Permission';

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

export function Alert({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <p
      className={`px-6 py-4 md:px-10 md:py-6 text-red-900 bg-red-200 rounded-lg border border-red-300 ${className ||
        ''}`}
    >
      {children}
    </p>
  );
}
export interface PullRequestPageProps {
  headSha: string | undefined;
  saving: boolean;
  packages: PullRequestState['packages'];
  unreleasedPackages: string[];
  closed: boolean;
  merged: boolean;
  permission: Permission;
  onSave: (changes: {packageName: string; changes: ChangeSet}[]) => void;
}

const alreadyReleasedWarning = (
  <Alert className="mb-4">
    This package has already been released, so these notes are read only. If you
    need to edit the release notes, you can do so in GitHub releases, but it
    will not change the version numbers that were released, as they are
    immutable.
  </Alert>
);
export default function PullRequestPage({
  headSha,
  saving,
  packages,
  unreleasedPackages,
  closed,
  merged,
  permission,
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
      <div className="flex-grow flex-shrink-0 pb-16 pt-16 px-8 container mx-auto">
        {!unreleasedPackages.length ? (
          <Alert className="mb-6">
            This change set is read only because all these changes have already
            been released. If you need to edit the release notes, you can do so
            in GitHub releases, but it will not change the version numbers that
            were released, as they are immutable.
          </Alert>
        ) : (closed || merged) && permission !== 'edit' ? (
          <Alert className="mb-6">
            This change set is read only because the pull request has been{' '}
            {merged ? 'merged' : 'closed'}. Once a pull request is merged, it
            can only be edited by a repository owner.
          </Alert>
        ) : permission !== 'edit' ? (
          <Alert className="mb-6">
            Only the owner of the repository or author of the pull request can
            edit the release notes.
          </Alert>
        ) : null}
        {state
          .filter(({info}) => info.length !== 0)
          .map(({packageName, changes, info}, i) => (
            <React.Fragment key={packageName}>
              {i === 0 ? null : <hr className="my-16" />}
              <PackageChangeSet
                disabled={saving}
                readOnly={
                  !headSha ||
                  permission !== 'edit' ||
                  !unreleasedPackages.includes(packageName)
                }
                warning={
                  unreleasedPackages.length &&
                  !unreleasedPackages.includes(packageName) &&
                  permission === 'edit'
                    ? alreadyReleasedWarning
                    : null
                }
                packageName={packageName}
                packageInfo={info}
                changes={changes}
                onChange={onChange}
              />
            </React.Fragment>
          ))}
      </div>
      {headSha && permission === 'edit' && unreleasedPackages.length > 0 && (
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
