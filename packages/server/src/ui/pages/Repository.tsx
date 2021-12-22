import React from 'react';
import {useParams} from 'react-router-dom';

import {printTag} from '@rollingversions/tag-format';
import {GetRepositoryApiResponse, VersioningMode} from '@rollingversions/types';
import {printString} from '@rollingversions/version-number';

import Alert from '../visual/Alert';
import AppContainer from '../visual/AppContainer';
import AppNavBar, {AppNavBarLink} from '../visual/AppNavBar';
import ChangeBranchDialog, {
  ChangeBranchButton,
} from '../visual/ChangeBranchDialog';
import ChangeBranchLink from '../visual/ChangeBranchLink';
import RepositoryPage, {
  ChoosePackageButton,
  CycleWarning,
  ExistingRelease,
  LoadMoreButton,
  ManifestWarning,
  NextReleaseHeading,
  NoPastReleasesMessage,
  PackageWithChanges,
  PackageWithNoChanges,
  PastReleasesHeading,
  ReleaseButton,
  UnreleasedPullRequest,
  UnreleasedPullRequestList,
  useRepositoryQueryState,
} from '../visual/RepositoryPage';

interface Params {
  owner: string;
  repo: string;
}

interface PastReleasesState {
  nextPageToken: string | null;
  releases: {
    packageName: string;
    version: string;
    body: string;
  }[];
}
export default function Repository() {
  const params = useParams<Params>();
  const [error, setError] = React.useState<Error | undefined>();
  const [state, setState] = React.useState<
    GetRepositoryApiResponse | undefined
  >();
  const [pastReleasesError, setPastReleasesError] = React.useState<
    Error | undefined
  >();
  const [pastReleasesState, setPastReleasesState] = React.useState<
    PastReleasesState | undefined
  >();
  const [loadMoreRequested, setLoadMoreRequested] = React.useState<
    PastReleasesState | undefined
  >();
  const path = `/${params.owner}/${params.repo}`;
  const {
    branch,
    packageName,
    openDialog,
    closeDialogLink,
    getBranchLink,
    getPackageLink,
    getOpenDialogLink,
  } = useRepositoryQueryState();

  const loadedPrimaryState = !!state;
  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        setError(undefined);
        const res = await fetch(
          `${path}/json${
            branch ? `?branch=${encodeURIComponent(branch)}` : ``
          }`,
        );
        if (!res.ok) {
          throw new Error(`${res.statusText}: ${await res.text()}`);
        }
        const data = await res.json();
        if (!cancelled) setState(data);
      } catch (ex: any) {
        if (!cancelled) {
          setError(ex);
        }
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [path, branch]);

  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!loadedPrimaryState) return;
      try {
        setPastReleasesError(undefined);
        const search = new URLSearchParams();
        if (branch) search.append(`branch`, branch);
        if (packageName) search.append(`package-name`, packageName);
        const res = await fetch(`${path}/past-releases?${search.toString()}`);
        if (!res.ok) {
          throw new Error(`${res.statusText}: ${await res.text()}`);
        }
        const data = await res.json();
        if (!cancelled) setPastReleasesState(data);
      } catch (ex: any) {
        if (!cancelled) {
          setPastReleasesError(ex);
        }
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [loadedPrimaryState, path, branch, packageName]);

  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      if (
        !loadedPrimaryState ||
        pastReleasesState !== loadMoreRequested ||
        !loadMoreRequested?.nextPageToken
      )
        return;
      try {
        setPastReleasesError(undefined);
        const search = new URLSearchParams();
        if (branch) search.append(`branch`, branch);
        if (packageName) search.append(`package-name`, packageName);
        search.append(`before`, loadMoreRequested.nextPageToken);
        const res = await fetch(`${path}/past-releases?${search.toString()}`);
        if (!res.ok) {
          throw new Error(`${res.statusText}: ${await res.text()}`);
        }
        const data: PastReleasesState = await res.json();
        if (!cancelled) {
          setPastReleasesState((oldState) =>
            oldState
              ? {
                  releases: [...oldState.releases, ...data.releases],
                  nextPageToken: data.nextPageToken,
                }
              : undefined,
          );
          setLoadMoreRequested(undefined);
        }
      } catch (ex: any) {
        if (!cancelled) {
          setPastReleasesError(ex);
        }
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [
    loadedPrimaryState,
    path,
    branch,
    packageName,
    pastReleasesState,
    loadMoreRequested,
  ]);

  return (
    <>
      <AppContainer>
        <AppNavBar>
          <AppNavBarLink to={`/${params.owner}`}>{params.owner}</AppNavBarLink>
          <AppNavBarLink>{params.repo}</AppNavBarLink>
          <AppNavBarLink>
            {state?.deployBranch?.name ?? (error ? `Error` : `Loading`)}
            <ChangeBranchLink to={getOpenDialogLink('branch')} />
          </AppNavBarLink>
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
            !state.cycleDetected &&
            state.packages.some((pkg) => pkg.newVersion);

          return (
            <RepositoryPage {...state}>
              <NextReleaseHeading>
                {updateRequired &&
                (branch === state?.defaultBranch?.name || branch === null) ? (
                  <form
                    method="POST"
                    action={`/${params.owner}/${params.repo}/dispatch/rollingversions_publish_approved`}
                  >
                    <ReleaseButton />
                  </form>
                ) : null}
              </NextReleaseHeading>
              {state.cycleDetected ? (
                <CycleWarning cycle={state.cycleDetected} />
              ) : null}
              {state.packageErrors.map(({filename, error}, i) => (
                <ManifestWarning key={i} filename={filename} error={error} />
              ))}
              {state.packages.map((pkg) => {
                if (pkg.currentVersion?.ok !== false) {
                  return null;
                }
                return (
                  <Alert key={pkg.manifest.packageName}>
                    {pkg.manifest.packageName} has an ambiguous version on the
                    selected branch. You need to set the versioning in the
                    package manifest to either:{' '}
                    <code>{VersioningMode.AlwaysIncreasing}</code> or{' '}
                    <code>{VersioningMode.ByBranch}</code>.
                  </Alert>
                );
              })}
              {state.unreleasedPullRequests.length ? (
                <UnreleasedPullRequestList>
                  {state.unreleasedPullRequests.map((pr) => (
                    <UnreleasedPullRequest
                      key={pr.number}
                      href={`${path}/pull/${pr.number}`}
                      number={pr.number}
                      title={pr.title}
                    />
                  ))}
                </UnreleasedPullRequestList>
              ) : null}
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
                        ? pkg.manifest.tagFormat
                          ? currentVersion.name
                          : printString(currentVersion.version)
                        : null
                    }
                    newVersion={
                      pkg.manifest.tagFormat
                        ? printTag(pkg.newVersion, {
                            packageName: pkg.manifest.packageName,
                            oldTagName: null,
                            tagFormat: pkg.manifest.tagFormat,
                            versionSchema: pkg.manifest.versionSchema,
                          })
                        : printString(pkg.newVersion)
                    }
                    changeSet={pkg.changeSet}
                    changeTypes={pkg.manifest.changeTypes}
                    path={path}
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
                        ? pkg.manifest.tagFormat
                          ? pkg.currentVersion.name
                          : printString(pkg.currentVersion.version)
                        : null
                    }
                  />
                );
              })}
              <PastReleasesHeading
                to={getOpenDialogLink('package')}
                packageName={packageName}
              />
              {pastReleasesError ? (
                <div>
                  Failed to load past releases:{' '}
                  <pre>{pastReleasesError.stack}</pre>
                </div>
              ) : !pastReleasesState ? null : !pastReleasesState.releases
                  .length ? (
                <NoPastReleasesMessage />
              ) : (
                <>
                  {pastReleasesState.releases.map((release) => (
                    <ExistingRelease
                      key={`${release.packageName}@${release.version}`}
                      packageName={release.packageName}
                      version={release.version}
                      body={release.body}
                    />
                  ))}
                  {pastReleasesState.nextPageToken ? (
                    <LoadMoreButton
                      onClick={() => setLoadMoreRequested(pastReleasesState)}
                    />
                  ) : !packageName && state.packages.length > 1 ? (
                    <ChoosePackageButton to={getOpenDialogLink('package')} />
                  ) : null}
                </>
              )}
            </RepositoryPage>
          );
        })()}
      </AppContainer>
      <ChangeBranchDialog
        title="Choose a branch"
        open={!!(openDialog === 'branch' && state)}
        closeLink={closeDialogLink}
      >
        {state?.allBranchNames.map((branchName) => (
          <ChangeBranchButton key={branchName} to={getBranchLink(branchName)}>
            {branchName}
          </ChangeBranchButton>
        ))}
      </ChangeBranchDialog>
      <ChangeBranchDialog
        title="Choose a package"
        open={!!(openDialog === 'package' && state)}
        closeLink={closeDialogLink}
      >
        {state?.packages
          .map((pkg) => pkg.manifest.packageName)
          .sort()
          .map((packageName) => (
            <ChangeBranchButton
              key={packageName}
              to={getPackageLink(packageName)}
            >
              {packageName}
            </ChangeBranchButton>
          ))}
      </ChangeBranchDialog>
    </>
  );
}
