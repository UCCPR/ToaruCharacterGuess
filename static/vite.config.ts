import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';

const packageMetadata = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
) as { version: string };
const buildDateParts = Object.fromEntries(
  new Intl.DateTimeFormat('en', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date()).map((part) => [part.type, part.value]),
);
const buildDate = `${buildDateParts.year}-${buildDateParts.month}-${buildDateParts.day}`;
const buildNumber = process.env.BUILD_NUMBER?.trim();
if (buildNumber && !/^\d+$/.test(buildNumber)) {
  throw new Error('BUILD_NUMBER must contain digits only');
}
const revision = process.env.GITHUB_SHA?.slice(0, 7);
const buildVersion = buildNumber
  ? `${packageMetadata.version}+${buildNumber}`
  : revision
    ? `${packageMetadata.version}+${revision}`
    : packageMetadata.version;

export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/ToaruCharacterGuess/' : '/',
  define: {
    'import.meta.env.VITE_STATIC_APP_VERSION': JSON.stringify(buildVersion),
    'import.meta.env.VITE_STATIC_UPDATED_DATE': JSON.stringify(buildDate),
  },
  plugins: [react()],
  server: { fs: { allow: ['..'] } },
});
