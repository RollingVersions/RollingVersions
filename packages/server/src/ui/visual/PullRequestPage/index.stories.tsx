import * as React from 'react';
import PullRequestPage, {PullRequestPageProps} from './';
import {PublishTarget, PackageInfo} from 'rollingversions/lib/types';
import {action} from '@storybook/addon-actions';
import getEmptyChangeSet from 'rollingversions/lib/utils/getEmptyChangeSet';
import {MemoryRouter} from 'react-router-dom';
import AppNavBar, {AppNavBarLink} from '../AppNavBar';
import AppContainer from '../AppContainer';

export default {title: 'pages/PullRequestPage'};

function packageInfo(
  info: Pick<PackageInfo, 'packageName'> & Partial<PackageInfo>,
): PackageInfo {
  return {
    path: 'fake-path',
    publishTarget: PublishTarget.npm,
    publishConfigAccess: 'public',
    notToBePublished: false,
    registryVersion: null,
    versionTag: null,
    ...info,
  };
}
const Template = (props: Partial<PullRequestPageProps>) => {
  const [saving, setSaving] = React.useState(false);
  return (
    <MemoryRouter>
      <AppContainer>
        <AppNavBar>
          <AppNavBarLink to={`#`}>ForbesLindesay</AppNavBarLink>
          <AppNavBarLink to={`#`}>atdatabases</AppNavBarLink>
          <AppNavBarLink>PR 100</AppNavBarLink>
        </AppNavBar>
        <PullRequestPage
          headSha="sdjfkasjfkdsjvoixjvof"
          permission="edit"
          closed={false}
          merged={false}
          saving={saving}
          packages={
            new Map([
              [
                '@databases/pg',
                {
                  changes: getEmptyChangeSet(),
                  info: [packageInfo({packageName: '@databases/pg'})],
                },
              ],
              [
                '@databases/mysql',
                {
                  changes: getEmptyChangeSet(),
                  info: [packageInfo({packageName: '@databases/mysql'})],
                },
              ],
            ])
          }
          unreleasedPackages={['@databases/pg', '@databases/mysql']}
          onSave={async (...args) => {
            action('save')(...args);
            setSaving(true);
            await new Promise((r) => setTimeout(r, 2000));
            setSaving(false);
          }}
          {...props}
        />
      </AppContainer>
    </MemoryRouter>
  );
};
export const Default = () => {
  return <Template />;
};

export const ReadOnlyPackage = () => {
  return (
    <Template
      closed={true}
      merged={true}
      packages={
        new Map([
          [
            '@databases/pg',
            {
              changes: getEmptyChangeSet(),
              info: [packageInfo({packageName: '@databases/pg'})],
            },
          ],
          [
            '@databases/mysql',
            {
              changes: {
                ...getEmptyChangeSet(),
                breaking: [
                  {
                    title: 'Renamed `querySingleResult` to `queryOneResult`',
                    body: '',
                  },
                ],
              },
              info: [packageInfo({packageName: '@databases/mysql'})],
            },
          ],
        ])
      }
      unreleasedPackages={['@databases/pg']}
    />
  );
};

export const AllChangesReleased = () => {
  return (
    <Template
      closed={true}
      merged={true}
      packages={
        new Map([
          [
            '@databases/pg',
            {
              changes: getEmptyChangeSet(),
              info: [packageInfo({packageName: '@databases/pg'})],
            },
          ],
          [
            '@databases/mysql',
            {
              changes: {
                ...getEmptyChangeSet(),
                breaking: [
                  {
                    title: 'Renamed `querySingleResult` to `queryOneResult`',
                    body: '',
                  },
                ],
              },
              info: [packageInfo({packageName: '@databases/mysql'})],
            },
          ],
        ])
      }
      unreleasedPackages={[]}
    />
  );
};

export const ClosedNonAdmin = () => {
  return (
    <Template
      permission="view"
      closed={true}
      merged={true}
      packages={
        new Map([
          [
            '@databases/pg',
            {
              changes: getEmptyChangeSet(),
              info: [packageInfo({packageName: '@databases/pg'})],
            },
          ],
          [
            '@databases/mysql',
            {
              changes: {
                ...getEmptyChangeSet(),
                breaking: [
                  {
                    title: 'Renamed `querySingleResult` to `queryOneResult`',
                    body: '',
                  },
                ],
              },
              info: [packageInfo({packageName: '@databases/mysql'})],
            },
          ],
        ])
      }
      unreleasedPackages={['@databases/pg']}
    />
  );
};

export const OpenNonAdminNonAuthor = () => {
  return (
    <Template
      permission="view"
      packages={
        new Map([
          [
            '@databases/pg',
            {
              changes: getEmptyChangeSet(),
              info: [packageInfo({packageName: '@databases/pg'})],
            },
          ],
          [
            '@databases/mysql',
            {
              changes: {
                ...getEmptyChangeSet(),
                breaking: [
                  {
                    title: 'Renamed `querySingleResult` to `queryOneResult`',
                    body: '',
                  },
                ],
              },
              info: [packageInfo({packageName: '@databases/mysql'})],
            },
          ],
        ])
      }
      unreleasedPackages={['@databases/pg']}
    />
  );
};
