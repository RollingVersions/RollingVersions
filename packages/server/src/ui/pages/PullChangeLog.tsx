import React from 'react';
import {useParams} from 'react-router-dom';
import usePullRequest from '../hooks/usePullRequest';
import PullRequestPage from '../visual/PullRequestPage';
import AppContainer from '../visual/AppContainer';
import AppNavBar, {AppNavBarLink} from '../visual/AppNavBar';

interface Params {
  owner: string;
  repo: string;
  pull_number: string;
}

export default function PullChangeLog() {
  const params = useParams<Params>();
  const pr = usePullRequest(params);
  const [saving, setSaving] = React.useState(false);

  return (
    <AppContainer>
      <AppNavBar>
        <AppNavBarLink to={`/${params.owner}`}>{params.owner}</AppNavBarLink>
        <AppNavBarLink to={`/${params.owner}/${params.owner}`}>
          {params.owner}
        </AppNavBarLink>
        <AppNavBarLink>PR {params.pull_number}</AppNavBarLink>
      </AppNavBar>
      {(() => {
        if (pr.error) {
          return <div>Something went wrong: {pr.error}</div>;
        }
        if (!pr.pullRequest) {
          return <div>Loading...</div>;
        }
        if (!pr.pullRequest.changeLogState) {
          if (pr.pullRequest.merged) {
            return (
              <div>
                This PR is already merged and does not seem to have a change
                log.
              </div>
            );
          } else if (pr.pullRequest.closed) {
            return (
              <div>
                This PR is already closed and does not seem to have a change
                log.
              </div>
            );
          } else {
            return (
              <div>
                This PR does not seem to have a change log, or any way to add
                one.
              </div>
            );
          }
        }

        const headSha = pr.pullRequest.changeLogState?.packageInfoFetchedAt;

        return (
          <PullRequestPage
            headSha={headSha}
            readOnly={
              pr.pullRequest.permission !== 'edit' ||
              pr.pullRequest.unreleasedPackages.length === 0 ||
              !headSha
            }
            saving={pr.updating || saving}
            packages={pr.pullRequest.changeLogState.packages}
            unreleasedPackages={pr.pullRequest.unreleasedPackages}
            onSave={async (updates) => {
              if (!headSha) return;
              setSaving(true);
              if (
                pr.pullRequest &&
                (await pr.update({
                  headSha,
                  updates,
                }))
              ) {
                location.assign(
                  `https://github.com/${params.owner}/${params.repo}/pull/${params.pull_number}`,
                );
              } else {
                setSaving(false);
              }
            }}
          />
        );
      })()}
    </AppContainer>
  );
}
