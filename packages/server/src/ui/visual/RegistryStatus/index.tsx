import React from 'react';
import {PackageInfo} from '@rollingversions/utils/lib/Platforms';

interface RegistryStatusProps {
  packageInfo: Pick<
    PackageInfo,
    | 'platform'
    | 'notToBePublished'
    | 'versionTag'
    | 'registryVersion'
    | 'publishConfigAccess'
  >[];
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
  return (
    <>
      {packageInfo
        .filter((p) => !p.notToBePublished)
        .map((p, i) => {
          if (p.versionTag || p.registryVersion) {
            if (p.registryVersion) {
              return (
                <p key={i}>
                  This package is published <strong>publicly</strong> on the{' '}
                  {platform} registry.
                </p>
              );
            } else {
              return (
                <p key={i}>
                  This package is published <strong>privately</strong> on the{' '}
                  {platform} registry.
                </p>
              );
            }
          }
          if (p.publishConfigAccess === 'restricted') {
            return (
              <React.Fragment key={i}>
                <p>
                  This package wil be published <strong>privately</strong> on
                  the {platform} registry.
                </p>
                <p>
                  If you prefer to publish it publicly, you can add the
                  following to your package.json:
                  <pre>
                    <code>{'"publishConfig": {"access": "public"}'}</code>
                  </pre>
                </p>
              </React.Fragment>
            );
          }
          return (
            <p key={i}>
              This package wil be published <strong>publicly</strong> on the{' '}
              {platform} registry.
            </p>
          );
        })}
    </>
  );
}
