import * as React from 'react';
import {MemoryRouter} from 'react-router-dom';

import {createChangeSet} from '@rollingversions/change-set';

import {RepositoryPageProps, useBranchState} from '.';
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

const TemplateInner = ({
  dialog,
  ...props
}: RepositoryPageProps & {dialog?: React.ReactNode}) => {
  const {branch, changingBranch} = useBranchState();
  return (
    <>
      <AppContainer>
        <AppNavBar>
          <AppNavBarLink to={`#`}>ForbesLindesay</AppNavBarLink>
          <AppNavBarLink>atdatabases</AppNavBarLink>
          <AppNavBarLink>
            {branch ?? `main`}
            <ChangeBranchLink currentBranch={branch} />
          </AppNavBarLink>
        </AppNavBar>
        <RepositoryPage {...props} />
      </AppContainer>

      <ChangeBranchDialog open={changingBranch} currentBranch={branch}>
        <ChangeBranchButton to={{search: `?branch=main`}}>
          main
        </ChangeBranchButton>
        {Array.from({length: 20}).map((_, i) => (
          <ChangeBranchButton
            key={i}
            to={{
              search: `?branch=${encodeURIComponent(
                `feat/${String.fromCharCode(97 + i)}`,
              )}`,
            }}
          >
            feat/{String.fromCharCode(97 + i)}
          </ChangeBranchButton>
        ))}
      </ChangeBranchDialog>
    </>
  );
};
const Template = (props: RepositoryPageProps & {dialog?: React.ReactNode}) => {
  return (
    <MemoryRouter>
      <TemplateInner {...props} />
    </MemoryRouter>
  );
};

export const NoUpdateRequired = () => {
  return (
    <Template>
      <PackageWithNoChanges packageName="@database/pg" currentVersion={null} />
      <PackageWithNoChanges
        packageName="@database/mysql"
        currentVersion={null}
      />
    </Template>
  );
};

export const UpdateRequired = () => {
  return (
    <Template releaseButton={<ReleaseButton />}>
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
      />
    </Template>
  );
};

export const CircularDependency = () => {
  return (
    <Template>
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
      />
    </Template>
  );
};
