import type { NextRequest } from 'next/server';
import apiApp from '@/server/vercelApp';
import { runExpressApp } from '@/server/expressAdapter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ path?: string[] }> };

async function handle(req: NextRequest, method: string) {
  return runExpressApp(apiApp, req, method);
}

export async function GET(req: NextRequest, _ctx: RouteContext) {
  return handle(req, 'GET');
}

export async function POST(req: NextRequest, _ctx: RouteContext) {
  return handle(req, 'POST');
}

export async function PATCH(req: NextRequest, _ctx: RouteContext) {
  return handle(req, 'PATCH');
}

export async function PUT(req: NextRequest, _ctx: RouteContext) {
  return handle(req, 'PUT');
}

export async function DELETE(req: NextRequest, _ctx: RouteContext) {
  return handle(req, 'DELETE');
}

export async function OPTIONS(req: NextRequest, _ctx: RouteContext) {
  return handle(req, 'OPTIONS');
}
