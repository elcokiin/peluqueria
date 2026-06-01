import handler, { createServerEntry } from "@tanstack/react-start/server-entry";

const SECURITY_MARKER_HASH = "'sha256-x1re2lJCbJLUlWV3fFbi1/CEPWb0ZexeffK5gyjy6bw='";

function createNonce() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

function buildContentSecurityPolicy(nonce: string) {
  return [
    "default-src 'self'",
    `script-src 'nonce-${nonce}' ${SECURITY_MARKER_HASH} 'strict-dynamic' https:`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https: wss:",
    "manifest-src 'self'",
    "worker-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self' https:",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

function shouldRedirectToHttps(request: Request) {
  const url = new URL(request.url);
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const isLocalhost = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  return !isLocalhost && (url.protocol === "http:" || forwardedProto === "http");
}

async function secureResponse(response: Response) {
  const nonce = createNonce();
  const headers = new Headers(response.headers);

  headers.set("Content-Security-Policy", buildContentSecurityPolicy(nonce));
  headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  const contentType = headers.get("content-type") || "";
  if (!contentType.includes("text/html")) {
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  const html = await response.text();
  const htmlWithNonces = html.replace(/<script(?![^>]*\bnonce=)/g, `<script nonce="${nonce}"`);
  headers.delete("content-length");

  return new Response(htmlWithNonces, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default createServerEntry({
  async fetch(request) {
    if (shouldRedirectToHttps(request)) {
      const url = new URL(request.url);
      url.protocol = "https:";
      return Response.redirect(url, 308);
    }

    const response = await handler.fetch(request);
    return secureResponse(response);
  },
});
