const API_URL = import.meta.env.VITE_API_URL ?? "/access-portal/api"

/**
 * Safely parse a JSON response, handling cases where the server
 * returns HTML error pages instead of JSON
 */
async function safeParseJson<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type")

  // If it's not JSON content, throw an error instead of trying to parse
  if (contentType && !contentType.includes("application/json")) {
    throw new Error("Server returned non-JSON response")
  }

  try {
    return await response.json()
  } catch (error) {
    throw new Error("Failed to parse server response")
  }
}

import { type AccessRequestPayload } from "./access-request-schema"

export async function createAccessRequest(payload: AccessRequestPayload) {
  const response = await fetch(`${API_URL}/access-requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error("Unable to create access request.")
  }

  return safeParseJson(response)
}
