'use strict';

const LOG_LEVEL = (process.env.LOG_LEVEL || 'debug').toLowerCase();
const isDev = process.env.NODE_ENV !== 'production';
const shouldLog = isDev && LOG_LEVEL !== 'silent';

function ts() {
  return new Date().toISOString();
}

function paint(colorCode, text) {
  return `${colorCode}${text}\x1b[0m`;
}

const colors = {
  info: '\x1b[32m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
};

function info(...args) {
  if (!shouldLog) return;
  console.log(paint(colors.info, `[${ts()}] [info]`), ...args);
}

function warn(...args) {
  if (!shouldLog) return;
  console.warn(paint(colors.warn, `[${ts()}] [warn]`), ...args);
}

function error(...args) {
  if (!shouldLog) return;
  console.error(paint(colors.error, `[${ts()}] [error]`), ...args);
}

function log(...args) {
  if (!shouldLog) return;
  console.log(`[${ts()}]`, ...args);
}

module.exports = { log, info, warn, error };
