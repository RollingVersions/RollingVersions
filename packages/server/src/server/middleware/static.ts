import {readFileSync} from 'fs';
import {Router, static as expressStatic} from 'express';
import {requiresAuth} from './auth';
import validateParams, {validateRepoParams} from './utils/validateParams';
import checkPermissions, {checkRepoPermissions} from './utils/checkPermissions';

const staticMiddleware = Router();

staticMiddleware.use(
  '/static',
  expressStatic(`${__dirname}/../../../dist/static`, {
    maxAge: 365 * 24 * 60 * 60 * 1000,
    immutable: true,
    index: false,
  }),
);
staticMiddleware.use(
  expressStatic(`${__dirname}/../../../favicon`, {
    maxAge: 365 * 24 * 60 * 60 * 1000,
    immutable: true,
    index: false,
  }),
);

const getHtml = () => {
  const src = readFileSync(`${__dirname}/../../../dist/index.html`, 'utf8');
  const scriptStart = '<script';
  const [start, ...rest] = src.split(scriptStart);
  const end = scriptStart + rest.join(scriptStart);
  return (extra: string) => `${start}${extra}${end}`;
};

const htmlCache = process.env.NODE_ENV !== 'production' ? null : getHtml();

staticMiddleware.get('/help', async (_req, res, _next) => {
  const html = htmlCache || getHtml();
  res.send(
    html(
      '',
      // you can insert variables here via: `<script></script>`
    ),
  );
});

staticMiddleware.get(
  `/:owner/:repo`,
  requiresAuth(),
  validateRepoParams(),
  checkRepoPermissions(['view', 'edit']),
);

staticMiddleware.get(`/:owner/:repo/pulls/:pull_number`, (req, res) => {
  res.redirect(
    `/${req.params.owner}/${req.params.repo}/pull/${req.params.pull_number}`,
  );
});
staticMiddleware.get(
  `/:owner/:repo/pull/:pull_number`,
  requiresAuth(),
  validateParams(),
  checkPermissions(['view', 'edit']),
);

staticMiddleware.get('/*', async (req, res, next) => {
  if (/^\/static\//.test(req.path)) {
    next();
    return;
  }
  const html = htmlCache || getHtml();
  res.send(
    html(
      '',
      // you can insert variables here via: `<script></script>`
    ),
  );
});

export default staticMiddleware;
