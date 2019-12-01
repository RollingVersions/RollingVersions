import createIngress from './createIngress';
import createServiceAccount from './createServiceAccount';

export default [
  ...createServiceAccount({namespace: 'changelogversion'}),
  ...createIngress({
    name: 'changelogversion-staging',
    namespace: 'changelogversion',
    serviceName: 'changelogversion-staging',
    hosts: ['changelogversion.staging.makewebtech.org'],
    enableTLS: true,
    stagingTLS: true,
  }),
  ...createIngress({
    name: 'changelogversion-production',
    namespace: 'changelogversion',
    serviceName: 'changelogversion-production',
    hosts: ['changelogversion.makewebtech.org'],
    enableTLS: true,
    stagingTLS: true,
  }),
];
