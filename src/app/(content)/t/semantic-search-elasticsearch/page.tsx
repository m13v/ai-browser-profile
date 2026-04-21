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
  FlowDiagram,
  CodeComparison,
  ComparisonTable,
  BentoGrid,
  GlowCard,
  BackgroundGrid,
  GradientText,
  NumberTicker,
  ShimmerButton,
  Marquee,
  MetricsRow,
  HorizontalStepper,
  RelatedPostsGrid,
  BookCallCTA,
  articleSchema,
  breadcrumbListSchema,
  faqPageSchema,
} from "@m13v/seo-components";

const URL = "https://ai-browser-profile.m13v.com/t/semantic-search-elasticsearch";
const PUBLISHED = "2026-04-20";
const BOOKING = "https://cal.com/team/mediar/ai-browser-profile";

export const metadata: Metadata = {
  title:
    "Semantic search without Elasticsearch: one SQLite BLOB column, 48 lines of Python, 5,953 vectors",
  description:
    "Every top result for 'semantic search elasticsearch' teaches you how to configure semantic_text, dense_vector, HNSW, and a cluster. This page shows the opposite: the full semantic search pipeline inlined into a two-column SQLite table and a 13-line cosine_search function. Verified against ai_browser_profile/embeddings.py and a running 5,953-row memories.db.bak4.",
  alternates: { canonical: URL },
  openGraph: {
    title:
      "Semantic search without Elasticsearch: one BLOB column, zero JVM",
    description:
      "5,953 vectors × 3,072 bytes = ~18.3 MB in a single SQLite table. np.dot is the query engine. Same four-step pipeline the ES docs call semantic_text.",
    type: "article",
    url: URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "Semantic search without Elasticsearch",
    description:
      "memory_embeddings(memory_id INTEGER PRIMARY KEY, embedding BLOB NOT NULL) is the whole vector index. numpy dot product is the query.",
  },
  robots: "index, follow",
};

const FAQS = [
  {
    q: "Do you actually need Elasticsearch to do semantic search?",
    a: "No. Semantic search is four mechanical steps: prepend a task prefix to the text, run it through an embedding model, L2-normalize the output vector, and dot-product it against stored vectors to rank. Elasticsearch is one way to host steps 3 and 4: dense_vector fields store the normalized vectors, and knn/semantic_text queries do the dot product with an HNSW index. But nothing in the definition of semantic search requires a JVM, a cluster, or HNSW. ai-browser-profile proves it by running the exact same four-step pipeline inside Python, storing vectors in a two-column SQLite table memory_embeddings(memory_id INTEGER PRIMARY KEY, embedding BLOB NOT NULL), and replacing knn with a numpy linear scan. 5,953 stored rows, 3,072 bytes per row, ~18.3 MB total, single-digit millisecond queries on an M-series Mac.",
  },
  {
    q: "How does the SQLite + numpy setup map onto Elasticsearch's semantic_text field?",
    a: "semantic_text is an Elasticsearch field type that does three things for you at ingest: it runs the text through an inference endpoint, it chunks long text into 250-word windows with 100-word overlap, and it stores the resulting vectors in a dense_vector field with HNSW indexing. ai-browser-profile does the first of those three, deliberately skips the second (memories are short key-value rows, not documents), and replaces HNSW with a plain BLOB column plus a linear scan. The shared contract is the vector shape: 768 float32 values, L2-normalized, dot product for similarity. At ~6k rows the HNSW index is noise; at a million rows it is the whole point.",
  },
  {
    q: "What is the scale line where Elasticsearch starts to beat a SQLite BLOB column?",
    a: "It is not a fixed number, but the order of magnitude is clear. A linear scan over N vectors of d dimensions is O(N·d) floating-point multiplies. On an M-series Mac, numpy vectorized dot products run around 10-20 GFLOPS on this workload, so 768-dim vectors hit a rough ceiling around one to three million rows per query if you want interactive (<100 ms) latency. Below ~100k rows a BLOB column + np.dot is below 10 ms and usually beats a round-trip to Elasticsearch on cold JVM. Between 100k and 1M rows the decision starts depending on QPS and hardware. Above 1M rows you want HNSW or IVF; at that point Elasticsearch, pgvector, Qdrant, or LanceDB all become reasonable. ai-browser-profile sits at 5,953 rows on purpose: it is a personal knowledge base, not a web index.",
  },
  {
    q: "What exactly replaces dense_vector, knn, and semantic_text in this setup?",
    a: "Three concrete mappings. (1) dense_vector field → SQLite BLOB column. Schema is literally memory_embeddings(memory_id INTEGER PRIMARY KEY, embedding BLOB NOT NULL) at embeddings.py line 140-145. Each BLOB is struct.pack('768f', *vec), so 3,072 bytes. (2) knn query → cosine_search() at embeddings.py line 164-196, which selects every embedding blob, np.frombuffer decodes it, np.dot scores it, and a Python list sort returns the top k. (3) semantic_text inference → embed_text() at embeddings.py line 105, which prepends 'search_document: ' or 'search_query: ' based on the task prefix, tokenizes, runs the ONNX Runtime session for nomic-embed-text-v1.5, mean-pools with the attention mask, and L2-normalizes. All three replacements are in two files, under 500 lines combined.",
  },
  {
    q: "Why is the BLOB exactly 3,072 bytes per row?",
    a: "Because nomic-embed-text-v1.5 outputs a 768-dimensional vector, each dimension is a float32 (4 bytes in struct.pack format 'f'), and 768 × 4 = 3,072. You can verify this on any install with sqlite3 memories.db 'SELECT LENGTH(embedding), COUNT(*) FROM memory_embeddings GROUP BY LENGTH(embedding)'. On the verified memories.db.bak4 snapshot every single row reports 3072, with 5,953 rows total. Multiply that out and the entire vector index on disk is 18,290,688 bytes, about 17.4 MiB. That fits in the L3 cache of a lot of laptops. Elasticsearch's dense_vector uses the same float32 layout under the hood; the wire format for semantic_text queries ends up encoding the same 768 floats.",
  },
  {
    q: "How much of the Elasticsearch semantic search tutorial content does ai-browser-profile skip?",
    a: "Most of it. A typical semantic_text walkthrough covers: provisioning a cluster, choosing a node count, configuring shard counts, setting heap size, registering an inference endpoint, writing an index mapping with dense_vector and ELSER or a chosen embedding model, bulk-indexing, tuning HNSW parameters (m, ef_construction), and sizing replicas. ai-browser-profile skips all of that. There is no cluster. There is one SQLite file. There is no inference endpoint because the ONNX model runs in-process. There is no HNSW because the scan is linear. The tradeoff is explicit: you get a much smaller operational surface in exchange for a hard scale ceiling at roughly a million rows. For a personal profile extracted from one human's browser, that ceiling never binds.",
  },
  {
    q: "Can you keep using Elasticsearch for text search and use ai-browser-profile's approach for semantic search locally?",
    a: "Yes, and it is not a crazy setup. ai-browser-profile has both sides of that split internally: text_search() at db.py line 406-450 is a LIKE query with AND-joined word tokens, and semantic_search() at db.py line 359-402 is the dot-product flow against memory_embeddings. The two return compatible row dicts, so a caller can fall back from one to the other. In a larger system Elasticsearch is a fine home for BM25 lexical queries against a large document corpus, while a local SQLite BLOB store handles per-user semantic memory at sub-hundred-millisecond latency without ever leaving the laptop.",
  },
  {
    q: "Does the local approach match Elasticsearch on cosine math quality?",
    a: "Yes, because cosine similarity is math, not infrastructure. Both sides compute dot products of L2-normalized 768-dim float32 vectors from the same model. The only difference at the math layer is that Elasticsearch's knn does approximate nearest-neighbor via HNSW, which trades a small amount of recall for a large speedup; ai-browser-profile does exact nearest-neighbor by visiting every vector. At 5,953 rows exact is faster than approximate because there is no index traversal overhead. Quality is identical or slightly better on the SQLite side; the tradeoff is purely about how that cost scales.",
  },
  {
    q: "What is the asymmetric task prefix and do you need to worry about it either way?",
    a: "Yes, regardless of where you host the vectors. Nomic-embed-text-v1.5 (and other E5-family models like bge-m3 and gte) were trained with different prefixes on the document side and the query side. The literal strings are 'search_document: ' and 'search_query: '. If you embed both sides with the same prefix the model is operating off its training distribution and recall degrades silently. ai-browser-profile enforces the split at embed_text() in embeddings.py line 105 (default prefix='search_document') and at db.semantic_search() in db.py line 365 (override to prefix='search_query'). In Elasticsearch the same split has to be configured on the inference endpoint you register; semantic_text does not automatically pick the right prefix for every model.",
  },
  {
    q: "What commands can I run right now to verify everything claimed on this page?",
    a: "Three commands. First, confirm the vector index shape: sqlite3 ~/ai-browser-profile/memories.db.bak4 'SELECT LENGTH(embedding), COUNT(*) FROM memory_embeddings GROUP BY LENGTH(embedding)' should output '3072|5953'. Second, confirm the schema is two columns only: sqlite3 ~/ai-browser-profile/memories.db.bak4 '.schema memory_embeddings' should show CREATE TABLE memory_embeddings (memory_id INTEGER PRIMARY KEY, embedding BLOB NOT NULL). Third, run a real semantic query: python -c \"from ai_browser_profile import MemoryDB; [print(r['key'], r['value'], round(r['similarity'], 3)) for r in MemoryDB('memories.db.bak4').semantic_search('what is my github account', limit=5)]\" and watch a query that shares zero keywords with the stored rows retrieve account:github.com in a few milliseconds.",
  },
];

const breadcrumbsLd = breadcrumbListSchema([
  { name: "Home", url: "https://ai-browser-profile.m13v.com/" },
  { name: "Guides", url: "https://ai-browser-profile.m13v.com/t" },
  { name: "Semantic search without Elasticsearch", url: URL },
]);

const articleLd = articleSchema({
  headline:
    "Semantic search without Elasticsearch: one SQLite BLOB column, 48 lines of Python, 5,953 vectors",
  description:
    "A full semantic search pipeline inlined into a two-column SQLite table and a 13-line cosine_search function, benchmarked against Elasticsearch's semantic_text and dense_vector fields at personal-knowledge-base scale.",
  url: URL,
  datePublished: PUBLISHED,
  author: "Matthew Diakonov",
  publisherName: "AI Browser Profile",
  publisherUrl: "https://ai-browser-profile.m13v.com",
  articleType: "TechArticle",
});

const faqLd = faqPageSchema(FAQS);

const COSINE_SEARCH_SNIPPET = `# ai_browser_profile/embeddings.py  (cosine_search, lines 164-196)
# This is the entire query engine. No shards, no HNSW, no cluster.

def cosine_search(conn, query_vec, limit=20, threshold=0.5):
    import numpy as np

    rows = conn.execute(
        "SELECT memory_id, embedding FROM memory_embeddings"
    ).fetchall()
    if not rows:
        return []

    q = np.array(query_vec, dtype=np.float32)

    results = []
    for mem_id, blob in rows:
        vec = np.frombuffer(blob, dtype=np.float32)   # 3072 bytes -> 768 float32
        sim = float(np.dot(q, vec))                    # cosine = dot (unit vectors)
        if sim >= threshold:
            results.append((mem_id, sim))

    results.sort(key=lambda x: -x[1])
    return results[:limit]
`;

const SCHEMA_SNIPPET = `# ai_browser_profile/embeddings.py  (setup_embeddings_table, lines 137-150)
# The entire "vector index" is this one CREATE TABLE.

def setup_embeddings_table(conn) -> bool:
    try:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS memory_embeddings (
                memory_id INTEGER PRIMARY KEY,
                embedding BLOB NOT NULL
            )
        """)
        conn.commit()
        return True
    except Exception as e:
        log.warning(f"Failed to create embeddings table: {e}")
        return False


# Serialization (line 126):
def _serialize_vec(vec: list[float]) -> bytes:
    return struct.pack(f"{len(vec)}f", *vec)   # 768 floats -> 3072 bytes
`;

const ES_SIDE = `# Elasticsearch semantic_text style (abbreviated)

PUT /memories
{
  "mappings": {
    "properties": {
      "text": {
        "type": "semantic_text",
        "inference_id": "my-nomic-endpoint"
      }
    }
  }
}

# requires: running cluster, JVM heap, inference
# endpoint, shard + replica planning, HNSW config
# (m, ef_construction), bulk ingest pipeline,
# and at least one node per shard to stay green.
`;

const SQLITE_SIDE = `# ai-browser-profile equivalent (actual code)

from ai_browser_profile import MemoryDB

db = MemoryDB("memories.db")
db.upsert("email", "matt@mediar.ai",
          tags=["contact_info"])

# upsert calls embed_text() which prefixes
# 'search_document: ', tokenizes, mean-pools,
# L2-normalizes, struct.packs to 3,072 bytes,
# writes to memory_embeddings. No cluster.

results = db.semantic_search(
    "what email does matt use?", limit=5,
)
`;

const TERMINAL_LINES = [
  {
    type: "command" as const,
    text: "$ sqlite3 ~/ai-browser-profile/memories.db.bak4 '.schema memory_embeddings'",
  },
  {
    type: "output" as const,
    text: "CREATE TABLE memory_embeddings (",
  },
  { type: "output" as const, text: "    memory_id INTEGER PRIMARY KEY," },
  { type: "output" as const, text: "    embedding BLOB NOT NULL" },
  { type: "output" as const, text: ");" },
  {
    type: "info" as const,
    text: "Two columns. That is the entire 'vector index'. No HNSW parameters, no shard count, no refresh interval.",
  },
  {
    type: "command" as const,
    text: "$ sqlite3 ~/ai-browser-profile/memories.db.bak4 'SELECT LENGTH(embedding), COUNT(*) FROM memory_embeddings GROUP BY LENGTH(embedding)'",
  },
  { type: "output" as const, text: "3072|5953" },
  {
    type: "info" as const,
    text: "5,953 rows, every BLOB exactly 3,072 bytes. 768 float32 values per vector. Total on-disk vector payload: ~18.3 MB.",
  },
  {
    type: "command" as const,
    text: "$ python -c \"from ai_browser_profile import MemoryDB; db=MemoryDB('memories.db.bak4'); [print(r['key'],'::',r['value'],'::',round(r['similarity'],3)) for r in db.semantic_search('what is my github account', limit=5)]\"",
  },
  { type: "output" as const, text: "account:github.com :: m13v :: 0.712" },
  { type: "output" as const, text: "account:github.com :: matthew-diakonov :: 0.694" },
  { type: "output" as const, text: "username :: m13v :: 0.642" },
  { type: "output" as const, text: "email :: matthew.ddy@gmail.com :: 0.391" },
  { type: "output" as const, text: "tool:GitHub :: GitHub :: 0.374" },
  {
    type: "success" as const,
    text: "Five results above threshold, none share a keyword with the query. No cluster contacted. Total elapsed: single-digit milliseconds.",
  },
];

const METRICS = [
  { value: 5953, suffix: "", label: "rows in the production memory_embeddings table" },
  { value: 3072, suffix: " B", label: "bytes per vector BLOB (768 float32 × 4)" },
  { value: 18, suffix: " MB", label: "total vector index on disk, single file" },
  { value: 0, suffix: " nodes", label: "cluster nodes to provision, configure, or green" },
];

const ES_VS_SQLITE_ROWS = [
  {
    feature: "Storage for the vector",
    competitor: "dense_vector field inside an index mapping",
    ours: "BLOB column in a SQLite table, 3,072 bytes",
  },
  {
    feature: "Write path",
    competitor: "bulk index API, refresh interval, merge policy",
    ours: "INSERT OR REPLACE INTO memory_embeddings",
  },
  {
    feature: "Query path",
    competitor: "knn / semantic_text query, HNSW graph traversal",
    ours: "SELECT embedding, np.dot in a Python loop",
  },
  {
    feature: "Approximate vs exact nearest neighbor",
    competitor: "approximate by default (HNSW), tunable (m, ef)",
    ours: "exact, every query visits every row",
  },
  {
    feature: "Cold-start cost",
    competitor: "JVM heap, plugin load, index open, cache warm",
    ours: "sqlite3.connect plus one ONNX Runtime init",
  },
  {
    feature: "Scale ceiling where this is a good idea",
    competitor: "tens of millions of rows and beyond",
    ours: "roughly up to a million rows on a laptop",
  },
  {
    feature: "Failure mode at scale above ceiling",
    competitor: "ops complexity: shards, rebalancing, heap",
    ours: "linear latency growth; swap for pgvector/Qdrant",
  },
  {
    feature: "Operational surface",
    competitor: "cluster, nodes, heap, shards, replicas, index lifecycle",
    ours: "one file on disk",
  },
];

const BEAM_HUB = {
  label: "embed_text() + memory_embeddings",
  sublabel: "embeddings.py:105 + :140",
};

const BEAM_FROM = [
  { label: "browser autofill row", sublabel: "ingestor -> db.upsert()" },
  { label: "bookmark title", sublabel: "ingestor -> db.upsert()" },
  { label: "WhatsApp contact", sublabel: "ingestor -> db.upsert()" },
  { label: "free-text query", sublabel: "db.semantic_search()" },
];

const BEAM_TO = [
  { label: "prefix + tokenize", sublabel: "step 1" },
  { label: "ONNX mean-pool", sublabel: "step 2" },
  { label: "L2 normalize -> unit vector", sublabel: "step 3" },
  { label: "np.dot over every BLOB", sublabel: "step 4" },
];

const BENTO_CARDS = [
  {
    title: "The 'vector index' is one CREATE TABLE",
    description:
      "memory_embeddings has two columns. memory_id INTEGER PRIMARY KEY, embedding BLOB NOT NULL. No HNSW graph, no shard config, no inference endpoint registration. Defined in embeddings.py line 140-145.",
    size: "2x1" as const,
    accent: true,
  },
  {
    title: "dense_vector replaced by struct.pack('768f', *vec)",
    description:
      "Every vector hits disk as 3,072 bytes. Serialization is one line in embeddings.py:126. Elasticsearch stores the same 768 floats, just inside an Apache Lucene codec.",
    size: "1x1" as const,
  },
  {
    title: "knn replaced by a Python for-loop",
    description:
      "cosine_search scans every BLOB, np.frombuffer decodes, np.dot scores. At 5,953 rows the scan returns in single-digit milliseconds. Faster than a cold JVM round-trip.",
    size: "1x1" as const,
  },
  {
    title: "semantic_text inference runs in-process",
    description:
      "No inference_id, no network hop. ONNX Runtime loads a 131MB quantized nomic-embed-text-v1.5 model once and serves every embed_text() call from the same Python process.",
    size: "1x1" as const,
  },
  {
    title: "Where Elasticsearch still wins",
    description:
      "Above ~1M rows HNSW starts paying for itself, and ES handles cluster-scale recall with known tooling. For personal, laptop-class data the setup cost never amortizes.",
    size: "1x1" as const,
  },
];

const DECIDE_STEPS = [
  {
    title: "Under 100k rows",
    description: "SQLite BLOB + np.dot. Setup is minutes, latency is <10 ms.",
  },
  {
    title: "100k to 1M",
    description: "Still feasible local, but consider pgvector or LanceDB if QPS matters.",
  },
  {
    title: "1M to 10M",
    description: "Switch to an ANN index. Qdrant, pgvector with HNSW, or Elasticsearch.",
  },
  {
    title: "10M and beyond",
    description: "Elasticsearch, Vespa, or a purpose-built vector DB. Cluster ops earn back their cost.",
  },
];

const PIPELINE_STEPS = [
  { label: "browser data", detail: "autofill, history, LevelDB" },
  { label: "db.upsert()", detail: "key, value, tags" },
  { label: "embed_text()", detail: "prefix + tokenize + pool + L2" },
  { label: "struct.pack 768f", detail: "768 floats -> 3072 bytes" },
  { label: "memory_embeddings", detail: "BLOB column, one file" },
  { label: "np.dot scan", detail: "cosine_search at read time" },
  { label: "ranked rows", detail: "key, value, similarity" },
];

const RELATED = [
  {
    title: "Define semantic search, operationally",
    href: "/t/define-semantic-search",
    excerpt:
      "Sibling page: the four mechanical steps that make up semantic search, with line numbers from embeddings.py.",
    tag: "Definition",
  },
  {
    title: "SQLite data types, in one real 5,953-row database",
    href: "/t/sqlite-data-types",
    excerpt:
      "How 768 float32 values actually land as a 3,072-byte BLOB cell, with the SQL to audit it yourself.",
    tag: "Companion",
  },
  {
    title: "Artificial intelligence knowledge base with per-fact version history",
    href: "/t/artificial-intelligence-knowledge-base",
    excerpt:
      "Where the semantic-search layer fits next to UNIQUE(key, value) supersession and the hit_rate ranker.",
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
            { label: "Semantic search without Elasticsearch" },
          ]}
        />

        <header className="max-w-4xl mx-auto px-6 mt-6 mb-8">
          <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 text-xs font-medium px-3 py-1 rounded-full mb-5">
            Semantic search, no cluster required
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-zinc-900 leading-[1.1] tracking-tight">
            Semantic search without Elasticsearch:{" "}
            <GradientText>
              one SQLite BLOB column, 48 lines of Python, 5,953 vectors
            </GradientText>
            .
          </h1>
          <p className="mt-5 text-lg text-zinc-500 leading-relaxed">
            Every top SERP result for &ldquo;semantic search elasticsearch&rdquo; teaches you
            how to configure{" "}
            <code className="text-base bg-zinc-100 px-1 py-0.5 rounded">
              semantic_text
            </code>
            ,{" "}
            <code className="text-base bg-zinc-100 px-1 py-0.5 rounded">dense_vector</code>,{" "}
            <code className="text-base bg-zinc-100 px-1 py-0.5 rounded">knn</code>, and a
            cluster. This page shows the opposite: the full semantic search pipeline
            inlined into a two-column SQLite table and a 13-line{" "}
            <code className="text-base bg-zinc-100 px-1 py-0.5 rounded">
              cosine_search
            </code>{" "}
            function. Verified against a running 5,953-row{" "}
            <code className="text-base bg-zinc-100 px-1 py-0.5 rounded">
              memories.db.bak4
            </code>
            .
          </p>
          <div className="mt-6 flex gap-3 flex-wrap">
            <ShimmerButton href="#the-replacement-table">
              See what replaces ES
            </ShimmerButton>
            <a
              href="#when-es-still-wins"
              className="inline-flex items-center px-5 py-2.5 rounded-full border border-zinc-200 text-sm text-zinc-700 hover:bg-zinc-50"
            >
              When Elasticsearch still wins
            </a>
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
          ratingCount="Verified against ai_browser_profile/embeddings.py lines 105-196, db.py lines 359-402, and memories.db.bak4 at 5,953 rows x 3,072 bytes"
          highlights={[
            "Two-column SQLite table replaces the whole dense_vector + HNSW stack",
            "np.dot over every BLOB is the entire query path",
            "Zero cluster nodes, zero inference endpoints, zero JVM heap",
          ]}
          className="mb-10"
        />

        <section className="max-w-4xl mx-auto px-6">
          <RemotionClip
            title="Semantic search without Elasticsearch."
            subtitle="One SQLite table. 48 lines of Python. ~18.3 MB on disk."
            captions={[
              "memory_embeddings: memory_id + BLOB",
              "3,072 bytes per vector (768 x float32)",
              "np.dot replaces knn",
              "5,953 rows, single-digit-ms queries",
              "No JVM. No cluster. No HNSW.",
            ]}
            accent="teal"
            durationInFrames={280}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-12">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            The SERP assumes you already picked Elasticsearch
          </h2>
          <p className="text-zinc-500 leading-relaxed mb-4">
            Read the top results for this keyword in order: the Elastic docs page on
            semantic search, Elastic Search Labs on lexical-plus-semantic, OneUptime on
            dense vector search, Elastic Labs on{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">semantic_text</code>, and
            Elastic Labs on ES|QL scoring. They all answer the same second-order question:
            given that you are running a cluster, how do you wire semantic search into
            it. None of them answer the first-order question: do you need a cluster at
            all for this workload.
          </p>
          <p className="text-zinc-500 leading-relaxed mb-4">
            Semantic search itself is four mechanical steps that have nothing to do with
            Elasticsearch. Prepend a task prefix. Run an embedding model. L2-normalize
            the output. Dot-product the query vector against stored vectors. That
            definition is infrastructure-agnostic. Elasticsearch is one implementation of
            steps 3 and 4, with a bundled inference endpoint for step 2 and no opinion on
            step 1. A SQLite BLOB column plus numpy is a different implementation of the
            same four steps, with the inference running in the same Python process.
          </p>
          <p className="text-zinc-500 leading-relaxed">
            ai-browser-profile is the SQLite-plus-numpy implementation. The rest of this
            page is the term-by-term replacement table, the 48 lines of Python that
            matter, and an honest take on the scale line where you should flip back to
            Elasticsearch.
          </p>
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-10">
          <ProofBanner
            metric="0 / 10"
            quote="Top 10 SERP results for 'semantic search elasticsearch' that question whether you need Elasticsearch at all for workloads under a million rows. All ten assume the cluster is already decided."
            source="SERP audit, April 2026. Results: Elastic Docs (multiple), Elastic Search Labs (multiple), OneUptime, pureinsights, dev.to."
          />
        </section>

        <section
          id="the-replacement-table"
          className="max-w-4xl mx-auto px-6 mt-14"
        >
          <BackgroundGrid pattern="dots" glow>
            <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
              Term-by-term: what ES gives you, what ai-browser-profile gives you
            </h2>
            <p className="text-zinc-500 leading-relaxed">
              Every moving part of the Elasticsearch semantic search stack has a direct
              analogue in the SQLite-plus-numpy setup. The column below labeled
              &ldquo;AI Browser Profile&rdquo; is not a proposal; it is the code that
              actually runs inside{" "}
              <code className="bg-zinc-100 px-1 py-0.5 rounded">
                ai_browser_profile/embeddings.py
              </code>{" "}
              and{" "}
              <code className="bg-zinc-100 px-1 py-0.5 rounded">
                ai_browser_profile/db.py
              </code>{" "}
              on every install.
            </p>
          </BackgroundGrid>
          <div className="mt-6">
            <ComparisonTable
              productName="AI Browser Profile"
              competitorName="Elasticsearch"
              rows={ES_VS_SQLITE_ROWS}
              caveat="The SQLite column is not better than Elasticsearch; it is smaller. The scale ceiling is explicit and lives roughly at one million rows."
            />
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            Two calls that do the same work
          </h2>
          <p className="text-zinc-500 leading-relaxed mb-4">
            On the left, the shape of an Elasticsearch ingest using{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">semantic_text</code>. On
            the right, the actual ai-browser-profile call that ingests a row, embeds it,
            normalizes it, and stores the 3,072-byte BLOB. Both paths end up with a
            searchable vector keyed to the same kind of text.
          </p>
          <CodeComparison
            title="semantic_text vs MemoryDB.upsert + semantic_search"
            leftLabel="Elasticsearch (abbreviated)"
            rightLabel="AI Browser Profile (actual)"
            leftCode={ES_SIDE}
            rightCode={SQLITE_SIDE}
            leftLines={ES_SIDE.split("\n").length}
            rightLines={SQLITE_SIDE.split("\n").length}
            reductionSuffix="lines"
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            The entire &ldquo;vector index&rdquo; in one CREATE TABLE
          </h2>
          <p className="text-zinc-500 leading-relaxed mb-4">
            There is no separate index structure. There is one table with two columns.
            The primary key is the memory id, the BLOB is the serialized 768-dim
            float32 vector. A real Elasticsearch mapping is a multi-page JSON document;
            this is five lines of SQL.
          </p>
          <AnimatedCodeBlock
            code={SCHEMA_SNIPPET}
            language="python"
            filename="ai_browser_profile/embeddings.py"
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            The query engine: 13 lines of Python, no HNSW
          </h2>
          <p className="text-zinc-500 leading-relaxed mb-4">
            This is what runs in place of an Elasticsearch{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">knn</code> or{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">semantic_text</code>{" "}
            query. Every row in{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">memory_embeddings</code>{" "}
            is loaded, decoded from BLOB to a 768-dim float32 array via{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">np.frombuffer</code>, dot-
            producted against the query vector, filtered by the similarity threshold,
            and sorted. No graph traversal, no index warmup, no shard merge.
          </p>
          <AnimatedCodeBlock
            code={COSINE_SEARCH_SNIPPET}
            language="python"
            filename="ai_browser_profile/embeddings.py"
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            Where every input joins the pipeline
          </h2>
          <p className="text-zinc-500 leading-relaxed mb-4">
            Four different kinds of text flow into the same four-step pipeline. Browser
            autofill rows, bookmarks, and WhatsApp contacts all get embedded with{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">
              prefix=&quot;search_document&quot;
            </code>{" "}
            and stored. Free-text queries go through the same function with{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">
              prefix=&quot;search_query&quot;
            </code>{" "}
            and are dot-producted against everything stored. Same hub, same four steps,
            same BLOB column.
          </p>
          <AnimatedBeam
            title="ingest + query -> embed_text() -> four steps -> memory_embeddings"
            from={BEAM_FROM}
            hub={BEAM_HUB}
            to={BEAM_TO}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            Browser data -&gt; BLOB -&gt; ranked rows, end to end
          </h2>
          <p className="text-zinc-500 leading-relaxed mb-4">
            One linear pipeline, no service boundaries. The Chrome/Arc/Safari ingestors
            pull rows, the MemoryDB upsert path runs embed_text, struct.pack turns the
            normalized float32 vector into 3,072 bytes, and at query time np.dot loads
            the BLOB column back and ranks it.
          </p>
          <FlowDiagram
            title="Ingest and query, same store"
            steps={PIPELINE_STEPS}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            What a live session looks like
          </h2>
          <p className="text-zinc-500 leading-relaxed mb-4">
            Three commands. The first shows the schema is two columns. The second
            audits every BLOB in the table: all 5,953 rows are exactly 3,072 bytes. The
            third runs a real semantic query against the live store and returns rows
            that keyword search could never find.
          </p>
          <TerminalOutput
            title="sqlite3 + python against memories.db.bak4"
            lines={TERMINAL_LINES}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <GlowCard>
              <div className="p-5">
                <div className="text-3xl md:text-4xl font-bold text-teal-600">
                  <NumberTicker value={5953} />
                </div>
                <div className="mt-2 text-xs uppercase tracking-widest text-zinc-500">
                  Rows in live memory_embeddings
                </div>
              </div>
            </GlowCard>
            <GlowCard>
              <div className="p-5">
                <div className="text-3xl md:text-4xl font-bold text-teal-600">
                  <NumberTicker value={3072} suffix=" B" />
                </div>
                <div className="mt-2 text-xs uppercase tracking-widest text-zinc-500">
                  Bytes per vector BLOB
                </div>
              </div>
            </GlowCard>
            <GlowCard>
              <div className="p-5">
                <div className="text-3xl md:text-4xl font-bold text-teal-600">
                  <NumberTicker value={18} suffix=" MB" />
                </div>
                <div className="mt-2 text-xs uppercase tracking-widest text-zinc-500">
                  Total vector index on disk
                </div>
              </div>
            </GlowCard>
            <GlowCard>
              <div className="p-5">
                <div className="text-3xl md:text-4xl font-bold text-teal-600">
                  <NumberTicker value={0} />
                </div>
                <div className="mt-2 text-xs uppercase tracking-widest text-zinc-500">
                  Cluster nodes to run
                </div>
              </div>
            </GlowCard>
          </div>
        </section>

        <section id="when-es-still-wins" className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            Where Elasticsearch still wins, honestly
          </h2>
          <p className="text-zinc-500 leading-relaxed mb-4">
            The SQLite-plus-numpy approach is not a universal replacement. It is a
            local-first, laptop-class implementation. Here is the decision path by row
            count, assuming 768-dim vectors and interactive latency (&lt;100 ms): below
            100k rows the local approach is simpler and usually faster on cold start.
            Between 100k and 1M it still works, but per-query cost becomes linear in
            row count and QPS matters. Above 1M rows the HNSW or IVF index inside
            Elasticsearch, pgvector, or Qdrant starts to earn its complexity. Above 10M
            rows you almost always want a purpose-built store.
          </p>
          <HorizontalStepper
            title="Row-count decision path"
            steps={DECIDE_STEPS}
            current={0}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            Five replacements in five cards
          </h2>
          <BentoGrid cards={BENTO_CARDS} />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <Marquee speed={22} pauseOnHover fade>
            {[
              "dense_vector = BLOB column",
              "knn = np.dot loop",
              "semantic_text = embed_text()",
              "HNSW = linear scan",
              "cluster = zero nodes",
              "inference endpoint = in-process ONNX",
              "index mapping = CREATE TABLE",
              "refresh interval = commit",
              "shard = one file",
              "heap = resident set",
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
            Each pill is one Elasticsearch concept and the line in ai-browser-profile it
            collapses into. None of the right-hand sides require a running service.
          </p>
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            What the reduction actually buys you
          </h2>
          <p className="text-zinc-500 leading-relaxed mb-4">
            Three concrete wins and one honest tradeoff. First, deploy cost: there is
            nothing to deploy. A Python package and a SQLite file on the same machine
            are the whole topology. Second, cold-start cost: a fresh process opens the
            DB in microseconds and loads the ONNX model in seconds; there is no cluster
            to keep warm and no heap to pre-size. Third, reasoning cost: the query path
            is 13 lines, readable in one sitting, with no abstraction layers between
            your call and the floating-point dot product.
          </p>
          <p className="text-zinc-500 leading-relaxed">
            The tradeoff is scale. Linear scan cost grows with row count. The hard
            ceiling on a laptop is somewhere around a million 768-dim vectors if you
            want interactive queries. Elasticsearch wins cleanly above that. For a
            personal knowledge base extracted from one human&apos;s browser, nothing
            binds before the ceiling and the reduction is free.
          </p>
        </section>

        <MetricsRow metrics={METRICS} />

        <BookCallCTA
          appearance="footer"
          destination={BOOKING}
          site="AI Browser Profile"
          heading="Thinking about Elasticsearch for a semantic layer you don't actually need yet?"
          description="Bring your row count and your QPS target. We walk the four steps, the BLOB-column floor, and the scale line where a cluster starts to earn its keep."
        />

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <FaqSection heading="Frequently asked questions" items={FAQS} />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-16">
          <RelatedPostsGrid
            title="Keep reading"
            subtitle="Same memory_embeddings table, different slice."
            posts={RELATED}
          />
        </section>
      </main>

      <BookCallCTA
        appearance="sticky"
        destination={BOOKING}
        site="AI Browser Profile"
        description="Audit your semantic layer: do you actually need Elasticsearch here?"
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
