import createIngress from './createIngress';
import createServiceAccount from './createServiceAccount';
import createConfigMap from './createConfigMap';

export default [
  ...createServiceAccount({namespace: 'rollingversions'}),
  ...createIngress({
    name: 'rollingversions-staging',
    namespace: 'rollingversions',
    serviceName: 'rollingversions-staging',
    hosts: ['staging.rollingversions.com'],
    enableTLS: true,
    stagingTLS: false,
  }),
  ...createIngress({
    name: 'rollingversions-production',
    namespace: 'rollingversions',
    serviceName: 'rollingversions-production',
    hosts: ['rollingversions.com'],
    enableTLS: true,
    stagingTLS: false,
  }),

  createConfigMap({
    name: 'rollingversions-staging',
    namespace: 'rollingversions',
    data: {
      APP_ID: '50319',
      APP_URL: 'https://staging.rollingversions.com',
      BASE_URL: 'https://staging.rollingversions.com',
    },
  }),
  createConfigMap({
    name: 'rollingversions-production',
    namespace: 'rollingversions',
    data: {
      APP_ID: '50318',
      APP_URL: 'https://rollingversions.com',
      BASE_URL: 'https://rollingversions.com',
    },
  }),
];
