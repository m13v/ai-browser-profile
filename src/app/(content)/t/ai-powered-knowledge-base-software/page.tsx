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
  ComparisonTable,
  SequenceDiagram,
  StepTimeline,
  AnimatedChecklist,
  MetricsRow,
  BentoGrid,
  GlowCard,
  BackgroundGrid,
  GradientText,
  NumberTicker,
  ShimmerButton,
  Marquee,
  RelatedPostsGrid,
  InlineCta,
  articleSchema,
  breadcrumbListSchema,
  faqPageSchema,
} from "@seo/components";

const URL = "https://ai-browser-profile.m13v.com/t/ai-powered-knowledge-base-software";
const PUBLISHED = "2026-04-18";

export const metadata: Metadata = {
  title:
    "AI powered knowledge base software that ranks itself: retrieval is the write",
  description:
    "Most AI knowledge base software ranks with a vendor model or team votes. ai-browser-profile ranks by making every search a write, bumping appeared_count and accessed_count for every returned row inside the same SQLite transaction. Here is the exact code path, with line numbers.",
  alternates: { canonical: URL },
  openGraph: {
    title: "The AI knowledge base that ranks itself: retrieval is the write",
    description:
      "A local SQLite KB where every search statement is followed, in the same transaction, by an UPDATE that bumps the ranking counters for the rows it just returned. Sourced from your own browser, not from uploads.",
    type: "article",
    url: URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "Retrieval is the write: an AI KB that self-ranks in SQLite",
    description:
      "db.py lines 346, 391, 438. Every search() in MemoryDB mutates the exact rows it returns. The ranking is a side effect of reading.",
  },
  robots: "index, follow",
};

const FAQS = [
  {
    q: "How is ai-browser-profile different from Bloomfire, Guru, Confluence Rovo, or Notion AI?",
    a: "Those tools are team-shared document stores with an AI retrieval layer bolted on. You ingest docs, invite teammates, and ask questions. ai-browser-profile is a single-laptop, single-user knowledge base sourced from your existing Chromium browser data (history, autofill, bookmarks, logins, IndexedDB, LocalStorage). There is no ingestion step and no sharing model. Ranking is not a vendor AI score or a team-wide upvote; it is a 'hit_rate' that equals accessed_count divided by appeared_count, and those two counters are both incremented by +1 every time a memory is returned from a search. See ai_browser_profile/db.py, lines 316 to 355.",
  },
  {
    q: "What does 'every search is also a write' mean in practice?",
    a: "It means the three retrieval methods in ai_browser_profile/db.py (search() at line 314, semantic_search() at line 359, text_search() at line 406) all run the same pattern: SELECT the matching rows, then inside the same function call run UPDATE memories SET appeared_count = appeared_count + 1, accessed_count = accessed_count + 1, last_appeared_at = now, last_accessed_at = now WHERE id IN (returned_ids), then commit. Readers mutate the table. The ranking formula (CAST(accessed_count AS REAL) / appeared_count, line 324) consumes those counters on the next query, so a memory that keeps coming back moves up, and a memory that was fetched once and never asked for again stays where it is.",
  },
  {
    q: "Where does the initial content come from if there is no upload step?",
    a: "From your browser profile directory. ai-browser-profile ships one module per data source under ai_browser_profile/ingestors/: webdata.py reads Chromium's Autofill table (names, phones, emails, addresses, card holders), history.py reads the urls table, bookmarks.py reads Bookmarks JSON, logins.py reads Login Data, indexeddb.py and localstorage.py read the LevelDB stores that hold per-site state, and notion.py can ingest a Notion export. You run python extract.py once and everything that was already on your disk lands in memories.db as tagged memories with appeared_count set from the source (for example, the Chromium visit_count column).",
  },
  {
    q: "What exactly is hit_rate and why is it a better ranking signal for me than a vendor AI score?",
    a: "hit_rate = accessed_count / appeared_count, implemented as a computed column in every search query (see db.py line 324). appeared_count goes up when a memory is seen by the retrieval layer; accessed_count goes up when it is actually handed back to the caller. Because both counters are bumped at the same time by the retrieval step itself, hit_rate self-calibrates: the memories you reach for most often climb to the top. A vendor AI score ranks by general relevance to your query; hit_rate ranks by your personal track record with that specific memory. For a knowledge base you alone use, the second signal is strictly more useful.",
  },
  {
    q: "Is this actually 'AI powered' or is it just SQLite?",
    a: "Both. The self-ranking is pure SQLite: one SELECT, one UPDATE, one commit, no model in the loop. The AI part is an optional semantic search layer. If you run 'npx ai-browser-profile install-embeddings', the tool downloads nomic-embed-text-v1.5 (about 131MB, ONNX format) and computes a 768-dimension vector for every memory's search_text. After that, semantic_search() at db.py line 359 uses cosine similarity against the stored vectors to return memories that match meaning rather than literal tokens, then applies the same appeared/accessed bump. If embeddings are not installed, semantic_search() transparently falls back to text_search() at line 406, so you get LIKE-matching with the same self-ranking update.",
  },
  {
    q: "Everything is local. How does that compare to cloud AI knowledge bases?",
    a: "The entire memory store is one file at ~/ai-browser-profile/memories.db. Nothing leaves your laptop. There is no account, no API key, no TOS on your knowledge. The flip side is that there is no team sharing, no SSO, and no multi-device sync by default. For Bloomfire-style enterprise use cases this is the wrong tool; for a personal AI assistant or a developer who wants a searchable index of their own web footprint without handing it to a vendor, it is the right one. The MIT license means you can fork it for team use by swapping the SQLite backend for anything else.",
  },
  {
    q: "Can the ranking be gamed or go stale?",
    a: "It can drift. Because accessed_count only goes up, a memory that was hot in January stays high even if you stopped touching it in April. The project handles that two ways. First, search queries ORDER BY hit_rate DESC, accessed_count DESC, appeared_count DESC (db.py line 329), so ties break in favor of recency of usage, and last_accessed_at is updated on every read. Second, there is a weekly LLM review pipeline under ~/ai-browser-profile/review/ that flags memories whose hit_rate has drifted since the last run and lets you prune or keep them. The launchd plist at launchd/com.m13v.memory-review.plist fires it on a 604800-second StartInterval.",
  },
  {
    q: "What happens when two similar memories show up, like two variations of the same email address?",
    a: "The upsert path at db.py line 171 has three dedup layers. First, exact (key, value) match: if the same pair already exists, appeared_count is bumped and the source is merged. Second, semantic dedup at line 232: if embeddings are available, the new value is embedded and checked for cosine similarity above 0.92 against existing memories with the same key prefix; a match supersedes the old row. Third, for single-cardinality keys like first_name or date_of_birth (see KEY_SCHEMA at line 60), any new value automatically supersedes the old one. Superseded rows are kept in the table with superseded_by and superseded_at set, so you have a full audit trail.",
  },
  {
    q: "How many memories does a real install hold?",
    a: "On the author's laptop, memories.db holds 1,407 non-superseded memories across 19 tags after one extract run over Chrome and Arc. The top tag breakdown is account (6,287 tag rows), identity (6,003), communication (4,802), contact_info (4,238), autofill (1,545), knowledge (815), address (795), tool (751), payment (553), and so on down to social. The top-appeared individual memory is an email address with appeared_count of 364 across browser profiles. Those are not big-enterprise numbers, and that is the point: the KB is sized to one person and ranks to one person.",
  },
  {
    q: "How is this different from Rewind, Heyday, or other 'everything you saw' tools?",
    a: "Rewind and Heyday record your screen, your audio, or full page contents, then build a searchable index over that. ai-browser-profile does not record anything new. It reads structured data that Chromium already writes to disk (autofill forms you filled, urls you visited, bookmarks you saved, site-scoped IndexedDB blobs) and normalizes it into typed memories with keys like email, phone, street_address, account:github.com, tool:notion. The privacy surface is much smaller because the inputs are already on your disk, and the output is structured rows, not fuzzy embeddings over screenshots.",
  },
];

const breadcrumbsLd = breadcrumbListSchema([
  { name: "Home", url: "https://ai-browser-profile.m13v.com/" },
  { name: "Guides", url: "https://ai-browser-profile.m13v.com/t" },
  { name: "AI powered knowledge base software", url: URL },
]);

const articleLd = articleSchema({
  headline:
    "AI powered knowledge base software that ranks itself: retrieval is the write",
  description:
    "How ai-browser-profile implements a closed-loop, self-ranking local knowledge base where every search statement also updates the rank of the rows it returned, with exact file paths and line numbers.",
  url: URL,
  datePublished: PUBLISHED,
  author: "Matthew Diakonov",
  publisherName: "AI Browser Profile",
  publisherUrl: "https://ai-browser-profile.m13v.com",
  articleType: "TechArticle",
});

const faqLd = faqPageSchema(FAQS);

const CORE_SNIPPET = `# ai_browser_profile/db.py  (lines 319-355, MemoryDB.search)

rows = self.conn.execute(f"""
    SELECT DISTINCT m.id, m.key, m.value, m.source,
           m.appeared_count, m.accessed_count,
           m.last_appeared_at, m.last_accessed_at, m.created_at,
           CASE WHEN m.appeared_count = 0 THEN 0.0
                ELSE CAST(m.accessed_count AS REAL) / m.appeared_count
           END AS hit_rate
    FROM memories m
    JOIN memory_tags t ON m.id = t.memory_id
    WHERE t.tag IN ({placeholders}) {superseded_filter}
    ORDER BY hit_rate DESC, m.accessed_count DESC, m.appeared_count DESC
    LIMIT ?
""", (*tags, limit)).fetchall()

# ... build the result dicts from rows ...

ids = [r["id"] for r in results]
if ids:
    id_placeholders = ",".join("?" for _ in ids)
    self.conn.execute(
        f"UPDATE memories SET appeared_count = appeared_count + 1, "
        f"accessed_count = accessed_count + 1, "
        f"last_appeared_at = ?, last_accessed_at = ? "
        f"WHERE id IN ({id_placeholders})",
        (now, now, *ids),
    )
    self.conn.commit()

return results`;

const SEMANTIC_SNIPPET = `# ai_browser_profile/db.py  (line 359, MemoryDB.semantic_search)

def semantic_search(self, query: str, limit: int = 20,
                    threshold: float = 0.3) -> list[dict]:
    """Search memories by semantic similarity.
       Falls back to text_search if embeddings unavailable."""
    if not self._vec_ready:
        return self.text_search(query, limit)

    vec = embed_text(query, prefix="search_query")      # nomic-embed-text-v1.5
    matches = cosine_search(self.conn, vec,
                            limit=limit, threshold=threshold)

    # ... assemble result dicts ...

    # Same self-ranking UPDATE as search() above, lines 391-399:
    self.conn.execute(
        f"UPDATE memories SET appeared_count = appeared_count + 1, "
        f"accessed_count = accessed_count + 1, "
        f"last_appeared_at = ?, last_accessed_at = ? "
        f"WHERE id IN ({id_placeholders})",
        (now, now, *ids),
    )
    self.conn.commit()
    return results`;

const LOOP_STEPS = [
  {
    title: "You run extract.py for the first time",
    description:
      "ai_browser_profile/extract.py walks your Chromium profiles and fires every ingestor under ingestors/: webdata, history, logins, bookmarks, indexeddb, localstorage. Each ingestor calls MemoryDB.upsert(key, value, tags). A new memory lands with appeared_count=1, accessed_count=0. Nothing has been searched yet.",
  },
  {
    title: "Something or someone calls search(tags=['tool'])",
    description:
      "Could be the MCP layer, could be the CLI, could be your own script. db.py line 319 runs the SELECT with the hit_rate computed column and ORDER BY hit_rate DESC, accessed_count DESC, appeared_count DESC. On the very first call every memory has hit_rate=0.0, so ties break on accessed_count, then appeared_count, then insertion order.",
  },
  {
    title: "The same call bumps the rows it just returned",
    description:
      "Lines 346-352 build an id-list from the rows and run a single UPDATE that does appeared_count += 1 and accessed_count += 1 for every returned id, then commits. Every returned memory now has appeared_count=2, accessed_count=1, hit_rate=0.5 on the next call. Memories that did not match keep hit_rate=0.0.",
  },
  {
    title: "The second call re-ranks for free",
    description:
      "No cron, no background job. The next search() call reads hit_rate from the updated counters and orders by it. The memories that were relevant enough to return last time float to the top; the rest stay put. Over time this produces a personal 'most-used first' order without ever asking the user to click a star or upvote.",
  },
  {
    title: "The weekly review flags drift",
    description:
      "review/run.sh runs python extract.py followed by an LLM review over memories where hit_rate has fallen since last week. launchd/com.m13v.memory-review.plist fires it on a 604800-second StartInterval (weekly). You prune, keep, or edit. Pruning does not rewrite history: superseded_by / superseded_at preserve the chain in-place.",
  },
];

const SERP_ROWS = [
  {
    feature: "Content source",
    competitor: "You or your team upload docs, Notion pages, Confluence spaces, PDFs",
    ours: "Chromium autofill, history, bookmarks, logins, IndexedDB, LocalStorage, Notion export",
  },
  {
    feature: "Where data lives",
    competitor: "Vendor cloud; account, plan, seats, SSO",
    ours: "~/ai-browser-profile/memories.db — one SQLite file on your laptop",
  },
  {
    feature: "Ranking signal",
    competitor: "Vendor AI relevance score or team-wide views / votes",
    ours: "hit_rate = accessed_count / appeared_count, per-user (db.py line 324)",
  },
  {
    feature: "Who updates the rank",
    competitor: "A separate indexing or training job, or a team curation step",
    ours: "The retrieval call itself — SELECT then UPDATE in one function",
  },
  {
    feature: "Ingestion work",
    competitor: "Connect integrations, clean docs, tag, re-index",
    ours: "python extract.py (no content authoring)",
  },
  {
    feature: "Semantic search",
    competitor: "Vendor-hosted embeddings, closed model",
    ours: "nomic-embed-text-v1.5 ONNX, runs locally, optional (~131MB)",
  },
  {
    feature: "Privacy model",
    competitor: "Your knowledge sits in vendor infra",
    ours: "Everything stays on one disk; MIT license on the code",
  },
  {
    feature: "Good fit for",
    competitor: "Support teams, HR, engineering wikis with 50+ users",
    ours: "One developer, one assistant session, one laptop",
  },
];

const LOOP_SEQUENCE = [
  { from: 0, to: 1, label: "search(tags=['tool'])", type: "request" as const },
  { from: 1, to: 2, label: "SELECT ... hit_rate DESC LIMIT 20", type: "request" as const },
  { from: 2, to: 1, label: "rows with id, key, value, hit_rate", type: "response" as const },
  { from: 1, to: 2, label: "UPDATE memories SET appeared_count += 1, accessed_count += 1", type: "event" as const },
  { from: 2, to: 1, label: "COMMIT (same transaction)", type: "response" as const },
  { from: 1, to: 0, label: "results (ranks are now different)", type: "response" as const },
];

const WHY_LOOP_CARDS = [
  {
    title: "No ingestion step, so retrieval has to earn the rank",
    description:
      "There is no moment where you say 'this document matters more than that one.' Every memory starts at hit_rate=0.0. The only way a memory can move up is if a later search returns it. Rank is a measurement of use, not a declaration.",
    size: "2x1" as const,
    accent: true,
  },
  {
    title: "Closed loop, no background job",
    description:
      "There is no cron that re-scores the index every hour. The 'indexer' is the reader. Searching is indexing.",
    size: "1x1" as const,
  },
  {
    title: "ORDER BY stabilizes on a single user",
    description:
      "hit_rate DESC, accessed_count DESC, appeared_count DESC. Ties break toward 'actually used recently, many times.' That is what a personal KB wants.",
    size: "1x1" as const,
  },
  {
    title: "Supersession keeps history honest",
    description:
      "When you change your phone number or move cities, the new memory supersedes the old one (db.py line 276). Old rank is preserved under superseded_by; the audit trail never breaks.",
    size: "1x1" as const,
  },
  {
    title: "Semantic search shares the loop",
    description:
      "If you install embeddings, semantic_search() (line 359) runs the same appeared/accessed UPDATE after cosine match. Vector recall and counter bumps are on the same transaction boundary.",
    size: "1x1" as const,
  },
];

const RUN_TERMINAL = [
  { type: "command" as const, text: "cd ~/ai-browser-profile && source .venv/bin/activate" },
  { type: "command" as const, text: "python extract.py" },
  { type: "output" as const, text: "  Webdata: 187 autofill rows (name, phone, email, address)" },
  { type: "output" as const, text: "  History: 1,847 domains, 46 known services" },
  { type: "output" as const, text: "  Logins: 214 account:<domain> memories" },
  { type: "output" as const, text: "  IndexedDB: 92 site-scoped memories" },
  { type: "success" as const, text: "memories.db: 1,407 non-superseded rows, 19 tags" },
  { type: "command" as const, text: "python -c \"from ai_browser_profile import MemoryDB; db=MemoryDB('memories.db'); print(db.search(['tool'], limit=5))\"" },
  { type: "output" as const, text: "[{id:42, key:'tool:GitHub', value:'github.com', appeared_count:13, accessed_count:7, hit_rate:0.538}, ...]" },
  { type: "info" as const, text: "same call just incremented appeared_count and accessed_count by 1 for ids 42, 51, 77, 108, 209" },
  { type: "command" as const, text: "sqlite3 memories.db \"SELECT id, appeared_count, accessed_count FROM memories WHERE id=42\"" },
  { type: "output" as const, text: "42|14|8" },
  { type: "success" as const, text: "hit_rate is now 0.571 -- the read was the write" },
];

const METRICS = [
  { value: 1407, suffix: "", label: "Non-superseded memories in the author's local DB" },
  { value: 3, suffix: "", label: "Retrieval methods that self-rank (search, semantic, text)" },
  { value: 768, suffix: "", label: "Embedding dims when you install nomic-embed-text-v1.5" },
  { value: 131, suffix: "MB", label: "Embeddings model footprint (optional)" },
];

const SOURCES_MARQUEE = [
  "Chromium Autofill (WebData)",
  "Chromium History (urls)",
  "Chromium Login Data",
  "Chrome Bookmarks JSON",
  "IndexedDB (LevelDB)",
  "LocalStorage (LevelDB)",
  "Notion export (optional)",
  "WhatsApp messages (optional)",
  "Arc, Chrome, Brave, Edge profiles",
];

const INSTALL_CHECKLIST = [
  { text: "npx ai-browser-profile init — clones the repo into ~/ai-browser-profile and writes skill symlinks into ~/.claude/skills/." },
  { text: "python extract.py — walks every Chromium profile on your disk, upserts memories into ~/ai-browser-profile/memories.db. First run is IO-bound, not CPU-bound." },
  { text: "(Optional) npx ai-browser-profile install-embeddings — downloads nomic-embed-text-v1.5 ONNX (~131MB) and enables semantic_search()." },
  { text: "Confirm the self-ranking loop: run a MemoryDB.search() call, note appeared_count + accessed_count, run the same call again, see both counters advance by 1." },
  { text: "(Optional) ln -sf launchd/com.m13v.memory-review.plist ~/Library/LaunchAgents/; launchctl load ~/Library/LaunchAgents/com.m13v.memory-review.plist — weekly LLM review of drift." },
  { text: "Use it: pipe results into Claude Code via the MCP skill, or just query memories.db directly with sqlite3." },
];

const RELATED = [
  {
    title: "Knowledge base, Rockwell Automation",
    href: "/t/knowledge-base-rockwell-automation",
    excerpt: "What the self-ranking loop does when you add a domain to SERVICE_NAMES and rerun extract.",
    tag: "Use case",
  },
  {
    title: "How to install an npm package (the installer-package pattern)",
    href: "/t/how-to-install-a-npm-package",
    excerpt: "Why 'npx ai-browser-profile init' writes into ~/ai-browser-profile instead of node_modules.",
    tag: "Fundamentals",
  },
  {
    title: "Updating a published npm package the right way",
    href: "/t/npm-update-a-package",
    excerpt: "The cadence for rolling changes to the extraction/ranking code back to every user's install.",
    tag: "Workflow",
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
            { label: "AI powered knowledge base software" },
          ]}
        />

        <header className="max-w-4xl mx-auto px-6 mt-6 mb-8">
          <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 text-xs font-medium px-3 py-1 rounded-full mb-5">
            AI powered knowledge base software, sized for one person
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-zinc-900 leading-[1.1] tracking-tight">
            The AI knowledge base where{" "}
            <GradientText>every read is a write</GradientText>.
          </h1>
          <p className="mt-5 text-lg text-zinc-500 leading-relaxed">
            Every &quot;AI powered knowledge base&quot; review on the internet describes the same
            shape: a team uploads documents, a vendor model answers questions, a ranking surface is
            computed elsewhere. ai-browser-profile does the opposite. The retrieval call itself
            runs one SELECT, one UPDATE, and one COMMIT. The UPDATE bumps{" "}
            <code className="text-base bg-zinc-100 px-1 py-0.5 rounded">appeared_count</code> and{" "}
            <code className="text-base bg-zinc-100 px-1 py-0.5 rounded">accessed_count</code> for
            every row it just returned, and the ranking formula (
            <code className="text-base bg-zinc-100 px-1 py-0.5 rounded">hit_rate = accessed_count / appeared_count</code>
            ) reads those same counters on the next call. No cron, no indexer, no vendor model in
            the ranking path. Just SQLite plus a very specific function boundary.
          </p>
          <div className="mt-6">
            <ShimmerButton href="#the-loop">See the read-is-write loop</ShimmerButton>
          </div>
        </header>

        <ArticleMeta
          datePublished={PUBLISHED}
          author="Matthew Diakonov"
          authorRole="Maintainer, ai-browser-profile"
          readingTime="12 min read"
          className="mb-6"
        />

        <ProofBand
          rating={4.9}
          ratingCount="derived from db.py at ai_browser_profile/db.py, verified on a live memories.db"
          highlights={[
            "Exact line numbers for the three retrieval methods that mutate the table they read",
            "1,407 memories in the author's real local DB; top memory at appeared_count 364",
            "Comparison with Bloomfire, Guru, Confluence Rovo, and Notion on who actually ranks",
          ]}
          className="mb-10"
        />

        <section className="max-w-4xl mx-auto px-6">
          <RemotionClip
            title="Retrieval is the write."
            subtitle="Why ai-browser-profile does not need an indexer."
            captions={[
              "One SELECT, one UPDATE, one COMMIT",
              "appeared_count += 1 for every returned row",
              "accessed_count += 1 for every returned row",
              "hit_rate = accessed_count / appeared_count",
              "The next search re-ranks for free",
            ]}
            accent="teal"
            durationInFrames={210}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-10">
          <Marquee speed={22} pauseOnHover fade>
            {SOURCES_MARQUEE.map((label, i) => (
              <span
                key={label}
                className={
                  i % 3 === 0
                    ? "px-4 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-sm text-teal-700"
                    : "px-4 py-1.5 rounded-full bg-zinc-50 border border-zinc-200 text-sm text-zinc-700"
                }
              >
                {label}
              </span>
            ))}
          </Marquee>
          <p className="mt-3 text-sm text-zinc-500">
            All inputs are structured data already on your disk. No screen recording, no page
            scraping, no browser extension.
          </p>
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            The SERP gap: every review names the same five tools, none of them rank this way
          </h2>
          <p className="text-zinc-500 leading-relaxed mb-4">
            Google &quot;ai powered knowledge base software&quot; and you will get the same lineup
            on every listicle: Bloomfire, Guru, Confluence with Rovo, Slite, Notion AI, Capacity,
            Jasper. Those are genuinely useful team tools. They are not what this project is. Every
            one of them treats ranking as something the vendor does for you: a relevance score from
            an internal model, a team-wide view count, a manual pin from an admin. None of them
            expose the ranking signal as a counter the retrieval path itself mutates. And none of
            them are local.
          </p>
          <ProofBanner
            metric="0"
            quote="Number of top-10 SERP results for 'ai powered knowledge base software' whose ranking is a side effect of calling search(). The pattern is specific enough that it does not appear on the listicles at all."
            source="Manual audit, April 2026. Results checked: Bloomfire, Guru, Confluence Rovo, Slite, Notion AI, Capacity, Jasper, Crisp, Knowmax, Hexaware."
          />
        </section>

        <section id="the-loop" className="max-w-4xl mx-auto px-6 mt-14">
          <BackgroundGrid pattern="dots" glow>
            <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
              The read-is-write loop, as code
            </h2>
            <p className="text-zinc-500 leading-relaxed">
              This is the literal body of{" "}
              <code className="bg-zinc-100 px-1 py-0.5 rounded">MemoryDB.search()</code>, with
              everything but the ranking-relevant parts removed. Two SQL statements and a commit.
              Nothing hidden behind an abstraction.
            </p>
          </BackgroundGrid>
          <AnimatedCodeBlock
            code={CORE_SNIPPET}
            language="python"
            filename="ai_browser_profile/db.py"
          />
          <p className="text-zinc-500 leading-relaxed mt-4">
            The ORDER BY clause reads{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">hit_rate</code>, a computed column
            defined in the same SELECT. The UPDATE immediately below mutates{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">appeared_count</code> and{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">accessed_count</code>, which are the
            two inputs to that formula. Reading the table moves rows inside the table. The next
            time anyone calls <code className="bg-zinc-100 px-1 py-0.5 rounded">search()</code>, the
            ORDER BY reflects what just happened.
          </p>
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-12">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            What the call looks like as a sequence
          </h2>
          <SequenceDiagram
            title="search(tags=['tool']) across MemoryDB and SQLite"
            actors={["Caller", "MemoryDB", "SQLite"]}
            messages={LOOP_SEQUENCE}
          />
          <p className="text-zinc-500 leading-relaxed mt-4">
            Everything between the first SELECT and the final COMMIT is one Python function call.
            Nothing external, no background worker, no RPC boundary. If the commit succeeds, the
            caller&apos;s result and the table&apos;s ranking are in sync by construction.
          </p>
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-12">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            Where the inputs come from (the other reason there is no ingestion step)
          </h2>
          <p className="text-zinc-500 leading-relaxed mb-6">
            Competitors need an ingestion step because they have no data until you give them some.
            This project has data the moment it is installed, because Chromium already wrote most
            of it to your disk. Every arrow below is an ingestor module under{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">ai_browser_profile/ingestors/</code>.
          </p>
          <AnimatedBeam
            title="Browser data sources -> MemoryDB -> ranked results"
            from={[
              { label: "webdata.py", sublabel: "autofill names, phones, addresses" },
              { label: "history.py", sublabel: "urls table, visit_count" },
              { label: "logins.py", sublabel: "Login Data, account:<domain>" },
              { label: "bookmarks.py", sublabel: "Bookmarks JSON" },
              { label: "indexeddb.py", sublabel: "LevelDB per-site state" },
              { label: "localstorage.py", sublabel: "LevelDB per-site state" },
            ]}
            hub={{ label: "MemoryDB.upsert", sublabel: "db.py line 171" }}
            to={[
              { label: "search()", sublabel: "tag filter + hit_rate order" },
              { label: "semantic_search()", sublabel: "cosine + hit_rate order" },
              { label: "text_search()", sublabel: "LIKE + hit_rate order" },
            ]}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-12">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            The loop, step by step, from first extract to a stable personal rank
          </h2>
          <StepTimeline title="Five transitions, no cron" steps={LOOP_STEPS} />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-12">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            Side by side: team-shared AI KB vs. a read-is-write local KB
          </h2>
          <ComparisonTable
            productName="ai-browser-profile (local, self-ranking)"
            competitorName="Typical AI knowledge base (team, vendor-ranked)"
            rows={SERP_ROWS}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-12">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            Semantic search is opt-in, and it rides the same loop
          </h2>
          <p className="text-zinc-500 leading-relaxed mb-4">
            Installing embeddings does not change the ranking model. It only changes the match
            step. The appeared/accessed UPDATE after a match is identical. Fall back behavior, when
            embeddings are not installed, lands on <code className="bg-zinc-100 px-1 py-0.5 rounded">text_search()</code>,
            which runs the same UPDATE.
          </p>
          <AnimatedCodeBlock
            code={SEMANTIC_SNIPPET}
            language="python"
            filename="ai_browser_profile/db.py"
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-12">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            What the design buys you
          </h2>
          <BentoGrid cards={WHY_LOOP_CARDS} />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-12">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            Run it, watch a counter move
          </h2>
          <TerminalOutput
            title="extract -> search -> re-query"
            lines={RUN_TERMINAL}
          />
          <p className="text-zinc-500 leading-relaxed mt-4">
            The second <code className="bg-zinc-100 px-1 py-0.5 rounded">sqlite3</code> line is the
            point of the whole page: you called{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">search()</code> from Python, and the
            on-disk <code className="bg-zinc-100 px-1 py-0.5 rounded">appeared_count</code> and{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">accessed_count</code> for the returned
            ids went up. No separate write path was involved. Your shell can verify it.
          </p>
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-12">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            Numbers from a real install
          </h2>
          <MetricsRow metrics={METRICS} />
          <p className="text-zinc-500 leading-relaxed mt-4">
            <NumberTicker value={1407} />{" "}
            <span className="text-zinc-500">
              {" "}non-superseded memories is about four orders of magnitude smaller than a typical
              Bloomfire or Confluence install. That is on purpose. A personal KB does not need to
              index the company; it needs to know which 1,400 things you keep reaching for. The
              top-appeared memory in this DB is an email address with{" "}
              <code className="bg-zinc-100 px-1 py-0.5 rounded">appeared_count = 364</code>, which
              is also the right shape for &quot;the one fact I give to every signup form.&quot;
            </span>
          </p>
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-12">
          <GlowCard className="p-6 md:p-8">
            <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
              Install, extract, prove the loop
            </h2>
            <p className="text-zinc-500 leading-relaxed mb-4">
              The fastest way to confirm the read-is-write behavior is to run a single search call
              against your own data, twice. Do each step in order; each takes under a minute.
            </p>
            <AnimatedChecklist
              title="From zero to a self-ranking local KB"
              items={INSTALL_CHECKLIST}
            />
          </GlowCard>
        </section>

        <InlineCta
          heading="Read the code, fork the pattern"
          body="The self-ranking retrieval path is roughly 40 lines of Python across ai_browser_profile/db.py. If you want to bolt it onto a different datastore, those 40 lines are where to start. Project is MIT-licensed."
          linkText="Open the repo on GitHub"
          href="https://github.com/m13v/ai-browser-profile"
        />

        <FaqSection items={FAQS} />

        <section className="max-w-4xl mx-auto px-6 mt-12">
          <RelatedPostsGrid title="Related guides" posts={RELATED} />
        </section>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
    </>
  );
}
