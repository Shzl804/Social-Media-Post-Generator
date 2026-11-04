"use client";

import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaTiktok,
  FaXTwitter,
} from "react-icons/fa6";

import { ApiError, generatePost } from "@/lib/api";
import type { GeneratePostRequest, Platform, Post } from "@/lib/types";
import PostResult from "@/components/PostResult";

const PLATFORMS: {
  value: Platform;
  label: string;
  icon: ReactNode;
  brand: string;
  description: string;
}[] = [
  {
    value: "instagram",
    label: "Instagram",
    icon: <FaInstagram />,
    brand: "from-purple-600 via-pink-500 to-orange-400",
    description: "Visual storytelling",
  },
  {
    value: "linkedin",
    label: "LinkedIn",
    icon: <FaLinkedinIn />,
    brand: "from-blue-700 to-blue-500",
    description: "Professional content",
  },
  {
    value: "tiktok",
    label: "TikTok",
    icon: <FaTiktok />,
    brand: "from-slate-900 to-slate-700",
    description: "Short-form content",
  },
  {
    value: "x",
    label: "X",
    icon: <FaXTwitter />,
    brand: "from-neutral-900 to-neutral-700",
    description: "Concise conversations",
  },
  {
    value: "facebook",
    label: "Facebook",
    icon: <FaFacebookF />,
    brand: "from-blue-700 to-blue-500",
    description: "Community engagement",
  },
];

const TONES = [
  "Professional and practical",
  "Friendly and conversational",
  "Playful and witty",
  "Inspirational",
  "Authoritative and data-driven",
];

const GOALS = ["Engagement", "Awareness", "Education", "Leads", "Sales"];

const LIMITS = {
  topic: 500,
  audience: 300,
  tone: 100,
  goal: 100,
};

const labelClass =
  "mb-2 block text-sm font-semibold tracking-wide text-slate-800";

const inputClass =
  "w-full rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition-all duration-300 placeholder:text-slate-400 hover:border-indigo-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full border px-3.5 py-2 text-xs font-medium transition-all duration-200 active:scale-95 ${
        active
          ? "border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
          : "border-slate-200 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
      }`}
    >
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <svg
      className="h-5 w-5 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        className="opacity-25"
      />
      <path
        d="M4 12a8 8 0 0 1 8-8"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Skeleton() {
  return (
    <div
      role="status"
      aria-label="Generating your post"
      className="mt-8 animate-fade-up overflow-hidden rounded-3xl border border-slate-200/70 bg-white p-6 shadow-xl shadow-indigo-950/5 sm:p-8"
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="h-12 w-12 animate-pulse rounded-2xl bg-indigo-100" />

        <div className="flex-1 space-y-2">
          <div className="h-4 w-36 animate-pulse rounded-full bg-slate-200" />
          <div className="h-3 w-24 animate-pulse rounded-full bg-slate-100" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="h-7 w-3/4 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-4 w-full animate-pulse rounded-lg bg-slate-100" />
        <div className="h-4 w-5/6 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-10 w-1/3 animate-pulse rounded-xl bg-indigo-50" />
      </div>

      <p className="mt-6 text-sm font-medium text-indigo-600">
        Creating something worth sharing...
      </p>
    </div>
  );
}

export default function PostForm() {
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState<Platform>("linkedin");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState(TONES[0]);
  const [goal, setGoal] = useState("Education");
  const [includeImagePrompt, setIncludeImagePrompt] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState(0);
  const [post, setPost] = useState<Post | null>(null);

  const topicPct = Math.min(100, (topic.length / LIMITS.topic) * 100);
  const selectedPlatform = PLATFORMS.find(
    (item) => item.value === platform
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setError(null);

    const payload: GeneratePostRequest = {
      topic: topic.trim(),
      platform,
      audience: audience.trim(),
      tone: tone.trim(),
      goal: goal.trim(),
      include_image_prompt: includeImagePrompt,
    };

    try {
      setPost(await generatePost(payload));
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again."
      );

      setErrorKey((key) => key + 1);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl pb-12">
      {/* Page heading */}
      <header className="animate-fade-up mb-8 text-center sm:mb-10">
        <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-4 py-2 text-xs font-semibold tracking-wide text-indigo-700 shadow-sm">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          AI-POWERED CONTENT STUDIO
        </div>

        <h1 className="light-mode-heading text-3xl font-black tracking-tight sm:text-5xl">
          Turn your ideas into{" "}
          <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
            great content.
          </span>
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
          Create platform-ready social media posts with engaging hooks,
          relevant hashtags, and content tailored to your audience.
        </p>
      </header>

      {/* Form container */}
      <div className="group relative rounded-[28px] bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 p-[1.5px] shadow-2xl shadow-indigo-950/10 transition-shadow duration-500 hover:shadow-indigo-500/15">
        <form
          onSubmit={handleSubmit}
          className="space-y-8 rounded-[27px] bg-white p-5 sm:p-8 lg:p-10"
        >
          {/* Topic */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="topic" className={labelClass}>
                <span className="mr-2 text-indigo-600">01.</span>
                What&apos;s your post about?
              </label>

              <span className="text-xs font-medium text-slate-400">
                Required
              </span>
            </div>

            <textarea
              id="topic"
              required
              minLength={3}
              maxLength={LIMITS.topic}
              rows={4}
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="e.g. How AI is transforming small business customer support..."
              className={`${inputClass} resize-y`}
            />

            <div className="flex items-center gap-3">
              <div
                className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"
                role="progressbar"
                aria-label="Topic character usage"
                aria-valuemin={0}
                aria-valuemax={LIMITS.topic}
                aria-valuenow={topic.length}
              >
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    topicPct > 90
                      ? "bg-rose-500"
                      : topicPct > 70
                        ? "bg-amber-400"
                        : "bg-gradient-to-r from-indigo-500 to-fuchsia-500"
                  }`}
                  style={{ width: `${topicPct}%` }}
                />
              </div>

              <span className="min-w-16 text-right text-xs tabular-nums text-slate-500">
                {topic.length}/{LIMITS.topic}
              </span>
            </div>
          </section>

          {/* Platform */}
          <section>
            <div className="mb-4">
              <h2 className={labelClass}>
                <span className="mr-2 text-indigo-600">02.</span>
                Choose your platform
              </h2>

              <p className="text-xs text-slate-500">
                Select where you want to publish your content.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {PLATFORMS.map((item) => {
                const active = platform === item.value;

                return (
                  <button
                    key={item.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setPlatform(item.value)}
                    className={`group/platform relative flex min-h-32 flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border p-3 transition-all duration-300 active:scale-[0.97] ${
                      active
                        ? "border-indigo-300 bg-indigo-50/80 shadow-lg shadow-indigo-950/5 ring-2 ring-indigo-500/20"
                        : "border-slate-200 bg-white hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-950/5"
                    }`}
                  >
                    <span
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-xl text-white shadow-md transition-transform duration-300 group-hover/platform:scale-110 group-hover/platform:rotate-3 ${item.brand}`}
                    >
                      {item.icon}
                    </span>

                    <span className="text-sm font-bold text-slate-800">
                      {item.label}
                    </span>

                    <span className="text-center text-[10px] leading-4 text-slate-500">
                      {item.description}
                    </span>

                    {active && (
                      <span className="absolute right-2 top-2 flex h-5 w-5 animate-pop items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {selectedPlatform && (
              <p
                aria-live="polite"
                className="mt-3 text-xs text-slate-500"
              >
                Selected:{" "}
                <span className="font-semibold text-indigo-700">
                  {selectedPlatform.label}
                </span>
              </p>
            )}
          </section>

          {/* Audience */}
          <section>
            <label htmlFor="audience" className={labelClass}>
              <span className="mr-2 text-indigo-600">03.</span>
              Who is your target audience?
            </label>

            <input
              id="audience"
              required
              minLength={2}
              maxLength={LIMITS.audience}
              value={audience}
              onChange={(event) => setAudience(event.target.value)}
              placeholder="e.g. Developers, students, or small business owners"
              className={inputClass}
            />

            <p className="mt-2 text-xs text-slate-400">
              Be specific to help the AI create more relevant content.
            </p>
          </section>

          {/* Tone */}
          <section>
            <label htmlFor="tone" className={labelClass}>
              <span className="mr-2 text-indigo-600">04.</span>
              Choose your writing tone
            </label>

            <input
              id="tone"
              required
              minLength={2}
              maxLength={LIMITS.tone}
              value={tone}
              onChange={(event) => setTone(event.target.value)}
              placeholder="Describe your preferred tone"
              className={inputClass}
            />

            <div className="mt-3 flex flex-wrap gap-2">
              {TONES.map((item) => (
                <Chip
                  key={item}
                  active={tone === item}
                  onClick={() => setTone(item)}
                >
                  {item}
                </Chip>
              ))}
            </div>
          </section>

          {/* Goal */}
          <section>
            <label htmlFor="goal" className={labelClass}>
              <span className="mr-2 text-indigo-600">05.</span>
              What&apos;s your content goal?
            </label>

            <input
              id="goal"
              required
              minLength={2}
              maxLength={LIMITS.goal}
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              placeholder="Describe your goal"
              className={inputClass}
            />

            <div className="mt-3 flex flex-wrap gap-2">
              {GOALS.map((item) => (
                <Chip
                  key={item}
                  active={goal === item}
                  onClick={() => setGoal(item)}
                >
                  {item}
                </Chip>
              ))}
            </div>
          </section>

          {/* Image prompt toggle */}
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 to-fuchsia-50/60 p-4 transition-all duration-300 hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-950/5 sm:p-5">
            <span className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                🎨
              </span>

              <span>
                <span className="block text-sm font-bold text-slate-800">
                  Generate an image prompt
                </span>

                <span className="mt-1 block text-xs leading-5 text-slate-500">
                  Get a ready-to-use prompt for creating a matching visual
                  with an AI image generator.
                </span>
              </span>
            </span>

            <span className="relative inline-flex h-6 w-11 shrink-0">
              <input
                type="checkbox"
                checked={includeImagePrompt}
                onChange={(event) =>
                  setIncludeImagePrompt(event.target.checked)
                }
                className="peer sr-only"
              />

              <span className="absolute inset-0 rounded-full bg-slate-300 transition-colors duration-300 peer-checked:bg-indigo-600 peer-focus-visible:ring-4 peer-focus-visible:ring-indigo-500/20" />

              <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 peer-checked:translate-x-5" />
            </span>
          </label>

          {/* Submit */}
          <div className="space-y-3 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="group/submit relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 px-6 py-4 text-sm font-bold text-white shadow-xl shadow-indigo-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-indigo-500/30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/30 active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
            >
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover/submit:translate-x-full" />

              <span className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <Spinner />
                    Creating your post...
                  </>
                ) : (
                  <>✨ Generate my post</>
                )}
              </span>
            </button>

            <p className="text-center text-xs text-slate-400">
              {loading
                ? "Please wait while your content is being generated."
                : "AI-generated content should be reviewed before publishing."}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              key={errorKey}
              role="alert"
              className="animate-shake rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
            >
              <p className="font-bold">Something went wrong</p>
              <p className="mt-1 break-words">{error}</p>

              <button
                type="button"
                onClick={() => setError(null)}
                className="mt-3 text-xs font-semibold underline underline-offset-4 hover:text-rose-950"
              >
                Dismiss
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Loading state */}
      {loading && <Skeleton />}

      {/* Generated result */}
      {!loading && post && <PostResult key={post.id} post={post} />}
    </div>
  );
}
