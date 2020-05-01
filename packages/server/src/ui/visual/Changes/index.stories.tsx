import * as React from 'react';
import Changes from './';
import getLocalId from '../../utils/getLocalId';
import getEmptyChangeSet from 'rollingversions/lib/utils/getEmptyChangeSet';

export default {title: 'modules/Changes'};

export const Default = () => {
  const [changes, setChanges] = React.useState({
    ...getEmptyChangeSet<{localId: number}>(),
    breaking: [
      {
        localId: getLocalId(),
        title: 'Renamed `merged.unmerge` to `merged.unmergeAllQueries`',
        body: '',
      },
      {
        localId: getLocalId(),
        title: 'Renamed `merged.documents` to `merged.allQueries`',
        body: '',
      },
    ],
    feat: [
      {
        localId: getLocalId(),
        title:
          'Add `Batch` API that allows you to cleanly queue up queries and run them as a batch',
        body: `\`\`\`ts
import {Batch} from 'graphql-merge-unmerge';
import gql from 'graphql-tag';
import {print} from 'graphql';
const batch = new Batch(async ({query, variables}) => {
  const r = await callGraphQLServer({query: print(query), variables});
  if (!r.data) {
    throw new Error(JSON.stringify(r.errors));
  }
  return r.data;
});
const resultA = batch.queue({
  query: gql\`
    query($id: Int!) {
      user(id: $id) {
        id
        teams {
          name
        }
      }
    }
  \`,
  variables: {id: 3},
});
const resultB = batch.queue({
  query: gql\`
    query($id: Int!) {
      user(id: $id) {
        id
        name
      }
    }
  \`,
  variables: {id: 3},
});
await batch.run();
console.log(await resultA);
console.log(await resultB);
\`\`\``,
      },
    ],
  });
  return (
    <div className="w-full min-h-full bg-gray-300 p-2">
      <Changes
        title="Breaking Changes"
        disabled={false}
        readOnly={false}
        changes={changes.breaking}
        onChange={(breaking) => setChanges((old) => ({...old, breaking}))}
      />
      <Changes
        title="New Features"
        disabled={false}
        readOnly={false}
        changes={changes.feat}
        onChange={(feat) => setChanges((old) => ({...old, feat}))}
      />
    </div>
  );
};
