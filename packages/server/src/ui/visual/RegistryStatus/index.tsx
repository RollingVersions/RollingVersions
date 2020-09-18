import React from 'react';
import {
  PackageManifestWithVersion,
  PublishTarget,
} from 'rollingversions/lib/types';

export interface RegistryStatusProps {
  packageManifest: Pick<
    PackageManifestWithVersion,
    'notToBePublished' | 'versionTag' | 'registryVersion' | 'targetConfig'
  >[];
}

export default function RegistryStatus({packageManifest}: RegistryStatusProps) {
  const publishTarget = packageManifest
    .map((p) => p.targetConfig.type)
    .join(', ');
  if (packageManifest.every((p) => p.notToBePublished)) {
    return (
      <p>
        This package is not published on any registry, but git tags/releases
        will still be created for it if you add a changelog.
      </p>
    );
  }
  return (
    <>
      {packageManifest
        .filter((p) => !p.notToBePublished)
        .map(
          (p, i): React.ReactElement => {
            switch (p.targetConfig.type) {
              case PublishTarget.npm: {
                if (p.versionTag || p.registryVersion) {
                  if (p.registryVersion) {
                    return (
                      <p key={i}>
                        This package is published <strong>publicly</strong> on
                        the {publishTarget} registry.
                      </p>
                    );
                  } else {
                    return (
                      <p key={i}>
                        This package is published <strong>privately</strong> on
                        the {publishTarget} registry.
                      </p>
                    );
                  }
                }
                if (p.targetConfig.publishConfigAccess === 'restricted') {
                  return (
                    <React.Fragment key={i}>
                      <p>
                        This package wil be published <strong>privately</strong>{' '}
                        on the {publishTarget} registry.
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
                    This package wil be published <strong>publicly</strong> on
                    the {publishTarget} registry.
                  </p>
                );
              }
              case PublishTarget.custom_script: {
                return (
                  <p key={i}>
                    This package wil be published via a custom script:
                    <pre>
                      <code>{p.targetConfig.publish}</code>
                    </pre>
                  </p>
                );
              }
            }
          },
        )}
    </>
  );
}
