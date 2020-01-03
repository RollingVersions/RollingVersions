import createIngress from './createIngress';
import createServiceAccount from './createServiceAccount';
import createConfigMap from './createConfigMap';

export default [
  ...createServiceAccount({namespace: 'changelogversion'}),
  ...createIngress({
    name: 'changelogversion-staging',
    namespace: 'changelogversion',
    serviceName: 'changelogversion-staging',
    hosts: ['staging.changelogversion.com'],
    enableTLS: true,
    stagingTLS: false,
  }),
  ...createIngress({
    name: 'changelogversion-production',
    namespace: 'changelogversion',
    serviceName: 'changelogversion-production',
    hosts: ['changelogversion.com'],
    enableTLS: true,
    stagingTLS: false,
  }),

  createConfigMap({
    name: 'changelogversion-staging',
    namespace: 'changelogversion',
    data: {
      APP_ID: '50319',
      APP_URL: 'https://staging.changelogversion.com',
      BASE_URL: 'https://staging.changelogversion.com',
    },
  }),
  createConfigMap({
    name: 'changelogversion-production',
    namespace: 'changelogversion',
    data: {
      APP_ID: '50318',
      APP_URL: 'https://changelogversion.com',
      BASE_URL: 'https://changelogversion.com',
    },
  }),
];
