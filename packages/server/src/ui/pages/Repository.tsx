import React from 'react';
import {useParams} from 'react-router-dom';

import {printTag} from '@rollingversions/tag-format';
import {
  GetRepositoryApiResponse,
  PastReleasesApiResponse,
  VersioningMode,
} from '@rollingversions/types';
import {printString} from '@rollingversions/version-number';

import {SetReleaseDescriptionBodyCodec} from '../../types';
import Alert from '../visual/Alert';
import AppContainer from '../visual/AppContainer';
import AppNavBar, {AppNavBarLink} from '../visual/AppNavBar';
import ChangeBranchLink from '../visual/ChangeBranchLink';
import ModalDialogButtonList, {
  ModalDialogLinkButton,
} from '../visual/ModalDialogButtonList';
import ModalDialogSetReleaseNotes from '../visual/ModalDialogSetReleaseNotes';
import RepositoryPage, {
  ChoosePackageButton,
  CycleWarning,
  ExistingRelease,
  LoadMoreButton,
  ManifestWarning,
  NextReleaseHeading,
  NoPastReleasesMessage,
  PackagesWithoutChanges,
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
    PastReleasesApiResponse | undefined
  >();
  const [loadMoreRequested, setLoadMoreRequested] = React.useState<
    PastReleasesApiResponse | undefined
  >();
  const path = `/${params.owner}/${params.repo}`;
  const {
    branch,
    packageName,
    openDialog,
    closeDialogLink,
    closeDialog,
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
        const data: PastReleasesApiResponse = await res.json();
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
            <ChangeBranchLink to={getOpenDialogLink({name: 'branch'})} />
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
                        ? pkg.manifest.tag_format
                          ? currentVersion.name
                          : printString(currentVersion.version)
                        : null
                    }
                    newVersion={
                      pkg.manifest.tag_format
                        ? printTag(pkg.newVersion, {
                            packageName: pkg.manifest.packageName,
                            oldTagName: null,
                            tagFormat: pkg.manifest.tag_format,
                            versionSchema: pkg.manifest.version_schema,
                          })
                        : printString(pkg.newVersion)
                    }
                    changeSet={pkg.changeSet}
                    changeTypes={pkg.manifest.change_types}
                    path={path}
                    releaseDescription={pkg.releaseDescription}
                    setReleaseDescriptionLink={getOpenDialogLink({
                      name: `release_description`,
                      packageName: pkg.manifest.packageName,
                    })}
                  />
                );
              })}
              {state.packages.some((pkg) => !pkg.newVersion) ? (
                <PackagesWithoutChanges>
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
                            ? pkg.manifest.tag_format
                              ? pkg.currentVersion.name
                              : printString(pkg.currentVersion.version)
                            : null
                        }
                      />
                    );
                  })}
                </PackagesWithoutChanges>
              ) : null}
              <PastReleasesHeading
                hasMultiplePackages={state.packages.length > 1}
                to={getOpenDialogLink({name: 'package'})}
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
                      editLink={release.editLink}
                    />
                  ))}
                  {pastReleasesState.nextPageToken ? (
                    <LoadMoreButton
                      key={pastReleasesState.releases.length}
                      onClick={() => setLoadMoreRequested(pastReleasesState)}
                    />
                  ) : !packageName && state.packages.length > 1 ? (
                    <ChoosePackageButton
                      to={getOpenDialogLink({name: 'package'})}
                    />
                  ) : null}
                </>
              )}
            </RepositoryPage>
          );
        })()}
      </AppContainer>
      <ModalDialogButtonList
        title="Choose a branch"
        open={!!(openDialog?.name === 'branch' && state)}
        closeLink={closeDialogLink}
      >
        {state?.allBranchNames.map((branchName) => (
          <ModalDialogLinkButton
            key={branchName}
            to={getBranchLink(branchName)}
          >
            {branchName}
          </ModalDialogLinkButton>
        ))}
      </ModalDialogButtonList>
      <ModalDialogButtonList
        title="Choose a package"
        open={!!(openDialog?.name === 'package' && state)}
        closeLink={closeDialogLink}
      >
        {state?.packages
          .map((pkg) => pkg.manifest.packageName)
          .sort()
          .map((packageName) => (
            <ModalDialogLinkButton
              key={packageName}
              to={getPackageLink(packageName)}
            >
              {packageName}
            </ModalDialogLinkButton>
          ))}
      </ModalDialogButtonList>
      <ModalDialogSetReleaseNotes
        open={!!(openDialog?.name === 'release_description' && state)}
        releaseNotes={
          openDialog?.name === 'release_description'
            ? state?.packages.find(
                (p) => p.manifest.packageName === openDialog.packageName,
              )?.releaseDescription
            : undefined
        }
        closeLink={closeDialogLink}
        onSave={(releaseDescription) => {
          const pkg =
            openDialog?.name === 'release_description'
              ? state?.packages.find(
                  (p) => p.manifest.packageName === openDialog.packageName,
                )
              : undefined;
          if (pkg) {
            closeDialog();
            setState((s) =>
              s
                ? {
                    ...s,
                    packages: s.packages.map((p) => {
                      if (p.manifest.packageName === pkg.manifest.packageName) {
                        return {...p, releaseDescription};
                      }
                      return p;
                    }),
                  }
                : s,
            );
            const currentVersion = pkg.currentVersion;
            fetch(`${path}/set_release_description`, {
              method: 'POST',
              body: JSON.stringify(
                SetReleaseDescriptionBodyCodec.serialize({
                  packageName: pkg.manifest.packageName,
                  currentVersion: !currentVersion
                    ? `unreleased`
                    : currentVersion.ok
                    ? printString(currentVersion.version)
                    : printString(currentVersion.maxVersion.version),
                  releaseDescription,
                }),
              ),
              headers: {'Content-Type': 'application/json'},
            })
              .then(async (res) => {
                if (!res.ok) {
                  throw new Error(`${res.statusText}: ${await res.text()}`);
                }
              })
              .catch((err) => {
                setError(err);
              });
          }
        }}
      />
    </>
  );
}
