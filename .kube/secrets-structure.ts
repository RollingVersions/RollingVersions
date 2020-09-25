import createSecret from './createSecrets';

// To set secrets:
//   - create `secrets.ts` in this folder
//   - run `jskube .kube/secrets.ts`
//   - delete `secrets.ts`
// The code for `secrets.ts` is in 1password
interface Secrets {
  PRIVATE_KEY: string;
  // Generate using node -e "console.log(require('crypto').randomBytes(20).toString('hex'))"
  WEBHOOK_SECRET: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  SECURE_KEY: string;
  DATABASE_URL: string;
  APEX_LOGS_URL: string;
  APEX_LOGS_AUTH_TOKEN: string;
}
export default function secrets(data: {staging: Secrets; production: Secrets}) {
  return [
    createSecret({
      name: 'rollingversions-staging',
      namespace: 'rollingversions',
      data: data.staging as any,
    }),
    createSecret({
      name: 'rollingversions-production',
      namespace: 'rollingversions',
      data: data.production as any,
    }),
  ];
}
