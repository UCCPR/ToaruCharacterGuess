import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { config } from '../../src/config';

describe('test database isolation', () => {
  it('never points Vitest at the local gameplay database', () => {
    expect(path.basename(config.dbUrl)).toBe('csgofriberg.test.sqlite3');
  });
});
