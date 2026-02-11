import { auth } from "./auth"

export type ApiKeyContext = {
  userId: string
  key: unknown
}

export async function verifyApiAccess(
  request: Request,
  requiredPermissions?: Record<string, string[]>
): Promise<ApiKeyContext> {
  const apiKey = request.headers.get("x-api-key")
  if (!apiKey) {
    const err = new Response(JSON.stringify({ error: "Missing API key" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    })
    // Throw Response to allow route handlers to return directly
    throw err
  }

  try {
    const result = await auth.api.verifyApiKey({
      body: { key: apiKey, permissions: requiredPermissions },
    })

    if (!result?.valid || !result.key) {
      const status = result?.error?.code === "RATE_LIMIT_EXCEEDED" ? 429 : 401
      throw new Response(
        JSON.stringify({ error: status === 429 ? "API key rate limit reached" : "Invalid or unauthorized API key" }),
        { status, headers: { "content-type": "application/json" } }
      )
    }

    return { userId: result.key.userId, key: result.key }
  } catch (e) {
    if (e instanceof Response) throw e
    console.log(e)
    throw new Response(JSON.stringify({ error: "Invalid or unauthorized API key" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    })
  }
}
