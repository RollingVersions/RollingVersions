import ChangeSet from '@rollingversions/change-set';
import React from 'react';
import PackageChangeSet, {PackageChangeSetProps} from '../PackageChangeSet';
import SaveChangeLogFooter from '../SaveChangeLogFooter';
import getLocalId from '../../utils/getLocalId';
import Permission from '../../../server/permissions/Permission';
import {PullRequestPackage} from '../../../types';
import Alert from '../Alert';
import {PackageManifestWithVersion} from 'rollingversions/src/types';

function getState(
  packages: Map<string, PullRequestPackage>,
): {
  packageName: string;
  changes: ChangeSet<{localId: number}>;
  manifests: PackageManifestWithVersion[];
  released: boolean;
}[] {
  return [...packages]
    .map(([packageName, {changeSet, manifests, released}]) => ({
      packageName,
      changes: changeSet.map((c) => ({
        ...c,
        localId: getLocalId(),
      })),
      manifests,
      released,
    }))
    .sort(({packageName: a}, {packageName: b}) => (a < b ? -1 : 1));
}

export interface PullRequestPageProps {
  saving: boolean;
  packages: Map<string, PullRequestPackage>;
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
  saving,
  packages,
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

  const allReleased = state.every((p) => p.released);

  return (
    <>
      <div className="flex-grow flex-shrink-0 pb-16 pt-16 px-8 container mx-auto">
        {allReleased ? (
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
          // TODO(feat): consider still rendering these in some way
          .filter(({manifests}) => manifests.length !== 0)
          .map(({packageName, changes, manifests: manifest, released}, i) => (
            <React.Fragment key={packageName}>
              {i === 0 ? null : <hr className="my-16" />}
              <PackageChangeSet
                disabled={saving}
                readOnly={permission !== 'edit' || released}
                warning={
                  !allReleased && released && permission === 'edit'
                    ? alreadyReleasedWarning
                    : null
                }
                packageName={packageName}
                packageManifest={manifest}
                changes={changes}
                onChange={onChange}
              />
            </React.Fragment>
          ))}
      </div>
      {permission === 'edit' && !allReleased && (
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
                  changes: changes.map(({localId, ...c}) => c),
                })),
            );
          }}
        />
      )}
    </>
  );
}
