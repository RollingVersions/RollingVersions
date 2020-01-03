import {readFileSync} from 'fs';
// tslint:disable-next-line: no-implicit-dependencies
import express from 'express';

const staticServer = express.Router();

staticServer.use(
  '/static',
  express.static(`${__dirname}/../../../dist/static`, {
    maxAge: 365 * 24 * 60 * 60 * 1000,
    immutable: true,
    index: false,
  }),
);

const getHtml = () => {
  const src = readFileSync(`${__dirname}/../dist/index.html`, 'utf8');
  const scriptStart = '<script';
  const [start, ...rest] = src.split(scriptStart);
  const end = scriptStart + rest.join(scriptStart);
  return (extra: string) => `${start}${extra}${end}`;
};

const htmlCache = process.env.NODE_ENV !== 'production' ? null : getHtml();

staticServer.get('/*', async (req, res, next) => {
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

export default staticServer;
