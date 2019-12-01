# web-app-template

A template for a node app using TypeScript deployed to kubernetes

## Setting up Kubernetes

TODO

## Setting up the repo

1. Hit "Use This Template" to create the repository
1. Enable [CircleCI](https://circleci.com/add-projects/gh/ForbesLindesay)
1. In Settings
   1. Disable "Wikis"
   1. Disable "Projects"
   1. Disable "Allow merge commits"
   1. Disable "Allow rebase merging"
   1. Enable "Automatically delete head branches"
1. Create a new branch
1. Commit initial code to the branch (be sure to replace all refernces to web-app-template, and remove these instructions from the README)
1. Push the new branch and create a PR
1. In Settings -> Branch Protection, create a new rule
   1. Use "master" as the branch name pattern
   1. Enable "Require status checks to pass before merging"
   1. Select the unit tests as required
   1. Enable "Include administrators"
   1. Enable "Restrict who can push to matching branches"
1. Merge the PR

## Setting up a new app

1. Replace web-app-template with the name of your app in all files
1. Point the DNS for your domain name at your loadbalancer's external IP (which you can get by running `kubectl get svc --namespace=ingress-nginx`)
1. Run `npx jskube .kube/setup.ts` - N.B. this will attempt to get an SSL certificate, so you must first point the DNS records at your loadbalancer.
1. Run `npx jskube .kube/deployment-placeholder.ts` (optional). If you do this, you should be able to load the website at the domain name you selected, but you will have to bypass a warning about a certificate error as it will be using the letsencrypt staging ssl certificate.
1. Once the certificate is issued successfully and you are happy with the domain name of your service, you can set `stagingTLS` to `false` in `.kube/setup.ts` and re-run `npx jskube .kube/setup.ts` to request production TLS certificates.


## Deploying locally

1. build the typescript etc. `yarn build`
1. build an initial image `docker build -t forbeslindesay/web-app-template:hotfix-01 .`
1. push `docker push forbeslindesay/web-app-template:hotfix-01"`
1. deploy `ENVIRONMENT=staging DOCKERHUB_USERNAME=forbeslindesay CIRCLE_SHA1=hotfix-01 jskube apply -f .kube/deployment`

## Setting up Circle CI

After you follow the instructions for "Setting up a new app". You can configure CI to deploy your app.

1. Run `jskube get-env-vars --user cicd --namespace ${namespace}` to get the environment variables for connecting to kubernetes
1. Get your dockerhub username and password as `DOCKERHUB_USERNAME` and `DOCKERHUB_PASS`
1. Add the environment variables to Circle CI -> web-app-template -> Settings -> Environment Variables
 (https://circleci.com/gh/ForbesLindesay/web-app-template/edit#env-vars)
