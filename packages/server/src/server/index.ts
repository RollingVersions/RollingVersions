import {json} from 'body-parser';
import express from 'express';

import {AUTH_FILENAME, WEBHOOK_SUBSCRIPTION_NAME} from './environment';
import {errorLoggingMiddlware, expressMiddlewareLogger} from './logger';
import apiMiddleware from './middleware/api';
import appMiddleware from './middleware/app';
import authMiddleware from './middleware/auth';
import staticMiddleware from './middleware/static';
import {pullWebhookEvents} from './webhooks';

const app = express();

pullWebhookEvents(AUTH_FILENAME, WEBHOOK_SUBSCRIPTION_NAME);

app.use(expressMiddlewareLogger());

app.use(authMiddleware);
app.use(json());
app.use(apiMiddleware);
app.use(appMiddleware);
// https://github.com/Mottie/github-reserved-names/blob/master/oddballs.json has the names that are available to use
app.use(staticMiddleware);

app.use(errorLoggingMiddlware());

export default app.listen(process.env.PORT || 3000);
