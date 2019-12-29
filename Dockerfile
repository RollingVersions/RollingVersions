FROM node:12-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package.json /app/package.json
COPY yarn.lock /app/yarn.lock
ADD packages/changelogversion/package.json /app/packages/changelogversion/package.json
ADD packages/changelogversion-utils/package.json /app/packages/changelogversion-utils/package.json
ADD packages/server/package.json /app/packages/server/package.json

RUN yarn install --production \
  && yarn cache clean

ADD packages/changelogversion/lib /app/packages/changelogversion/lib
ADD packages/changelogversion-utils/lib /app/packages/changelogversion-utils/lib
ADD packages/server/lib /app/packages/server/lib
ADD packages/server/dist /app/packages/server/dist

RUN yarn install --production

CMD cd packages/server && yarn start