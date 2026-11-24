import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import esbuild from 'esbuild';

test('Netlify function bundles cleanly with esbuild and handles rewritten API paths', async () => {
  const outFile = path.join(os.tmpdir(), `wishmantra-fn-${Date.now()}.mjs`);
  const tmpDb = path.join(os.tmpdir(), `wishmantra-netlify-test-${Date.now()}.db`);
  const prevDbPath = process.env.WISHMANTRA_DB_PATH;
  const prevNetlify = process.env.NETLIFY;

  try {
    await esbuild.build({
      entryPoints: ['netlify/functions/api.ts'],
      bundle: true,
      platform: 'node',
      target: 'node22',
      format: 'esm',
      outfile: outFile,
      packages: 'external',
    });
    assert.ok(fs.existsSync(outFile));

    process.env.NETLIFY = 'true';
    process.env.WISHMANTRA_DB_PATH = tmpDb;

    const { handler } = await import('../netlify/functions/api.ts');

    const healthRes = (await handler(
      {
        httpMethod: 'GET',
        path: '/.netlify/functions/api/health',
        headers: {},
        queryStringParameters: {},
        body: null,
        isBase64Encoded: false,
      } as unknown as Parameters<typeof handler>[0],
      {} as Parameters<typeof handler>[1]
    )) as { statusCode: number; body: string };

    assert.equal(healthRes.statusCode, 200);
    assert.deepEqual(JSON.parse(healthRes.body), { ok: true });

    const productsRes = (await handler(
      {
        httpMethod: 'GET',
        path: '/.netlify/functions/api/products',
        headers: {},
        queryStringParameters: {},
        body: null,
        isBase64Encoded: false,
      } as unknown as Parameters<typeof handler>[0],
      {} as Parameters<typeof handler>[1]
    )) as { statusCode: number; body: string };

    assert.equal(productsRes.statusCode, 200);
    const parsedProducts = JSON.parse(productsRes.body) as { products: unknown[] };
    assert.equal(parsedProducts.products.length, 30);

    const adminUnauthRes = (await handler(
      {
        httpMethod: 'GET',
        path: '/.netlify/functions/api/admin/dashboard',
        headers: {},
        queryStringParameters: {},
        body: null,
        isBase64Encoded: false,
      } as unknown as Parameters<typeof handler>[0],
      {} as Parameters<typeof handler>[1]
    )) as { statusCode: number };

    assert.equal(adminUnauthRes.statusCode, 401);
  } finally {
    if (prevDbPath === undefined) delete process.env.WISHMANTRA_DB_PATH;
    else process.env.WISHMANTRA_DB_PATH = prevDbPath;
    if (prevNetlify === undefined) delete process.env.NETLIFY;
    else process.env.NETLIFY = prevNetlify;
    fs.rmSync(outFile, { force: true });
    fs.rmSync(tmpDb, { force: true });
    fs.rmSync(`${tmpDb}-wal`, { force: true });
    fs.rmSync(`${tmpDb}-shm`, { force: true });
  }
});
