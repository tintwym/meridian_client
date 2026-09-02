import http from 'node:http';
import type { AddressInfo } from 'node:net';
import type { NextRequest } from 'next/server';
import type { Express } from 'express';

let bridge: { server: http.Server; port: number } | null = null;

function getBridge(app: Express): Promise<{ server: http.Server; port: number }> {
  if (bridge) return Promise.resolve(bridge);

  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as AddressInfo;
      bridge = { server, port: addr.port };
      resolve(bridge);
    });
    server.on('error', reject);
  });
}

function toFetchHeaders(headers: Headers): Headers {
  const out = new Headers();
  headers.forEach((value, key) => {
    if (key.toLowerCase() === 'host' || key.toLowerCase() === 'connection') return;
    out.set(key, value);
  });
  return out;
}

/**
 * Run the Express API through a loopback HTTP server.
 * Reliable for async handlers + body parsing (unlike node-mocks-http in Next dev).
 */
export async function runExpressApp(
  app: Express,
  req: NextRequest,
  method: string,
): Promise<Response> {
  const { port } = await getBridge(app);
  const url = new URL(req.url);
  const target = `http://127.0.0.1:${port}${url.pathname}${url.search}`;

  const init: RequestInit = {
    method,
    headers: toFetchHeaders(req.headers),
  };

  if (method !== 'GET' && method !== 'HEAD') {
    init.body = await req.text();
  }

  const res = await fetch(target, init);
  const text = await res.text();

  return new Response(text, {
    status: res.status,
    headers: res.headers,
  });
}
