import { WorkerEntrypoint } from "cloudflare:workers";
import type { Env } from "../types";
import { GameRoom } from "./game-room";
import { Leaderboard } from "./leaderboard";

export { GameRoom, Leaderboard };

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
  // its method isn't GET/HEAD, so a same-origin GET (e.g. the site's own
  // leaderboard fetch) legitimately arrives with none. Only reject when
  // an Origin was actually sent and didn't match.
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

function generateRoomId(request: Request, env: Env): string {
  if (env.IS_PLAYWRIGHT === "1") {
    // Desktop Chrome and Mobile Chrome run this suite concurrently
    // against the same dev server -- keyed off a header the config sets
    // per project (see playwright.config.ts) so they don't collide in
    // the same room. Falls back to a fixed id if the header's absent.
    const project = request.headers
      .get("X-Playwright-Project")
      ?.replace(/[^\w-]/g, "");
    return project ? `abc123-${project}` : "abc123";
  }
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, 6);
}

export default class extends WorkerEntrypoint<Env> {
  // Called via a service binding from api/play's LobbyRoom once a host
  // starts a Country Guesser room from the shared lobby -- pre-registers
  // them as the first (host) player before anyone actually connects, so
  // they can't lose the host race to whoever's WebSocket happens to
  // land first. See GameRoom.seed() below.
  async seedRoom(payload: {
    roomId: string;
    hostId: string;
    hostName: string;
  }): Promise<void> {
    const stub = this.env.GAME_ROOMS.get(
      this.env.GAME_ROOMS.idFromName(payload.roomId),
    );
    await stub.seed(payload.hostId, payload.hostName);
  }

  async fetch(request: Request): Promise<Response> {
    const env = this.env;
    const url = new URL(request.url);
    const { pathname } = url;
    const allowedOrigin = resolveAllowedOrigin(request, env);

    // Reject anything (including the WS upgrade) from a disallowed
    // origin up front. CORS response headers alone don't stop
    // non-browser or cross-site WebSocket clients from completing the
    // handshake, so this is the actual enforcement.
    if (!allowedOrigin) {
      return new Response("Forbidden", { status: 403 });
    }

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders(allowedOrigin),
      });
    }

    if (
      pathname === "/api/countries/rooms" &&
      request.method === "POST"
    ) {
      return json(
        { roomId: generateRoomId(request, env) },
        200,
        allowedOrigin,
      );
    }

    if (
      pathname === "/api/countries/leaderboard" &&
      request.method === "GET"
    ) {
      const stub = env.LEADERBOARD.get(
        env.LEADERBOARD.idFromName("global"),
      );
      const res = await stub.fetch("http://leaderboard/top10");
      const entries = await res.json();
      return json(entries, res.status, allowedOrigin);
    }

    if (pathname.startsWith("/api/countries/ws/")) {
      const roomId = pathname.slice("/api/countries/ws/".length);
      if (!roomId) {
        return new Response("Missing room ID", { status: 400 });
      }
      const stub = env.GAME_ROOMS.get(
        env.GAME_ROOMS.idFromName(roomId),
      );
      return stub.fetch(request);
    }

    return new Response("Not found", {
      status: 404,
      headers: corsHeaders(allowedOrigin),
    });
  }
}
