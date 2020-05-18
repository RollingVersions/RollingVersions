import * as React from 'react';
import {MemoryRouter} from 'react-router-dom';
import {RepoResponse} from '../../../types';
import AppNavBar, {AppNavBarLink} from '../AppNavBar';
import AppContainer from '../AppContainer';
import RepositoryPage, {ReleaseButton} from './';
import PackageStatus from 'rollingversions/lib/types/PackageStatus';
import getEmptyChangeSet from 'rollingversions/lib/utils/getEmptyChangeSet';

export default {title: 'pages/RepositoryPage'};

const Template = (
  props: Pick<RepoResponse, 'packages'> &
    Partial<RepoResponse> & {releaseButton?: React.ReactNode},
) => {
  return (
    <MemoryRouter>
      <AppContainer>
        <AppNavBar>
          <AppNavBarLink to={`#`}>ForbesLindesay</AppNavBarLink>
          <AppNavBarLink>atdatabases</AppNavBarLink>
        </AppNavBar>
        <RepositoryPage headSha="HEAD_SHA" cycleDetected={null} {...props} />
      </AppContainer>
    </MemoryRouter>
  );
};

export const NoUpdateRequired = () => {
  return (
    <Template
      packages={[
        {
          status: PackageStatus.NoUpdateRequired,
          packageName: '@database/pg',
          currentVersion: null,
          newVersion: null,
          manifests: [],
          dependencies: {required: [], optional: [], development: []},
        },
        {
          status: PackageStatus.NoUpdateRequired,
          packageName: '@database/mysql',
          currentVersion: null,
          newVersion: null,
          manifests: [],
          dependencies: {required: [], optional: [], development: []},
        },
      ]}
    />
  );
};

export const UpdateRequired = () => {
  return (
    <Template
      releaseButton={<ReleaseButton />}
      packages={[
        {
          status: PackageStatus.NewVersionToBePublished,
          packageName: '@database/pg',
          currentVersion: null,
          newVersion: '1.0.0',
          changeSet: {
            ...getEmptyChangeSet(),
            feat: [
              {
                title: 'Initial release',
                body: '',
                pr: 42,
              },
            ],
          },
          manifests: [],
          dependencies: {required: [], optional: [], development: []},
        },
        {
          status: PackageStatus.NewVersionToBePublished,
          packageName: '@database/mysql',
          currentVersion: '1.0.0',
          newVersion: '2.0.0',
          changeSet: {
            ...getEmptyChangeSet(),
            breaking: [
              {
                title: 'Renamed queryStream to queryIterable',
                body: '',
                pr: 42,
              },
            ],
          },
          manifests: [],
          dependencies: {required: [], optional: [], development: []},
        },
      ]}
    />
  );
};

export const CircularDependency = () => {
  return (
    <Template
      cycleDetected={['@datbases/pg', '@databases/mysl', '@databases/pg']}
      packages={[
        {
          status: PackageStatus.NewVersionToBePublished,
          packageName: '@database/pg',
          currentVersion: null,
          newVersion: '1.0.0',
          changeSet: {
            ...getEmptyChangeSet(),
            feat: [
              {
                title: 'Initial release',
                body: '',
                pr: 42,
              },
            ],
          },
          manifests: [],
          dependencies: {required: [], optional: [], development: []},
        },
        {
          status: PackageStatus.NewVersionToBePublished,
          packageName: '@database/mysql',
          currentVersion: '1.0.0',
          newVersion: '2.0.0',
          changeSet: {
            ...getEmptyChangeSet(),
            breaking: [
              {
                title: 'Renamed queryStream to queryIterable',
                body: '',
                pr: 42,
              },
            ],
          },
          manifests: [],
          dependencies: {required: [], optional: [], development: []},
        },
      ]}
    />
  );
};

export const MissingTag = () => {
  return (
    <Template
      packages={[
        {
          status: PackageStatus.MissingTag,
          packageName: '@database/mysql',
          currentVersion: '1.0.0',
          manifests: [],
          dependencies: {required: [], optional: [], development: []},
        },
        {
          status: PackageStatus.NewVersionToBePublished,
          packageName: '@database/pg',
          currentVersion: null,
          newVersion: '1.0.0',
          changeSet: {
            ...getEmptyChangeSet(),
            feat: [
              {
                title: 'Initial release',
                body: '',
                pr: 42,
              },
            ],
          },
          manifests: [],
          dependencies: {required: [], optional: [], development: []},
        },
      ]}
    />
  );
};
