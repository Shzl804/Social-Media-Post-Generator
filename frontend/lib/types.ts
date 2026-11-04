export type Platform = "instagram" | "linkedin" | "tiktok" | "x" | "facebook";
export type ResearchMode = "live" | "fallback";
export interface GeneratePostRequest { topic: string; platform: Platform; audience: string; tone: string; goal: string; include_image_prompt: boolean; }
export interface Source { title: string; url: string; summary: string; }
export interface Post { id: number; topic: string; platform: Platform; audience: string; tone: string; goal: string; title: string; hook: string; body: string; call_to_action: string; hashtags: string[]; niche_hashtags: string[]; content_ideas: string[]; image_prompt: string; sources: Source[]; research_mode: ResearchMode; created_at: string; }
