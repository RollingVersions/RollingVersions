FROM node:12-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package.json /app/package.json
COPY yarn.lock /app/yarn.lock
ADD packages/cli/package.json /app/packages/cli/package.json
ADD packages/server/package.json /app/packages/server/package.json

RUN yarn install --production \
  && yarn cache clean

ADD packages/cli/lib /app/packages/cli/lib
ADD packages/server/lib /app/packages/server/lib
ADD packages/server/dist /app/packages/server/dist
ADD packages/server/index.js /app/packages/server/index.js

RUN yarn install --production

CMD cd packages/server && yarn start