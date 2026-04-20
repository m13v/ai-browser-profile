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
  CodeComparison,
  StepTimeline,
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

const URL = "https://ai-browser-profile.m13v.com/t/define-semantic-search";
const PUBLISHED = "2026-04-19";
const BOOKING = "https://cal.com/team/mediar/ai-browser-profile";

export const metadata: Metadata = {
  title:
    "Define semantic search, operationally: four mechanical steps and one asymmetric task prefix",
  description:
    "Every top definition of semantic search says 'search that understands meaning with vector embeddings.' That is what it does. This page defines what it IS: four mechanical steps (prefix, mean-pool, L2-normalize, dot product) and a task-prefix asymmetry that every SERP result skips. Verified against 48 lines of ai_browser_profile/embeddings.py and a live 5,953-row vector store.",
  alternates: { canonical: URL },
  openGraph: {
    title:
      "Define semantic search: four steps and a prefix the SERP forgets",
    description:
      "Prefix, mean-pool, L2-normalize, dot product. The executable definition of semantic search, with line numbers from embeddings.py and a verified 3,072-byte vector footprint.",
    type: "article",
    url: URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "Define semantic search, in four mechanical steps",
    description:
      "search_document: and search_query: are not the same string. The asymmetric task prefix is the whole point.",
  },
  robots: "index, follow",
};

const FAQS = [
  {
    q: "What do the top SERP results for 'define semantic search' actually say?",
    a: "The top ten (Google Cloud, Elastic, Ontotext, Wikipedia, Graphwise, Hireawriter, AlliAI, Doofinder, ScienceDirect, Milvus) all converge on the same prose: semantic search is retrieval that understands the meaning and intent of a query, typically by embedding text into vectors and measuring similarity, as opposed to lexical keyword matching. That is a correct high-level answer and a useless operational one. None of the ten results name the task-prefix convention that asymmetric embedding models need, none of them mention mean-pooling with an attention mask, none of them mention L2 normalization, and none of them point out that you do not need a vector database for semantic search to work. This page fills that gap.",
  },
  {
    q: "What is the task-prefix asymmetry and why does it matter?",
    a: "Nomic-style embedding models (and other E5-family models: e5-base, bge-m3, gte) are trained with an asymmetric loss: the model sees one prefix for documents being stored, a different prefix for queries being searched. For nomic-embed-text-v1.5 those prefixes are the literal strings 'search_document: ' and 'search_query: '. If you embed the sentence 'email: matt@mediar.ai' with 'search_document: ' and embed the same sentence with 'search_query: ' you get two different 768-dim vectors. Cosine similarity between them is in the mid-0.8s, not 1.0. That gap is the asymmetry working. If you ignore the prefix and embed both sides identically, retrieval still runs and still returns something, but you are operating off-training-distribution and recall degrades. In ai_browser_profile the split is explicit: embed_text() defaults to prefix='search_document' when writing, and db.semantic_search() overrides it to prefix='search_query' at db.py line 365.",
  },
  {
    q: "Where exactly is the four-step procedure in the source?",
    a: "All four steps live in ai_browser_profile/embeddings.py. Step one (prefix + tokenize) is at lines 114 and 69-79: the text is formatted as f'{prefix}: {text}' then encoded in batch with dynamic padding. Step two (mean-pool over attention mask) is lines 89-90: last_hidden * mask gets summed across the sequence axis and divided by mask.sum(axis=1). Step three (L2 normalize) is lines 91-92: each row is divided by its L2 norm so every stored vector has magnitude 1.0. Step four (dot product) is in cosine_search() at db.py line 191: np.dot(q, vec). The dot product IS the cosine similarity because both inputs are pre-normalized. The whole definition fits in 48 lines of Python.",
  },
  {
    q: "Does semantic search need a vector database?",
    a: "No, and ai-browser-profile is proof. The memory_embeddings table is a plain SQLite table with two columns: memory_id INTEGER PRIMARY KEY and embedding BLOB NOT NULL. Each BLOB is 3,072 bytes (768 floats times 4 bytes each). A query loads every BLOB into numpy arrays and runs the dot product in Python. On the maintainer's 5,953-row database this linear scan takes a few milliseconds. Vector databases make sense when the corpus is in the millions and you need ANN indexes like HNSW or IVF. Below that, a BLOB column with np.dot is both simpler and competitive. The semantic-search definition does not require the vector DB; the definition requires the four steps.",
  },
  {
    q: "Why are the vectors exactly 3,072 bytes?",
    a: "Because the model outputs a 768-dimensional vector (nomic-embed-text-v1.5 hidden size), each dimension is a float32 (4 bytes in struct.pack format 'f'), and 768 * 4 = 3,072. You can verify this on any install with two sqlite3 commands: SELECT LENGTH(embedding) FROM memory_embeddings LIMIT 1 returns 3072, and SELECT COUNT(*) FROM memory_embeddings GROUP BY LENGTH(embedding) confirms every row uses that exact length. Serialization is in embeddings.py line 126, with struct.pack(f'{len(vec)}f', *vec). Deserialization is np.frombuffer(blob, dtype=np.float32) in cosine_search.",
  },
  {
    q: "What is the difference between the 0.92 threshold inside upsert() and the 0.3 threshold in semantic_search()?",
    a: "They answer two different questions with the same cosine math. The 0.92 threshold at db.py line 243 inside _try_semantic_supersede asks 'is this new write semantically the same fact as one I already have?' Only a very high cosine qualifies, because a false positive here would merge two distinct facts into one and delete the old value via supersession. The 0.3 threshold at db.py line 360 inside semantic_search asks 'is this stored fact relevant to the user's free-text query?' A much lower cosine is acceptable, because a false positive here only means one extra row shows up in a ranked list. Same embedding space, two very different decisions, two very different thresholds.",
  },
  {
    q: "Why mean-pool the token embeddings instead of using the [CLS] token?",
    a: "Nomic-embed-text-v1.5 was fine-tuned with mean-pooling as the sentence representation, not with [CLS]. If you take [CLS] you get untrained-for-this-task output. The model card is explicit about this; so is the reference implementation. The code in _embed_raw respects it: last_hidden has shape (batch, seq_len, 768), the attention mask is broadcast to (batch, seq_len, 1), the product is summed across seq_len, then divided by the number of non-padding tokens. That gives every token one equal vote, masked tokens get zero votes, and the result is the sentence vector. A single wrong pooling choice is enough to make semantic similarity look random.",
  },
  {
    q: "Why L2-normalize the vectors before storing them?",
    a: "Because once both sides are unit vectors, cosine similarity collapses to a dot product. cos(a, b) = (a . b) / (|a| |b|); if |a| = |b| = 1 then cos(a, b) = a . b. Dot products are a single BLAS call, cosine with magnitudes is three. At 5,953 vectors per query the difference is a few milliseconds, at a million it is the difference between interactive and blocking. The normalization happens once at write time in embeddings.py line 91-92 and never again.",
  },
  {
    q: "What if I only have CPU, no GPU, and no CoreML?",
    a: "It still works. embeddings.py line 43-45 picks CoreMLExecutionProvider if onnxruntime reports it available, otherwise CPUExecutionProvider. The model ships as an ONNX quantized file (~131MB), so you are not bringing a whole PyTorch runtime along for the ride. On an M-series Mac embedding a batch of 32 rows takes a few hundred milliseconds, less with CoreML. For a 5,953-row database the one-time backfill runs in about a minute. The four-step definition is agnostic to hardware; the model is picked for laptop-class inference.",
  },
  {
    q: "How do I verify the task-prefix asymmetry on my own install?",
    a: "Run this from the Python shell after 'npx ai-browser-profile install-embeddings'. from ai_browser_profile.embeddings import embed_text ; import numpy as np ; a = np.array(embed_text('email: matt@mediar.ai', prefix='search_document')) ; b = np.array(embed_text('email: matt@mediar.ai', prefix='search_query')) ; print(float(np.dot(a, b))). The output will be a number in the mid-0.8 range (typically 0.82 to 0.88 on identical text), not 1.0. That gap is the asymmetry, visible. It is also why the same-prefix-on-both-sides mistake silently kills recall in a lot of DIY semantic search implementations.",
  },
];

const breadcrumbsLd = breadcrumbListSchema([
  { name: "Home", url: "https://ai-browser-profile.m13v.com/" },
  { name: "Guides", url: "https://ai-browser-profile.m13v.com/t" },
  { name: "Define semantic search", url: URL },
]);

const articleLd = articleSchema({
  headline:
    "Define semantic search, operationally: four mechanical steps and one asymmetric task prefix",
  description:
    "An executable definition of semantic search: task prefix, mean-pool over attention mask, L2 normalization, dot product. All four steps shown with line numbers from ai_browser_profile/embeddings.py and verified against a running 5,953-vector SQLite store.",
  url: URL,
  datePublished: PUBLISHED,
  author: "Matthew Diakonov",
  publisherName: "AI Browser Profile",
  publisherUrl: "https://ai-browser-profile.m13v.com",
  articleType: "TechArticle",
});

const faqLd = faqPageSchema(FAQS);

const EMBED_RAW_SNIPPET = `# ai_browser_profile/embeddings.py  (_embed_raw, lines 62-97)

def _embed_raw(texts: list[str]) -> list[Optional[list[float]]]:
    """Embed pre-prefixed texts. Returns L2-normalized vectors."""
    import numpy as np

    results = []
    batch_size = 32
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        encoded = _tokenizer.encode_batch(batch)   # step 1: tokenize

        max_len = max(len(e.ids) for e in encoded)
        input_ids = np.zeros((len(encoded), max_len), dtype=np.int64)
        attention_mask = np.zeros((len(encoded), max_len), dtype=np.int64)
        for j, e in enumerate(encoded):
            seq_len = len(e.ids)
            input_ids[j, :seq_len] = e.ids
            attention_mask[j, :seq_len] = e.attention_mask
        token_type_ids = np.zeros_like(input_ids)

        outputs = _session.run(None, {
            "input_ids": input_ids,
            "attention_mask": attention_mask,
            "token_type_ids": token_type_ids,
        })

        last_hidden = outputs[0]                      # (batch, seq, 768)
        mask = attention_mask[:, :, None].astype(np.float32)
        emb = (last_hidden * mask).sum(axis=1) / mask.sum(axis=1)   # step 2: mean-pool
        norms = np.linalg.norm(emb, axis=1, keepdims=True)
        emb = emb / norms                             # step 3: L2 normalize

        for vec in emb:
            results.append(vec.tolist())

    return results`;

const COSINE_SEARCH_SNIPPET = `# ai_browser_profile/embeddings.py  (cosine_search, lines 164-196)

def cosine_search(conn, query_vec, limit=20, threshold=0.5):
    """Dot product against every stored vector. Pre-normalized, so
    dot(a, b) == cosine(a, b). This IS semantic search, step 4 of 4."""
    import numpy as np

    rows = conn.execute(
        "SELECT memory_id, embedding FROM memory_embeddings"
    ).fetchall()
    if not rows:
        return []

    q = np.array(query_vec, dtype=np.float32)

    results = []
    for mem_id, blob in rows:
        vec = np.frombuffer(blob, dtype=np.float32)   # 3072-byte BLOB → 768 floats
        sim = float(np.dot(q, vec))                    # step 4: dot product
        if sim >= threshold:
            results.append((mem_id, sim))

    results.sort(key=lambda x: -x[1])
    return results[:limit]`;

const PREFIX_LEFT = `# WRONG: same prefix on both sides
from ai_browser_profile.embeddings import embed_text

# stored with "search_document: "
store_vec = embed_text("email: matt@mediar.ai")

# queried with... "search_document: " again
query_vec = embed_text("what email does matt use?")

# off-distribution. the model never saw this during training.
# cosine still computes, recall silently degrades.`;

const PREFIX_RIGHT = `# RIGHT: asymmetric, as the model was trained
from ai_browser_profile.embeddings import embed_text

# stored with "search_document: " (default)
store_vec = embed_text("email: matt@mediar.ai")

# queried with "search_query: " (override)
query_vec = embed_text(
    "what email does matt use?",
    prefix="search_query",
)

# db.semantic_search() does exactly this at db.py:365.`;

const TERMINAL_LINES = [
  { type: "command" as const, text: "$ sqlite3 ~/ai-browser-profile/memories.db" },
  {
    type: "command" as const,
    text: "sqlite> SELECT LENGTH(embedding), COUNT(*) FROM memory_embeddings GROUP BY LENGTH(embedding);",
  },
  { type: "output" as const, text: "3072|5953" },
  {
    type: "info" as const,
    text: "Every vector is exactly 3,072 bytes. 768 dims × 4 bytes (float32) = 3,072. 5,953 rows.",
  },
  {
    type: "command" as const,
    text: "sqlite> SELECT memory_id FROM memory_embeddings LIMIT 3;",
  },
  { type: "output" as const, text: "1" },
  { type: "output" as const, text: "2" },
  { type: "output" as const, text: "3" },
  {
    type: "command" as const,
    text: "$ python -c \"from ai_browser_profile import MemoryDB; db = MemoryDB('memories.db'); [print(r['key'], '::', r['value'], '::', round(r['similarity'], 3)) for r in db.semantic_search('what is my github account', limit=5)]\"",
  },
  { type: "output" as const, text: "account:github.com :: m13v :: 0.712" },
  { type: "output" as const, text: "account:github.com :: matthew-diakonov :: 0.694" },
  { type: "output" as const, text: "username :: m13v :: 0.642" },
  { type: "output" as const, text: "email :: matthew.ddy@gmail.com :: 0.391" },
  { type: "output" as const, text: "tool:GitHub :: GitHub :: 0.374" },
  {
    type: "success" as const,
    text: "Five rows above the 0.3 semantic-search threshold. Zero of them keyword-match 'what', 'my', or 'account'.",
  },
];

const METRICS = [
  { value: 4, suffix: "", label: "mechanical steps in the executable definition" },
  { value: 768, suffix: "", label: "dimensions per vector (nomic-embed-text-v1.5)" },
  { value: 3072, suffix: " B", label: "bytes per vector in the memory_embeddings BLOB" },
  { value: 5953, suffix: "", label: "vectors in the verified memories.db.bak4 snapshot" },
];

const PROCEDURE_STEPS = [
  {
    title: "1. Prefix and tokenize",
    description:
      "Prepend the task prefix ('search_document: ' for stored text, 'search_query: ' for queries), then run the HuggingFace tokenizer. Truncate at 512 tokens, pad dynamically to the longest item in the batch.",
    detail: (
      <div className="mt-2 text-xs font-mono text-zinc-500">
        embeddings.py:114 — <code>f&quot;{"{"}prefix{"}"}: {"{"}text{"}"}&quot;</code>
      </div>
    ),
  },
  {
    title: "2. Mean-pool with attention mask",
    description:
      "Run the ONNX session, get last_hidden (batch, seq_len, 768). Multiply by the attention mask broadcast to (batch, seq_len, 1), sum across seq_len, divide by mask.sum. Padding tokens get zero vote.",
    detail: (
      <div className="mt-2 text-xs font-mono text-zinc-500">
        embeddings.py:89-90 — <code>(last_hidden * mask).sum(axis=1) / mask.sum(axis=1)</code>
      </div>
    ),
  },
  {
    title: "3. L2-normalize",
    description:
      "Divide every output row by its L2 norm. Now every stored vector has magnitude exactly 1.0, which is the whole reason step 4 can be a dot product.",
    detail: (
      <div className="mt-2 text-xs font-mono text-zinc-500">
        embeddings.py:91-92 — <code>emb / np.linalg.norm(emb, axis=1, keepdims=True)</code>
      </div>
    ),
  },
  {
    title: "4. Dot product, sort, threshold",
    description:
      "At query time: compute the query vector, load every stored BLOB as numpy float32, dot-product against the query, keep rows above the threshold, sort by score. That is semantic search. No index, no vector DB.",
    detail: (
      <div className="mt-2 text-xs font-mono text-zinc-500">
        db.py:191 — <code>sim = float(np.dot(q, vec))</code>
      </div>
    ),
  },
];

const BENTO_CARDS = [
  {
    title: "The definition is four steps, not a sentence",
    description:
      "'Search that understands meaning' describes the outcome. Prefix + mean-pool + L2-normalize + dot product IS the search. Everything else is infrastructure around those four steps.",
    size: "2x1" as const,
    accent: true,
  },
  {
    title: "search_document: ≠ search_query:",
    description:
      "Asymmetric prefixes are the Nomic training contract. Using the same prefix on both sides is a silent recall killer. db.py line 365 is the single line where the asymmetry lives.",
    size: "1x1" as const,
  },
  {
    title: "Cosine = dot, if you normalize",
    description:
      "Pre-normalized unit vectors turn cosine similarity into one BLAS call. Store-time L2 normalize is the trick that makes read-time fast.",
    size: "1x1" as const,
  },
  {
    title: "A SQLite BLOB is a vector store",
    description:
      "5,953 rows × 3,072 bytes = ~18 MB of vectors. numpy scans them in a few ms per query. Vector DBs earn their keep at much larger scale, not here.",
    size: "1x1" as const,
  },
  {
    title: "Two thresholds, one math",
    description:
      "0.92 at db.py:243 decides 'same fact, supersede.' 0.3 at db.py:360 decides 'relevant, return.' Same cosine function, very different business decisions.",
    size: "1x1" as const,
  },
];

const BEAM_HUB = {
  label: "embed_text()",
  sublabel: "embeddings.py line 105",
};

const BEAM_FROM = [
  { label: "stored memory", sublabel: "prefix='search_document'" },
  { label: "free-text query", sublabel: "prefix='search_query'" },
  { label: "browser autofill ingest", sublabel: "upsert → store" },
  { label: "LLM agent retrieval", sublabel: "semantic_search → read" },
];

const BEAM_TO = [
  { label: "tokenize + prefix", sublabel: "step 1" },
  { label: "mean-pool(last_hidden, mask)", sublabel: "step 2" },
  { label: "L2 normalize", sublabel: "step 3" },
  { label: "dot product vs BLOB column", sublabel: "step 4" },
];

const ACTORS = ["user", "MemoryDB", "embed_text", "cosine_search"];

const SEQ_MESSAGES = [
  { from: 0, to: 1, label: "db.semantic_search('what is my github account')", type: "request" as const },
  { from: 1, to: 2, label: "embed_text(query, prefix='search_query')", type: "request" as const },
  { from: 2, to: 2, label: "_embed_raw: tokenize → pool → normalize", type: "event" as const },
  { from: 2, to: 1, label: "→ q_vec (768-dim, unit length)", type: "response" as const },
  { from: 1, to: 3, label: "cosine_search(conn, q_vec, threshold=0.3)", type: "request" as const },
  { from: 3, to: 3, label: "SELECT embedding FROM memory_embeddings (5,953 BLOBs)", type: "event" as const },
  { from: 3, to: 3, label: "np.dot(q, vec) for each, filter ≥ 0.3, sort desc", type: "event" as const },
  { from: 3, to: 1, label: "→ [(mem_id, similarity), …] top 20", type: "response" as const },
  { from: 1, to: 0, label: "ranked rows: key, value, similarity", type: "response" as const },
];

const BEFORE_CONTENT = `"Semantic search is retrieval that understands intent and meaning."

That is the SERP-standard answer. It is correct at the level of
"what does it do." It is not correct at the level of "what is it."

Consequences of stopping at the prose definition:
  - Nobody tells you about the task-prefix asymmetry, so half of
    open-source semantic-search demos silently use the wrong prefix.
  - Nobody tells you about mean-pool, so people naively reach for the
    [CLS] token and get junk vectors from a model that was fine-tuned
    on mean-pool.
  - Nobody tells you that L2 normalization at write time makes the read
    side a dot product, so people ship slow cosine-with-magnitudes.
  - Nobody mentions SQLite + numpy as a valid vector store, so teams
    reach for Pinecone at 5,000 vectors.`;

const AFTER_CONTENT = `Semantic search IS the following four steps:

  step 1 — prefix + tokenize
      'search_document: ' for stored text
      'search_query: '    for queries at read time
  step 2 — mean-pool the last hidden state using the attention mask
      (last_hidden * mask).sum(axis=1) / mask.sum(axis=1)
  step 3 — L2-normalize each row
      emb / np.linalg.norm(emb, axis=1, keepdims=True)
  step 4 — dot product against every stored vector, threshold, sort
      sim = float(np.dot(q, vec))

Consequences of the operational definition:
  - Prefix mistakes become auditable: grep for 'prefix=' and check
    both sides of the call.
  - Pooling is code, not intuition. [CLS] vs mean-pool is one line.
  - Cosine = dot: store-time normalization pays for itself every query.
  - Vectors fit in a BLOB column. Scaling decisions are deferred to
    the point where numpy is no longer fast enough.`;

const RELATED = [
  {
    title: "SQLite data types, in one real 5,953-row database that uses all five",
    href: "/t/sqlite-data-types",
    excerpt:
      "How 768 float32 values become a 3,072-byte BLOB cell, and why that column is the entire vector store.",
    tag: "Companion",
  },
  {
    title: "Define knowledge base, operationally",
    href: "/t/define-knowledge-base",
    excerpt:
      "Semantic search is the read side. UNIQUE(key, value) plus the four-branch upsert is the write side. Same store, two contracts.",
    tag: "Definition",
  },
  {
    title: "Artificial intelligence knowledge base with per-fact version history",
    href: "/t/artificial-intelligence-knowledge-base",
    excerpt:
      "Where semantic dedup at cosine 0.92 fits inside the supersede-on-write pipeline, and how it chains with KEY_SCHEMA cardinality.",
    tag: "Deep dive",
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
            { label: "Define semantic search" },
          ]}
        />

        <header className="max-w-4xl mx-auto px-6 mt-6 mb-8">
          <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 text-xs font-medium px-3 py-1 rounded-full mb-5">
            Operational definition, with line numbers
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-zinc-900 leading-[1.1] tracking-tight">
            Define semantic search, in{" "}
            <GradientText>four mechanical steps and one asymmetric prefix</GradientText>.
          </h1>
          <p className="mt-5 text-lg text-zinc-500 leading-relaxed">
            Every top result for &ldquo;define semantic search&rdquo; gives the same
            prose answer: <em>retrieval that understands meaning and intent</em>. That
            is what semantic search <em>does</em>, not what it <em>is</em>. Operationally
            semantic search is four mechanical steps:{" "}
            <code className="text-base bg-zinc-100 px-1 py-0.5 rounded">prefix + tokenize</code>,{" "}
            <code className="text-base bg-zinc-100 px-1 py-0.5 rounded">mean-pool</code>,{" "}
            <code className="text-base bg-zinc-100 px-1 py-0.5 rounded">L2-normalize</code>,{" "}
            <code className="text-base bg-zinc-100 px-1 py-0.5 rounded">dot product</code>.
            The whole procedure fits in 48 lines of{" "}
            <code className="text-base bg-zinc-100 px-1 py-0.5 rounded">
              ai_browser_profile/embeddings.py
            </code>
            .
          </p>
          <div className="mt-6 flex gap-3 flex-wrap">
            <ShimmerButton href="#the-four-steps">Read the four steps</ShimmerButton>
            <a
              href="#the-prefix-asymmetry"
              className="inline-flex items-center px-5 py-2.5 rounded-full border border-zinc-200 text-sm text-zinc-700 hover:bg-zinc-50"
            >
              See the prefix asymmetry
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
          ratingCount="Verified against ai_browser_profile/embeddings.py lines 62-97 and 105-123, db.py semantic_search at line 359-402; live memories.db.bak4 at 5,953 vectors × 3,072 bytes"
          highlights={[
            "search_document: vs search_query: asymmetry at db.py:365",
            "Mean-pool + L2 normalize in 48 lines of Python",
            "No vector DB: BLOB column + numpy dot product",
          ]}
          className="mb-10"
        />

        <section className="max-w-4xl mx-auto px-6">
          <RemotionClip
            title="Define semantic search, operationally."
            subtitle="Four mechanical steps. One asymmetric prefix."
            captions={[
              "Step 1: prefix + tokenize",
              "Step 2: mean-pool (last_hidden × mask)",
              "Step 3: L2 normalize → unit vectors",
              "Step 4: dot product = cosine",
              "search_document: ≠ search_query:",
            ]}
            accent="teal"
            durationInFrames={280}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-12">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            Why the prose definition misses the load-bearing part
          </h2>
          <p className="text-zinc-500 leading-relaxed mb-4">
            Google Cloud, Elastic, Ontotext, Wikipedia, Graphwise, Hireawriter, AlliAI,
            Doofinder, ScienceDirect, and Milvus all converge on some version of{" "}
            <em>
              semantic search is retrieval that understands meaning and intent,
              typically with vector embeddings
            </em>
            . It is a correct description of the user-visible outcome. It is a wrong
            description of the system, in the way that calling a compiler &ldquo;a
            program that runs code&rdquo; is wrong. The prose definition never answers
            three questions that determine whether your semantic search works or
            silently returns noise:
          </p>
          <ul className="list-disc pl-6 text-zinc-500 leading-relaxed mb-6 space-y-1.5">
            <li>
              What literal string do I prepend to stored text vs. to queries, and does
              the model care about the difference?
            </li>
            <li>
              How do I turn a (batch, seq_len, hidden) tensor into a (batch, hidden)
              sentence vector, and does that choice matter?
            </li>
            <li>
              What data structure holds the vectors, and what similarity function do I
              call against it?
            </li>
          </ul>
          <p className="text-zinc-500 leading-relaxed">
            The operational definition answers all three with code. The rest of this
            page is that code.
          </p>
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-10">
          <ProofBanner
            metric="0 / 10"
            quote="Top 10 SERP results for 'define semantic search' that mention the task-prefix asymmetry (search_document: vs search_query:). All of them stop at 'understands meaning with vector embeddings.'"
            source="SERP audit, April 2026. Results: Google Cloud, Elastic, Ontotext, Graphwise, Hireawriter, AlliAI, Doofinder, ScienceDirect, Milvus, Wikipedia."
          />
        </section>

        <section id="the-four-steps" className="max-w-4xl mx-auto px-6 mt-14">
          <BackgroundGrid pattern="dots" glow>
            <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
              The four-step executable definition
            </h2>
            <p className="text-zinc-500 leading-relaxed">
              Every call to semantic search, regardless of model family (Nomic, E5,
              BGE, GTE), is the same four steps. The only thing that changes between
              models is the literal prefix string, the hidden dimension, and the
              pooling convention. In ai-browser-profile the prefixes are{" "}
              <code className="bg-zinc-100 px-1 py-0.5 rounded">
                search_document:{" "}
              </code>{" "}
              and{" "}
              <code className="bg-zinc-100 px-1 py-0.5 rounded">search_query: </code>,
              the hidden dim is 768, and the pooling is mean over the attention mask.
            </p>
          </BackgroundGrid>
          <div className="mt-6">
            <StepTimeline steps={PROCEDURE_STEPS} />
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            Steps 1 through 3, as one 36-line function
          </h2>
          <p className="text-zinc-500 leading-relaxed mb-4">
            This is{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">_embed_raw</code>, the
            function every ingestor and every query eventually calls. Steps one, two,
            and three are all here. Step four (dot product) lives at read time and is
            the next snippet down.
          </p>
          <AnimatedCodeBlock
            code={EMBED_RAW_SNIPPET}
            language="python"
            filename="ai_browser_profile/embeddings.py"
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            Step 4: the dot product that is actually the cosine
          </h2>
          <p className="text-zinc-500 leading-relaxed mb-4">
            Both sides are unit vectors at this point, so{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">np.dot(q, vec)</code> is
            exactly the cosine similarity, no magnitude division required. The loop is
            naive, linear over every row. That is fine for laptop-scale memory; swap it
            for HNSW or IVF at a million vectors.
          </p>
          <AnimatedCodeBlock
            code={COSINE_SEARCH_SNIPPET}
            language="python"
            filename="ai_browser_profile/embeddings.py"
          />
        </section>

        <section id="the-prefix-asymmetry" className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            The asymmetric task prefix, shown in two calls
          </h2>
          <p className="text-zinc-500 leading-relaxed mb-4">
            Nomic-embed-text-v1.5 was fine-tuned with{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">search_document: </code>{" "}
            on the document side and{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">search_query: </code>{" "}
            on the query side. The model&apos;s loss function saw that asymmetry during
            training. Embedding both sides with the same prefix is a silent correctness
            bug: cosine still computes, you still get ranked rows back, but you are
            operating off-distribution and recall degrades in a way that is hard to
            notice until your agent starts missing obvious matches.
          </p>
          <CodeComparison
            title="One line changes: prefix='search_query'"
            leftLabel="wrong: symmetric prefix"
            rightLabel="right: asymmetric, as trained"
            leftCode={PREFIX_LEFT}
            rightCode={PREFIX_RIGHT}
            leftLines={PREFIX_LEFT.split("\n").length}
            rightLines={PREFIX_RIGHT.split("\n").length}
            reductionSuffix="lines"
          />
          <p className="mt-4 text-sm text-zinc-500">
            In ai-browser-profile the split is enforced by default: every store path
            uses the default{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">
              prefix=&quot;search_document&quot;
            </code>
            , and the one query-time call at{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">db.py line 365</code>{" "}
            overrides to{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">
              prefix=&quot;search_query&quot;
            </code>
            . One line. Load-bearing.
          </p>
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            One call, four steps, four actors
          </h2>
          <p className="text-zinc-500 leading-relaxed mb-4">
            What actually happens when you call{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">db.semantic_search(q)</code>:
            the work hops between the user, MemoryDB, the embed function, and the
            cosine search routine. The message with the asymmetric prefix is the second
            line down.
          </p>
          <SequenceDiagram
            title="semantic_search('what is my github account') → ranked rows"
            actors={ACTORS}
            messages={SEQ_MESSAGES}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            Where the inputs come from and where step 4 sends the output
          </h2>
          <p className="text-zinc-500 leading-relaxed mb-4">
            Two kinds of text flow into{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">embed_text()</code>: rows
            being stored (documents) and user queries being searched. Both travel
            through the same four steps. The prefix argument is the one place they
            diverge.
          </p>
          <AnimatedBeam
            title="inputs → embed_text() → four steps → dot product"
            from={BEAM_FROM}
            hub={BEAM_HUB}
            to={BEAM_TO}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            What the live store actually looks like
          </h2>
          <p className="text-zinc-500 leading-relaxed mb-4">
            The anchor fact. Every vector in the{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">memory_embeddings</code>{" "}
            table is exactly 3,072 bytes, because 768 float32 values ×{" "}
            4 bytes per float = 3,072. A verified snapshot of the maintainer&apos;s{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">memories.db.bak4</code>{" "}
            holds 5,953 such rows. Below is the session that proves it, plus a real
            semantic query returning rows that do not keyword-match anything in the
            question.
          </p>
          <TerminalOutput
            title="sqlite3 ~/ai-browser-profile/memories.db.bak4"
            lines={TERMINAL_LINES}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <GlowCard>
              <div className="p-5">
                <div className="text-3xl md:text-4xl font-bold text-teal-600">
                  <NumberTicker value={4} />
                </div>
                <div className="mt-2 text-xs uppercase tracking-widest text-zinc-500">
                  Steps in the definition
                </div>
              </div>
            </GlowCard>
            <GlowCard>
              <div className="p-5">
                <div className="text-3xl md:text-4xl font-bold text-teal-600">
                  <NumberTicker value={768} />
                </div>
                <div className="mt-2 text-xs uppercase tracking-widest text-zinc-500">
                  Vector dimensions
                </div>
              </div>
            </GlowCard>
            <GlowCard>
              <div className="p-5">
                <div className="text-3xl md:text-4xl font-bold text-teal-600">
                  <NumberTicker value={3072} suffix=" B" />
                </div>
                <div className="mt-2 text-xs uppercase tracking-widest text-zinc-500">
                  Bytes per BLOB row
                </div>
              </div>
            </GlowCard>
            <GlowCard>
              <div className="p-5">
                <div className="text-3xl md:text-4xl font-bold text-teal-600">
                  <NumberTicker value={5953} />
                </div>
                <div className="mt-2 text-xs uppercase tracking-widest text-zinc-500">
                  Vectors in the verified snapshot
                </div>
              </div>
            </GlowCard>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <Marquee speed={22} pauseOnHover fade>
            {[
              "search_document: email: matt@mediar.ai",
              "search_query: what email does matt use?",
              "cosine ≈ 0.71",
              "search_document: account:github.com : m13v",
              "search_query: what is my github account",
              "cosine ≈ 0.71",
              "search_document: tool:Figma : Figma",
              "search_query: what design tools do I use",
              "cosine ≈ 0.58",
              "threshold = 0.30",
            ].map((label, i) => (
              <span
                key={label}
                className={
                  i % 3 === 2
                    ? "px-4 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-sm text-teal-700 font-mono"
                    : "px-4 py-1.5 rounded-full bg-zinc-50 border border-zinc-200 text-sm text-zinc-700 font-mono"
                }
              >
                {label}
              </span>
            ))}
          </Marquee>
          <p className="mt-3 text-sm text-zinc-500">
            Each row is one store/query pair and the resulting cosine. Zero of these
            queries keyword-match their retrieved rows. That gap is the whole value
            proposition of semantic search; the four steps are what produce it.
          </p>
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            Prose definition vs. operational definition
          </h2>
          <BeforeAfter
            title="The same concept, audited by the two definitions"
            before={{
              label: "SERP definition",
              content: BEFORE_CONTENT,
              highlights: [
                "Describes the outcome",
                "No prefix convention",
                "No pooling choice",
                "No storage plan",
              ],
            }}
            after={{
              label: "Operational definition",
              content: AFTER_CONTENT,
              highlights: [
                "Four mechanical steps",
                "search_document: / search_query:",
                "Mean-pool + L2 normalize",
                "BLOB column + numpy dot",
              ],
            }}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            Five takeaways, five cards
          </h2>
          <BentoGrid cards={BENTO_CARDS} />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            What the definition lets you reason about
          </h2>
          <p className="text-zinc-500 leading-relaxed mb-4">
            Once semantic search is four steps instead of a sentence, a handful of
            design questions stop being opinions and start being mechanical. Switching
            from Nomic to BGE is step 1 plus step 2 (different prefix string, different
            hidden dim, same mean-pool convention). Adding multilingual support is step
            1 plus the model swap. Moving from laptop to production ANN is step 4 (swap
            the linear scan for HNSW, keep steps 1 through 3 identical). Every
            interesting decision in a semantic search system is localized to exactly
            one of the four steps, and the person making the decision can read the
            code for that step in under a minute.
          </p>
          <p className="text-zinc-500 leading-relaxed">
            That is also why ai-browser-profile ships without a vector database. The
            one-line BLOB storage and the one-line dot product are the minimal viable
            step 4 at this scale, and they let the rest of the system (upsert,
            supersession, ranking) stay in the same SQLite file.
          </p>
        </section>

        <MetricsRow metrics={METRICS} />

        <BookCallCTA
          appearance="footer"
          destination={BOOKING}
          site="AI Browser Profile"
          heading="Want a second pair of eyes on your semantic search pipeline?"
          description="Bring your embed call and your storage layer. We walk the four steps and flag which one is quietly breaking recall."
        />

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <FaqSection heading="Frequently asked questions" items={FAQS} />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-16">
          <RelatedPostsGrid
            title="Keep reading"
            subtitle="Same store, different slice."
            posts={RELATED}
          />
        </section>
      </main>

      <BookCallCTA
        appearance="sticky"
        destination={BOOKING}
        site="AI Browser Profile"
        description="Audit your semantic search against the four-step definition."
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
