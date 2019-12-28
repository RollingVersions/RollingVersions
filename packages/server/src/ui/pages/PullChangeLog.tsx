import React = require('react');
import {useParams} from 'react-router-dom';
import usePullRequest from '../hooks/usePullRequest';
import PullChangeLogEntry from '../local-components/PullChangeLogEntry';

interface Params {
  owner: string;
  repo: string;
  pull_number: string;
}
export default function PullChangeLog() {
  const params = useParams<Params>();
  const pr = usePullRequest(params);
  const [state, setState] = React.useState(pr.pullRequest?.changeLogState);
  React.useEffect(() => {
    setState(pr?.pullRequest?.changeLogState);
  }, [pr?.pullRequest?.changeLogState]);

  if (pr.error) {
    return <div>Something went wrong: {pr.error.message}</div>;
  }
  if (!pr.pullRequest) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <h1>ChangeLog</h1>
      {pr.pullRequest.currentVersions
        .slice()
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([name, packageInfo]) => (
          <PullChangeLogEntry
            key={name}
            packageInfo={packageInfo}
            changeLog={
              (state?.packages || []).find((c) => c.packageName === name) || {
                packageName: name,
                changes: [],
                publishInitialVersionAs: undefined,
              }
            }
            onChangeLogChange={(pkgState) => {
              setState((s) => ({
                submittedAtCommitSha: null,
                ...s,
                packages: [
                  ...(s?.packages || []).filter((p) => p.packageName !== name),
                  pkgState,
                ],
              }));
            }}
          />
        ))}
    </>
  );
}
