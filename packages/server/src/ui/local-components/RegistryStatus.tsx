import React from 'react';
import {PackageInfo} from 'changelogversion-utils/lib/Platforms';
import {PackagePullChangeLog} from 'changelogversion-utils/lib/PullChangeLog';

interface RegistryStatusProps {
  packageInfo: PackageInfo[];
  changeLog: PackagePullChangeLog;
  disabled: boolean;
  onChangeLogChange: (log: PackagePullChangeLog) => void;
}

export function publishingSettingsChosen({
  packageInfo,
  changeLog,
}: Pick<RegistryStatusProps, 'packageInfo' | 'changeLog'>) {
  return !!(
    packageInfo.every((p) => p.notToBePublished) ||
    packageInfo.some((p) => p.versionTag) ||
    packageInfo.some((p) => p.registryVersion) ||
    changeLog.publishInitialVersionAs
  );
}
export default function RegistryStatus({
  packageInfo,
  changeLog,
  disabled,
  onChangeLogChange,
}: RegistryStatusProps) {
  const platform = packageInfo.map((p) => p.platform).join(', ');
  if (packageInfo.every((p) => p.notToBePublished)) {
    return (
      <p>
        This package is not published on any registry, but git tags/releases
        will still be created for it if you add a changelog.
      </p>
    );
  }
  if (
    packageInfo.some((p) => p.versionTag) ||
    packageInfo.some((p) => p.registryVersion)
  ) {
    if (packageInfo.some((p) => p.registryVersion)) {
      return (
        <p>
          This package is published <strong>publicly</strong> on the {platform}{' '}
          registry.
        </p>
      );
    } else {
      return (
        <p>
          This package is published <strong>privately</strong> on the {platform}{' '}
          registry.
        </p>
      );
    }
  }
  if (!changeLog.publishInitialVersionAs) {
    if (disabled) {
      return <p>This package has not yet been selected to be published.</p>;
    }
    return (
      <>
        <button
          type="button"
          onClick={() =>
            onChangeLogChange({...changeLog, publishInitialVersionAs: 'public'})
          }
        >
          Publish publicly
        </button>
        <button
          type="button"
          onClick={() =>
            onChangeLogChange({
              ...changeLog,
              publishInitialVersionAs: 'private',
            })
          }
        >
          Publish privately
        </button>
      </>
    );
  }
  if (changeLog.publishInitialVersionAs === 'public') {
    return (
      <>
        <p>
          This package wil be published <strong>publicly</strong> on the{' '}
          {platform} registry.
        </p>
        {!disabled && (
          <button
            type="button"
            onClick={() =>
              onChangeLogChange({
                ...changeLog,
                publishInitialVersionAs: 'private',
              })
            }
          >
            Make private
          </button>
        )}
      </>
    );
  } else {
    return (
      <>
        <p>
          This package wil be published <strong>privately</strong> on the{' '}
          {platform} registry.
        </p>
        {!disabled && (
          <button
            type="button"
            onClick={() =>
              onChangeLogChange({
                ...changeLog,
                publishInitialVersionAs: 'public',
              })
            }
          >
            Make public
          </button>
        )}
      </>
    );
  }
}
