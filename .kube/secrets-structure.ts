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
}
export default function secrets(data: {staging: Secrets; production: Secrets}) {
  return [
    createSecret({
      name: 'changelogversion-staging',
      namespace: 'changelogversion',
      data: data.staging as any,
    }),
    createSecret({
      name: 'changelogversion-production',
      namespace: 'changelogversion',
      data: data.production as any,
    }),
  ];
}
