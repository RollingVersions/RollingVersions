import React from 'react';
import {useParams} from 'react-router-dom';
import usePullRequest from '../hooks/usePullRequest';
import PullChangeLogPackage from '../local-components/PullChangeLogPackage';
import Permission from '../../server/permissions/Permission';
import SaveChangeLogFooter from '../visual/SaveChangeLogFooter';

interface Params {
  owner: string;
  repo: string;
  pull_number: string;
}
export default function PullChangeLog() {
  const params = useParams<Params>();
  const pr = usePullRequest(params);
  const [saving, setSaving] = React.useState(false);
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

  const disabled =
    saving ||
    !state ||
    pr.updating ||
    pr.pullRequest?.permission !== Permission.Edit ||
    !headSha;

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
            disabled={disabled}
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
        <SaveChangeLogFooter
          disabled={disabled}
          headSha={headSha}
          onClick={async () => {
            if (!state || pr.updating) return;
            setSaving(true);
            if (
              await pr.update({
                ...state,
                submittedAtCommitSha: headSha,
              })
            ) {
              location.assign(
                `https://github.com/${params.owner}/${params.repo}/pull/${params.pull_number}`,
              );
            } else {
              setSaving(false);
            }
          }}
        />
      )}
    </div>
  );
}
