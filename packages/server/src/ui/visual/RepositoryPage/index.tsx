import React, {useMemo} from 'react';
import {Link, LinkProps, useLocation} from 'react-router-dom';

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

export default function RepositoryPage({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="container mx-auto">{children}</div>;
}
export function NextReleaseHeading({children}: {children?: React.ReactNode}) {
  return (
    <h1 className="flex align-center justify-between mb-2 mt-12">
      <span className="font-sans text-3xl text-gray-900 font-normal">
        Next Release
      </span>
      {children}
    </h1>
  );
}
export function PastReleasesHeading({
  to,
  packageName,
  hasMultiplePackages,
}: {
  to: LinkProps['to'];
  packageName: string | null;
  hasMultiplePackages: boolean;
}) {
  return (
    <h1 className="flex items-center mb-2 mt-12 font-sans text-3xl text-gray-900 font-normal">
      {hasMultiplePackages ? (
        <Link to={to}>
          Past Releases for {packageName || 'All Packages'}
          <span className="ml-2 text-sm text-gray-600">
            ({packageName ? `change` : `filter`} package)
          </span>
        </Link>
      ) : (
        `Past Releases`
      )}
    </h1>
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
  path,
}: {
  packageName: string;
  currentVersion: string | null;
  newVersion: string;
  changeSet: ChangeSet<{pr: number}>;
  changeTypes: readonly ChangeType[];
  path: string;
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
          renderContext: ({pr}) => ` ([#${pr}](${path}/pull/${pr}))`,
          changeTypes,
        })}
      </GitHubMarkdownAsync>
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

export function LoadMoreButton({onClick}: {onClick: () => void}) {
  return (
    <button
      type="button"
      className="flex items-center justify-center bg-black text-white font-poppins font-black h-8 px-4 text-lg focus:outline-none focus:shadow-gray"
      onClick={() => {
        onClick();
      }}
    >
      Load More
    </button>
  );
}

export function ChoosePackageButton({to}: {to: LinkProps['to']}) {
  return (
    <Link
      to={to}
      className="flex items-center justify-center bg-black text-white font-poppins font-black h-8 px-4 text-lg focus:outline-none focus:shadow-gray"
    >
      Choose a package to see more releases
    </Link>
  );
}

export type DialogName = 'branch' | 'package';
function asDialogName(str: string | null): DialogName | null {
  switch (str) {
    case 'branch':
    case 'package':
      return str;
    default:
      return null;
  }
}
export function useRepositoryQueryState(): {
  branch: string | null;
  packageName: string | null;
  openDialog: DialogName | null;
  closeDialogLink: LinkProps['to'];
  getBranchLink: (branch: string | null) => LinkProps['to'];
  getPackageLink: (packageName: string | null) => LinkProps['to'];
  getOpenDialogLink: (dialogName: DialogName) => LinkProps['to'];
} {
  const {search} = useLocation();
  return useMemo(() => {
    const searchParams = new URLSearchParams(search);
    const branch = searchParams.get(`branch`);
    const packageName = searchParams.get(`package-name`);
    const openDialog = searchParams.get(`dialog`);

    searchParams.delete(`dialog`);
    const closeDialogStr = searchParams.toString();

    const getBranchLink = (branch: string | null) => {
      const p = new URLSearchParams(searchParams);
      if (branch) p.set(`branch`, branch);
      else p.delete(`branch`);
      const s = p.toString();
      return {search: s ? `?${s}` : ``};
    };
    const getPackageLink = (packageName: string | null) => {
      const p = new URLSearchParams(searchParams);
      if (packageName) p.set(`package-name`, packageName);
      else p.delete(`package-name`);
      const s = p.toString();
      return {search: s ? `?${s}` : ``};
    };
    const getOpenDialogLink = (dialogName: DialogName) => {
      const p = new URLSearchParams(searchParams);
      p.set(`dialog`, dialogName);

      const s = p.toString();
      return {search: s ? `?${s}` : ``};
    };

    return {
      branch,
      packageName,
      openDialog: asDialogName(openDialog),
      closeDialogLink: {search: closeDialogStr ? `?${closeDialogStr}` : ``},
      getBranchLink,
      getPackageLink,
      getOpenDialogLink,
    };
  }, [search]);
}

export function UnreleasedPullRequestList({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <h2 className="font-sans text-sm list-square mb-1 text-gray-800">
        Pull requests in release:
      </h2>
      <ul className="font-sans text-sm list-square ml-8 mb-5 text-gray-800">
        {children}
      </ul>
    </>
  );
}
export function UnreleasedPullRequest(props: {
  number: number;
  title: string;
  href: string;
}) {
  return (
    <li>
      <Link
        className="flex-grow hover: text-gray-900 hover:font-bold"
        to={props.href}
      >
        {props.title} (#{props.number})
      </Link>
    </li>
  );
}

export function PackagesWithoutChanges({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <h2 className="font-sans text-sm list-square mb-1 text-gray-800">
        Packages with no merged changes to release:
      </h2>
      <ul className="font-sans text-sm list-square ml-8 mb-5 text-gray-800">
        {children}
      </ul>
    </>
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
    <li>
      {packageName} ({currentVersion || 'unreleased'})
    </li>
  );
}

export function NoPastReleasesMessage() {
  return <p>No past releases found</p>;
}
export function ExistingRelease({
  packageName,
  version,
  body,
  editLink,
}: {
  packageName: string;
  version: string;
  body: string;
  editLink?: string;
}) {
  return (
    <div className="mb-8">
      <PackageName>
        {packageName} ({version})
      </PackageName>
      {editLink ? (
        <a
          className="mb-4 text-sm text-gray-600 hover:text-gray-900 hover:underline"
          href={editLink}
        >
          Edit
        </a>
      ) : null}
      <GitHubMarkdownAsync>{body}</GitHubMarkdownAsync>
    </div>
  );
}
