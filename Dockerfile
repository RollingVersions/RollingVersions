
FROM node:14-alpine AS base

WORKDIR /app
ENV NODE_ENV=production

FROM base AS deps

ADD package.json /app/package.json
ADD yarn.lock /app/yarn.lock
ADD packages/change-set/package.json /app/packages/change-set/package.json
ADD packages/cli/package.json /app/packages/cli/package.json
ADD packages/config/package.json /app/packages/config/package.json
ADD packages/db/package.json /app/packages/db/package.json
ADD packages/server/package.json /app/packages/server/package.json
ADD packages/sort-by-dependencies/package.json /app/packages/sort-by-dependencies/package.json
ADD packages/tag-format/package.json /app/packages/tag-format/package.json
ADD packages/types/package.json /app/packages/types/package.json
ADD packages/version-number/package.json /app/packages/version-number/package.json

RUN yarn install --production \
  && yarn cache clean

FROM base AS code

ADD packages/db/lib /app/packages/db/lib
ADD scripts/db-post-introspect.js /app/scripts/db-post-introspect.js
RUN node /app/scripts/db-post-introspect.js

ADD packages/change-set/lib /app/packages/change-set/lib
ADD packages/cli/lib /app/packages/cli/lib
ADD packages/config/lib /app/packages/config/lib
ADD packages/sort-by-dependencies/lib /app/packages/sort-by-dependencies/lib
ADD packages/tag-format/lib /app/packages/tag-format/lib
ADD packages/types/lib /app/packages/types/lib
ADD packages/version-number/lib /app/packages/version-number/lib

ADD packages/server/lib /app/packages/server/lib
ADD packages/server/dist /app/packages/server/dist
ADD packages/server/favicon /app/packages/server/favicon
ADD packages/server/index.js /app/packages/server/index.js

FROM base AS runtime

COPY --from=deps /app /app
COPY --from=code /app /app

CMD cd packages/server && yarn start
