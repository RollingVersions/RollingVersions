interface LogEvent {
  event_status: 'ok' | 'warn' | 'error';
  event_type: string;
  message: string;
  [key: string]: any;
}
export default function log(event: LogEvent) {
  console.info(JSON.stringify({...event, app: 'rollingversions'}));
}
