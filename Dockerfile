FROM node:14-alpine

WORKDIR /app

ENV NODE_ENV=production

ADD package.json /app/package.json
ADD yarn.lock /app/yarn.lock
ADD packages/cli/package.json /app/packages/cli/package.json
ADD packages/db/package.json /app/packages/db/package.json
ADD packages/server/package.json /app/packages/server/package.json

RUN yarn install --production \
  && yarn cache clean

ADD packages/db/lib /app/packages/db/lib
ADD scripts/db-post-introspect.js /app/scripts/db-post-introspect.js
RUN node /app/scripts/db-post-introspect.js

ADD packages/cli/lib /app/packages/cli/lib
ADD packages/server/lib /app/packages/server/lib
ADD packages/server/dist /app/packages/server/dist
ADD packages/server/favicon /app/packages/server/favicon
ADD packages/server/index.js /app/packages/server/index.js

RUN yarn install --production

CMD cd packages/server && yarn start