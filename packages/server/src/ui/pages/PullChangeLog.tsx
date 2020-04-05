import React from 'react';
import {useParams} from 'react-router-dom';
import usePullRequest from '../hooks/usePullRequest';
import PackageChangeSet from '../visual/PackageChangeSet';
import Permission from '../../server/permissions/Permission';
import SaveChangeLogFooter from '../visual/SaveChangeLogFooter';
import {
  PackagePullChangeLog,
  ChangeLogEntry,
} from '@rollingversions/utils/lib/PullChangeLog';
import getLocalId from '../utils/getLocalId';
import PullRequestPage from '../visual/PullRequestPage';

interface Params {
  owner: string;
  repo: string;
  pull_number: string;
}
function getState(packages: PackagePullChangeLog[]) {
  const results: Record<string, (ChangeLogEntry & {localId: number})[]> = {};
  packages.forEach((pkg) => {
    results[pkg.packageName] = pkg.changes.map((c) => ({
      ...c,
      localId: getLocalId(),
    }));
  });
  return results;
}
export default function PullChangeLog() {
  const params = useParams<Params>();
  const pr = usePullRequest(params);
  const [saving, setSaving] = React.useState(false);

  if (pr.error) {
    return <div>Something went wrong: {pr.error.message}</div>;
  }
  if (!pr.pullRequest) {
    return <div>Loading...</div>;
  }

  const headSha = pr.pullRequest.headSha;

  return (
    <PullRequestPage
      headSha={headSha}
      readOnly={pr.pullRequest.permission !== Permission.Edit || !headSha}
      saving={pr.updating || saving}
      currentVersions={pr.pullRequest.currentVersions}
      packages={pr.pullRequest.changeLogState.packages}
      onSave={async (newPackages) => {
        if (!headSha) return;
        setSaving(true);
        if (
          pr.pullRequest &&
          (await pr.update({
            ...pr.pullRequest.changeLogState,
            packages: newPackages,
            submittedAtCommitSha: headSha,
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
}
