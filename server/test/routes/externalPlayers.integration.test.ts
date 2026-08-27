import http from 'http';
import express from 'express';
import { AddressInfo } from 'net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { db } from '../../src/db/knex';
import { initDb } from '../../src/db/init';
import { errorHandler } from '../../src/middleware/common';
import { signToken, userNameFromUsername } from '../../src/middleware/auth';
import adminRoutes from '../../src/routes/admin';
import externalPlayerRoutes, { externalPlayerAuth } from '../../src/routes/externalPlayers';

let server: http.Server;
let baseUrl: string;

async function request(path: string, init: RequestInit = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });
  return { response, data: await response.json() };
}

describe('disabled external character editing API', () => {
  beforeAll(async () => {
    await initDb();
    const app = express();
    app.use('/api/external', externalPlayerAuth);
    app.use(express.json());
    app.use('/api/admin', adminRoutes);
    app.use('/api/external', externalPlayerRoutes);
    app.use(errorHandler);
    server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    if (server) await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('requires a token and returns 410 for every authenticated editing path', async () => {
    const username = `external-disabled-${Date.now()}`;
    const [admin] = await db('users').insert({
      username,
      display_id: userNameFromUsername(username),
      password_hash: 'test',
      role: 'admin',
      token_version: 0,
    }).returning(['id', 'token_version']);
    const cookie = `csgofriberg_session=${signToken(admin)}`;

    try {
      const missingToken = await request('/api/external/players', { method: 'POST', body: '{}' });
      expect(missingToken.response.status).toBe(401);
      expect(missingToken.data.code).toBe('API_TOKEN_REQUIRED');

      const createdToken = await request('/api/admin/api-tokens', {
        method: 'POST',
        headers: { Cookie: cookie },
        body: JSON.stringify({ name: 'disabled editing test', expiresInDays: 1 }),
      });
      const authorization = { Authorization: `Bearer ${createdToken.data.token}` };

      for (const [path, method] of [
        ['/api/external/players', 'POST'],
        ['/api/external/players/1', 'PUT'],
        ['/api/external/players/import', 'POST'],
        ['/api/external/player-change-submissions', 'POST'],
      ] as const) {
        const result = await request(path, { method, headers: authorization, body: '{}' });
        expect(result.response.status).toBe(410);
        expect(result.data).toEqual({ code: 'CHARACTER_EDITING_DISABLED' });
      }
    } finally {
      await db('api_tokens').where({ created_by_user_id: admin.id }).del();
      await db('users').where({ id: admin.id }).del();
    }
  });
});
