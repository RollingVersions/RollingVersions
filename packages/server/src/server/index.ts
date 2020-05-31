import express from 'express';
import {json} from 'body-parser';
import morgan from 'morgan';
import onFinished from 'on-finished';
import onHeaders from 'on-headers';
import webhooks from './webhooks';
import authMiddleware from './middleware/auth';
import staticMiddleware from './middleware/static';
import appMiddleware from './middleware/app';
import log from './logger';

const app = express();
type EventSource = typeof EventSource;
const WEBHOOK_PROXY_URL = process.env.WEBHOOK_PROXY_URL;
if (WEBHOOK_PROXY_URL) {
  const EventSource: EventSource = require('eventsource');
  const source = new EventSource(WEBHOOK_PROXY_URL);
  source.onmessage = (event) => {
    console.info(event.data);
    const webhookEvent = JSON.parse(event.data);
    webhooks
      .verifyAndReceive({
        id: webhookEvent['x-request-id'],
        name: webhookEvent['x-github-event'],
        signature: webhookEvent['x-hub-signature'],
        payload: webhookEvent.body,
      })
      .catch((err) => console.error(err.stack || err));
  };
}

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('tiny'));
} else {
  app.use((req, res, next) => {
    const reqStartAt = process.hrtime();
    let resStartElapsed: typeof reqStartAt | null = null;
    onHeaders(res, () => {
      resStartElapsed = process.hrtime(reqStartAt);
    });
    onFinished(res, (err, res) => {
      if (!resStartElapsed) {
        resStartElapsed = process.hrtime(reqStartAt);
      }

      const responseTimeMs =
        resStartElapsed[0] * 1e3 + resStartElapsed[1] * 1e-6;
      const resEndElapsed = process.hrtime(reqStartAt);
      const totalTimeMs = resEndElapsed[0] * 1e3 + resEndElapsed[1] * 1e-6;

      log({
        event_status:
          err || res.statusCode >= 500
            ? 'error'
            : res.statusCode >= 400
            ? 'warn'
            : 'ok',
        event_type: 'response',
        message: `${req.method} ${req.url} ${
          res.statusCode
        } ${responseTimeMs.toFixed(3)} ms${
          err ? `:\n\n${err.stack || err.message || err}` : ``
        }`,
        method: req.method,
        url: req.url,
        status_code: res.statusCode,
        duration: responseTimeMs,
        total_time: totalTimeMs,
      });
    });
    next();
  });
}
webhooks.on('error', (error) => {
  console.error(
    `Error occured in "${
      (error as {event?: {name: string}}).event?.name
    } handler: ${error.stack}"`,
  );
});

app.use((req, res, next) => webhooks.middleware(req, res, next));

app.use(authMiddleware);
app.use(json());
app.use(appMiddleware);
// https://github.com/Mottie/github-reserved-names/blob/master/oddballs.json has the names that are available to use
app.use(staticMiddleware);

export default app.listen(process.env.PORT || 3000);
