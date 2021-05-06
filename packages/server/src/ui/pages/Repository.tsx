import React from 'react';
import {useParams} from 'react-router-dom';

import {GetRepositoryApiResponse, VersioningMode} from '@rollingversions/types';
import {printString} from '@rollingversions/version-number';

import Alert from '../visual/Alert';
import AppContainer from '../visual/AppContainer';
import AppNavBar, {AppNavBarLink} from '../visual/AppNavBar';
import RepositoryPage, {
  CycleWarning,
  PackageWithChanges,
  PackageWithNoChanges,
  ReleaseButton,
} from '../visual/RepositoryPage';

interface Params {
  owner: string;
  repo: string;
}

export default function Repository() {
  const params = useParams<Params>();
  const [error, setError] = React.useState<Error | undefined>();
  const [state, setState] = React.useState<
    GetRepositoryApiResponse | undefined
  >();
  const path = `/${params.owner}/${params.repo}`;

  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        setError(undefined);
        const res = await fetch(`${path}/json`);
        if (!res.ok) {
          throw new Error(`${res.statusText}: ${await res.text()}`);
        }
        const data = await res.json();
        if (!cancelled) setState(data);
      } catch (ex) {
        if (!cancelled) {
          setError(ex);
        }
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [path]);

  return (
    <AppContainer>
      <AppNavBar>
        <AppNavBarLink to={`/${params.owner}`}>{params.owner}</AppNavBarLink>
        <AppNavBarLink>{params.repo}</AppNavBarLink>
      </AppNavBar>
      {(() => {
        if (error) {
          return (
            <div>
              Failed to load repository: <pre>{error.stack}</pre>
            </div>
          );
        }
        if (!state) {
          return <div>Loading...</div>;
        }

        const updateRequired =
          !state.cycleDetected && state.packages.some((pkg) => pkg.newVersion);

        return (
          <RepositoryPage
            {...state}
            releaseButton={
              updateRequired ? (
                <form
                  method="POST"
                  action={`/${params.owner}/${params.repo}/dispatch/rollingversions_publish_approved`}
                >
                  <ReleaseButton />
                </form>
              ) : null
            }
          >
            {state.cycleDetected ? (
              <CycleWarning cycle={state.cycleDetected} />
            ) : null}
            {state.packages.map((pkg) => {
              if (pkg.currentVersion?.ok !== false) {
                return null;
              }
              return (
                <Alert key={pkg.manifest.packageName}>
                  {pkg.manifest.packageName} has an ambiguous version on the
                  selected branch. You need to set the versioning in the package
                  manifest to either:{' '}
                  <code>{VersioningMode.AlwaysIncreasing}</code> or{' '}
                  <code>{VersioningMode.ByBranch}</code>.
                </Alert>
              );
            })}
            {state.packages.map((pkg) => {
              const currentVersion = pkg.currentVersion;
              if (!pkg.newVersion) {
                return null;
              }
              return (
                <PackageWithChanges
                  key={pkg.manifest.packageName}
                  packageName={pkg.manifest.packageName}
                  currentVersion={
                    currentVersion?.ok
                      ? printString(currentVersion.version)
                      : null
                  }
                  newVersion={printString(pkg.newVersion)}
                  changeSet={pkg.changeSet}
                />
              );
            })}
            {state.packages.map((pkg) => {
              if (pkg.newVersion) {
                return null;
              }
              return (
                <PackageWithNoChanges
                  key={pkg.manifest.packageName}
                  packageName={pkg.manifest.packageName}
                  currentVersion={
                    pkg.currentVersion?.ok
                      ? printString(pkg.currentVersion.version)
                      : null
                  }
                />
              );
            })}
          </RepositoryPage>
        );
      })()}
    </AppContainer>
  );
}
