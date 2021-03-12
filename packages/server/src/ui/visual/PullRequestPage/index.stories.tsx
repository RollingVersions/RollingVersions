import {action} from '@storybook/addon-actions';
import * as React from 'react';
import {MemoryRouter} from 'react-router-dom';

import {createChangeSet} from '@rollingversions/change-set';
import {PublishTarget} from 'rollingversions/lib/types';
import type {PackageManifestWithVersion} from 'rollingversions/lib/types';

import PullRequestPage from '.';
import type {PullRequestPageProps} from '.';
import AppContainer from '../AppContainer';
import AppNavBar, {AppNavBarLink} from '../AppNavBar';

export default {title: 'pages/PullRequestPage'};

function packageManifest(
  manifest: Pick<PackageManifestWithVersion, 'packageName'> &
    Partial<PackageManifestWithVersion>,
): PackageManifestWithVersion {
  return {
    targetConfigs: [
      {
        type: PublishTarget.npm,
        packageName: manifest.packageName,
        private: false,
        publishConfigAccess: 'public',
        path: 'fake-path',
      },
    ],
    versionTag: null,
    dependencies: {required: [], optional: [], development: []},
    ...manifest,
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
          permission="edit"
          closed={false}
          merged={false}
          saving={saving}
          packages={
            new Map([
              [
                '@databases/pg',
                {
                  changeSet: createChangeSet(),
                  manifest: packageManifest({packageName: '@databases/pg'}),
                  dependencies: {required: [], optional: [], development: []},
                  released: false,
                },
              ],
              [
                '@databases/mysql',
                {
                  changeSet: createChangeSet(),
                  manifest: packageManifest({packageName: '@databases/mysql'}),

                  dependencies: {required: [], optional: [], development: []},
                  released: false,
                },
              ],
            ])
          }
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
              changeSet: createChangeSet(),
              manifest: packageManifest({packageName: '@databases/pg'}),
              released: false,
            },
          ],
          [
            '@databases/mysql',
            {
              changeSet: createChangeSet({
                type: 'breaking',
                title: 'Renamed `querySingleResult` to `queryOneResult`',
                body: '',
              }),
              manifest: packageManifest({packageName: '@databases/mysql'}),
              released: true,
            },
          ],
        ])
      }
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
              changeSet: createChangeSet(),
              manifest: packageManifest({packageName: '@databases/pg'}),
              released: true,
            },
          ],
          [
            '@databases/mysql',
            {
              changeSet: createChangeSet({
                type: 'breaking',
                title: 'Renamed `querySingleResult` to `queryOneResult`',
                body: '',
              }),
              manifest: packageManifest({packageName: '@databases/mysql'}),
              released: true,
            },
          ],
        ])
      }
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
              changeSet: createChangeSet(),
              manifest: packageManifest({packageName: '@databases/pg'}),
              dependencies: {required: [], optional: [], development: []},
              released: true,
            },
          ],
          [
            '@databases/mysql',
            {
              changeSet: createChangeSet({
                type: 'breaking',
                title: 'Renamed `querySingleResult` to `queryOneResult`',
                body: '',
              }),
              manifest: packageManifest({packageName: '@databases/mysql'}),
              released: false,
            },
          ],
        ])
      }
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
              changeSet: createChangeSet(),
              manifest: packageManifest({packageName: '@databases/pg'}),
              released: false,
            },
          ],
          [
            '@databases/mysql',
            {
              changeSet: createChangeSet({
                type: 'breaking',
                title: 'Renamed `querySingleResult` to `queryOneResult`',
                body: '',
              }),
              manifest: packageManifest({packageName: '@databases/mysql'}),
              released: true,
            },
          ],
        ])
      }
    />
  );
};
