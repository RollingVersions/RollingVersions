import express from 'express';
import {json} from 'body-parser';
import webhooks from './webhooks';
import authMiddleware from './middleware/auth';
import staticMiddleware from './middleware/static';
import appMiddleware from './middleware/app';
import {expressMiddlewareLogger} from './logger';

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

webhooks.on('error', (error) => {
  console.error(
    `Error occured in "${
      (error as {event?: {name: string}}).event?.name
    } handler: ${error.stack}"`,
  );
});

app.use(expressMiddlewareLogger());

app.use((req, res, next) => webhooks.middleware(req, res, next));

app.use(authMiddleware);
app.use(json());
app.use(appMiddleware);
// https://github.com/Mottie/github-reserved-names/blob/master/oddballs.json has the names that are available to use
app.use(staticMiddleware);

export default app.listen(process.env.PORT || 3000);
