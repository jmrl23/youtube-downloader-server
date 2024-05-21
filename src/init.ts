import path from 'node:path';
import loadDotEnv from './lib/utils/loadDotEnv';
import { nodeEnv } from './lib/constants/environment';

console.clear();

loadDotEnv(
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, `../.env.${nodeEnv}`),
  path.resolve(__dirname, '../.env.local'),
  path.resolve(__dirname, `../.env.${nodeEnv}.local`),
);