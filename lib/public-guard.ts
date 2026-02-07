import { NextResponse } from "next/server";
import { validateApiKey } from "./api-key";

export async function requireApiKey(request: Request) {
  const apiKey = request.headers.get("X-API-Key");
  if (!apiKey) {
    return {
      error: NextResponse.json(
        { error: "Missing API key. Provide X-API-Key header." },
        { status: 401 }
      ),
      client: null,
    };
  }

  const client = await validateApiKey(apiKey);
  if (!client) {
    return {
      error: NextResponse.json(
        { error: "Invalid or revoked API key." },
        { status: 403 }
      ),
      client: null,
    };
  }

  return { error: null, client };
}
