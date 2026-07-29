/** Cloudflare Worker entry point for the vinext application. */
import { SECURITY_HEADERS } from "../security-headers";
import handler from "vinext/server/app-router-entry";

interface Env {}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

function withSecurityHeaders(response: Response, request: Request): Response {
  const headers = new Headers(response.headers);
  SECURITY_HEADERS.forEach(({ key, value }) => headers.set(key, value));
  const pathname = new URL(request.url).pathname;
  if (pathname.includes("/assets/")) {
    headers.set("Cache-Control", "public, max-age=604800, stale-while-revalidate=2592000");
  } else if (pathname.includes("/content/") || /\/(?:app|library)\.js$|\/styles\.css$/.test(pathname)) {
    headers.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const response = await handler.fetch(request, env, ctx);
    return withSecurityHeaders(response, request);
  },
};

export default worker;
