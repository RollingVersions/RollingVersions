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
        <AppNavBarLink to={`/${params.owner}/${params.repo}`}>
          {params.repo}
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

        const headSha = pr.pullRequest.headSha || undefined;

        return (
          <PullRequestPage
            headSha={headSha}
            permission={pr.pullRequest.permission}
            closed={pr.pullRequest.closed}
            merged={pr.pullRequest.merged}
            saving={pr.updating || saving}
            packages={pr.pullRequest.packages}
            onSave={async (updates) => {
              // TODO: headSha should not be **needed** to save
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
