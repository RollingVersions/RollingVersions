import {URL} from 'url';

export const APP_ID = parseInt(getEnvironmentVariable('APP_ID', /^\d+$/), 10);
export const APP_URL = getAppUrl();
export const PRIVATE_KEY = getEnvironmentVariable('PRIVATE_KEY').replace(
  /\\n/gm,
  '\n',
);
export const WEBHOOK_SECRET = getEnvironmentVariable('WEBHOOK_SECRET');

function getEnvironmentVariable(name: string, regex?: RegExp) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable ${name}`);
  }
  if (regex && !regex.test(value)) {
    throw new Error(
      `Expected environment variable ${name} to match ${regex.toString()}`,
    );
  }
  return value;
}

function getAppUrl() {
  const str = getEnvironmentVariable('APP_URL');
  try {
    return new URL(str);
  } catch (ex) {
    throw new Error(`APP_URL should be a valid URL: ${ex.message}`);
  }
}
