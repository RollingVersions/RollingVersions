import React from 'react';
import {useParams} from 'react-router-dom';
import usePullRequest from '../hooks/usePullRequest';
import PullChangeLogPackage from '../local-components/PullChangeLogPackage';
import Permission from '../../Permission';

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

  const headSha = pr.pullRequest.headSha;
  const shortSha = headSha.substr(0, 7);
  return (
    <div className="mb-16 mt-4 mx-8">
      <h1>ChangeLog</h1>
      {Object.entries(pr.pullRequest.currentVersions)
        .slice()
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .filter(
          <S, T>(v: [S, T]): v is [S, Exclude<T, undefined>] =>
            v[1] !== undefined,
        )
        .map(([name, packageInfo]) => (
          <PullChangeLogPackage
            key={name}
            disabled={
              pr.updating || pr.pullRequest?.permission !== Permission.Edit
            }
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
      {pr.pullRequest.permission === Permission.Edit && (
        <button
          type="button"
          disabled={!state || !headSha || pr.updating}
          className={`${
            !state || !headSha || pr.updating
              ? `bg-gray-700`
              : `bg-blue-500 hover:bg-blue-700`
          } text-white font-bold py-2 px-4 fixed right-0 bottom-0 mx-12 my-4 rounded-full`}
          onClick={() => {
            if (!state || !headSha || pr.updating) return;
            void pr.update({
              ...state,
              submittedAtCommitSha: headSha,
            });
          }}
        >
          Save Changelog For {shortSha}
        </button>
      )}
    </div>
  );
}
