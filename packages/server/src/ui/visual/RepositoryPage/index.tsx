import React from 'react';
import PackageStatus from 'rollingversions/lib/types/PackageStatus';
import changesToMarkdown from 'rollingversions/lib/utils/changesToMarkdown';
import GitHubMarkdownAsync from '../GitHubMarkdown/async';
import {RepoResponse} from '../../../types';
import Alert from '../Alert';
import InstallIcon from '../HeroBar/install-icon.svg';

function PackageName({children}: {children: React.ReactNode}) {
  return (
    <h2 className="font-sans text-2xl text-gray-900 font-light mb-4">
      {children}
    </h2>
  );
}
export default function RepositoryPage(
  repoState: RepoResponse & {releaseButton?: React.ReactNode},
) {
  return (
    <div className="container mx-auto">
      <h1 className="flex align-center justify-between mb-2 mt-12">
        <span className="font-sans text-3xl text-gray-900 font-normal">
          Next Release
        </span>
        {repoState.releaseButton}
      </h1>
      {repoState.cycleDetected ? (
        <Alert className="mb-4">
          Cycle Detected: {repoState.cycleDetected.join(' -> ')}
        </Alert>
      ) : null}
      {repoState.packages.map((pkg) => {
        switch (pkg.status) {
          case PackageStatus.MissingTag:
            return (
              <React.Fragment key={pkg.packageName}>
                <PackageName>{pkg.packageName}</PackageName>
                <Alert className="mb-4">
                  Missing tag for {pkg.currentVersion}
                </Alert>
              </React.Fragment>
            );
          case PackageStatus.NewVersionToBePublished:
            return (
              <React.Fragment key={pkg.packageName}>
                <PackageName>
                  {pkg.packageName} ({pkg.currentVersion || 'unreleased'}
                  {' -> '}
                  {pkg.newVersion})
                </PackageName>
                <GitHubMarkdownAsync>
                  {changesToMarkdown(pkg.changeSet, 3)}
                </GitHubMarkdownAsync>
              </React.Fragment>
            );
          case PackageStatus.NoUpdateRequired:
            return (
              <React.Fragment key={pkg.packageName}>
                <PackageName>
                  {pkg.packageName} ({pkg.currentVersion || 'unreleased'})
                </PackageName>
                <p className="mb-8">No updates merged</p>
              </React.Fragment>
            );
        }
      })}
    </div>
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
