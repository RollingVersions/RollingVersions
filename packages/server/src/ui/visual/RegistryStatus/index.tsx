import assertNever from 'assert-never';
import React from 'react';

import {PublishTarget, PublishTargetConfig} from '@rollingversions/types';

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
      {targetConfigs.map((targetConfig, i): React.ReactElement | null => {
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
                <p key={i}>
                  This package is not published on npm, but git tags/releases
                  will still be created for it if you add a changelog.
                </p>
              );
            }
            if (targetConfig.publishConfigAccess === 'restricted') {
              return (
                <React.Fragment key={i}>
                  <p>
                    This package will be published <strong>privately</strong> on
                    the npm registry, unless you have manually updated the
                    access config.
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
                This package will be published <strong>publicly</strong> on the
                npm registry.
              </p>
            );
          }
          case PublishTarget.custom: {
            if (targetConfig.release) {
              return (
                <p key={i}>
                  This package will be published via a custom script:
                  <pre>
                    <code>{targetConfig.release.command}</code>
                  </pre>
                </p>
              );
            } else if (targetConfigs.length === 1) {
              return (
                <p key={i}>
                  This package will be published only as a GitHub tag.
                </p>
              );
            } else {
              return null;
            }
          }
          case PublishTarget.docker:
            return (
              <p key={i}>
                This docker image will be pushed to:
                <pre>
                  <code>{targetConfig.image_name.remote}</code>
                </pre>
              </p>
            );
          default:
            return assertNever(targetConfig);
        }
      })}
    </>
  );
}
