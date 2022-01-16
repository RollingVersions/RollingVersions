const {default: connect, sql} = require('@databases/bigquery');
const chalk = require('chalk');
const {showError} = require('funtypes');

const {
  GitHubEventSchema,
  IGNORED_EVENT_NAMES,
} = require('../packages/server/lib/server/webhooks/event-types');

// If gcloud permissions fail, try the following commands:
// gcloud init
// gcloud auth application-default login
(async () => {
  let ok = true;
  const db = connect();
  const events = await db.query(sql`
    SELECT timestamp, github_id, event_name, payload
    FROM rv.webhook_events
    WHERE NOT(event_name IN UNNEST(${IGNORED_EVENT_NAMES}))
    AND timestamp > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
    ORDER BY timestamp ASC
  `);
  for (const {timestamp, github_id, event_name, payload} of events) {
    const result = GitHubEventSchema.safeParse({
      id: github_id,
      name: event_name,
      payload: JSON.parse(payload),
    });
    if (!result.success) {
      ok = false;
      console.log(
        `Schema for ${chalk.red(event_name)} at ${chalk.red(
          timestamp.value,
        )} is not valid`,
      );
      console.log(``);
      console.log(showError(result));
      console.log(``);
    }
  }
  if (!ok) {
    process.exit(1);
  }
})().catch((err) => {
  console.error(err.stack);
  process.exit(1);
});
