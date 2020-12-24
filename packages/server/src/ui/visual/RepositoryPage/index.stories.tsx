import * as React from 'react';
import {MemoryRouter} from 'react-router-dom';
import getEmptyChangeSet from 'rollingversions/lib/utils/getEmptyChangeSet';
import AppNavBar, {AppNavBarLink} from '../AppNavBar';
import AppContainer from '../AppContainer';
import RepositoryPage, {
  CycleWarning,
  PackageWithChanges,
  PackageWithMissingTag,
  PackageWithNoChanges,
  ReleaseButton,
  RepositoryPageProps,
} from './';

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
        changeSet={{
          ...getEmptyChangeSet(),
          feat: [
            {
              title: 'Initial release',
              body: '',
              pr: 42,
            },
          ],
        }}
      />
      <PackageWithChanges
        packageName="@database/mysql"
        currentVersion="1.0.0"
        newVersion="2.0.0"
        changeSet={{
          ...getEmptyChangeSet(),
          breaking: [
            {
              title: 'Renamed queryStream to queryIterable',
              body: '',
              pr: 42,
            },
          ],
        }}
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
        changeSet={{
          ...getEmptyChangeSet(),
          feat: [
            {
              title: 'Initial release',
              body: '',
              pr: 42,
            },
          ],
        }}
      />
      <PackageWithChanges
        packageName="@database/mysql"
        currentVersion="1.0.0"
        newVersion="2.0.0"
        changeSet={{
          ...getEmptyChangeSet(),
          breaking: [
            {
              title: 'Renamed queryStream to queryIterable',
              body: '',
              pr: 42,
            },
          ],
        }}
      />
    </Template>
  );
};

export const MissingTag = () => {
  return (
    <Template>
      <PackageWithMissingTag
        packageName="@database/mysql"
        currentVersion="1.0.0"
      />
      <PackageWithChanges
        packageName="@database/pg"
        currentVersion={null}
        newVersion="1.0.0"
        changeSet={{
          ...getEmptyChangeSet(),
          feat: [
            {
              title: 'Initial release',
              body: '',
              pr: 42,
            },
          ],
        }}
      />
    </Template>
  );
};
