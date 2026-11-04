import type { GeneratePostRequest, Post } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
export class ApiError extends Error { status?: number; constructor(message: string, status?: number) { super(message); this.name = "ApiError"; this.status = status; } }

export async function generatePost(payload: GeneratePostRequest): Promise<Post> {
  let response: Response;
  try { response = await fetch(`${API_URL}/api/index`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); }
  catch { throw new ApiError("Could not reach the server. Make sure the backend is running."); }
  if (!response.ok) { let message = "Something went wrong. Please try again."; if (response.status === 422) message = "Some inputs are invalid or too long. Please check them and try again."; else if (response.status === 502) message = "The post could not be generated right now. Please try again later."; throw new ApiError(message, response.status); }
  return (await response.json()) as Post;
}
