import React from 'react';

import {PublishTarget} from 'rollingversions/lib/types';
import type {PublishTargetConfig} from 'rollingversions/src/types/PublishTarget';

import Alert from '../Alert';

export interface RegistryStatusProps {
  targetConfigs: readonly PublishTargetConfig[];
}

export default function RegistryStatus({targetConfigs}: RegistryStatusProps) {
  if (targetConfigs.length === 0) {
    return (
      <Alert>
        This package will not be published because there are no longer any
        target configs for it. If you want to publish these changes, either move
        the changes onto the correct package, or add a publish target in the
        repo for this package name.
      </Alert>
    );
  }
  return (
    <>
      {targetConfigs.map(
        (targetConfig, i): React.ReactElement => {
          switch (targetConfig.type) {
            case PublishTarget.npm: {
              // if (p.versionTag || p.registryVersion) {
              //   if (p.registryVersion) {
              //     return (
              //       <p key={i}>
              //         This package is published <strong>publicly</strong> on
              //         the {publishTarget} registry.
              //       </p>
              //     );
              //   } else {
              //     return (
              //       <p key={i}>
              //         This package is published <strong>privately</strong> on
              //         the {publishTarget} registry.
              //       </p>
              //     );
              //   }
              // }
              if (targetConfig.private) {
                return (
                  <p>
                    This package is not published on any registry, but git
                    tags/releases will still be created for it if you add a
                    changelog.
                  </p>
                );
              }
              if (targetConfig.publishConfigAccess === 'restricted') {
                return (
                  <React.Fragment key={i}>
                    <p>
                      This package will be published <strong>privately</strong>{' '}
                      on the npm registry, unless you have manually updated the
                      acess config.
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
                  This package will be published <strong>publicly</strong> on
                  the npm registry.
                </p>
              );
            }
            case PublishTarget.custom_script: {
              return (
                <p key={i}>
                  This package will be published via a custom script:
                  <pre>
                    <code>{targetConfig.publish}</code>
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
