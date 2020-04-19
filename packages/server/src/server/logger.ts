interface LogEvent {
  status: 'ok' | 'warn' | 'error';
  type: string;
  message: string;
  [key: string]: any;
}
export default function log(event: LogEvent) {
  console.info(JSON.stringify({...event, app: 'rollingversions'}));
}
