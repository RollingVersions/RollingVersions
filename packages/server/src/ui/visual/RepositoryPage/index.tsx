import assertNever from 'assert-never';
import React, {useMemo} from 'react';
import {Link, LinkProps, useHistory, useLocation} from 'react-router-dom';

import type ChangeSet from '@rollingversions/change-set';
import {changesToMarkdown} from '@rollingversions/change-set';
import {ChangeType} from '@rollingversions/types';

import Alert from '../Alert';
import GitHubMarkdownAsync from '../GitHubMarkdown/async';
import InstallIcon from '../HeroBar/install-icon.svg';

function PackageName({children}: {children: React.ReactNode}) {
  return (
    <h2 className="flex items-end font-sans text-2xl text-gray-900 font-light mb-4">
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
        <Link to={to} replace>
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
  releaseDescription,
  setReleaseDescriptionLink,
}: {
  packageName: string;
  currentVersion: string | null;
  newVersion: string;
  changeSet: ChangeSet<{pr: number}>;
  changeTypes: readonly ChangeType[];
  path: string;
  releaseDescription: string;
  setReleaseDescriptionLink: LinkProps['to'];
}) {
  return (
    <React.Fragment key={packageName}>
      <PackageName>
        {packageName} ({currentVersion || 'unreleased'}
        {' -> '}
        {newVersion})
      </PackageName>
      {releaseDescription ? (
        <>
          <GitHubMarkdownAsync>{releaseDescription}</GitHubMarkdownAsync>
          <Link
            className="block -mt-4 text-sm text-gray-700 hover:text-gray-900 italic hover:underline"
            to={setReleaseDescriptionLink}
            replace
          >
            Edit Release Description
          </Link>
        </>
      ) : (
        <Link
          className="text-sm text-gray-700 hover:text-gray-900 italic hover:underline"
          to={setReleaseDescriptionLink}
          replace
        >
          Add Release Description
        </Link>
      )}
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
      replace
    >
      Choose a package to see more releases
    </Link>
  );
}

export type DialogParam =
  | {name: 'branch'}
  | {name: 'package'}
  | {name: 'release_description'; packageName: string};
function parseDialogParam(str: string | null): DialogParam | null {
  switch (str) {
    case 'branch':
    case 'package':
      return {name: str};
    default: {
      const match = str && /^release_description:(.+)$/.exec(str);
      if (match) {
        return {name: `release_description`, packageName: match[1]};
      }
      return null;
    }
  }
}
function stringifyDialogParam(param: DialogParam): string {
  switch (param.name) {
    case 'branch':
    case 'package':
      return param.name;
    case 'release_description':
      return `${param.name}:${param.packageName}`;
    default:
      return assertNever(param);
  }
}
export interface RepositoryQueryState {
  branch: string | null;
  packageName: string | null;
  openDialog: DialogParam | null;
  closeDialogLink: LinkProps['to'];
  closeDialog: () => void;
  getBranchLink: (branch: string | null) => LinkProps['to'];
  getPackageLink: (packageName: string | null) => LinkProps['to'];
  getOpenDialogLink: (dialogParam: DialogParam) => LinkProps['to'];
}
export function useRepositoryQueryState(): RepositoryQueryState {
  const history = useHistory();
  const {search} = useLocation();

  const parsedParams = useMemo(() => {
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
    const getOpenDialogLink = (dialogParam: DialogParam) => {
      const p = new URLSearchParams(searchParams);
      p.set(`dialog`, stringifyDialogParam(dialogParam));
      const s = p.toString();
      return {search: s ? `?${s}` : ``};
    };

    return {
      branch,
      packageName,
      openDialog: parseDialogParam(openDialog),
      closeDialogLink: {search: closeDialogStr ? `?${closeDialogStr}` : ``},
      getBranchLink,
      getPackageLink,
      getOpenDialogLink,
    };
  }, [search]);
  return {
    ...parsedParams,
    closeDialog: () => {
      history.replace({...history.location, ...parsedParams.closeDialogLink});
    },
  };
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
        <div className="flex-grow" />
        {editLink ? (
          <a
            className="text-sm text-gray-600 hover:text-gray-900 hover:underline"
            href={editLink}
          >
            Edit Release
          </a>
        ) : null}
      </PackageName>
      <GitHubMarkdownAsync>{body}</GitHubMarkdownAsync>
    </div>
  );
}
