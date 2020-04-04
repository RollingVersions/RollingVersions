import React from 'react';
import {useParams} from 'react-router-dom';
import usePullRequest from '../hooks/usePullRequest';
import PullChangeLogPackage from '../local-components/PullChangeLogPackage';
import Permission from '../../server/permissions/Permission';

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
              pr.updating ||
              pr.pullRequest?.permission !== Permission.Edit ||
              !headSha
            }
            packageInfo={packageInfo}
            changeLog={
              (state?.packages || []).find((c) => c.packageName === name) || {
                packageName: name,
                changes: [],
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
      {pr.pullRequest.permission === Permission.Edit && headSha && (
        <div className="fixed left-0 right-0 bottom-0 w-full bg-white flex justify-end shadow-2xl">
          <button
            type="button"
            disabled={!state || pr.updating}
            className={`${
              !state || pr.updating
                ? `bg-gray-700`
                : `bg-blue-500 hover:bg-blue-700`
            } text-white font-bold py-4 px-8 mx-12 my-4 rounded-full`}
            onClick={async () => {
              if (!state || pr.updating) return;
              if (
                await pr.update({
                  ...state,
                  submittedAtCommitSha: headSha,
                })
              ) {
                location.assign(
                  `https://github.com/${params.owner}/${params.repo}/pull/${params.pull_number}`,
                );
              }
            }}
          >
            Save Changelog For {headSha.substr(0, 7)}
          </button>
        </div>
      )}
    </div>
  );
}
