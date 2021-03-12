import './index.css';
import React from 'react';
import {render} from 'react-dom';
import {BrowserRouter, Switch, Route} from 'react-router-dom';

import Contact from './pages/Contact';
import Docs from './pages/Docs';
import Home from './pages/Home';
import PullChangeLog from './pages/PullChangeLog';
import Repository from './pages/Repository';

render(
  <BrowserRouter>
    <Switch>
      <Route path="/" exact>
        <Home />
      </Route>
      <Route path="/help" exact={false}>
        <Docs />
      </Route>
      <Route path="/contact" exact>
        <Contact />
      </Route>
      <Route path="/:owner/:repo" exact>
        <Repository />
      </Route>
      <Route path="/:owner/:repo/pull/:pull_number" exact>
        <PullChangeLog />
      </Route>
    </Switch>
  </BrowserRouter>,
  document.getElementById('app'),
);
