interface LogEvent {
  event_status: 'ok' | 'warn' | 'error';
  event_type: string;
  message: string;
  [key: string]: any;
}
export default function log({message, ...event}: LogEvent) {
  console.info(
    JSON.stringify({...event, log: message, app: 'rollingversions'}),
  );
}
