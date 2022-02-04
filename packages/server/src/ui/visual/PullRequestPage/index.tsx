import React from 'react';

import type ChangeSet from '@rollingversions/change-set';
import type {PackageManifest} from '@rollingversions/types';

import type Permission from '../../../server/permissions/Permission';
import type {PullRequestPackage} from '../../../types';
import getLocalId from '../../utils/getLocalId';
import Alert from '../Alert';
import type {PackageChangeSetProps} from '../PackageChangeSet';
import PackageChangeSet from '../PackageChangeSet';
import {ManifestWarning} from '../RepositoryPage';
import SaveChangeLogFooter from '../SaveChangeLogFooter';

function getState(
  packages: Map<string, PullRequestPackage>,
): {
  packageName: string;
  changes: ChangeSet<{localId: number}>;
  manifest: PackageManifest;
  released: boolean;
}[] {
  return [...packages]
    .map(([packageName, {changeSet, manifest, released}]) => ({
      packageName,
      changes: changeSet.map((c) => ({
        ...c,
        localId: getLocalId(),
      })),
      manifest,
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
  packageErrors: readonly {
    readonly filename: string;
    readonly error: string;
  }[];
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
  packageErrors,
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

        {packageErrors
          ? packageErrors.map(({filename, error}, i) => (
              <ManifestWarning key={i} filename={filename} error={error} />
            ))
          : null}
        {state.map(({packageName, changes, manifest, released}, i) => (
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
              targetConfigs={manifest.targetConfigs}
              changes={changes}
              changeTypes={manifest.change_types}
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
