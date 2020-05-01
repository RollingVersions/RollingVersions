import * as React from 'react';
import PullRequestPage from './';
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

export const Default = () => {
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
          readOnly={false}
          saving={false}
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
          onSave={action('save')}
        />
      </AppContainer>
    </MemoryRouter>
  );
};
