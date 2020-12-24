import React from 'react';
import {PublishTarget} from 'rollingversions/lib/types';
import {PublishTargetConfig} from 'rollingversions/lib/types/PublishTarget';
import Alert from '../Alert';

export interface RegistryStatusProps {
  targetConfigs: PublishTargetConfig[];
  currentVersion: string | null;
}

export default function RegistryStatus({
  targetConfigs,
  currentVersion,
}: RegistryStatusProps) {
  if (targetConfigs.length === 0) {
    return <Alert>This package no longer has any publish targets.</Alert>;
  }
  if (targetConfigs.length === 1) {
    return (
      <TargetStatus
        targetConfig={targetConfigs[0]}
        currentVersion={currentVersion}
      />
    );
  } else {
    return (
      <>
        <p>
          This package has multiple targets that will be published to when you
          release changes.
        </p>
        {targetConfigs.map((targetConfig, i) => (
          <TargetStatus
            key={i}
            targetConfig={targetConfig}
            currentVersion={currentVersion}
          />
        ))}
      </>
    );
  }
}

function TargetStatus({
  targetConfig,
  currentVersion,
}: {
  targetConfig: PublishTargetConfig;
  currentVersion: string | null;
}) {
  switch (targetConfig.type) {
    case PublishTarget.npm: {
      if (targetConfig.private) {
        return (
          <p>
            This package has the value <code>"private": true</code> in{' '}
            <code>package.json</code>, so it will not be published on the npm
            registry. Git tags and release notes will still be generated.
          </p>
        );
      }
      if (targetConfig.publishConfigAccess === 'restricted') {
        if (!currentVersion) {
          return (
            <React.Fragment>
              <p>
                This package will be published <strong>privately</strong> on the{' '}
                npm registry.
              </p>
              <p>
                If you prefer to publish it publicly, you can add the following
                to your package.json:
                <pre>
                  <code>{'"publishConfig": {"access": "public"}'}</code>
                </pre>
              </p>
            </React.Fragment>
          );
        } else {
          return (
            <p>
              This package will be published <strong>privately</strong> on the{' '}
              npm registry.
            </p>
          );
        }
      } else {
        return (
          <p>
            This package wil be published <strong>publicly</strong> on the npm
            registry.
          </p>
        );
      }
    }
    case PublishTarget.custom_script: {
      return (
        <p>
          This package wil be published via a custom script:
          <pre>
            <code>{targetConfig.publish}</code>
          </pre>
        </p>
      );
    }
  }
}
