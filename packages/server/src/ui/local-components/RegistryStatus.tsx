import React from 'react';
import {PackageInfo} from 'changelogversion-utils/lib/Platforms';
import {PackagePullChangeLog} from 'changelogversion-utils/lib/PullChangeLog';

interface RegistryStatusProps {
  packageInfo: PackageInfo[];
  changeLog: PackagePullChangeLog;
  disabled: boolean;
  onChangeLogChange: (log: PackagePullChangeLog) => void;
}

export default function RegistryStatus({packageInfo}: RegistryStatusProps) {
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
  if (!packageInfo.some((p) => p.publishConfigAccess !== 'restricted')) {
    return (
      <>
        <p>
          This package wil be published <strong>publicly</strong> on the{' '}
          {platform} registry.
        </p>
      </>
    );
  } else {
    return (
      <>
        <p>
          This package wil be published <strong>privately</strong> on the{' '}
          {platform} registry.
        </p>
        <p>
          If you prefer to publish it publicly, you can add the following to
          your package.json:
          <pre>
            <code>{'"publishConfig": {"access": "public"}'}</code>
          </pre>
        </p>
      </>
    );
  }
}
