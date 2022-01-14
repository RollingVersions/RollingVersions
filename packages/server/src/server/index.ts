import {writeFileSync} from 'fs';

import {json} from 'body-parser';
import express from 'express';

import {errorLoggingMiddlware, expressMiddlewareLogger} from './logger';
import apiMiddleware from './middleware/api';
import appMiddleware from './middleware/app';
import authMiddleware from './middleware/auth';
import staticMiddleware from './middleware/static';
import webhooks, {pullWebhookEvents} from './webhooks';

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
if (
  process.env.GOOGLE_SERVICE_ACCOUNT_JSON &&
  process.env.WEBHOOK_SUBSCRIPTION_NAME
) {
  const AUTH_FILENAME = `google-service-account.json`;
  writeFileSync(AUTH_FILENAME, process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  pullWebhookEvents(AUTH_FILENAME, process.env.WEBHOOK_SUBSCRIPTION_NAME);
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
app.use(apiMiddleware);
app.use(appMiddleware);
// https://github.com/Mottie/github-reserved-names/blob/master/oddballs.json has the names that are available to use
app.use(staticMiddleware);

app.use(errorLoggingMiddlware());

export default app.listen(process.env.PORT || 3000);
