import * as React from 'react';
import {action} from '@storybook/addon-actions';
import ChangeInput, {ChangeInputList} from '../ChangeInput';
import Changes from './';

export default {title: 'Changes'};

export const ChangesExample = () => {
  return (
    <div className="w-full min-h-full bg-gray-300 p-2">
      <Changes title="Breaking Changes">
        <ChangeInputList>
          <ChangeInput
            title="Renamed `merged.unmerge` to `merged.unmergeAllQueries`"
            body=""
            disabled={false}
            onChange={action('change 1')}
            onFocus={action('focus 1')}
            onBlur={action('blur 1')}
          />
          <ChangeInput
            title="Renamed `merged.documents` to `merged.allQueries`"
            body=""
            disabled={false}
            onChange={action('change 2')}
            onFocus={action('focus 2')}
            onBlur={action('blur 2')}
          />
        </ChangeInputList>
      </Changes>
      <Changes title="Features">
        <ChangeInputList>
          <ChangeInput
            title="Add `Batch` API that allows you to cleanly queue up queries and run them as a batch"
            body={`\`\`\`ts
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
\`\`\``}
            disabled={true}
            onChange={action('change 3')}
            onFocus={action('focus 3')}
            onBlur={action('blur 3')}
          />
          <ChangeInput
            title="Expose more detail"
            body={`We now return much more detail about the queries we were able to merge and were not able to merge:

\`\`\`ts
interface Result {
  mergedQuery: Query | undefined;
  mergedQueries: Query[];
  unmergedQueries: Query[];
  allQueries: Query[];
  unmergeMergedQueries: ((result: any) => any[]) | undefined;
  unmergeAllQueries: (results: any[]) => any[];
}
\`\`\``}
            disabled={false}
            onChange={action('change 4')}
            onFocus={action('focus 4')}
            onBlur={action('blur 4')}
          />
        </ChangeInputList>
      </Changes>
    </div>
  );
};
