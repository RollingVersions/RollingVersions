import {URL} from 'url';

function string(name: string) {
  const value = process.env[name];
  if (value !== undefined) return value;
  throw new Error(`Missing required config value "${name}"`);
}

function optional<T>(name: string, kind: (name: string) => T): T | undefined {
  return process.env[name] !== undefined ? kind(name) : undefined;
}

function integer(name: string) {
  const str = string(name);
  if (str.length > 6 || !/^\d+$/.test(str)) {
    throw new Error(
      `Config value "${name}" should be an integer between 0 and 999,999`,
    );
  }
  return parseInt(str, 10);
}

function url(name: string) {
  const urlString = string(name);
  try {
    return new URL(urlString);
  } catch (ex) {
    throw new Error(`Config value "${name}" should be an absolute URL`);
  }
}
function oneOf<T extends readonly [string, ...string[]]>(
  name: string,
  options: T,
): T[number] {
  const str = string(name);
  if (!options.includes(str)) {
    throw new Error(
      `Expected ${name} to be one of: ${options
        .map((o) => `'${o}'`)
        .join(' | ')}`,
    );
  }
  return str;
}

export const APP_ID = integer('APP_ID');
export const APP_URL = url('APP_URL');
export const PRIVATE_KEY = string('PRIVATE_KEY').replace(/\\n/gm, '\n');
export const WEBHOOK_SECRET = string('WEBHOOK_SECRET');
export const ENVIRONMENT = oneOf('ENVIRONMENT', [
  'development',
  'staging',
  'production',
] as const);

const APEX_LOGS_URL = optional('APEX_LOGS_URL', url);
export const APEX_LOGS_CONFIG = APEX_LOGS_URL
  ? {
      url: APEX_LOGS_URL.href,
      authToken: string('APEX_LOGS_AUTH_TOKEN'),
      projectId: string('APEX_LOGS_PROJECT_ID'),
    }
  : {json: true};
