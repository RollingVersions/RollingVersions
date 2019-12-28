import './index.css';
import React = require('react');
import {render} from 'react-dom';
import {BrowserRouter, Switch, Route} from 'react-router-dom';
import Home from './pages/Home';
import PullChangeLog from './pages/PullChangeLog';

render(
  <BrowserRouter>
    <Switch>
      <Route path="/" exact>
        <Home />
      </Route>
      <Route path="/:owner/:repo/pulls/:pull_number" exact>
        <PullChangeLog />
      </Route>
    </Switch>
  </BrowserRouter>,
  document.getElementById('app')!,
);
