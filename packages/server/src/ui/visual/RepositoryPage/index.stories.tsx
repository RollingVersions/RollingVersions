import * as React from 'react';
import {MemoryRouter} from 'react-router-dom';
import AppNavBar, {AppNavBarLink} from '../AppNavBar';
import AppContainer from '../AppContainer';
import RepositoryPage, {
  CycleWarning,
  PackageWithChanges,
  PackageWithNoChanges,
  ReleaseButton,
  RepositoryPageProps,
} from './';
import {createChangeSet} from '@rollingversions/change-set';

export default {title: 'pages/RepositoryPage'};

const Template = (props: RepositoryPageProps) => {
  return (
    <MemoryRouter>
      <AppContainer>
        <AppNavBar>
          <AppNavBarLink to={`#`}>ForbesLindesay</AppNavBarLink>
          <AppNavBarLink>atdatabases</AppNavBarLink>
        </AppNavBar>
        <RepositoryPage {...props} />
      </AppContainer>
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
