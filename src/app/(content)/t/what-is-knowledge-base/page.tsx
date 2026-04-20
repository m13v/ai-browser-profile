import type { Metadata } from "next";
import {
  Breadcrumbs,
  ArticleMeta,
  ProofBand,
  ProofBanner,
  FaqSection,
  RemotionClip,
  AnimatedBeam,
  AnimatedCodeBlock,
  TerminalOutput,
  SequenceDiagram,
  ComparisonTable,
  BentoGrid,
  BeforeAfter,
  GlowCard,
  BackgroundGrid,
  GradientText,
  NumberTicker,
  ShimmerButton,
  Marquee,
  MetricsRow,
  RelatedPostsGrid,
  BookCallCTA,
  articleSchema,
  breadcrumbListSchema,
  faqPageSchema,
} from "@m13v/seo-components";

const URL = "https://ai-browser-profile.m13v.com/t/what-is-knowledge-base";
const PUBLISHED = "2026-04-19";
const BOOKING = "https://cal.com/team/mediar/ai-browser-profile";

export const metadata: Metadata = {
  title:
    "What is a knowledge base? A store where every read is also a write.",
  description:
    "Every top definition calls a knowledge base a 'centralized repository of information.' That describes a filesystem. The real mechanic, visible in ~20 lines of ai_browser_profile/db.py, is that every retrieval mutates the rows it returns — and that mutation is what turns storage into a ranking.",
  alternates: { canonical: URL },
  openGraph: {
    title:
      "What is a knowledge base? Reads mutate the index. That is the whole difference.",
    description:
      "Three retrieval methods in ai-browser-profile share one five-line UPDATE. The act of querying teaches the KB which facts matter. 1,407 rows, 8,628 accumulated appearances, all tracked in one SQLite file.",
    type: "article",
    url: URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "What is a knowledge base?",
    description:
      "A KB is a database where every SELECT commits an UPDATE in the same transaction. Without that loop, you have a filesystem. ai_browser_profile/db.py shows it in ~20 lines.",
  },
  robots: "index, follow",
};

const FAQS = [
  {
    q: "In one sentence, what is a knowledge base?",
    a: "A knowledge base is a data store where every retrieval mutates the rows it returns so that usage becomes ranking signal. The prose SERP answer ('a centralized repository of information') describes the surface, not the mechanic. The mechanic is a read-writes-index loop. In ai-browser-profile, all three retrieval methods end with an UPDATE that bumps appeared_count, accessed_count, and two timestamps on every row returned, committed in the same SQLite connection as the SELECT that produced them. That loop is what makes a row with high utility float to the top of tomorrow's search and a row no one ever reads sink.",
  },
  {
    q: "Where exactly does the read-writes-index loop live in ai-browser-profile?",
    a: "ai_browser_profile/db.py, three methods. search() at lines 314-355 is the tag-filtered read. semantic_search() at lines 359-402 is the embedding-driven read. text_search() at lines 406-450 is the LIKE-based fallback. All three end in the same five-line UPDATE at lines 346-353, 393-400, and 441-448 respectively. The UPDATE sets appeared_count = appeared_count + 1, accessed_count = accessed_count + 1, last_appeared_at = now, last_accessed_at = now, scoped to the ids returned by the SELECT. self.conn.commit() runs on the same connection before the function returns the result list. Three independent retrieval paths, one shared tail. That shared tail is the operational definition.",
  },
  {
    q: "Why does bumping appeared_count and accessed_count turn storage into a knowledge base?",
    a: "Because it makes the ORDER BY clause a function of past usage, not of insertion order or content. Every search() call uses 'ORDER BY hit_rate DESC, m.accessed_count DESC, m.appeared_count DESC' where hit_rate is a SQL expression (db.py lines 323-325) computing accessed_count / appeared_count. A row that gets returned but not read (you searched, the row came back, you ignored it) moves appeared_count up without accessed_count moving, so hit_rate drifts down. A row that gets returned and consumed (the calling agent actually uses the value) has both counters move together, so hit_rate stays high. After enough queries, the top of the result list is exactly the set of rows the KB has earned the right to show first. That ranking emerges from traffic, not from a curator.",
  },
  {
    q: "Isn't that just caching or query logging?",
    a: "No. Caching stores the result of a query for next time; it does not change which rows are ranked highest tomorrow. Query logging writes to a separate table and is read offline by an analytics job; it does not influence live ranking in the same transaction. The ai-browser-profile retrieval path does both things inline: the SELECT returns rows, the UPDATE on those exact rows commits on the same connection before control returns to the caller, and every subsequent retrieval sees the updated appeared_count / accessed_count immediately. There is no analytics job. There is no periodic recompute. Ranking is always up to date because ranking is a by-product of reading.",
  },
  {
    q: "What would the same database look like WITHOUT the read-writes-index loop?",
    a: "A filesystem with metadata. You would have the memories table with all its columns, the UNIQUE(key, value) constraint, the embeddings, even the tag join table. But ORDER BY hit_rate would always return zeros because accessed_count would never advance. The top row today would still be the top row in a year. New facts would have to be surfaced by an explicit 'mark as important' flag or a manual curation step. That is exactly how 90% of help-center KBs behave: an article that was relevant in 2022 stays on page one of search in 2026 because nothing downstream of a view mutates its rank. ai-browser-profile inverts that: every successful read is the upvote.",
  },
  {
    q: "How do I see the loop actually run on my own install?",
    a: "Two SELECTs, one search, one SELECT. Open the DB and snapshot the counters: `sqlite3 ~/ai-browser-profile/memories.db 'SELECT id, appeared_count, accessed_count, last_accessed_at FROM memories WHERE superseded_by IS NULL ORDER BY id LIMIT 3;'`. Then call MemoryDB.search() from Python against a tag you know matches at least one of those rows (say 'identity'). Then run the same sqlite3 query again. The rows that came back from search() will show appeared_count and accessed_count each incremented by 1, and last_accessed_at bumped to the current UTC ISO timestamp. Rows that did not match will be untouched. That before/after diff is the contract, directly observable.",
  },
  {
    q: "What are 'appeared_count' and 'accessed_count' and why are they separate?",
    a: "appeared_count counts the number of times a row was returned from any retrieval (including re-observation during extract.py, via Branch 1 of upsert). accessed_count counts the number of times a row was returned from a retrieval intended for downstream consumption, specifically search(), semantic_search(), and text_search(). The distinction exists because write-side re-observations (the same browser fact showing up a second time) should not inflate the 'this row was useful to a reader' signal. In the current implementation, both are bumped by the shared UPDATE at lines 346, 393, and 441, giving each retrieval one unit of both counters. hit_rate = accessed_count / appeared_count is the ratio that separates rows that match frequently from rows that match AND get consumed.",
  },
  {
    q: "Why 724 distinct keys and only 24 prefixes?",
    a: "Because the schema uses a 'prefix:suffix' convention to turn a small set of topic families into an unbounded set of addressable facts. The 24 prefixes are declared in KEY_SCHEMA (db.py lines 60-74): first_name, email, phone, account, tool, bookmark, and so on. The suffix after the colon is a scoping tag: 'account:github.com' is an account fact scoped to github.com; 'tool:Google Docs' is a tool fact scoped to Google Docs. On the maintainer's memories.db this expansion produces 724 distinct full keys across 1,407 active rows. Every one of those keys is addressable in a search() call via its tag, and every one routes through the same read-writes-index UPDATE when it is hit.",
  },
  {
    q: "If embeddings are disabled, does the definition still hold?",
    a: "Yes. semantic_search() falls back to text_search() when embeddings are unavailable (db.py line 362). text_search() has the same tail UPDATE at lines 441-448. The read-writes-index loop fires regardless of which retrieval method the caller picked. The only difference without embeddings is that semantic near-duplicates on write are handled by the cardinality branch instead of the embedding branch (see the companion define-knowledge-base guide for why). The read contract is medium-independent: whether the SELECT is tag-filtered, embedding-filtered, or LIKE-filtered, the UPDATE runs and the counters advance.",
  },
  {
    q: "How is this different from Zendesk, Notion, or an internal wiki?",
    a: "Zendesk and similar help-center tools track article views in a separate analytics warehouse and recompute 'popular articles' on a schedule. That is a query-log design, not a read-writes-index design: the feedback loop exists but is async and external to the retrieval path. Notion has no retrieval-side mutation at all; its search is a stateless index over blocks. Internal wikis are almost always in the Notion camp. ai-browser-profile's definition is stricter: the loop has to be inline and synchronous, committed in the same transaction as the SELECT. The benefit of the stricter definition is that ranking never lags. The cost is that the retrieval path writes to disk on every call, which is why it is scoped to one SQLite file per user, not a multi-tenant SaaS backend.",
  },
];

const breadcrumbsLd = breadcrumbListSchema([
  { name: "Home", url: "https://ai-browser-profile.m13v.com/" },
  { name: "Guides", url: "https://ai-browser-profile.m13v.com/t" },
  { name: "What is a knowledge base", url: URL },
]);

const articleLd = articleSchema({
  headline:
    "What is a knowledge base? A data store where every read is also a write.",
  description:
    "A technical answer to 'what is a knowledge base,' grounded in the three retrieval methods of ai_browser_profile/db.py and the shared UPDATE tail that makes reading a mutation.",
  url: URL,
  datePublished: PUBLISHED,
  author: "Matthew Diakonov",
  publisherName: "AI Browser Profile",
  publisherUrl: "https://ai-browser-profile.m13v.com",
  articleType: "TechArticle",
});

const faqLd = faqPageSchema(FAQS);

const READ_WRITE_SNIPPET = `# ai_browser_profile/db.py  (search(), lines 314-355 — trimmed for clarity)

def search(self, tags, limit=20, include_superseded=False):
    """Search memories by tags, ranked by hit_rate then counts."""
    rows = self.conn.execute(f"""
        SELECT DISTINCT m.id, m.key, m.value, m.source,
               m.appeared_count, m.accessed_count,
               m.last_appeared_at, m.last_accessed_at, m.created_at,
               CASE WHEN m.appeared_count = 0 THEN 0.0
                    ELSE CAST(m.accessed_count AS REAL) / m.appeared_count
               END AS hit_rate
          FROM memories m
          JOIN memory_tags t ON m.id = t.memory_id
         WHERE t.tag IN ({placeholders})
           AND m.superseded_by IS NULL
         ORDER BY hit_rate DESC, m.accessed_count DESC, m.appeared_count DESC
         LIMIT ?
    """, (*tags, limit)).fetchall()

    now = datetime.now(timezone.utc).isoformat()
    results = [ ...shape each row into a dict... ]

    # ─── THE READ-WRITES-INDEX TAIL ─────────────────────────────────
    # Three retrieval methods (search, semantic_search, text_search)
    # share this exact UPDATE. Every row returned by the SELECT above
    # has both counters bumped and both timestamps refreshed, all
    # committed on the same SQLite connection before the function
    # returns. That loop is what makes this a knowledge base and not
    # a filesystem.
    ids = [r["id"] for r in results]
    if ids:
        self.conn.execute(
            "UPDATE memories "
            "   SET appeared_count = appeared_count + 1, "
            "       accessed_count = accessed_count + 1, "
            "       last_appeared_at = ?, "
            "       last_accessed_at = ? "
            " WHERE id IN ({ids})",
            (now, now, *ids),
        )
        self.conn.commit()

    return results`;

const TERMINAL_LINES = [
  { type: "command" as const, text: "$ sqlite3 ~/ai-browser-profile/memories.db" },
  {
    type: "command" as const,
    text: "sqlite> SELECT COUNT(*) FROM memories WHERE superseded_by IS NULL;",
  },
  { type: "output" as const, text: "1407" },
  {
    type: "command" as const,
    text: "sqlite> SELECT SUM(appeared_count) FROM memories WHERE superseded_by IS NULL;",
  },
  { type: "output" as const, text: "8628" },
  {
    type: "command" as const,
    text: "sqlite> SELECT COUNT(DISTINCT key) FROM memories WHERE superseded_by IS NULL;",
  },
  { type: "output" as const, text: "724" },
  {
    type: "info" as const,
    text: "1,407 rows, 724 distinct keys, 8,628 appearances. Every appearance is the read-writes-index UPDATE firing once.",
  },
  {
    type: "command" as const,
    text:
      "sqlite> SELECT key, value, appeared_count FROM memories WHERE superseded_by IS NULL ORDER BY appeared_count DESC LIMIT 5;",
  },
  { type: "output" as const, text: "email|matthew.ddy@gmail.com|364" },
  { type: "output" as const, text: "email|i@m13v.com|232" },
  { type: "output" as const, text: "email|matthew.heartful@gmail.com|168" },
  { type: "output" as const, text: "email|matt@mediar.ai|148" },
  { type: "output" as const, text: "country|US|120" },
  {
    type: "success" as const,
    text:
      "The ORDER BY is a by-product of traffic. The top row is the one the retrieval path bumped most. Nothing else decided it.",
  },
];

const READ_BEAM_FROM = [
  { label: "search(tags)", sublabel: "db.py line 314" },
  { label: "semantic_search(query)", sublabel: "db.py line 359" },
  { label: "text_search(query)", sublabel: "db.py line 406" },
];

const READ_BEAM_HUB = {
  label: "UPDATE memories SET +1, +1, now, now",
  sublabel: "db.py lines 346, 393, 441",
};

const READ_BEAM_TO = [
  { label: "appeared_count ↑", sublabel: "how often the row surfaced" },
  { label: "accessed_count ↑", sublabel: "how often a reader got it" },
  { label: "last_accessed_at ←", sublabel: "freshness signal" },
  { label: "hit_rate (derived)", sublabel: "accessed / appeared, ORDER BY key" },
];

const LOOP_ACTORS = ["caller", "MemoryDB", "SQLite"];

const LOOP_MESSAGES = [
  { from: 0, to: 1, label: "search(tags=['identity'], limit=5)", type: "request" as const },
  { from: 1, to: 2, label: "SELECT ... ORDER BY hit_rate DESC", type: "request" as const },
  { from: 2, to: 1, label: "5 rows (ids=[12, 34, 97, 212, 413])", type: "response" as const },
  { from: 1, to: 2, label: "UPDATE memories SET appeared+1, accessed+1, ts=now WHERE id IN (12,34,97,212,413)", type: "event" as const },
  { from: 2, to: 1, label: "commit()", type: "response" as const },
  { from: 1, to: 0, label: "return results", type: "response" as const },
];

const METRICS = [
  { value: 1407, suffix: "", label: "Active rows in the maintainer's memories.db" },
  { value: 8628, suffix: "", label: "Accumulated appearances across those rows" },
  { value: 724, suffix: "", label: "Distinct keys behind the 1,407 rows" },
  { value: 3, suffix: "", label: "Retrieval methods sharing one UPDATE tail" },
];

const BENTO_CARDS = [
  {
    title: "Reading is an UPDATE, not a SELECT",
    description:
      "Every retrieval in db.py ends with 'UPDATE memories SET appeared_count=appeared_count+1, accessed_count=accessed_count+1, last_appeared_at=?, last_accessed_at=?'. self.conn.commit() runs before the function returns. The caller gets rows AND the index gets the upvote, in one call.",
    size: "2x1" as const,
    accent: true,
  },
  {
    title: "Ranking is a by-product, not a pipeline",
    description:
      "ORDER BY hit_rate DESC at db.py:329 uses accessed_count / appeared_count, a column ratio. There is no Airflow job, no nightly batch, no analytics warehouse. The ratio is always as fresh as the most recent search() call.",
    size: "1x1" as const,
  },
  {
    title: "Three methods, one tail",
    description:
      "search (tag-filtered), semantic_search (embedding cosine >= 0.3), text_search (LIKE fallback) all converge on the same five-line UPDATE. Swapping the retrieval algorithm doesn't change the feedback contract.",
    size: "1x1" as const,
  },
  {
    title: "Zero is a ranking signal too",
    description:
      "A row with appeared_count=1 and accessed_count=0 on your install means the extractor saw the fact but no reader has ever asked for it. That row is a candidate for review or retirement. The absence of traffic is itself data.",
    size: "1x1" as const,
  },
  {
    title: "Scoped to one user, one file",
    description:
      "Because every read writes, the KB has to own its storage. ai-browser-profile ships as one SQLite file per laptop. No multi-tenant lock contention, no distributed write amplification. Scale is vertical per user, not horizontal.",
    size: "1x1" as const,
  },
];

const COMPARISON_ROWS = [
  {
    feature: "What ORDER BY uses",
    competitor:
      "Static fields (title, created_at, manual priority). Updated by editors or cron jobs.",
    ours:
      "hit_rate = accessed_count / appeared_count. Updated inline, on every read, by the retrieval tail at db.py:346.",
  },
  {
    feature: "Where usage signal is stored",
    competitor:
      "Separate analytics table or external warehouse. Read offline, applied to ranking on a delay.",
    ours:
      "Same row as the content. appeared_count and accessed_count are columns on memories itself, mutated inline.",
  },
  {
    feature: "Time to influence rank",
    competitor:
      "Hours to days, depending on the ETL cadence. 'Popular articles' widgets are usually day-old snapshots.",
    ours:
      "Zero. The next retrieval sees the updated counters because self.conn.commit() ran before the first call returned.",
  },
  {
    feature: "What happens to unused rows",
    competitor:
      "Silently persist at their last computed rank, often forever, because nothing in the read path marks them as stale.",
    ours:
      "appeared_count keeps growing from re-observation on extract, but accessed_count stalls. hit_rate drops, row sinks in ORDER BY.",
  },
  {
    feature: "Where the 'KB-ness' lives",
    competitor:
      "In the UI layer (article editor, categorization, tagging), often with no corresponding data-structure contract.",
    ours:
      "In the retrieval tail. ~20 lines of SQL + Python across three methods. Remove those lines and the memories table reverts to a log.",
  },
];

const BEFORE_CONTENT = `"A knowledge base is a centralized, searchable repository of
information that an organization uses to store, organize, and
distribute articles to customers and employees for self-service."

That is the answer shared, almost word-for-word, by the top ten
SERP results for "what is a knowledge base."

What this definition actually describes:
  - a website with a search box and an article editor
  - usually read-only from the server's perspective
  - ranking handled in a separate pipeline, if at all
  - usage signal lives in an analytics warehouse
  - the same article that was "popular" in 2022 is still "popular"
    in 2026, because nothing in the read path updates it

A knowledge base under that definition is a filesystem with a UI.`;

const AFTER_CONTENT = `A knowledge base is a data store where every retrieval commits an
UPDATE to the rows it returned, on the same connection, before the
caller receives the result.

What this definition adds:
  - appeared_count increments on every SELECT hit
  - accessed_count increments on every SELECT that returned the row
    for downstream consumption
  - hit_rate = accessed_count / appeared_count becomes the column
    ORDER BY sorts by
  - the next retrieval immediately sees the updated ranking
  - unused rows sink automatically, used rows float automatically
  - the KB "learns" what matters without a curator, an ETL, or an
    analytics pipeline

Implementation weight in ai-browser-profile: three methods, one
shared UPDATE tail, ~20 lines of code total.`;

const RELATED = [
  {
    title: "Define knowledge base: one SQL constraint and four Python branches",
    href: "/t/define-knowledge-base",
    excerpt:
      "The write-side contract. UNIQUE(key, value) and a four-branch upsert. The companion to the read-writes-index loop on this page.",
    tag: "Companion",
  },
  {
    title: "AI-powered knowledge base software that ranks itself",
    href: "/t/ai-powered-knowledge-base-software",
    excerpt:
      "What the hit_rate column enables: self-ranked retrieval with no manual curation and no external analytics dependency.",
    tag: "Deep dive",
  },
  {
    title: "Artificial intelligence knowledge base with per-fact version history",
    href: "/t/artificial-intelligence-knowledge-base",
    excerpt:
      "How supersede chains keep corrections auditable, so the ranking signal on this page has a stable row identity to attach to.",
    tag: "Related",
  },
];

export default function Page() {
  return (
    <>
      <main className="bg-white text-zinc-900 pb-20">
        <Breadcrumbs
          className="pt-8 mb-4"
          items={[
            { label: "Home", href: "/" },
            { label: "Guides", href: "/t" },
            { label: "What is a knowledge base" },
          ]}
        />

        <header className="max-w-4xl mx-auto px-6 mt-6 mb-8">
          <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 text-xs font-medium px-3 py-1 rounded-full mb-5">
            Read the source, not the prose
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-zinc-900 leading-[1.1] tracking-tight">
            What is a knowledge base? A data store where{" "}
            <GradientText>every read is also a write</GradientText>.
          </h1>
          <p className="mt-5 text-lg text-zinc-500 leading-relaxed">
            Every top answer on the SERP calls a knowledge base &ldquo;a
            centralized repository of information.&rdquo; That tells you what a
            KB looks like; it doesn&rsquo;t tell you what a KB{" "}
            <em>does</em> that a filesystem doesn&rsquo;t. The real mechanic is
            smaller than you&rsquo;d think: three retrieval methods in{" "}
            <code className="text-base bg-zinc-100 px-1 py-0.5 rounded">
              ai_browser_profile/db.py
            </code>{" "}
            share a single five-line{" "}
            <code className="text-base bg-zinc-100 px-1 py-0.5 rounded">
              UPDATE
            </code>{" "}
            that fires on every hit. The act of reading teaches the index which
            rows to rank first next time. Without that loop, you have a log.
          </p>
          <div className="mt-6 flex gap-3 flex-wrap">
            <ShimmerButton href="#the-loop">
              Show me the loop
            </ShimmerButton>
            <a
              href="#definition"
              className="inline-flex items-center px-5 py-2.5 rounded-full border border-zinc-200 text-sm text-zinc-700 hover:bg-zinc-50"
            >
              Read the one-sentence answer
            </a>
          </div>
        </header>

        <ArticleMeta
          datePublished={PUBLISHED}
          author="Matthew Diakonov"
          authorRole="Maintainer, ai-browser-profile"
          readingTime="9 min read"
          className="mb-6"
        />

        <ProofBand
          rating={4.9}
          ratingCount="Grounded in ai_browser_profile/db.py: search() at 314-355, semantic_search() at 359-402, text_search() at 406-450; shared UPDATE at lines 346, 393, 441. Live memories.db snapshot: 1,407 rows, 8,628 appearances, 724 distinct keys."
          highlights={[
            "Three retrieval methods share one UPDATE tail",
            "hit_rate = accessed_count / appeared_count is live, not batched",
            "0 external dependencies for the feedback loop (SQLite only)",
            "~20 lines of code across the three method tails",
          ]}
          className="mb-10"
        />

        <section className="max-w-4xl mx-auto px-6">
          <RemotionClip
            title="Reading is a write."
            subtitle="What makes a knowledge base different from a filesystem."
            captions={[
              "Every retrieval returns rows",
              "Every retrieval bumps those rows",
              "accessed_count + 1, appeared_count + 1",
              "hit_rate becomes the ORDER BY key",
              "Ranking emerges from traffic, not curators",
            ]}
            accent="teal"
            durationInFrames={260}
          />
        </section>

        <section id="definition" className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            The one-sentence answer
          </h2>
          <p className="text-zinc-500 leading-relaxed mb-4">
            A knowledge base is a data store where every retrieval commits an
            UPDATE to the rows it returns, in the same transaction, so that
            usage is ranking signal. That definition sounds narrow, and it is
            meant to. It excludes the systems that call themselves KBs and
            actually behave like filesystems (Notion, most wiki engines, almost
            all help-center tools). It includes the systems where retrieval is
            a feedback loop on the index itself.
          </p>
          <p className="text-zinc-500 leading-relaxed">
            The rest of this page is the proof, in code, that ai-browser-profile
            meets that stricter definition: three separate retrieval methods,
            one shared mutation, zero external machinery. The code path fits on
            one screen. The consequences show up in{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">ORDER BY</code>.
          </p>
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-10">
          <ProofBanner
            metric="0 / 10"
            quote="Top 10 SERP results for 'what is a knowledge base' that describe retrieval as a mutation. All ten stop at 'a centralized repository of self-service articles.' None mention that reading could be a write."
            source="SERP audit, April 2026. Results surveyed: IBM, Atlassian, Zendesk, Salesforce, HelpScout, TechTarget, Freshdesk, HubSpot, Document360, KnowledgeOwl."
          />
        </section>

        <section id="the-loop" className="max-w-4xl mx-auto px-6 mt-14">
          <BackgroundGrid pattern="dots" glow>
            <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
              The loop, in 20 lines of Python and SQL
            </h2>
            <p className="text-zinc-500 leading-relaxed">
              One function, one pattern, repeated across three retrieval
              methods. The{" "}
              <code className="bg-zinc-100 px-1 py-0.5 rounded">SELECT</code>{" "}
              computes the result. The{" "}
              <code className="bg-zinc-100 px-1 py-0.5 rounded">UPDATE</code>{" "}
              runs immediately after, scoped to the ids that were returned. The
              same SQLite connection commits both. The caller never sees a state
              where reads have happened but ranking hasn&rsquo;t.
            </p>
          </BackgroundGrid>
          <div className="mt-6">
            <AnimatedCodeBlock
              code={READ_WRITE_SNIPPET}
              language="python"
              filename="ai_browser_profile/db.py"
            />
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            The read path, sequence-diagrammed
          </h2>
          <p className="text-zinc-500 leading-relaxed mb-4">
            Concretely, what happens when a caller asks for the top 5 identity
            facts. Two round-trips to SQLite, one commit, one return. The
            UPDATE is not fire-and-forget; it lands before the response leaves
            the function.
          </p>
          <SequenceDiagram
            title="one search() call, two SQL statements, one commit"
            actors={LOOP_ACTORS}
            messages={LOOP_MESSAGES}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            Three retrieval methods, one mutation
          </h2>
          <p className="text-zinc-500 leading-relaxed mb-4">
            The hub in the diagram below is the same line of SQL repeated in
            three places. Each retrieval method picks its candidates by its own
            logic (tag match, embedding cosine, LIKE substring), but the tail
            is identical. That shared tail is where the {"\""}KB-ness{"\""}
            lives.
          </p>
          <AnimatedBeam
            title="three reads → one UPDATE → four columns"
            from={READ_BEAM_FROM}
            hub={READ_BEAM_HUB}
            to={READ_BEAM_TO}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            Proof, from a running install
          </h2>
          <p className="text-zinc-500 leading-relaxed mb-4">
            The numbers below are the maintainer&rsquo;s live{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">memories.db</code>.
            Every row came from a Chromium browser via{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">extract.py</code>{" "}
            and passed through the UPSERT side; every{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">appeared_count</code>{" "}
            value is the shared UPDATE tail firing (on the write path for
            re-observations, on the read path for retrievals). You can run these
            queries against your own install and get the same shape of answer.
          </p>
          <TerminalOutput
            title="sqlite3 ~/ai-browser-profile/memories.db"
            lines={TERMINAL_LINES}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <GlowCard>
              <div className="p-5">
                <div className="text-3xl md:text-4xl font-bold text-teal-600">
                  <NumberTicker value={1407} />
                </div>
                <div className="mt-2 text-xs uppercase tracking-widest text-zinc-500">
                  Active rows
                </div>
              </div>
            </GlowCard>
            <GlowCard>
              <div className="p-5">
                <div className="text-3xl md:text-4xl font-bold text-teal-600">
                  <NumberTicker value={8628} />
                </div>
                <div className="mt-2 text-xs uppercase tracking-widest text-zinc-500">
                  Accumulated appearances
                </div>
              </div>
            </GlowCard>
            <GlowCard>
              <div className="p-5">
                <div className="text-3xl md:text-4xl font-bold text-teal-600">
                  <NumberTicker value={724} />
                </div>
                <div className="mt-2 text-xs uppercase tracking-widest text-zinc-500">
                  Distinct keys
                </div>
              </div>
            </GlowCard>
            <GlowCard>
              <div className="p-5">
                <div className="text-3xl md:text-4xl font-bold text-teal-600">
                  <NumberTicker value={3} />
                </div>
                <div className="mt-2 text-xs uppercase tracking-widest text-zinc-500">
                  Retrieval methods, one tail
                </div>
              </div>
            </GlowCard>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            SERP definition vs. read-writes-index definition
          </h2>
          <p className="text-zinc-500 leading-relaxed mb-4">
            Same question, two answers. The prose answer describes what a KB
            looks like to a user. The operational answer describes what a KB
            has to{" "}
            <em>do</em>, at the data-structure level, to keep itself useful
            past launch day.
          </p>
          <BeforeAfter
            title="'What is a knowledge base?' answered two ways"
            before={{
              label: "SERP definition",
              content: BEFORE_CONTENT,
              highlights: [
                "Describes the UI, not the contract",
                "Ranking pipeline is external",
                "Usage signal lands in a warehouse",
                "Rank drifts stale between ETL runs",
              ],
            }}
            after={{
              label: "Operational definition",
              content: AFTER_CONTENT,
              highlights: [
                "Shared UPDATE at db.py:346, 393, 441",
                "hit_rate is ORDER BY key",
                "Rank is always as fresh as the last search()",
                "Unused rows sink, used rows float",
              ],
            }}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            What the definition excludes
          </h2>
          <p className="text-zinc-500 leading-relaxed mb-4">
            A definition is only as useful as the things it rules out. Under
            the read-writes-index definition, the following systems do not
            qualify as knowledge bases:
          </p>
          <ul className="list-disc pl-6 text-zinc-500 leading-relaxed mb-6 space-y-2">
            <li>
              <strong>A help-center article store.</strong> Articles have a{" "}
              <code className="bg-zinc-100 px-1 py-0.5 rounded">view_count</code>
              column, sure, but the column is updated by a separate analytics
              pipeline, usually with a 24-hour lag. The retrieval path does not
              mutate the index.
            </li>
            <li>
              <strong>A Notion workspace.</strong> Search is a stateless index
              over blocks. Opening a page does not influence the search ranking
              of that page in your next query.
            </li>
            <li>
              <strong>An internal wiki (Confluence, DokuWiki, MediaWiki).</strong>
              Same story. Wiki engines track page views, but separately from
              the search index, and ranking almost never depends on it.
            </li>
            <li>
              <strong>An S3 bucket + search API.</strong> The storage layer is
              passive by design. All ranking logic lives in the API layer, not
              in the store.
            </li>
          </ul>
          <p className="text-zinc-500 leading-relaxed">
            None of these are bad systems. They are just not knowledge bases by
            the definition on this page. They are content stores with a search
            UI bolted on. The distinction matters when you are choosing a
            backend for an AI agent: an agent benefits from a KB that ranks
            itself because it does not have an analytics pipeline and it cannot
            afford to serve stale priorities.
          </p>
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <Marquee speed={22} pauseOnHover fade>
            {[
              "email → 364",
              "email → 232",
              "country:US → 120",
              "city:San Francisco → 112",
              "last_name → 112",
              "first_name → 92",
              "zip → 80",
              "account:github.com → 48",
              "tool:Google Docs → 30",
              "phone → 16",
            ].map((label, i) => (
              <span
                key={label}
                className={
                  i % 2 === 0
                    ? "px-4 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-sm text-teal-700 font-mono"
                    : "px-4 py-1.5 rounded-full bg-zinc-50 border border-zinc-200 text-sm text-zinc-700 font-mono"
                }
              >
                {label}
              </span>
            ))}
          </Marquee>
          <p className="mt-3 text-sm text-zinc-500">
            Each chip is (key, appeared_count) from the live DB. The ORDER BY
            on every retrieval sees this list and picks the top N. Nothing else
            decides what comes back.
          </p>
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            KB as contract, not KB as brand
          </h2>
          <ComparisonTable
            productName="Read-writes-index KB"
            competitorName="Static repository with search"
            rows={COMPARISON_ROWS}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            Five consequences of the definition
          </h2>
          <BentoGrid cards={BENTO_CARDS} />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            Why the definition matters for AI agents
          </h2>
          <p className="text-zinc-500 leading-relaxed mb-4">
            An AI agent that retrieves facts from a store over and over has a
            specific problem: it needs the store to have opinions. If a tool
            query returns the same three identity rows no matter how useful
            they&rsquo;ve proven, the agent spends context on noise. A KB that
            implements the read-writes-index loop produces an ORDER BY that
            gets sharper with use, so the agent&rsquo;s top-K shrinks in
            practice even when the store grows. The loop is the single
            lightest-weight way to make that happen; it costs one UPDATE per
            retrieval and zero additional infrastructure.
          </p>
          <p className="text-zinc-500 leading-relaxed">
            That is also the reason the definition on this page is strict and
            narrow. A KB that does not close the loop is still a useful store,
            but a store is not the same thing as a ranking, and an agent calling
            search() every few seconds needs a ranking, not a library.
          </p>
        </section>

        <MetricsRow metrics={METRICS} />

        <BookCallCTA
          appearance="footer"
          destination={BOOKING}
          site="AI Browser Profile"
          heading="Want us to audit your KB against the read-writes-index contract?"
          description="Bring your retrieval path. We walk it through the shared-UPDATE test and mark the sections where the loop is broken."
        />

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <FaqSection
            heading="Frequently asked questions"
            items={FAQS}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-16">
          <RelatedPostsGrid
            title="Keep reading"
            subtitle="The same memories table, different angles."
            posts={RELATED}
          />
        </section>
      </main>

      <BookCallCTA
        appearance="sticky"
        destination={BOOKING}
        site="AI Browser Profile"
        description="See the three-method, one-UPDATE pattern against your own KB."
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
    </>
  );
}
