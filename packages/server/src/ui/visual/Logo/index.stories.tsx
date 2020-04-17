import * as React from 'react';
import Logo from './';

export default {title: 'modules/Logo'};

export const Default = () => {
  return <Logo />;
};

export const Dark = () => {
  return (
    <div style={{background: 'black', height: '100%', width: '100%'}}>
      <Logo dark />
    </div>
  );
};
