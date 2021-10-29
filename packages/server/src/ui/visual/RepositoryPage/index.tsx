import React, {useMemo} from 'react';
import {useLocation} from 'react-router-dom';

import type ChangeSet from '@rollingversions/change-set';
import {changesToMarkdown} from '@rollingversions/change-set';
import {ChangeType} from '@rollingversions/types';

import Alert from '../Alert';
import GitHubMarkdownAsync from '../GitHubMarkdown/async';
import InstallIcon from '../HeroBar/install-icon.svg';

function PackageName({children}: {children: React.ReactNode}) {
  return (
    <h2 className="font-sans text-2xl text-gray-900 font-light mb-4">
      {children}
    </h2>
  );
}

export interface RepositoryPageProps {
  releaseButton?: React.ReactNode;
  children: React.ReactNode;
}

export default function RepositoryPage({
  releaseButton,
  children,
}: RepositoryPageProps) {
  return (
    <div className="container mx-auto">
      <h1 className="flex align-center justify-between mb-2 mt-12">
        <span className="font-sans text-3xl text-gray-900 font-normal">
          Next Release
        </span>
        {releaseButton}
      </h1>
      {children}
    </div>
  );
}

export function CycleWarning({cycle}: {cycle: readonly string[]}) {
  return <Alert className="mb-4">Cycle Detected: {cycle.join(' -> ')}</Alert>;
}
export function ManifestWarning({
  filename,
  error,
}: {
  filename: string;
  error: string;
}) {
  return (
    <Alert className="mb-4">
      An error was encountered while parsing the package manifest at "{filename}
      ":
      <pre>{error}</pre>
    </Alert>
  );
}

export function PackageWithChanges({
  packageName,
  currentVersion,
  newVersion,
  changeSet,
  changeTypes,
}: {
  packageName: string;
  currentVersion: string | null;
  newVersion: string;
  changeSet: ChangeSet<{pr: number}>;
  changeTypes: readonly ChangeType[];
}) {
  return (
    <React.Fragment key={packageName}>
      <PackageName>
        {packageName} ({currentVersion || 'unreleased'}
        {' -> '}
        {newVersion})
      </PackageName>
      <GitHubMarkdownAsync>
        {changesToMarkdown(changeSet, {
          headingLevel: 3,
          renderContext: ({pr}) => ` (#${pr})`,
          changeTypes,
        })}
      </GitHubMarkdownAsync>
    </React.Fragment>
  );
}

export function PackageWithNoChanges({
  packageName,
  currentVersion,
}: {
  packageName: string;
  currentVersion: string | null;
}) {
  return (
    <React.Fragment key={packageName}>
      <PackageName>
        {packageName} ({currentVersion || 'unreleased'})
      </PackageName>
      <p className="mb-8">No updates merged</p>
    </React.Fragment>
  );
}

export function ReleaseButton() {
  return (
    <button
      type="submit"
      className="flex items-center justify-center bg-black text-white italic font-poppins font-black h-12 px-8 text-2xl focus:outline-none focus:shadow-gray"
    >
      Release via GitHub
      <div className="w-2" />
      <InstallIcon className="h-6 w-auto" />
    </button>
  );
}

export function useBranchState() {
  const {search} = useLocation();
  return useMemo(() => {
    const searchParams = new URLSearchParams(search);
    const branch = searchParams.get(`branch`);
    const changingBranch = searchParams.get(`change-branch`) === `1`;
    return {branch, changingBranch};
  }, [search]);
}
