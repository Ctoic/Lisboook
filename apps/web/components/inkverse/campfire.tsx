"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import type { CampfireKind, CampfirePostContract, CampfireReplyContract, CampfireThreadContract } from "@lisbook/types";
import { EmptyState } from "@/components/states";
import { Button, ButtonLink } from "@/components/ui/button";
import { AlertIcon, ArrowLeftIcon, PlusIcon, QuillIcon, SparkleIcon, TrashIcon } from "@/components/ui/icons";
import { Modal } from "@/components/ui/modal";
import { publicApi, taverns, type NewPostInput } from "@/lib/inkverse-client";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { timeAgo } from "./inkwell";

export const postKinds: { value: CampfireKind; label: string; plural: string; blurb: string; color: string }[] = [
  { value: "spark", label: "Spark", plural: "Sparks", blurb: "A wild idea, free for anyone to adopt into a Saga", color: "#f59e5b" },
  { value: "duel", label: "Duel", plural: "Duels", blurb: "A question with two sides. Pick one and argue it", color: "#f2787a" },
  { value: "tale", label: "Round Robin", plural: "Round Robin", blurb: "A story told in turns, one passage each", color: "#a99cf5" },
  { value: "prompt", label: "Moonlit Prompt", plural: "Prompts", blurb: "A writing challenge for everyone", color: "#5ad1c1" }
];
const kindOf = (kind: CampfireKind) => postKinds.find((k) => k.value === kind)!;

function FlameIcon({ size = 16, filled = false }: { size?: number; filled?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" aria-hidden>
      <path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.2 1-3.6 2.2-4.8.3 1.6 1.1 2.6 2.3 3C10.8 8.6 11.2 5.6 12 3Z" />
    </svg>
  );
}

function AuthorLink({ author }: { author: CampfirePostContract["author"] }) {
  return author.quillName ? (
    <Link href={`/creators/${encodeURIComponent(author.quillName)}`} className="campfire__author">
      {author.name}
    </Link>
  ) : (
    <span className="campfire__author">{author.name}</span>
  );
}

/** Embers, Duel votes and replies need an account; this asks the viewer to sign in instead. */
function useSignedIn() {
  const { session, openSignIn } = useAuth();
  return (reason: string) => {
    if (session) return session.accessToken;
    openSignIn(reason, "signup");
    return null;
  };
}

function DuelBar({ post, onVote }: { post: CampfirePostContract; onVote: (side: "a" | "b") => void }) {
  const total = post.votesA + post.votesB;
  const pctA = total ? Math.round((post.votesA / total) * 100) : 50;
  return (
    <div className="duel">
      <div className="duel__bar" aria-label={`${post.sideA} ${pctA}%, ${post.sideB} ${100 - pctA}%`}>
        <span style={{ width: `${pctA}%` }} />
      </div>
      <div className="duel__sides">
        <Button variant={post.mine.vote === "a" ? "primary" : "glass"} size="sm" onClick={() => onVote("a")}>
          {post.sideA} · {total ? `${pctA}%` : "0"}
        </Button>
        <span className="muted">{total} {total === 1 ? "vote" : "votes"}</span>
        <Button variant={post.mine.vote === "b" ? "primary" : "glass"} size="sm" onClick={() => onVote("b")}>
          {post.sideB} · {total ? `${100 - pctA}%` : "0"}
        </Button>
      </div>
    </div>
  );
}

function Composer({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (post: CampfireThreadContract) => void }) {
  const { session } = useAuth();
  const toast = useToast();
  const [draft, setDraft] = useState<NewPostInput>({ kind: "spark", title: "", body: "", sideA: "", sideB: "", tavern: "general", tags: [] });
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof NewPostInput>(key: K, value: NewPostInput[K]) => setDraft((d) => ({ ...d, [key]: value }));

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    if (!session) return;
    setSaving(true);
    try {
      const post = await publicApi.createPost(session.accessToken, {
        ...draft,
        title: draft.title.trim(),
        body: draft.body.trim(),
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 5)
      });
      onCreated(post);
    } catch (err) {
      toast({ title: "Couldn't share that", description: (err as Error).message, tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  const duel = draft.kind === "duel";
  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      icon={<FlameIcon size={24} />}
      title="Add to the fire"
      description={kindOf(draft.kind).blurb}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" loading={saving} onClick={() => submit()}>
            Share
          </Button>
        </>
      }
    >
      <form className="stack" style={{ gap: 14 }} onSubmit={submit}>
        <div className="segmented ink-kind-picker" role="group" aria-label="Kind of post">
          {postKinds.map((k) => (
            <button key={k.value} type="button" aria-pressed={draft.kind === k.value} onClick={() => set("kind", k.value)}>
              {k.label}
            </button>
          ))}
        </div>
        <div className="field">
          <label className="field__label" htmlFor="post-title">
            {duel ? "The question" : draft.kind === "tale" ? "Title of the tale" : "Title"}
          </label>
          <input
            id="post-title"
            className="input"
            value={draft.title}
            maxLength={140}
            onChange={(e) => set("title", e.target.value)}
            placeholder={duel ? "Should villains always get a redemption arc?" : draft.kind === "tale" ? "The Last Lamp" : "Memories as currency"}
            data-autofocus
          />
        </div>
        {duel ? (
          <div className="ink-soul-head">
            <div className="field">
              <label className="field__label" htmlFor="post-a">
                Side A
              </label>
              <input id="post-a" className="input" value={draft.sideA} maxLength={80} onChange={(e) => set("sideA", e.target.value)} placeholder="Yes, everyone deserves one" />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="post-b">
                Side B
              </label>
              <input id="post-b" className="input" value={draft.sideB} maxLength={80} onChange={(e) => set("sideB", e.target.value)} placeholder="No, some should stay monsters" />
            </div>
          </div>
        ) : null}
        <div className="field">
          <label className="field__label" htmlFor="post-body">
            {duel ? "Context (optional)" : draft.kind === "tale" ? "The opening passage" : draft.kind === "prompt" ? "The challenge" : "Your idea"}
          </label>
          <textarea
            id="post-body"
            className="input"
            rows={5}
            maxLength={4000}
            value={draft.body}
            onChange={(e) => set("body", e.target.value)}
            placeholder={
              draft.kind === "tale"
                ? "The lamplighter found the last lamp already lit…"
                : draft.kind === "prompt"
                  ? "Write a scene where a dragon asks a human for help. 500 words."
                  : "A city where you pay for bread with your happiest memory."
            }
          />
        </div>
        <div className="ink-soul-head">
          <div className="field">
            <label className="field__label" htmlFor="post-tavern">
              Tavern
            </label>
            <select id="post-tavern" className="input" value={draft.tavern} onChange={(e) => set("tavern", e.target.value)}>
              {taverns.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="post-tags">
              Tags <span className="muted">(comma-separated)</span>
            </label>
            <input id="post-tags" className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="dragons, heist" />
          </div>
        </div>
      </form>
    </Modal>
  );
}

function PostCard({ post, onChange }: { post: CampfirePostContract; onChange: (post: CampfirePostContract) => void }) {
  const toast = useToast();
  const signedIn = useSignedIn();
  const kind = kindOf(post.kind);

  async function react(reaction: "ember" | "vote_a" | "vote_b") {
    const token = signedIn("Sign in to add your Ember or vote at the Campfire.");
    if (!token) return;
    try {
      onChange(await publicApi.react(token, post.id, reaction));
    } catch (err) {
      toast({ title: "Couldn't do that", description: (err as Error).message, tone: "error" });
    }
  }

  return (
    <article className="campfire__post glass">
      <div className="campfire__meta">
        <span className="badge" style={{ color: kind.color }}>
          {kind.label}
        </span>
        {post.pinned ? <span className="badge badge--accent">Pinned</span> : null}
        <span className="muted">
          <AuthorLink author={post.author} /> · {taverns.find((t) => t.value === post.tavern)?.label} · {timeAgo(post.createdAt)}
        </span>
      </div>
      <Link href={`/campfire/${post.id}`} className="campfire__title">
        {post.title}
      </Link>
      {post.body ? <p className="campfire__body">{post.body}</p> : null}
      {post.kind === "duel" ? <DuelBar post={post} onVote={(side) => react(side === "a" ? "vote_a" : "vote_b")} /> : null}
      <div className="campfire__actions">
        <Button variant={post.mine.ember ? "primary" : "ghost"} size="sm" onClick={() => react("ember")} aria-pressed={post.mine.ember} title="Add an Ember">
          <FlameIcon size={14} filled={post.mine.ember} /> {post.embers}
        </Button>
        <ButtonLink href={`/campfire/${post.id}`} variant="ghost" size="sm">
          {post.replyCount} {post.kind === "tale" ? (post.replyCount === 1 ? "passage" : "passages") : post.kind === "duel" ? "arguments" : post.replyCount === 1 ? "reply" : "replies"}
        </ButtonLink>
        {post.adoptedCount ? <span className="muted campfire__adopted">Adopted into {post.adoptedCount} {post.adoptedCount === 1 ? "Saga" : "Sagas"}</span> : null}
        {post.tags.map((tag) => (
          <span key={tag} className="campfire__tag">
            #{tag}
          </span>
        ))}
      </div>
    </article>
  );
}

/** The Campfire: Sparks, Duels, Round Robin tales and Moonlit Prompts. */
export function Campfire() {
  const { session, ready } = useAuth();
  const signedIn = useSignedIn();
  const router = useRouter();
  const [posts, setPosts] = useState<CampfirePostContract[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState<CampfireKind | "all">("all");
  const [tavern, setTavern] = useState("all");
  const [sort, setSort] = useState<"hot" | "new">("hot");
  const [composing, setComposing] = useState(false);

  useEffect(() => {
    if (!ready) return;
    setPosts(null);
    publicApi
      .posts({ kind: kind === "all" ? undefined : kind, tavern: tavern === "all" ? undefined : tavern, sort }, session?.accessToken)
      .then(setPosts, (err: Error) => setError(err.message));
  }, [kind, tavern, sort, session, ready]);

  return (
    <div className="shell">
      <header className="page-head ink-head">
        <div>
          <span className="eyebrow">The Campfire</span>
          <h1>
            Gather round, <span className="gradient-text">storytellers</span>
          </h1>
          <p>Share wild ideas, argue the big questions of craft, and build stories together, one passage at a time.</p>
        </div>
        <Button variant="primary" size="lg" onClick={() => signedIn("Sign in to share at the Campfire.") && setComposing(true)}>
          <PlusIcon size={18} /> Add to the fire
        </Button>
      </header>

      <div className="campfire__filters">
        <div className="chips" role="group" aria-label="Kind">
          <button type="button" className="chip" aria-pressed={kind === "all"} onClick={() => setKind("all")}>
            Everything
          </button>
          {postKinds.map((k) => (
            <button key={k.value} type="button" className="chip" aria-pressed={kind === k.value} onClick={() => setKind(k.value)}>
              {k.plural}
            </button>
          ))}
        </div>
        <div className="row" style={{ gap: 8 }}>
          <select className="input campfire__select" value={tavern} onChange={(e) => setTavern(e.target.value)} aria-label="Tavern">
            <option value="all">All taverns</option>
            {taverns.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <div className="segmented" role="group" aria-label="Sort">
            <button type="button" aria-pressed={sort === "hot"} onClick={() => setSort("hot")}>
              Hot
            </button>
            <button type="button" aria-pressed={sort === "new"} onClick={() => setSort("new")}>
              New
            </button>
          </div>
        </div>
      </div>

      <div className="campfire__layout">
        <div className="stack" style={{ gap: 14 }}>
          {error ? (
            <EmptyState icon={<AlertIcon size={28} />} title="The fire went out" description={error} />
          ) : !posts ? (
            Array.from({ length: 3 }, (_, i) => <div key={i} className="skeleton" style={{ height: 150, borderRadius: 22 }} />)
          ) : !posts.length ? (
            <EmptyState
              icon={<SparkleIcon size={28} />}
              title="Nobody's here yet"
              description="Be the first to throw a Spark on the fire."
              actions={
                <Button variant="primary" onClick={() => signedIn("Sign in to share at the Campfire.") && setComposing(true)}>
                  Share an idea
                </Button>
              }
            />
          ) : (
            posts.map((post) => <PostCard key={post.id} post={post} onChange={(updated) => setPosts((all) => all?.map((p) => (p.id === updated.id ? updated : p)) ?? null)} />)
          )}
        </div>
        <aside className="campfire__side">
          <div className="glass glass--pad ink-panel">
            <h2 className="panel-title">Around the fire</h2>
            <ul className="campfire__guide">
              {postKinds.map((k) => (
                <li key={k.value}>
                  <strong style={{ color: k.color }}>{k.plural}</strong>
                  <span className="muted">{k.blurb}.</span>
                </li>
              ))}
            </ul>
            <p className="muted" style={{ fontSize: "0.82rem", marginTop: 12 }}>
              Be kind, be specific. Embers celebrate good ideas; adopting a Spark always credits its author.
            </p>
          </div>
          <ButtonLink href="/inkverse/library" variant="glass" block>
            Browse the Debut Shelf
          </ButtonLink>
        </aside>
      </div>

      {composing ? (
        <Composer
          open={composing}
          onClose={() => setComposing(false)}
          onCreated={(post) => {
            setComposing(false);
            router.push(`/campfire/${post.id}`);
          }}
        />
      ) : null}
    </div>
  );
}

function ReplyItem({ reply, onEmber, tale }: { reply: CampfireReplyContract; onEmber: () => void; tale: boolean }) {
  return (
    <li className={`campfire__reply${tale ? " campfire__reply--tale" : ""}`}>
      <div className="campfire__meta">
        <span className="muted">
          <AuthorLink author={reply.author} /> · {timeAgo(reply.createdAt)}
        </span>
      </div>
      <p className={tale ? "campfire__passage" : undefined}>{reply.body}</p>
      <Button variant={reply.mine.ember ? "primary" : "ghost"} size="sm" onClick={onEmber} aria-pressed={reply.mine.ember}>
        <FlameIcon size={13} filled={reply.mine.ember} /> {reply.embers}
      </Button>
    </li>
  );
}

/** One post and its conversation: replies, Duel arguments by side, or a Round Robin tale's passages. */
export function CampfireThread({ id }: { id: string }) {
  const { session, ready } = useAuth();
  const signedIn = useSignedIn();
  const router = useRouter();
  const toast = useToast();
  const [thread, setThread] = useState<CampfireThreadContract | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [side, setSide] = useState<"a" | "b">("a");
  const [sending, setSending] = useState(false);
  const [adopting, setAdopting] = useState(false);

  useEffect(() => {
    if (!ready) return;
    publicApi.thread(id, session?.accessToken).then(setThread, (err: Error) => setError(err.message));
  }, [id, session, ready]);

  if (error) {
    return (
      <div className="shell section">
        <EmptyState
          icon={<AlertIcon size={28} />}
          title="That post has gone out"
          description={error}
          actions={
            <ButtonLink href="/campfire" variant="primary">
              Back to the Campfire
            </ButtonLink>
          }
        />
      </div>
    );
  }
  if (!thread) {
    return (
      <div className="shell section" aria-busy="true">
        <div className="skeleton" style={{ height: 260, borderRadius: 26 }} />
      </div>
    );
  }

  const kind = kindOf(thread.kind);
  const tale = thread.kind === "tale";
  const duel = thread.kind === "duel";
  const lastAuthor = tale ? (thread.replies[thread.replies.length - 1]?.author.id ?? thread.author.id) : null;
  const myTurnBlocked = tale && session && lastAuthor === session.user.id;

  async function run(action: (token: string) => Promise<CampfireThreadContract>, reason: string) {
    const token = signedIn(reason);
    if (!token) return;
    try {
      setThread(await action(token));
    } catch (err) {
      toast({ title: "Couldn't do that", description: (err as Error).message, tone: "error" });
    }
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    await run((token) => publicApi.reply(token, id, reply.trim(), duel ? side : undefined), "Sign in to join the conversation.");
    setReply("");
    setSending(false);
  }

  async function adopt() {
    const token = signedIn("Sign in to adopt this idea into your own Saga.");
    if (!token) return;
    setAdopting(true);
    try {
      const created = await publicApi.adopt(token, id);
      toast({ title: "Adopted into a new Saga", description: "The original author is credited in your logline." });
      router.push(`/inkverse/sagas/${created.sagaId}/quill/${created.folioId}`);
    } catch (err) {
      toast({ title: "Couldn't adopt", description: (err as Error).message, tone: "error" });
      setAdopting(false);
    }
  }

  async function remove() {
    const token = signedIn("Sign in first.");
    if (!token) return;
    try {
      await publicApi.removePost(token, id);
      toast({ title: "Post removed" });
      router.push("/campfire");
    } catch (err) {
      toast({ title: "Couldn't remove", description: (err as Error).message, tone: "error" });
    }
  }

  const replies = (list: CampfireReplyContract[]) =>
    list.map((r) => <ReplyItem key={r.id} reply={r} tale={tale} onEmber={() => run((token) => publicApi.reactReply(token, r.id), "Sign in to add an Ember.")} />);

  return (
    <div className="shell">
      <Link href="/campfire" className="back-link">
        <ArrowLeftIcon size={16} /> The Campfire
      </Link>
      <article className="campfire__thread glass glass--pad">
        <div className="campfire__meta">
          <span className="badge" style={{ color: kind.color }}>
            {kind.label}
          </span>
          <span className="muted">
            <AuthorLink author={thread.author} /> · {taverns.find((t) => t.value === thread.tavern)?.label} · {timeAgo(thread.createdAt)}
          </span>
        </div>
        <h1 className="campfire__thread-title">{thread.title}</h1>
        {thread.body ? <p className={tale ? "campfire__passage" : "campfire__thread-body"}>{thread.body}</p> : null}
        {duel ? <DuelBar post={thread} onVote={(s) => run((token) => publicApi.react(token, id, s === "a" ? "vote_a" : "vote_b"), "Sign in to vote.")} /> : null}
        <div className="campfire__actions">
          <Button
            variant={thread.mine.ember ? "primary" : "glass"}
            size="sm"
            onClick={() => run((token) => publicApi.react(token, id, "ember"), "Sign in to add an Ember.")}
            aria-pressed={thread.mine.ember}
          >
            <FlameIcon size={14} filled={thread.mine.ember} /> {thread.embers} {thread.embers === 1 ? "Ember" : "Embers"}
          </Button>
          {!duel ? (
            <Button variant="primary" size="sm" onClick={adopt} loading={adopting}>
              <QuillIcon size={14} /> Adopt into a Saga
            </Button>
          ) : null}
          {thread.adoptedCount ? <span className="muted campfire__adopted">Adopted {thread.adoptedCount}×</span> : null}
          {thread.mine.isAuthor ? (
            <Button variant="ghost" size="sm" onClick={remove}>
              <TrashIcon size={14} /> Remove
            </Button>
          ) : null}
        </div>
      </article>

      {duel ? (
        <div className="duel__columns">
          {(["a", "b"] as const).map((s) => (
            <section key={s}>
              <h2 className="panel-title">{s === "a" ? thread.sideA : thread.sideB}</h2>
              <ul className="campfire__replies">{replies(thread.replies.filter((r) => r.side === s))}</ul>
              {!thread.replies.some((r) => r.side === s) ? <p className="muted">No arguments for this side yet.</p> : null}
            </section>
          ))}
        </div>
      ) : (
        <section style={{ marginTop: 24 }}>
          <h2 className="panel-title">{tale ? "The tale continues" : "Replies"}</h2>
          <ul className="campfire__replies">{replies(thread.replies)}</ul>
          {!thread.replies.length ? <p className="muted">{tale ? "Nobody has added the next passage yet. Will it be you?" : "No replies yet."}</p> : null}
        </section>
      )}

      <form className="campfire__composer glass glass--pad" onSubmit={send}>
        {duel ? (
          <div className="segmented" role="group" aria-label="Your side">
            <button type="button" aria-pressed={side === "a"} onClick={() => setSide("a")}>
              {thread.sideA}
            </button>
            <button type="button" aria-pressed={side === "b"} onClick={() => setSide("b")}>
              {thread.sideB}
            </button>
          </div>
        ) : null}
        <textarea
          className="input"
          rows={tale ? 5 : 3}
          maxLength={tale ? 2500 : 2000}
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder={myTurnBlocked ? "You wrote the last passage. Wait for someone else to continue." : tale ? "Write the next passage…" : duel ? "Make your argument…" : "Join the conversation…"}
          disabled={Boolean(myTurnBlocked)}
          aria-label="Your reply"
        />
        <div className="row" style={{ justifyContent: "flex-end" }}>
          <Button type="submit" variant="primary" loading={sending} disabled={Boolean(myTurnBlocked) || !reply.trim()}>
            {tale ? "Add passage" : duel ? "Argue" : "Reply"}
          </Button>
        </div>
      </form>
    </div>
  );
}
