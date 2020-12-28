import ChangeSet from '@rollingversions/change-set';
import React from 'react';
import changesToMarkdown from 'rollingversions/lib/utils/changesToMarkdown';
import GitHubMarkdownAsync from '../GitHubMarkdown/async';
import Alert from '../Alert';
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

export function PackageWithChanges({
  packageName,
  currentVersion,
  newVersion,
  changeSet,
}: {
  packageName: string;
  currentVersion: string | null;
  newVersion: string;
  changeSet: ChangeSet<{pr: number}>;
}) {
  return (
    <React.Fragment key={packageName}>
      <PackageName>
        {packageName} ({currentVersion || 'unreleased'}
        {' -> '}
        {newVersion})
      </PackageName>
      <GitHubMarkdownAsync>
        {changesToMarkdown(changeSet, 3)}
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
