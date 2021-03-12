import {action} from '@storybook/addon-actions';
import * as React from 'react';

import ChangeInput, {ChangeInputList} from '.';

export default {title: 'modules/ChangeInput', component: ChangeInput};
const Story = ({disabled}: {disabled: boolean}) => {
  const [change, setChange] = React.useState({
    title: 'I **fixed** a thing',
    body:
      'If you were doing\n\n```ts\ndb.stream(sql`SELECT * FROM table;`);\n```\n\nYou now need to do:\n\n```ts\ndb.queryStream(sql`SELECT * FROM table;`);\n```',
  });
  const [change2, setChange2] = React.useState({
    title: 'I **fixed** a thing',
    body: '',
  });
  const [change3, setChange3] = React.useState({
    title: '',
    body: 'I only have a body, which is an error',
  });
  return (
    <div className="w-full min-h-full bg-gray-300 p-2">
      <ChangeInputList>
        <ChangeInput
          ref={(input) => {
            input?.focus();
          }}
          localId={1}
          title={change.title}
          body={change.body}
          disabled={disabled}
          readOnly={false}
          onChange={setChange}
          onFocus={action('focus 1')}
          onBlur={action('blur 1')}
        />
        <ChangeInput
          localId={2}
          title={change2.title}
          body={change2.body}
          disabled={disabled}
          readOnly={false}
          onChange={setChange2}
          onFocus={action('focus 2')}
          onBlur={action('blur 2')}
        />
        <ChangeInput
          localId={3}
          title={change3.title}
          body={change3.body}
          disabled={disabled}
          readOnly={false}
          onChange={setChange3}
          onFocus={action('focus 3')}
          onBlur={action('blur 3')}
        />
      </ChangeInputList>
    </div>
  );
};

export const Default = () => <Story disabled={false} />;
export const Disabled = () => <Story disabled={true} />;
