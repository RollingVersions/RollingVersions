import * as React from 'react';
import {MemoryRouter} from 'react-router-dom';

import {createChangeSet} from '@rollingversions/change-set';
import {DEFAULT_CHANGE_TYPES} from '@rollingversions/config';

import {
  ExistingRelease,
  LoadMoreButton,
  NextReleaseHeading,
  NoPastReleasesMessage,
  PackagesWithoutChanges,
  PastReleasesHeading,
  UnreleasedPullRequest,
  UnreleasedPullRequestList,
  useRepositoryQueryState,
} from '.';
import RepositoryPage, {
  CycleWarning,
  PackageWithChanges,
  PackageWithNoChanges,
  ReleaseButton,
} from '.';
import AppContainer from '../AppContainer';
import AppNavBar, {AppNavBarLink} from '../AppNavBar';
import ChangeBranchDialog, {ChangeBranchButton} from '../ChangeBranchDialog';
import ChangeBranchLink from '../ChangeBranchLink';

export default {title: 'pages/RepositoryPage'};

interface TemplateProps {
  children: React.ReactNode;
  noPastReleases?: boolean;
  allowEditPastReleases?: boolean;
}
const TemplateInner = ({
  children,
  noPastReleases,
  allowEditPastReleases,
}: TemplateProps) => {
  const {
    branch,
    packageName,
    openDialog,
    closeDialogLink,
    getOpenDialogLink,
    getBranchLink,
    getPackageLink,
  } = useRepositoryQueryState();
  return (
    <>
      <AppContainer>
        <AppNavBar>
          <AppNavBarLink to={`#`}>ForbesLindesay</AppNavBarLink>
          <AppNavBarLink>atdatabases</AppNavBarLink>
          <AppNavBarLink>
            {branch ?? `main`}
            <ChangeBranchLink to={getOpenDialogLink('branch')} />
          </AppNavBarLink>
        </AppNavBar>
        <RepositoryPage>
          {children}
          <PastReleasesHeading
            hasMultiplePackages
            to={getOpenDialogLink('package')}
            packageName={packageName}
          />
          {noPastReleases ? (
            <NoPastReleasesMessage />
          ) : (
            <>
              <ExistingRelease
                packageName="@databases/mysql"
                version="1.0.0"
                body={[`## Features`, `- Initial Release (#40)`].join(`\n`)}
                editLink={
                  allowEditPastReleases ? `https://github.com` : undefined
                }
              />
              <LoadMoreButton
                onClick={() => {
                  // do nothing in storybook
                }}
              />
            </>
          )}
        </RepositoryPage>
      </AppContainer>

      <ChangeBranchDialog
        title="Choose a branch"
        open={openDialog === 'branch'}
        closeLink={closeDialogLink}
      >
        <ChangeBranchButton to={{search: `?branch=main`}}>
          main
        </ChangeBranchButton>
        {Array.from({length: 20}).map((_, i) => (
          <ChangeBranchButton
            key={i}
            to={getBranchLink(`feat/${String.fromCharCode(97 + i)}`)}
          >
            feat/{String.fromCharCode(97 + i)}
          </ChangeBranchButton>
        ))}
      </ChangeBranchDialog>
      <ChangeBranchDialog
        title="Choose a package"
        open={openDialog === 'package'}
        closeLink={closeDialogLink}
      >
        <ChangeBranchButton to={getPackageLink('@databases/mysql')}>
          @databases/mysql
        </ChangeBranchButton>
        <ChangeBranchButton to={getPackageLink('@databases/pg')}>
          @databases/pg
        </ChangeBranchButton>
      </ChangeBranchDialog>
    </>
  );
};
const Template = (props: TemplateProps) => {
  return (
    <MemoryRouter>
      <TemplateInner {...props} />
    </MemoryRouter>
  );
};

export const NoUpdateRequired = () => {
  return (
    <Template noPastReleases>
      <NextReleaseHeading />
      <PackagesWithoutChanges>
        <PackageWithNoChanges
          packageName="@database/pg"
          currentVersion={null}
        />
        <PackageWithNoChanges
          packageName="@database/mysql"
          currentVersion={null}
        />
      </PackagesWithoutChanges>
    </Template>
  );
};

export const UpdateRequired = () => {
  return (
    <Template allowEditPastReleases>
      <NextReleaseHeading>
        <ReleaseButton />
      </NextReleaseHeading>
      <UnreleasedPullRequestList>
        <UnreleasedPullRequest
          href="/42"
          number={42}
          title="feat: add a pull request"
        />
        <UnreleasedPullRequest
          href="/41"
          number={41}
          title="fix: remove a bug"
        />
      </UnreleasedPullRequestList>
      <PackageWithChanges
        packageName="@database/pg"
        currentVersion={null}
        newVersion="1.0.0"
        changeSet={createChangeSet({
          type: 'feat',
          title: 'Initial release',
          body: '',
          pr: 42,
        })}
        changeTypes={DEFAULT_CHANGE_TYPES}
        path="/ForbesLindesay/atdatabases"
      />
      <PackageWithChanges
        packageName="@database/mysql"
        currentVersion="1.0.0"
        newVersion="2.0.0"
        changeSet={createChangeSet({
          type: 'breaking',
          title: 'Renamed queryStream to queryIterable',
          body: '',
          pr: 42,
        })}
        changeTypes={DEFAULT_CHANGE_TYPES}
        path="/ForbesLindesay/atdatabases"
      />
    </Template>
  );
};

export const CircularDependency = () => {
  return (
    <Template>
      <NextReleaseHeading />
      <CycleWarning
        cycle={['@datbases/pg', '@databases/mysl', '@databases/pg']}
      />
      <PackageWithChanges
        packageName="@database/pg"
        currentVersion={null}
        newVersion="1.0.0"
        changeSet={createChangeSet({
          type: 'feat',
          title: 'Initial release',
          body: '',
          pr: 42,
        })}
        changeTypes={DEFAULT_CHANGE_TYPES}
        path="/ForbesLindesay/atdatabases"
      />
      <PackageWithChanges
        packageName="@database/mysql"
        currentVersion="1.0.0"
        newVersion="2.0.0"
        changeSet={createChangeSet({
          type: 'breaking',
          title: 'Renamed queryStream to queryIterable',
          body: '',
          pr: 42,
        })}
        changeTypes={DEFAULT_CHANGE_TYPES}
        path="/ForbesLindesay/atdatabases"
      />
    </Template>
  );
};
