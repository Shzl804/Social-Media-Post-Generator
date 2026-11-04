"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaTiktok,
  FaXTwitter,
} from "react-icons/fa6";

import type { Platform, Post } from "@/lib/types";

const PLATFORM_CONFIG: Record<
  Platform,
  {
    label: string;
    icon: ReactNode;
    brand: string;
    limit?: number;
  }
> = {
  instagram: {
    label: "Instagram",
    icon: <FaInstagram />,
    brand: "from-purple-600 via-pink-500 to-orange-400",
    limit: 2200,
  },
  linkedin: {
    label: "LinkedIn",
    icon: <FaLinkedinIn />,
    brand: "from-blue-700 to-blue-500",
    limit: 3000,
  },
  tiktok: {
    label: "TikTok",
    icon: <FaTiktok />,
    brand: "from-slate-900 to-slate-700",
    limit: 2200,
  },
  x: {
    label: "X",
    icon: <FaXTwitter />,
    brand: "from-neutral-900 to-neutral-700",
    limit: 280,
  },
  facebook: {
    label: "Facebook",
    icon: <FaFacebookF />,
    brand: "from-blue-700 to-blue-500",
  },
};

const textareaClass =
  "w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm leading-7 text-slate-800 shadow-sm outline-none transition-all duration-300 hover:border-indigo-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";

function useCopy(text: string) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setFailed(false);

      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
      setFailed(true);

      window.setTimeout(() => setFailed(false), 2500);
    }
  }

  return { copied, failed, copy };
}

function CopyButton({
  text,
  label,
  primary = false,
}: {
  text: string;
  label: string;
  primary?: boolean;
}) {
  const { copied, failed, copy } = useCopy(text);

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={failed ? "Copy failed" : label}
      title={failed ? "Clipboard access failed" : label}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all duration-200 active:scale-95 ${
        copied
          ? "animate-pop border-emerald-200 bg-emerald-50 text-emerald-700"
          : failed
            ? "border-rose-200 bg-rose-50 text-rose-700"
            : primary
              ? "border-transparent bg-indigo-600 text-white shadow-md shadow-indigo-500/20 hover:-translate-y-0.5 hover:bg-indigo-700"
              : "border-slate-200 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-indigo-300 hover:text-indigo-700 hover:shadow-sm"
      }`}
    >
      <span aria-hidden="true">
        {copied ? "✓" : failed ? "!" : "⧉"}
      </span>

      {copied ? "Copied!" : failed ? "Copy failed" : label}
    </button>
  );
}

function HashtagChip({
  tag,
  niche = false,
}: {
  tag: string;
  niche?: boolean;
}) {
  const { copied, failed, copy } = useCopy(tag);

  return (
    <button
      type="button"
      onClick={copy}
      title={`Copy ${tag}`}
      aria-label={`Copy hashtag ${tag}`}
      className={`rounded-full border px-3.5 py-2 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:scale-95 ${
        copied
          ? "animate-pop border-emerald-200 bg-emerald-50 text-emerald-700"
          : failed
            ? "border-rose-200 bg-rose-50 text-rose-700"
            : niche
              ? "border-slate-200 bg-slate-50 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
              : "border-indigo-100 bg-indigo-50 text-indigo-700 hover:border-indigo-200 hover:bg-indigo-100"
      }`}
    >
      {copied ? "✓ Copied" : failed ? "Copy failed" : tag}
    </button>
  );
}

function Section({
  title,
  description,
  action,
  index = 0,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  index?: number;
  children: ReactNode;
}) {
  return (
    <section
      className="animate-fade-up space-y-3"
      style={{
        animationDelay: `${index * 80}ms`,
        animationFillMode: "both",
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold tracking-wide text-slate-800">
            {title}
          </h3>

          {description && (
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {description}
            </p>
          )}
        </div>

        {action}
      </div>

      {children}
    </section>
  );
}

function Count({ value }: { value: string }) {
  const words = value.trim() ? value.trim().split(/\s+/).length : 0;

  return (
    <p className="text-right text-xs tabular-nums text-slate-400">
      {value.length} characters · {words} words
    </p>
  );
}

export default function PostResult({ post }: { post: Post }) {
  const [hook, setHook] = useState(post.hook);
  const [body, setBody] = useState(post.body);
  const [cta, setCta] = useState(post.call_to_action);

  const config = PLATFORM_CONFIG[post.platform];

  const hashtagLine = [...post.hashtags, ...post.niche_hashtags].join(" ");

  const fullPost = [hook, body, cta, hashtagLine]
    .filter((part) => part.trim().length > 0)
    .join("\n\n");

  const limit = config.limit;
  const over = limit !== undefined && fullPost.length > limit;

  const pct = limit
    ? Math.min(100, (fullPost.length / limit) * 100)
    : 0;

  const edited =
    hook !== post.hook ||
    body !== post.body ||
    cta !== post.call_to_action;

  const live = post.research_mode === "live";

  function reset() {
    setHook(post.hook);
    setBody(post.body);
    setCta(post.call_to_action);
  }

  return (
    <div className="mt-8 animate-fade-up overflow-hidden rounded-[28px] border border-slate-200/70 bg-white shadow-2xl shadow-indigo-950/5">
      {/* Top gradient accent */}
      <div className="h-1.5 bg-gradient-to-r from-indigo-600 via-violet-500 to-fuchsia-500" />

      <div className="space-y-8 p-5 sm:p-8 lg:p-10">
        {/* Research status */}
        <div
          role="status"
          className={`flex items-start gap-3 rounded-2xl border p-4 ${
            live
              ? "border-emerald-200 bg-emerald-50/70"
              : "border-amber-200 bg-amber-50/70"
          }`}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-lg shadow-sm">
            {live ? "✓" : "!"}
          </span>

          <div>
            <p
              className={`text-sm font-bold ${
                live ? "text-emerald-900" : "text-amber-900"
              }`}
            >
              {live ? "Research-enabled generation" : "Review before publishing"}
            </p>

            <p
              className={`mt-1 text-xs leading-5 ${
                live ? "text-emerald-800" : "text-amber-800"
              }`}
            >
              {live
                ? "Research sources are listed below. Verify important claims before publishing."
                : "Live research was not used. Verify factual claims, hashtags, and trend references before publishing."}
            </p>
          </div>
        </div>

        {/* Header */}
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div className="flex items-start gap-4">
            <span
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-2xl text-white shadow-lg ${config.brand}`}
            >
              {config.icon}
            </span>

            <div className="min-w-0">
              <span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-indigo-700">
                Generated content
              </span>

              <h2 className="mt-2 break-words text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                {post.title}
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Ready for {config.label} · Customize before publishing
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {edited && (
              <button
                type="button"
                onClick={reset}
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 transition-all hover:-translate-y-0.5 hover:border-rose-200 hover:text-rose-600 active:scale-95"
              >
                ↺ Reset edits
              </button>
            )}

            <CopyButton
              text={fullPost}
              label="Copy full post"
              primary
            />
          </div>
        </header>

        {/* Character counter */}
        <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-slate-800">
                Post length
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Includes the hook, body, call to action, and hashtags.
              </p>
            </div>

            <p
              aria-live="polite"
              className={`text-sm font-bold tabular-nums ${
                over ? "text-rose-600" : "text-slate-700"
              }`}
            >
              {fullPost.length}
              {limit !== undefined ? ` / ${limit}` : ""} characters
            </p>
          </div>

          {limit !== undefined && (
            <div
              className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200"
              role="progressbar"
              aria-label={`${config.label} character limit usage`}
              aria-valuemin={0}
              aria-valuemax={limit}
              aria-valuenow={Math.min(fullPost.length, limit)}
            >
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  over
                    ? "bg-rose-500"
                    : pct > 85
                      ? "bg-amber-400"
                      : "bg-gradient-to-r from-indigo-500 to-violet-500"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          )}

          {over && (
            <p className="mt-3 animate-pop text-xs font-semibold text-rose-600">
              Your post exceeds this configured character limit by{" "}
              {fullPost.length - limit!} characters.
            </p>
          )}
        </section>

        {/* Hook */}
        <Section
          title="01 · The hook"
          description="Grab attention in the first few lines."
          index={1}
          action={<CopyButton text={hook} label="Copy hook" />}
        >
          <textarea
            aria-label="Edit post hook"
            value={hook}
            onChange={(event) => setHook(event.target.value)}
            rows={3}
            className={textareaClass}
          />

          <Count value={hook} />
        </Section>

        {/* Body */}
        <Section
          title="02 · Post body"
          description="Your main message. Edit it to match your voice."
          index={2}
          action={<CopyButton text={body} label="Copy body" />}
        >
          <textarea
            aria-label="Edit post body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={10}
            className={textareaClass}
          />

          <Count value={body} />
        </Section>

        {/* CTA */}
        <Section
          title="03 · Call to action"
          description="Encourage your audience to take the next step."
          index={3}
          action={<CopyButton text={cta} label="Copy CTA" />}
        >
          <textarea
            aria-label="Edit call to action"
            value={cta}
            onChange={(event) => setCta(event.target.value)}
            rows={2}
            className={textareaClass}
          />

          <Count value={cta} />
        </Section>

        {/* Hashtags */}
        <Section
          title="04 · Hashtags"
          description="Click any hashtag to copy it."
          index={4}
          action={
            <CopyButton
              text={hashtagLine}
              label="Copy all"
            />
          }
        >
          {post.hashtags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {post.hashtags.map((tag, index) => (
                <HashtagChip key={`${tag}-${index}`} tag={tag} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              No general hashtags were generated.
            </p>
          )}

          {post.niche_hashtags.length > 0 && (
            <div className="mt-5 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Niche hashtag ideas
              </p>

              <div className="flex flex-wrap gap-2">
                {post.niche_hashtags.map((tag, index) => (
                  <HashtagChip
                    key={`${tag}-${index}`}
                    tag={tag}
                    niche
                  />
                ))}
              </div>
            </div>
          )}
        </Section>

        {/* Content ideas */}
        {post.content_ideas.length > 0 && (
          <Section
            title="05 · More content ideas"
            description="Use these suggestions to plan your next posts."
            index={5}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {post.content_ideas.map((idea, index) => (
                <div
                  key={`${idea}-${index}`}
                  className="group flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:bg-indigo-50/50 hover:shadow-lg hover:shadow-indigo-950/5"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-lg transition-transform duration-300 group-hover:scale-110">
                    💡
                  </span>

                  <p className="text-sm leading-6 text-slate-700">
                    {idea}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Image prompt */}
        {post.image_prompt && (
          <Section
            title="06 · AI image prompt"
            description="Use this prompt with your preferred AI image generator."
            index={6}
            action={
              <CopyButton
                text={post.image_prompt}
                label="Copy prompt"
              />
            }
          >
            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-fuchsia-50 p-5">
              <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-700">
                <span aria-hidden="true">✦</span>
                Visual concept
              </div>

              <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                {post.image_prompt}
              </p>
            </div>
          </Section>
        )}

        {/* Research sources */}
        <Section
          title="07 · Research sources"
          description="Review these references before using factual claims."
          index={7}
        >
          {post.sources.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <span className="text-2xl" aria-hidden="true">
                🔎
              </span>

              <p className="mt-3 text-sm font-semibold text-slate-700">
                No sources attached
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Independently verify factual claims before publishing.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {post.sources.map((source, index) => (
                <a
                  key={source.url}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/30 hover:shadow-lg hover:shadow-indigo-950/5"
                >
                  <div className="min-w-0">
                    <span className="mb-2 inline-block rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Source {index + 1}
                    </span>

                    <h4 className="break-words text-sm font-bold leading-6 text-indigo-700 transition-colors group-hover:text-indigo-900">
                      {source.title}
                    </h4>

                    {source.summary && (
                      <p className="mt-1 text-xs leading-6 text-slate-500">
                        {source.summary}
                      </p>
                    )}
                  </div>

                  <span className="shrink-0 rounded-xl bg-indigo-50 px-3 py-2 text-sm text-indigo-600 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                    ↗
                  </span>
                </a>
              ))}
            </div>
          )}
        </Section>

        {/* Footer */}
        <footer className="border-t border-slate-100 pt-6">
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-xs leading-5 text-slate-400">
              Review your content before publishing. Character limits may
              differ from the limits configured here.
            </p>

            <CopyButton
              text={fullPost}
              label="Copy final post"
              primary
            />
          </div>
        </footer>
      </div>
    </div>
  );
}