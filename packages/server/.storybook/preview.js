import '../src/ui/index.css';
import {addDecorator} from '@storybook/react';
import {withInfo} from '@storybook/addon-info';
import {withA11y} from '@storybook/addon-a11y';
import {setConsoleOptions} from '@storybook/addon-console';

setConsoleOptions({
  panelExclude: [],
});

addDecorator(withInfo);
addDecorator(withA11y);

// addParameters({
//   viewport: {
//     viewports: newViewports, // newViewports would be an ViewportMap. (see below for examples)
//     defaultViewport: 'someDefault',
//   },
// });
