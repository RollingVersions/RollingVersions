import createDeployment from './createDeployment';

export default [
  ...createDeployment({
    namespace: 'changelogversion',
    name: 'changelogversion-staging',
    containerPort: 5678,
    replicaCount: 1,
    image: `hashicorp/http-echo`,
    container: {
      args: [
        "-text=To deploy your app, follow the instructions in the README and let CircleCI do it's thing.",
      ],
    },
  }),
  ...createDeployment({
    namespace: 'changelogversion',
    name: 'changelogversion-production',
    containerPort: 5678,
    replicaCount: 1,
    image: `hashicorp/http-echo`,
    container: {
      args: [
        "-text=To deploy your app, follow the instructions in the README and let CircleCI do it's thing.",
      ],
    },
  }),
];

// containers:
// - name: echo1
//   image: hashicorp/http-echo
//   args:
//   - "-text=echo1"
//   ports:
//   - containerPort: 5678
