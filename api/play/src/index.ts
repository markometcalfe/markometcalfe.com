import type { Env } from "../types";
import { LobbyRoom } from "./lobby-room";

export { LobbyRoom };

const PRODUCTION_ORIGIN = "https://markometcalfe.com";

// In production only the live site may call this API. Locally
// (env.ENVIRONMENT=development, set via .dev.vars) any origin is
// allowed so the Nuxt dev server can run on whatever port it likes.
// Returns null when the request's origin isn't allowed at all.
function resolveAllowedOrigin(
  request: Request,
  env: Env,
): string | null {
  const origin = request.headers.get("Origin");
  if (env.ENVIRONMENT === "development") {
    return origin ?? "*";
  }
  if (origin === PRODUCTION_ORIGIN) {
    return PRODUCTION_ORIGIN;
  }
  // Browsers only send an `Origin` header on a same-origin request when
  // its method isn't GET/HEAD, so a same-origin GET legitimately
  // arrives with none. Only reject when an Origin was actually sent and
  // didn't match.
  if (origin === null && request.method === "GET") {
    return PRODUCTION_ORIGIN;
  }
  return null;
}

function corsHeaders(allowedOrigin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

function json(
  data: unknown,
  status: number,
  allowedOrigin: string,
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(allowedOrigin),
    },
  });
}

const ROOM_CODE_DIGITS = "0123456789";
const ROOM_CODE_LENGTH = 4;

// Four digits (0000-9999) -- short enough to read out or type from
// memory.
function randomRoomCode(): string {
  const bytes = new Uint8Array(ROOM_CODE_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(
    bytes,
    b => ROOM_CODE_DIGITS[b % ROOM_CODE_DIGITS.length],
  ).join("");
}

function generateRoomId(request: Request, env: Env): string {
  if (env.IS_PLAYWRIGHT === "1") {
    const project = request.headers
      .get("X-Playwright-Project")
      ?.replace(/[^\w-]/g, "");
    return project ? `abc123-${project}` : "abc123";
  }
  return randomRoomCode();
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;
    const allowedOrigin = resolveAllowedOrigin(request, env);

    if (!allowedOrigin) {
      return new Response("Forbidden", { status: 403 });
    }

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders(allowedOrigin),
      });
    }

    if (pathname === "/api/play/rooms" && request.method === "POST") {
      return json(
        { roomId: generateRoomId(request, env) },
        200,
        allowedOrigin,
      );
    }

    if (pathname.startsWith("/api/play/ws/")) {
      const roomId = pathname.slice("/api/play/ws/".length);
      if (!roomId) {
        return new Response("Missing room ID", { status: 400 });
      }
      const stub = env.LOBBY_ROOMS.get(
        env.LOBBY_ROOMS.idFromName(roomId),
      );
      return stub.fetch(request);
    }

    return new Response("Not found", {
      status: 404,
      headers: corsHeaders(allowedOrigin),
    });
  },
};
