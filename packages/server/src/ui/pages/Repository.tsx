import React from 'react';
import {useParams} from 'react-router-dom';
import {RepoResponse} from '../../types';
import PackageStatus from 'rollingversions/lib/types/PackageStatus';
import GitHubMarkdownAsync from '../visual/GitHubMarkdown/async';
import {changesToMarkdown} from 'rollingversions/lib/utils/Rendering';
import AppContainer from '../visual/AppContainer';
import AppNavBar, {AppNavBarLink} from '../visual/AppNavBar';

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
        <AppNavBarLink>{params.owner}</AppNavBarLink>
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

        return (
          <>
            <h1>Future Releases</h1>
            {state.cycleDetected ? (
              <p>Cycle Detected: {state.cycleDetected.join(' -> ')}</p>
            ) : null}
            {state.packages.map((pkg) => {
              switch (pkg.status) {
                case PackageStatus.MissingTag:
                  return (
                    <React.Fragment key={pkg.packageName}>
                      <h2>{pkg.packageName}</h2>
                      <p>Missing tag for {pkg.currentVersion}</p>
                    </React.Fragment>
                  );
                case PackageStatus.NewVersionToBePublished:
                  return (
                    <React.Fragment key={pkg.packageName}>
                      <h2>
                        {pkg.packageName} ({pkg.currentVersion} ->{' '}
                        {pkg.newVersion})
                      </h2>
                      <GitHubMarkdownAsync>
                        {changesToMarkdown(pkg.changeSet, 3)}
                      </GitHubMarkdownAsync>
                    </React.Fragment>
                  );
                case PackageStatus.NoUpdateRequired:
                  return (
                    <React.Fragment key={pkg.packageName}>
                      <h2>
                        {pkg.packageName} ({pkg.currentVersion})
                      </h2>
                      <p>No updates merged</p>
                    </React.Fragment>
                  );
              }
            })}
            <form
              method="POST"
              action={`/${params.owner}/${params.repo}/dispatch/rollingversions_publish_approved`}
            >
              <button type="submit">Release These Changes</button>
            </form>
          </>
        );
      })()}
    </AppContainer>
  );
}
