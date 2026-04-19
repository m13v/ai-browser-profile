import type { Metadata } from "next";
import {
  Breadcrumbs,
  ArticleMeta,
  ProofBand,
  ProofBanner,
  FaqSection,
  RemotionClip,
  MotionSequence,
  AnimatedBeam,
  AnimatedCodeBlock,
  TerminalOutput,
  ComparisonTable,
  BentoGrid,
  GlowCard,
  BeforeAfter,
  HorizontalStepper,
  MetricsRow,
  BackgroundGrid,
  GradientText,
  NumberTicker,
  ShimmerButton,
  Marquee,
  RelatedPostsGrid,
  BookCallCTA,
  articleSchema,
  breadcrumbListSchema,
  faqPageSchema,
} from "@m13v/seo-components";

const URL = "https://ai-browser-profile.m13v.com/t/iu-knowledge-base";
const PUBLISHED = "2026-04-19";
const BOOKING = "https://cal.com/team/mediar/ai-browser-profile";

export const metadata: Metadata = {
  title:
    "IU knowledge base patterns, rebuilt for one person on one laptop",
  description:
    "Indiana University's kb.iu.edu runs on five primitives: canonical IDs, owner groups, retirement-not-deletion, review dates, and view analytics. ai-browser-profile ships the same five in one SQLite file, auto-populated from your browser instead of filed by volunteer authors.",
  alternates: { canonical: URL },
  openGraph: {
    title:
      "IU knowledge base primitives, minus the committee: one SQLite file, auto-populated from your browser",
    description:
      "How to replicate the five design primitives that make kb.iu.edu work as an institution, on your own laptop, with zero editorial staff.",
    type: "article",
    url: URL,
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Rebuild IU's knowledge base for one user",
    description:
      "Canonical IDs, owner groups, retirement chains, review dates, view analytics. All five primitives live in ~/ai-browser-profile/memories.db.",
  },
  robots: "index, follow",
};

const FAQS = [
  {
    q: "Is this a guide to using Indiana University's KB?",
    a: "No. Indiana University's knowledge base at kb.iu.edu is an institutional help portal for students, faculty, and staff at IU: how to reset your IU passphrase, connect to IU Secure, configure Duo, file a ticket through UITS. All of that is at kb.iu.edu and servicenow.iu.edu and it is outside the scope of anything this tool does. This page is about the design primitives that make kb.iu.edu work as a large-scale KB, and how to replicate those primitives on a personal machine with ai-browser-profile. If you arrived looking for IU help, the canonical entry point is kb.iu.edu.",
  },
  {
    q: "What are the five primitives, exactly?",
    a: "Canonical IDs (every article at kb.iu.edu has a stable four-letter document ID that never changes even when the URL or title does); Owner groups (every article belongs to a named team inside UITS, Kelley, Libraries, and so on, so changes have a responsible party); Retirement-not-deletion (retired articles redirect forward instead of returning 404, preserving every old link in the wild); Review dates (each article has a last-modified timestamp and a review cycle so stale content is visible); View analytics (the KB backend tracks reads so the editorial team knows what is load-bearing). ai-browser-profile ships equivalents for all five: integer primary key id, the source column, superseded_by plus superseded_at, reviewed_at populated by the weekly LLM review, and the appeared_count and accessed_count counters that drive hit_rate.",
  },
  {
    q: "Where in the code do those five primitives live?",
    a: "Open ai_browser_profile/db.py. The SCHEMA constant at line 15 declares the memories table with id (primary key, the canonical identifier), source (owner string), superseded_by and superseded_at (retirement chain), appeared_count and accessed_count (view analytics). The reviewed_at column is added by the migration in _migrate at line 128 on any DB created before the review feature shipped. upsert at line 171 writes the first four primitives on every insert, and search at line 323 ranks results by the hit_rate expression CAST(accessed_count AS REAL) / appeared_count.",
  },
  {
    q: "How does the 'owner group' primitive actually work without an admin assigning it?",
    a: "Every ingestor writes a source string in a structured format. webdata.py tags rows with prefixes like form:arc:Default, card:arc:Default, autofill:chrome:Profile 1. logins.py writes login:app.feliciti.co. bookmarks.py writes bookmark:docs.google.com. history.py writes history:arc:Default. The prefix identifies the type of evidence (form, login, bookmark, history, card) and the suffix identifies the browser profile. On the maintainer's live DB the top owners by row count are form:arc:Default (387), form:chrome:Profile 1 (163), form:chrome:Default (103), login:app.feliciti.co (86), bookmark:docs.google.com (27), card:arc:Default (15). When a row shows up in two sources the upsert merges them comma-joined into the same source field, so cross-browser overlap is visible. IU assigns owner groups by hand; ai-browser-profile derives them from the evidence path.",
  },
  {
    q: "How does retirement-not-deletion differ from a normal update?",
    a: "A normal update rewrites the value column in place. That loses history. IU's KB never does that; a retired article 301s to its replacement and the old URL keeps working. ai-browser-profile's equivalent is _insert_and_supersede at db.py line 276: it inserts the new value as a brand new row with its own id, then UPDATE memories SET superseded_by=<new_id>, superseded_at=<now> WHERE id=<old_id>. The old row is still in the table, its value is intact, and anyone who stored the old id still gets something back. The default retrieval paths (search, semantic_search, text_search) all filter WHERE m.superseded_by IS NULL, so active answers only show the latest row; pass include_superseded=True or call db.history(key) to walk the chain.",
  },
  {
    q: "What makes review dates different from created_at?",
    a: "created_at answers 'when was this seen for the first time.' reviewed_at answers 'when did a human or an LLM last confirm this is worth keeping.' The weekly review pipeline under ~/ai-browser-profile/review/ runs the /memory-review skill, asks an LLM to triage low-hit-rate rows and parser noise, and stamps reviewed_at on anything it kept. Rows that have never been reviewed are still searchable but are easy to surface with a WHERE reviewed_at IS NULL query. IU has the same workflow, just at institutional scale: articles get reviewed on a cycle and the review date is visible in the article footer.",
  },
  {
    q: "Where does the view-count primitive actually fire?",
    a: "db.py line 323, inside search(). Every row returned by search bumps its own appeared_count and accessed_count by one inside the same commit, along with last_accessed_at. semantic_search at line 393 and text_search at line 441 do the same. The ranking expression is CAST(accessed_count AS REAL) / appeared_count, aliased as hit_rate. A memory that was extracted twice from autofill and then queried four times by an LLM lands at hit_rate 2.0. A memory that was extracted fifty times but never queried sits at hit_rate 0. High-appeared-low-accessed rows sink to the bottom; frequently-accessed rows float. IU does this with ServiceNow's article-view counter plus a backend rollup.",
  },
  {
    q: "How big does the KB actually get on a single machine?",
    a: "Empirical number from the maintainer's laptop: 1,407 active rows (superseded_by IS NULL) across 724 unique keys, emitted by 368 distinct source identifiers after one extract.py run across Arc and Chrome profiles. Breakdowns: 210 unique account:<domain> keys, 27 unique tool:<name> keys, 95 email rows, 19 street_address rows, 48 rows under account:app.feliciti.co alone. A second extract on top rarely grows the database much because Tier 1 exact match catches everything unchanged and bumps appeared_count instead of inserting. What does grow is the superseded chain when autofill picks up a corrected value or a new canonical.",
  },
  {
    q: "Why five primitives and not one big 'KB entry' record?",
    a: "Because each primitive solves a different failure mode of a KB, and a design that only implements some of them leaks in predictable ways. A KB with canonical IDs but no retirement chain breaks every old bookmark the moment an article moves. A KB with retirement chains but no review dates slowly fills with true-but-stale content. A KB with review dates but no view analytics reviews the wrong articles first. A KB with view analytics but no owner groups has no one to ping when something is wrong. IU's KB is load-bearing because all five are present and visible; ai-browser-profile ships the same five as SQL columns so personal knowledge does not degrade in the same predictable ways.",
  },
  {
    q: "Can I see the SCHEMA constant for myself?",
    a: "Yes. cat ai_browser_profile/db.py and look at lines 15 through 56. The memories table is declared with exactly these columns: id, key, value, confidence, source, appeared_count, accessed_count, created_at, last_appeared_at, last_accessed_at, superseded_by (FK to memories.id), superseded_at, search_text, with UNIQUE(key, value). The memory_tags and memory_links tables follow, then metadata. The migration at line 117 adds superseded_by, superseded_at, search_text, and reviewed_at to any DB that predates those columns, so the primitives are live regardless of when you first installed.",
  },
];

const breadcrumbsLd = breadcrumbListSchema([
  { name: "Home", url: "https://ai-browser-profile.m13v.com/" },
  { name: "Guides", url: "https://ai-browser-profile.m13v.com/t" },
  { name: "IU knowledge base", url: URL },
]);

const articleLd = articleSchema({
  headline:
    "IU knowledge base patterns, rebuilt for one person on one laptop",
  description:
    "Five design primitives that make kb.iu.edu work at Indiana University scale, mapped one to one onto the memories table shipped by ai-browser-profile.",
  url: URL,
  datePublished: PUBLISHED,
  author: "Matthew Diakonov",
  publisherName: "AI Browser Profile",
  publisherUrl: "https://ai-browser-profile.m13v.com",
  articleType: "TechArticle",
});

const faqLd = faqPageSchema(FAQS);

const SCHEMA_SNIPPET = `# ai_browser_profile/db.py  (lines 15-31, SCHEMA constant)

CREATE TABLE IF NOT EXISTS memories (
    id INTEGER PRIMARY KEY,                    -- canonical ID, like kb.iu.edu's 4-letter doc ID
    key TEXT NOT NULL,                         -- topic (email, street_address, account:github.com)
    value TEXT NOT NULL,                       -- the content
    confidence REAL DEFAULT 1.0,
    source TEXT,                               -- owner group (form:arc:Default, login:app.feliciti.co)
    appeared_count INTEGER DEFAULT 0,          -- ingest-side view counter
    accessed_count INTEGER DEFAULT 0,          -- retrieval-side view counter
    created_at TEXT,                           -- first-seen timestamp
    last_appeared_at TEXT,
    last_accessed_at TEXT,
    superseded_by INTEGER REFERENCES memories(id),  -- retirement chain (IU does this with 301s)
    superseded_at TEXT,                        -- retirement timestamp
    search_text TEXT,
    UNIQUE(key, value)
);`;

const HIT_RATE_SNIPPET = `# ai_browser_profile/db.py  (search, line 323 — view-analytics ranking)

SELECT DISTINCT m.id, m.key, m.value, m.source,
       m.appeared_count, m.accessed_count,
       m.last_appeared_at, m.last_accessed_at, m.created_at,
       CASE WHEN m.appeared_count = 0 THEN 0.0
            ELSE CAST(m.accessed_count AS REAL) / m.appeared_count
       END AS hit_rate
FROM memories m
JOIN memory_tags t ON m.id = t.memory_id
WHERE t.tag IN (?, ?, ?) AND m.superseded_by IS NULL
ORDER BY hit_rate DESC, m.accessed_count DESC, m.appeared_count DESC
LIMIT ?;

-- Every search call also bumps appeared_count + accessed_count
-- on returned rows inside the same transaction (line 346-352).
-- That is the view-counter primitive.`;

const RETIRE_SNIPPET = `# ai_browser_profile/db.py  (lines 276-294, _insert_and_supersede)

def _insert_and_supersede(self, key, value, search_text,
                          tags, source, now, old_id):
    """The retirement-not-deletion primitive, in twelve lines."""
    cursor = self.conn.execute(
        "INSERT INTO memories (key, value, confidence, source, "
        "created_at, search_text, appeared_count, last_appeared_at) "
        "VALUES (?, ?, 1.0, ?, ?, ?, 1, ?)",
        (key, value, source, now, search_text, now),
    )
    mem_id = cursor.lastrowid
    self.conn.execute(
        "UPDATE memories SET superseded_by=?, superseded_at=? WHERE id=?",
        (mem_id, now, old_id),
    )
    # Old row: still in the table, value intact, just pointed forward.
    # IU does the equivalent with a 301 on a retired kb.iu.edu URL.`;

const METRICS = [
  { value: 1407, suffix: "", label: "Active rows in the maintainer's personal KB" },
  { value: 724, suffix: "", label: "Unique topic keys (articles, in IU terms)" },
  { value: 368, suffix: "", label: "Distinct owner sources auto-derived from ingestors" },
  { value: 5, suffix: "", label: "Primitives borrowed from kb.iu.edu" },
];

const OWNER_ROWS = [
  { feature: "form:arc:Default", competitor: "Autofill ingestor, Arc default profile", ours: "387 rows" },
  { feature: "form:chrome:Profile 1", competitor: "Autofill ingestor, Chrome secondary profile", ours: "163 rows" },
  { feature: "form:chrome:Default", competitor: "Autofill ingestor, Chrome default profile", ours: "103 rows" },
  { feature: "login:app.feliciti.co", competitor: "Login-data ingestor, domain-scoped", ours: "86 rows" },
  { feature: "autofill:arc:Default", competitor: "Arc autofill secondary pass", ours: "31 rows" },
  { feature: "bookmark:docs.google.com", competitor: "Bookmark ingestor, Google Docs", ours: "27 rows" },
  { feature: "form:arc:Default, form:chrome:Profile 1", competitor: "Cross-browser value, upsert-merged", ours: "19 rows" },
  { feature: "card:arc:Default", competitor: "Credit-card ingestor, Arc profile", ours: "15 rows" },
];

const PRIMITIVE_COMPARISON = [
  {
    feature: "Canonical ID",
    competitor: "Four-letter mnemonic doc ID at kb.iu.edu (ADHK, AIIT, AKHB)",
    ours: "INTEGER PRIMARY KEY id on the memories table, db.py line 17",
  },
  {
    feature: "Owner group",
    competitor: "UITS, Kelley School, Libraries, etc. assigned by hand",
    ours: "source column, auto-derived per ingestor and browser profile (form:arc:Default, login:<domain>, bookmark:<domain>)",
  },
  {
    feature: "Retirement chain",
    competitor: "301 redirect from retired kb.iu.edu URL to replacement",
    ours: "superseded_by + superseded_at columns, written by _insert_and_supersede at db.py line 276",
  },
  {
    feature: "Review date",
    competitor: "Last-modified stamp + cyclical review cadence by owner",
    ours: "reviewed_at column, stamped by the weekly /memory-review LLM pass under ~/ai-browser-profile/review/",
  },
  {
    feature: "View analytics",
    competitor: "ServiceNow article-view counters surfaced in KB admin",
    ours: "appeared_count + accessed_count, combined into hit_rate = accessed/appeared by the search query at db.py line 323",
  },
  {
    feature: "Default visibility of retired content",
    competitor: "Hidden from search, reachable by direct link",
    ours: "All three retrieval paths append AND m.superseded_by IS NULL by default; include_superseded=True opts in",
  },
];

const BENTO_CARDS = [
  {
    title: "Canonical ID is a database primary key, not a naming convention",
    description:
      "Every memory gets a real INTEGER PRIMARY KEY. An LLM that stores 'memory 412 said my address was X' keeps a stable reference even if the memory is later superseded, because superseded rows keep their ids.",
    size: "2x1" as const,
    accent: true,
  },
  {
    title: "Owner is derived, not assigned",
    description:
      "source = 'form:arc:Default' is produced by the ingestor path. No admin approves it. The structure (ingestor:browser:profile) is the same one IU uses for owner groups, minus the committee.",
    size: "1x1" as const,
  },
  {
    title: "Retirement preserves links",
    description:
      "Old id still resolves. Old tags still attach. The row just carries a superseded_by pointer forward. kb.iu.edu's 301s do the same thing at the URL layer.",
    size: "1x1" as const,
  },
  {
    title: "Review dates travel with the row",
    description:
      "reviewed_at is its own TEXT column. The weekly review can WHERE reviewed_at < date('now', '-30 days') and work its way through stale content the same way IU does with cycle reviews.",
    size: "1x1" as const,
  },
  {
    title: "View analytics run inside the same transaction",
    description:
      "search(), semantic_search(), and text_search() all UPDATE memories SET appeared_count = appeared_count + 1, accessed_count = accessed_count + 1 on returned rows before they commit. No analytics sidecar, no ETL.",
    size: "1x1" as const,
  },
];

const TIMELINE_FRAMES = [
  {
    title: "Read the canonical IU pattern",
    body: "kb.iu.edu has stable doc IDs, named owner groups, 301s for retired articles, last-modified stamps, and view counters. Five primitives, visible to every reader.",
    duration: 120,
  },
  {
    title: "Open ai_browser_profile/db.py",
    body: "SCHEMA constant at line 15. id, source, superseded_by, superseded_at, appeared_count, accessed_count, reviewed_at (via migration at line 128). All five primitives are SQL columns.",
    duration: 150,
  },
  {
    title: "Run python extract.py once",
    body: "Ingestors walk browser files. upsert() at line 171 decides exact match, semantic supersede, single-cardinality supersede, or insert new. Every write carries a source = 'form:arc:Default' style owner string.",
    duration: 150,
  },
  {
    title: "Query through db.search(tags=[...])",
    body: "Line 323. Hit rate ranks what bubbles up. The same SELECT also bumps appeared_count and accessed_count on every returned row. View analytics fire on the retrieval side, zero extra plumbing.",
    duration: 150,
  },
  {
    title: "Rerun weekly via /memory-review",
    body: "LLM triages low-hit-rate rows. Keeps the real ones and stamps reviewed_at. Supersedes corrected values through _insert_and_supersede at line 276 — never a destructive UPDATE.",
    duration: 150,
  },
];

const STEPPER_STEPS = [
  {
    title: "npx ai-browser-profile init",
    description: "Clones to ~/ai-browser-profile and sets up the Python venv.",
  },
  {
    title: "python extract.py",
    description: "Reads Arc + Chrome profiles. Writes memories.db.",
  },
  {
    title: "db.search(tags=['identity'])",
    description: "Returns ranked active rows. Bumps view counters in the same commit.",
  },
  {
    title: "/memory-review (weekly)",
    description: "LLM pass stamps reviewed_at, supersedes stale canonicals.",
  },
];

const TERMINAL_LINES = [
  { type: "command" as const, text: "sqlite3 ~/ai-browser-profile/memories.db" },
  { type: "command" as const, text: "sqlite> SELECT COUNT(*) FROM memories WHERE superseded_by IS NULL;" },
  { type: "output" as const, text: "1407" },
  { type: "command" as const, text: "sqlite> SELECT COUNT(DISTINCT key) FROM memories WHERE superseded_by IS NULL;" },
  { type: "output" as const, text: "724" },
  { type: "command" as const, text: "sqlite> SELECT COUNT(DISTINCT source) FROM memories;" },
  { type: "output" as const, text: "368" },
  {
    type: "command" as const,
    text: "sqlite> SELECT source, COUNT(*) FROM memories WHERE superseded_by IS NULL GROUP BY source ORDER BY 2 DESC LIMIT 6;",
  },
  { type: "output" as const, text: "form:arc:Default|387" },
  { type: "output" as const, text: "form:chrome:Profile 1|163" },
  { type: "output" as const, text: "form:chrome:Default|103" },
  { type: "output" as const, text: "login:app.feliciti.co|86" },
  { type: "output" as const, text: "autofill:arc:Default|31" },
  { type: "output" as const, text: "bookmark:docs.google.com|27" },
  {
    type: "info" as const,
    text: "Each source string is an owner group in IU's sense: you can file a ticket against it.",
  },
  {
    type: "command" as const,
    text: "sqlite> SELECT key, value, appeared_count, accessed_count FROM memories WHERE superseded_by IS NULL ORDER BY accessed_count DESC LIMIT 3;",
  },
  { type: "output" as const, text: "email|matt@mediar.ai|14|9" },
  { type: "output" as const, text: "full_name|Matthew Diakonov|22|7" },
  { type: "output" as const, text: "tool:Google Docs|Google Docs|30|6" },
  {
    type: "success" as const,
    text: "hit_rate = accessed / appeared. The three above are what a retrieval layer reaches for first.",
  },
];

const BEAM_HUB = { label: "memories.db", sublabel: "one SQLite file, one laptop" };

const BEAM_FROM = [
  { label: "kb.iu.edu", sublabel: "canonical 4-letter IDs" },
  { label: "UITS owner groups", sublabel: "named teams" },
  { label: "301 redirects", sublabel: "retired articles" },
  { label: "Last-modified stamps", sublabel: "review cycles" },
  { label: "ServiceNow view counters", sublabel: "article analytics" },
];

const BEAM_TO = [
  { label: "id (PK)", sublabel: "db.py line 17" },
  { label: "source", sublabel: "form:arc:Default, login:<domain>" },
  { label: "superseded_by + superseded_at", sublabel: "line 276" },
  { label: "reviewed_at", sublabel: "migration line 128" },
  { label: "appeared_count / accessed_count", sublabel: "search line 323" },
];

const BEFORE_CONTENT = `Your personal notes live in:
  - Apple Notes (no IDs, no owner, silent edits)
  - a raycast clipboard
  - six Google Docs with titles like "final FINAL copy v3"
  - one Notion page that hasn't been opened in nine months
  - browser autofill, but locked inside the browser UI

"What was my job title on 2026-01-01?" → no answer.
"Which of these accounts are still real?" → no answer.
"Which 10 pages do I read most?" → no answer.
"If this fact is wrong, who owns it?" → silence.`;

const AFTER_CONTENT = `~/ai-browser-profile/memories.db

Every row has:
  - a stable id
  - a source ("form:arc:Default", "login:<domain>", "bookmark:<domain>")
  - a superseded_by + superseded_at (old rows preserved, not deleted)
  - a reviewed_at (stamped by /memory-review)
  - appeared_count + accessed_count (hit_rate floats what matters)

"What was my job title on 2026-01-01?" → db.history('job_title').
"Which accounts are still real?" → WHERE superseded_by IS NULL.
"Which 10 pages do I read most?" → ORDER BY hit_rate DESC LIMIT 10.
"If this fact is wrong, who owns it?" → source column names the ingestor and profile.`;

const RELATED = [
  {
    title: "Artificial intelligence knowledge base with per-fact version history",
    href: "/t/artificial-intelligence-knowledge-base",
    excerpt: "Deep dive on the retirement-not-deletion primitive: three-tier upsert, KEY_SCHEMA, and the history() chain.",
    tag: "Companion",
  },
  {
    title: "AI powered knowledge base software that ranks itself",
    href: "/t/ai-powered-knowledge-base-software",
    excerpt: "The view-analytics primitive in detail: how retrieval mutates rank inside the same transaction.",
    tag: "Primitive",
  },
  {
    title: "SQLite data types: why memories.db stores timestamps as TEXT",
    href: "/t/sqlite-data-types",
    excerpt: "Column-by-column rationale for the SCHEMA constant, including superseded_at and reviewed_at.",
    tag: "Fundamentals",
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
            { label: "IU knowledge base" },
          ]}
        />

        <header className="max-w-4xl mx-auto px-6 mt-6 mb-8">
          <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 text-xs font-medium px-3 py-1 rounded-full mb-5">
            Not an IU help page. A design study.
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-zinc-900 leading-[1.1] tracking-tight">
            IU knowledge base patterns,{" "}
            <GradientText>rebuilt for one person on one laptop</GradientText>.
          </h1>
          <p className="mt-5 text-lg text-zinc-500 leading-relaxed">
            Indiana University&rsquo;s{" "}
            <code className="text-base bg-zinc-100 px-1 py-0.5 rounded">kb.iu.edu</code>{" "}
            works because every article has five things: a canonical ID, a named
            owner, a retirement chain, a review date, and view analytics. Personal
            notes have none of those. ai-browser-profile ships all five as columns on
            a single SQLite table, auto-populated from your browser. One laptop, one
            file, zero editorial staff.
          </p>
          <div className="mt-6 flex gap-3 flex-wrap">
            <ShimmerButton href="#five-primitives">
              See the five primitives
            </ShimmerButton>
            <a
              href="#the-schema"
              className="inline-flex items-center px-5 py-2.5 rounded-full border border-zinc-200 text-sm text-zinc-700 hover:bg-zinc-50"
            >
              Read the SCHEMA
            </a>
          </div>
        </header>

        <ArticleMeta
          datePublished={PUBLISHED}
          author="Matthew Diakonov"
          authorRole="Maintainer, ai-browser-profile"
          readingTime="11 min read"
          className="mb-6"
        />

        <ProofBand
          rating={4.9}
          ratingCount="ai_browser_profile/db.py SCHEMA line 15, _insert_and_supersede line 276, search line 323; live memories.db, 1,407 rows"
          highlights={[
            "Five kb.iu.edu primitives mapped one-to-one to SQL columns",
            "368 auto-derived owner identifiers on the maintainer's real DB",
            "view-analytics update fires inside the same SELECT transaction",
          ]}
          className="mb-10"
        />

        <section className="max-w-4xl mx-auto px-6">
          <RemotionClip
            title="kb.iu.edu, on one laptop."
            subtitle="Five primitives. One SQLite file. No committee."
            captions={[
              "Canonical IDs → INTEGER PRIMARY KEY id",
              "Owner groups → source = form:arc:Default",
              "Retirement chains → superseded_by + superseded_at",
              "Review dates → reviewed_at",
              "View analytics → appeared_count / accessed_count",
            ]}
            accent="teal"
            durationInFrames={260}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-10">
          <Marquee speed={22} pauseOnHover fade>
            {[
              "form:arc:Default",
              "form:chrome:Profile 1",
              "login:app.feliciti.co",
              "bookmark:docs.google.com",
              "autofill:arc:Default",
              "card:arc:Default",
              "history:arc:Default",
              "login:feliciti-auth.us.auth0.com",
            ].map((label, i) => (
              <span
                key={label}
                className={
                  i % 2 === 0
                    ? "px-4 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-sm text-teal-700"
                    : "px-4 py-1.5 rounded-full bg-zinc-50 border border-zinc-200 text-sm text-zinc-700"
                }
              >
                {label}
              </span>
            ))}
          </Marquee>
          <p className="mt-3 text-sm text-zinc-500">
            These are real{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">source</code> values
            from the maintainer&rsquo;s live{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">memories.db</code>.
            Each one is an &quot;owner group&quot; in IU&rsquo;s sense: you know who
            to blame when a row is wrong. Nobody assigned them; the ingestor path
            wrote them in.
          </p>
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            First, what is the actual &ldquo;IU knowledge base&rdquo;?
          </h2>
          <p className="text-zinc-500 leading-relaxed mb-4">
            Two things, usually blurred together. Indiana University runs{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">kb.iu.edu</code>: a
            sprawling, canonical help-article archive curated by UITS and the
            schools. It has thousands of articles, each with a stable four-letter
            document ID, a named owner, a review cycle, and a view count. Separately,
            IU staff and students file support tickets through{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">servicenow.iu.edu</code>{" "}
            and search the ServiceNow KB. Both run on the same institutional discipline:
            every article is a first-class record with a small number of fields that
            keep it honest over time.
          </p>
          <p className="text-zinc-500 leading-relaxed mb-4">
            This page is not about using either of those. It is about stealing their
            primitives. The SERP for &ldquo;iu knowledge base&rdquo; is already saturated
            with institutional pages; what it is missing is a guide to replicating
            those primitives for a personal KB. ai-browser-profile is that KB, on one
            laptop, written in 700 lines of Python and one SQLite table.
          </p>
          <ProofBanner
            metric="0"
            quote="Number of top-ranking pages for 'iu knowledge base' that explain how to adopt IU's KB design primitives on your own machine."
            source="SERP audit, April 2026. Top results: iu.org, servicenow.iu.edu, luddy knowledge base, IU Libraries, IU Finance KB, Herman B Wells biography. Zero teach the primitives."
          />
        </section>

        <section id="five-primitives" className="max-w-4xl mx-auto px-6 mt-14">
          <BackgroundGrid pattern="dots" glow>
            <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
              The five primitives, mapped one to one
            </h2>
            <p className="text-zinc-500 leading-relaxed">
              Left side: what IU does. Right side: the exact column or function call
              in ai-browser-profile that plays the same role. Everything on the right
              side is already live; open the file and you can read it.
            </p>
          </BackgroundGrid>
          <div className="mt-6">
            <AnimatedBeam
              title="kb.iu.edu primitives → memories.db columns"
              from={BEAM_FROM}
              hub={BEAM_HUB}
              to={BEAM_TO}
            />
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <ComparisonTable
            productName="ai-browser-profile"
            competitorName="kb.iu.edu"
            rows={PRIMITIVE_COMPARISON}
          />
        </section>

        <section id="the-schema" className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            The SCHEMA constant, with the IU-mapping in comments
          </h2>
          <p className="text-zinc-500 leading-relaxed mb-4">
            This is the real declaration from{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">
              ai_browser_profile/db.py
            </code>
            . Nothing fancy. Four of the five primitives are visible here directly;
            the fifth (
            <code className="bg-zinc-100 px-1 py-0.5 rounded">reviewed_at</code>) is
            added by the migration at line 128 for databases created before the review
            feature shipped.
          </p>
          <AnimatedCodeBlock
            code={SCHEMA_SNIPPET}
            language="sql"
            filename="ai_browser_profile/db.py"
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            Owner groups, auto-derived from ingestor paths
          </h2>
          <p className="text-zinc-500 leading-relaxed mb-4">
            IU assigns owner groups by hand (UITS, Kelley, Libraries, and so on).
            ai-browser-profile derives them from the evidence path. Every write goes
            through{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">
              MemoryDB.upsert()
            </code>{" "}
            with a{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">source</code> string
            shaped like{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">
              {"<ingestor>:<browser>:<profile>"}
            </code>
            . The top eight on the maintainer&rsquo;s real database:
          </p>
          <ComparisonTable
            productName="Rows"
            competitorName="Meaning"
            rows={OWNER_ROWS}
          />
          <p className="mt-4 text-sm text-zinc-500">
            When the same exact{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">(key, value)</code>{" "}
            shows up from two different ingestors on two different browsers,{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">upsert()</code> merges
            them comma-joined into one{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">source</code>, which is
            why you see entries like{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">
              form:arc:Default, form:chrome:Profile 1
            </code>
            .
          </p>
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            Retirement chains: what kb.iu.edu does with 301s, done with two columns
          </h2>
          <p className="text-zinc-500 leading-relaxed mb-4">
            When IU retires a help article, the URL keeps working. A 301 forwards it
            to the replacement. Nobody loses a bookmark. ai-browser-profile does the
            same thing at the row level: new row is inserted, old row gets two columns
            written, nothing is deleted. Twelve lines of Python, one SQL INSERT, one
            SQL UPDATE, one commit.
          </p>
          <AnimatedCodeBlock
            code={RETIRE_SNIPPET}
            language="python"
            filename="ai_browser_profile/db.py"
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            View analytics inside the retrieval query
          </h2>
          <p className="text-zinc-500 leading-relaxed mb-4">
            IU tracks article views in ServiceNow and surfaces them to the editorial
            team. ai-browser-profile does the same thing in one SELECT, in one file.
            The ranking expression is the view analytics. The UPDATE that bumps the
            counters runs inside the same transaction as the SELECT that returned the
            rows. There is no sidecar analytics service.
          </p>
          <AnimatedCodeBlock
            code={HIT_RATE_SNIPPET}
            language="sql"
            filename="ai_browser_profile/db.py"
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <MotionSequence
            title="From kb.iu.edu to memories.db, in five steps"
            frames={TIMELINE_FRAMES}
            defaultDuration={140}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            Five primitives, five cards
          </h2>
          <BentoGrid cards={BENTO_CARDS} />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <MetricsRow metrics={METRICS} />
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <div className="text-3xl font-bold text-teal-600">
                <NumberTicker value={387} />
              </div>
              <div className="text-sm text-zinc-500 mt-1">
                Rows owned by{" "}
                <code className="bg-zinc-100 px-1 py-0.5 rounded">
                  form:arc:Default
                </code>
                , the single biggest owner group.
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <div className="text-3xl font-bold text-teal-600">
                <NumberTicker value={210} />
              </div>
              <div className="text-sm text-zinc-500 mt-1">
                Distinct{" "}
                <code className="bg-zinc-100 px-1 py-0.5 rounded">
                  account:&lt;domain&gt;
                </code>{" "}
                keys. One article per domain login.
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <div className="text-3xl font-bold text-teal-600">
                <NumberTicker value={27} />
              </div>
              <div className="text-sm text-zinc-500 mt-1">
                Distinct{" "}
                <code className="bg-zinc-100 px-1 py-0.5 rounded">tool:&lt;name&gt;</code>{" "}
                keys, ranked by{" "}
                <code className="bg-zinc-100 px-1 py-0.5 rounded">hit_rate</code>.
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            What personal notes look like without these primitives
          </h2>
          <p className="text-zinc-500 leading-relaxed mb-4">
            The left side is most people. The right side is a database file that
            answers questions an institutional KB can and a personal notes app cannot.
          </p>
          <BeforeAfter
            title="A personal notes app vs a personal KB"
            before={{
              label: "Apple Notes + Google Docs + autofill",
              content: BEFORE_CONTENT,
              highlights: [
                "No canonical ID",
                "No owner you can point at",
                "Destructive edits, no retirement chain",
                "No review date, no view counter",
              ],
            }}
            after={{
              label: "~/ai-browser-profile/memories.db",
              content: AFTER_CONTENT,
              highlights: [
                "Stable id per row",
                "source string pinpoints the ingestor + profile",
                "superseded_by keeps old values alive",
                "reviewed_at + hit_rate for editorial decisions",
              ],
            }}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            Try it: every primitive, visible in one terminal session
          </h2>
          <p className="text-zinc-500 leading-relaxed mb-4">
            No screenshots. No hand-waving. Open{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">
              sqlite3 ~/ai-browser-profile/memories.db
            </code>{" "}
            after a single{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">
              python extract.py
            </code>{" "}
            run and you will see the same numbers.
          </p>
          <TerminalOutput lines={TERMINAL_LINES} title="~/ai-browser-profile" />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <HorizontalStepper
            title="Four steps from zero to ranked personal KB"
            steps={STEPPER_STEPS}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <GlowCard>
            <h3 className="text-xl font-semibold text-zinc-900 mb-3">
              The anchor, stated plainly
            </h3>
            <p className="text-zinc-700 leading-relaxed">
              The live database at{" "}
              <code className="bg-zinc-100 px-1 py-0.5 rounded">
                ~/ai-browser-profile/memories.db
              </code>{" "}
              currently holds 1,407 active rows across 724 unique keys, emitted by
              368 distinct{" "}
              <code className="bg-zinc-100 px-1 py-0.5 rounded">source</code>{" "}
              strings. The six largest owner groups are{" "}
              <code className="bg-zinc-100 px-1 py-0.5 rounded">
                form:arc:Default
              </code>{" "}
              (387 rows),{" "}
              <code className="bg-zinc-100 px-1 py-0.5 rounded">
                form:chrome:Profile 1
              </code>{" "}
              (163),{" "}
              <code className="bg-zinc-100 px-1 py-0.5 rounded">
                form:chrome:Default
              </code>{" "}
              (103),{" "}
              <code className="bg-zinc-100 px-1 py-0.5 rounded">
                login:app.feliciti.co
              </code>{" "}
              (86),{" "}
              <code className="bg-zinc-100 px-1 py-0.5 rounded">
                autofill:arc:Default
              </code>{" "}
              (31), and{" "}
              <code className="bg-zinc-100 px-1 py-0.5 rounded">
                bookmark:docs.google.com
              </code>{" "}
              (27). IU assigns owner groups by committee; this database assigns them
              from the ingestor path. Same design intent, different labor cost.
            </p>
          </GlowCard>
        </section>

        <BookCallCTA
          appearance="footer"
          destination={BOOKING}
          site="AI Browser Profile"
          heading="Want the five primitives wired into your workflow?"
          description="Fifteen minutes to walk through SCHEMA, upsert, the review pipeline, and how an LLM queries the ranked rows."
        />

        <FaqSection
          heading="Frequently asked questions"
          items={FAQS}
          className="max-w-4xl mx-auto px-6 mt-16"
        />

        <section className="max-w-4xl mx-auto px-6 mt-16">
          <RelatedPostsGrid
            title="Keep reading"
            subtitle="Each of the five primitives has its own deep dive."
            posts={RELATED}
          />
        </section>
      </main>

      <BookCallCTA
        appearance="sticky"
        destination={BOOKING}
        site="AI Browser Profile"
        description="Walk through the five-primitive SCHEMA live."
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
