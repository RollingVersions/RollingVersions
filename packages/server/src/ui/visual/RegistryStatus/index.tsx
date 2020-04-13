import React from 'react';
import {PackageInfo} from 'rollingversions/lib/types';

export interface RegistryStatusProps {
  packageInfo: Pick<
    PackageInfo,
    | 'publishTarget'
    | 'notToBePublished'
    | 'versionTag'
    | 'registryVersion'
    | 'publishConfigAccess'
  >[];
}

export default function RegistryStatus({packageInfo}: RegistryStatusProps) {
  const publishTarget = packageInfo.map((p) => p.publishTarget).join(', ');
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
                  {publishTarget} registry.
                </p>
              );
            } else {
              return (
                <p key={i}>
                  This package is published <strong>privately</strong> on the{' '}
                  {publishTarget} registry.
                </p>
              );
            }
          }
          if (p.publishConfigAccess === 'restricted') {
            return (
              <React.Fragment key={i}>
                <p>
                  This package wil be published <strong>privately</strong> on
                  the {publishTarget} registry.
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
              {publishTarget} registry.
            </p>
          );
        })}
    </>
  );
}
