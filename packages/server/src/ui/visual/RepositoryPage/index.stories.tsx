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
  RepositoryQueryState,
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
import ChangeBranchLink from '../ChangeBranchLink';
import ModalDialogButtonList, {
  ModalDialogLinkButton,
} from '../ModalDialogButtonList';
import ModalDialogSetReleaseNotes from '../ModalDialogSetReleaseNotes';

export default {title: 'pages/RepositoryPage'};

interface TemplateProps {
  children: (s: RepositoryQueryState) => React.ReactNode;
  noPastReleases?: boolean;
  allowEditPastReleases?: boolean;
}
const TemplateInner = ({
  children,
  noPastReleases,
  allowEditPastReleases,
}: TemplateProps) => {
  const s = useRepositoryQueryState();
  const {
    branch,
    packageName,
    openDialog,
    closeDialogLink,
    closeDialog,
    getOpenDialogLink,
    getBranchLink,
    getPackageLink,
  } = s;
  return (
    <>
      <AppContainer>
        <AppNavBar>
          <AppNavBarLink to={`#`}>ForbesLindesay</AppNavBarLink>
          <AppNavBarLink>atdatabases</AppNavBarLink>
          <AppNavBarLink>
            {branch ?? `main`}
            <ChangeBranchLink to={getOpenDialogLink({name: 'branch'})} />
          </AppNavBarLink>
        </AppNavBar>
        <RepositoryPage>
          {children(s)}
          <PastReleasesHeading
            hasMultiplePackages
            to={getOpenDialogLink({name: 'package'})}
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

      <ModalDialogButtonList
        title="Choose a branch"
        open={openDialog?.name === 'branch'}
        closeLink={closeDialogLink}
      >
        <ModalDialogLinkButton to={{search: `?branch=main`}}>
          main
        </ModalDialogLinkButton>
        {Array.from({length: 20}).map((_, i) => (
          <ModalDialogLinkButton
            key={i}
            to={getBranchLink(`feat/${String.fromCharCode(97 + i)}`)}
          >
            feat/{String.fromCharCode(97 + i)}
          </ModalDialogLinkButton>
        ))}
      </ModalDialogButtonList>
      <ModalDialogButtonList
        title="Choose a package"
        open={openDialog?.name === 'package'}
        closeLink={closeDialogLink}
      >
        <ModalDialogLinkButton to={getPackageLink('@databases/mysql')}>
          @databases/mysql
        </ModalDialogLinkButton>
        <ModalDialogLinkButton to={getPackageLink('@databases/pg')}>
          @databases/pg
        </ModalDialogLinkButton>
      </ModalDialogButtonList>
      <ModalDialogSetReleaseNotes
        open={openDialog?.name === 'release_description'}
        closeLink={closeDialogLink}
        releaseNotes={
          openDialog?.name === 'release_description'
            ? openDialog.packageName === '@database/pg'
              ? `This will be the **first** release of @databases/pg`
              : ``
            : undefined
        }
        onSave={() => {
          closeDialog();
        }}
      />
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
      {() => (
        <>
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
        </>
      )}
    </Template>
  );
};

export const UpdateRequired = () => {
  return (
    <Template allowEditPastReleases>
      {({getOpenDialogLink}) => (
        <>
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
            releaseDescription="This will be the **first** release of @databases/pg"
            setReleaseDescriptionLink={getOpenDialogLink({
              name: 'release_description',
              packageName: '@database/pg',
            })}
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
            releaseDescription=""
            setReleaseDescriptionLink={getOpenDialogLink({
              name: 'release_description',
              packageName: '@database/mysql',
            })}
          />
        </>
      )}
    </Template>
  );
};

export const CircularDependency = () => {
  return (
    <Template>
      {({getOpenDialogLink}) => (
        <>
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
            releaseDescription=""
            setReleaseDescriptionLink={getOpenDialogLink({
              name: 'release_description',
              packageName: '@database/pg',
            })}
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
            releaseDescription=""
            setReleaseDescriptionLink={getOpenDialogLink({
              name: 'release_description',
              packageName: '@database/pg',
            })}
          />
        </>
      )}
    </Template>
  );
};
