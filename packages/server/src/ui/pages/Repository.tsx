import React from 'react';
import {useParams} from 'react-router-dom';
import {RepoResponse} from '../../types';
import PackageStatus from 'rollingversions/lib/types/PackageStatus';
import AppContainer from '../visual/AppContainer';
import AppNavBar, {AppNavBarLink} from '../visual/AppNavBar';
import RepositoryPage, {ReleaseButton} from '../visual/RepositoryPage';

interface Params {
  owner: string;
  repo: string;
}

export default function Repository() {
  const params = useParams<Params>();
  const [error, setError] = React.useState<Error | undefined>();
  const [state, setState] = React.useState<RepoResponse | undefined>();
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
          !state.cycleDetected &&
          state.packages.some(
            (p) => p.status === PackageStatus.NewVersionToBePublished,
          ) &&
          !state.packages.some((p) => p.status === PackageStatus.MissingTag);

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
          />
        );
      })()}
    </AppContainer>
  );
}
