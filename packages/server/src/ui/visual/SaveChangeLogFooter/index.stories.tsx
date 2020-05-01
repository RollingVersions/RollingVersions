import * as React from 'react';
import {action} from '@storybook/addon-actions';
import SaveChangeLogFooter from './';

export default {title: 'modules/SaveChangeLogFooter'};

export const Default = () => {
  return (
    <div className="w-full min-h-full bg-gray-300 p-2">
      <SaveChangeLogFooter disabled={false} onClick={action('save')} />
    </div>
  );
};

export const Disabled = () => {
  return (
    <div className="w-full min-h-full bg-gray-300 p-2">
      <SaveChangeLogFooter disabled={true} onClick={action('save')} />
    </div>
  );
};
