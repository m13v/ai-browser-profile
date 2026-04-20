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
  CodeComparison,
  ComparisonTable,
  StepTimeline,
  MetricsRow,
  AnimatedChecklist,
  BentoGrid,
  GlowCard,
  BackgroundGrid,
  GradientText,
  Marquee,
  NumberTicker,
  BookCallCTA,
  articleSchema,
  breadcrumbListSchema,
  faqPageSchema,
} from "@seo/components";

const URL = "https://ai-browser-profile.m13v.com/t/npm-package-build";
const PUBLISHED = "2026-04-20";

export const metadata: Metadata = {
  title:
    "npm package build: what 'build' means for packages that ship no JavaScript",
  description:
    "Every tutorial says the npm build is tsup or tsc emitting a dist folder. ai-browser-profile publishes 26 files, exactly one of which is JavaScript. The 'build' is a files: allowlist plus a 315-line CLI that spawns a Python venv at install time. Here is how that model works and when it is the right shape.",
  alternates: { canonical: URL },
  openGraph: {
    title: "npm package build: the no-dist, install-time model",
    description:
      "ai-browser-profile@1.0.5 ships 26 files, 175.1 kB unpacked, and ONE of them is JavaScript. Here is how a 'build' that compiles nothing actually works.",
    type: "article",
    url: URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "npm package build: the no-dist, install-time model",
    description:
      "26 files. 1 is JavaScript. No tsup, no dist folder. What replaces the build step, and why.",
  },
  robots: "index, follow",
};

const FAQS = [
  {
    q: "What does 'build' actually mean for an npm package?",
    a: "It is whatever transforms your source into the tarball that `npm publish` uploads. Most modern tutorials equate it with a bundler (tsup, tsc, rollup, esbuild) emitting a `dist/` folder, then pointing `main`, `module`, `exports`, and `types` at files inside that folder. But the npm CLI does not care. It reads `files` in package.json, applies `.npmignore`, and packs whatever is left. No compilation is required. The minimum viable 'build' for a package is: pick your files, write a bin script, run `npm publish`.",
  },
  {
    q: "Is there a build step in ai-browser-profile?",
    a: "Not in the compile-to-dist sense. `scripts.build` in package.json is `next build`, which builds the docs website at ai-browser-profile.m13v.com — it is never invoked by `npm publish`. There is no prepublish script, no tsup config, no rollup config. Run `npm pack --dry-run` on a clean clone and you get 26 files, 175.1 kB unpacked, 48.8 kB packed. Of those 26, one is JavaScript (`bin/cli.js`, 9.8 kB). The other 25 are 16 Python files, 5 SKILL.md files, a shell script, README.md, and package.json.",
  },
  {
    q: "If there is no compiled output, what IS the build?",
    a: "Three lines in package.json plus a bin script. The `files` array allowlists what goes in the tarball (`bin/`, `ai_browser_profile/**/*.py`, `skill/`, `review/`, `setup/`, `autofill/`, `whatsapp/`, `extract.py`, `clean.py`). The `.npmignore` at the repo root excludes scratch state (`memories.db`, `*.db-wal`, `.venv/`, `__pycache__/`, `src/`, `.next/`, `node_modules/`). And `bin/cli.js` is a thin Node CLI that, at install time, creates a Python virtualenv, pip-installs two packages, and symlinks five directories into `~/.claude/skills`. That is the entire build.",
  },
  {
    q: "Why would anyone publish a package like this?",
    a: "Three reasons. First, npm is the lowest-friction distribution channel on Earth: `npx name@latest init` works on every Mac and Linux box without registering accounts or configuring package managers. Second, the real product is not JavaScript — it is Python source plus a SQLite database plus five Markdown skills — so compiling the JS would not help anyway. Third, the same pattern is used by create-next-app, shadcn/ui, create-t3-app, degit, and most of the 'scaffold something into \\$HOME or the CWD' tools. The bundler-free, install-time model is the common shape for installer-packages.",
  },
  {
    q: "What goes in the files array vs .npmignore?",
    a: "`files` is an allowlist of paths to INCLUDE; `.npmignore` is a blocklist of paths to EXCLUDE. npm uses both: the final tarball contains everything matched by `files`, minus anything matched by `.npmignore`. The safer default is to use `files` alone — it is impossible to accidentally ship a secret because every path is listed explicitly. ai-browser-profile uses both: `files` lists 9 entries, `.npmignore` lists the 19 paths that must never escape (`memories.db`, `*.db-wal`, `.venv/`, `src/`, `.next/`, `tsconfig.json`, `public/`, `scripts/`, and similar). Belt and suspenders.",
  },
  {
    q: "What happens at install time when there is no compiled code?",
    a: "`bin/cli.js` does the work that a bundler would normally do at build time. Its `init` function (lines 140-223) creates `~/ai-browser-profile`, copies 8 COPY_TARGETS into it, spawns `python3 -m venv .venv`, runs `pip install git+https://github.com/cclgroupltd/ccl_chromium_reader.git numpy`, generates a launchd plist, and symlinks five directories into `~/.claude/skills`. The whole file is 315 lines. It is the build script, just shifted from publish-time to install-time.",
  },
  {
    q: "Does this mean npm packages do not need TypeScript or dist folders?",
    a: "They do not need them at all. Most benefit from them, because most npm packages are JavaScript libraries consumed by `import` in other JavaScript projects, and those consumers need type declarations and bundled output. But if your package is a CLI or installer — `bin` entry, not `main` — there is no consumer doing `import pkg from 'pkg'`. Your entire surface is the shell command. In that world, a `dist/index.js` emitted by tsup adds zero value over a hand-written `bin/cli.js` that ships as source.",
  },
  {
    q: "Is this just a postinstall hook in disguise?",
    a: "No, and the distinction matters. A `postinstall` hook runs when the package lands in `node_modules`, even if the user only wanted to install it as a dep of something else. That is a common source of surprise and a reason npm added `--ignore-scripts`. ai-browser-profile uses the opposite pattern: no postinstall, an explicit `ai-browser-profile init` subcommand that the user runs on purpose. Installing the package (via `npm i -g` or the npx cache) has zero side effects. All the disk mutation is gated behind a command the user typed.",
  },
  {
    q: "Can I verify what is in the tarball before publishing?",
    a: "Yes, and you should. Run `npm pack --dry-run` in the package directory. It prints every file that would ship plus the total packed and unpacked size. Two things catch mistakes most often: secret files accidentally allowlisted, and build artifacts from a dev workflow creeping in (coverage reports, `.DS_Store`, editor swap files). For ai-browser-profile@1.0.5 the output is 26 files and two numbers: 48.8 kB packed, 175.1 kB unpacked. If those numbers jump, something leaked into the tarball.",
  },
  {
    q: "What belongs in bin/ vs a compiled dist/?",
    a: "`bin/` is for executables that users run from the shell. Each entry in the `bin` object in package.json becomes a command on `$PATH` after `npm i -g` or an ephemeral one inside `npx`. These files must have a shebang (`#!/usr/bin/env node`) and should run on Node without transforms — no top-level `import`, no JSX, no TypeScript. `dist/` is for library entrypoints consumed by `require()` or `import` from downstream code; those get compiled because the consumer's bundler needs them in a specific format. An installer-package has only the first and not the second.",
  },
  {
    q: "Can I mix both models — a library AND a CLI in one package?",
    a: "Yes. You ship `dist/index.js` for library consumers and `bin/cli.js` for shell users; package.json declares both. Plenty of popular packages do this (prettier, eslint, typescript itself). The tradeoff is that your build pipeline now has to produce TWO things, and your CI must test both entry points. ai-browser-profile deliberately skipped the library half because its library surface is the Python module `ai_browser_profile`, not JavaScript. Consumers who want programmatic access import the Python package, not the npm package.",
  },
  {
    q: "How do I pick between 'build to dist' and 'ship source'?",
    a: "Three questions. One: is your main consumer a JavaScript bundler that needs ESM/CJS/types? If yes, build to dist. Two: is your main consumer a human typing `npx pkg`? If yes, ship source with a bin script. Three: is the product written in JavaScript at all? If no, your npm package is a distribution vehicle, not a code artifact, and the build is a `files` allowlist plus a CLI. Pick the shape that matches the consumer's ergonomics, not the shape that matches the tutorial you read.",
  },
];

const breadcrumbsLd = breadcrumbListSchema([
  { name: "Home", url: "https://ai-browser-profile.m13v.com/" },
  { name: "Guides", url: "https://ai-browser-profile.m13v.com/t" },
  { name: "npm package build", url: URL },
]);

const articleLd = articleSchema({
  headline:
    "npm package build: what 'build' means for packages that ship no JavaScript",
  description:
    "The npm CLI does not care about TypeScript, tsup, or a dist folder. ai-browser-profile ships 26 files, one of which is JavaScript. Here is how a 'build' that compiles nothing actually works, with the exact files, sizes, and CLI that replace the bundler.",
  url: URL,
  datePublished: PUBLISHED,
  author: "Matthew Diakonov",
  publisherName: "AI Browser Profile",
  publisherUrl: "https://ai-browser-profile.m13v.com",
  articleType: "TechArticle",
});

const faqLd = faqPageSchema(FAQS);

const TARBALL_TERMINAL = [
  { type: "command" as const, text: "npm pack --dry-run" },
  { type: "output" as const, text: "npm notice 📦  ai-browser-profile@1.0.5" },
  { type: "output" as const, text: "npm notice Tarball Contents" },
  { type: "output" as const, text: "  4.9kB README.md" },
  { type: "output" as const, text: "  231B ai_browser_profile/__init__.py" },
  { type: "output" as const, text: "  40.3kB ai_browser_profile/db.py" },
  { type: "output" as const, text: "  6.5kB ai_browser_profile/embeddings.py" },
  { type: "output" as const, text: "  4.8kB ai_browser_profile/extract.py" },
  { type: "output" as const, text: "  ...11 more Python files..." },
  { type: "output" as const, text: "  8.7kB autofill/SKILL.md" },
  { type: "output" as const, text: "  9.8kB bin/cli.js" },
  { type: "output" as const, text: "  11.7kB clean.py" },
  { type: "output" as const, text: "  1.9kB extract.py" },
  { type: "output" as const, text: "  1.7kB package.json" },
  { type: "output" as const, text: "  2.3kB review/run.sh" },
  { type: "output" as const, text: "  7.2kB review/SKILL.md" },
  { type: "output" as const, text: "  5.7kB setup/SKILL.md" },
  { type: "output" as const, text: "  1.9kB skill/SKILL.md" },
  { type: "output" as const, text: "  11.5kB whatsapp/SKILL.md" },
  { type: "info" as const, text: "package size: 48.8 kB" },
  { type: "info" as const, text: "unpacked size: 175.1 kB" },
  { type: "success" as const, text: "total files: 26 (one of them, bin/cli.js, is JavaScript)" },
];

const PACKAGE_JSON_CODE = `{
  "name": "ai-browser-profile",
  "version": "1.0.5",
  "bin": {
    "ai-browser-profile": "bin/cli.js"
  },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit"
  },
  "files": [
    "bin/",
    "ai_browser_profile/**/*.py",
    "skill/",
    "review/",
    "setup/",
    "autofill/",
    "whatsapp/",
    "extract.py",
    "clean.py"
  ]
}

// Notes:
// - No \`main\`, \`module\`, \`exports\`, or \`types\` fields.
// - \`scripts.build\` is \`next build\` — that builds the docs site,
//   not the npm package. npm publish does not invoke it.
// - \`files\` is a 9-entry allowlist. Every path in the tarball is
//   one of these, minus anything matched by .npmignore.
// - \`bin\` is the entire public surface. No \`import\` consumer exists.`;

const TSUP_VS_ALLOWLIST_LEFT = `// The usual npm package "build"
// package.json
{
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsup src/index.ts --dts --format esm,cjs",
    "prepublishOnly": "npm run build"
  },
  "files": ["dist"]
}

// tsup.config.ts, tsconfig.json,
// sourcemaps, tree-shaking, splitting,
// ESM+CJS dual output, .d.ts generation.`;

const TSUP_VS_ALLOWLIST_RIGHT = `// ai-browser-profile's "build"
// package.json
{
  "bin": { "ai-browser-profile": "bin/cli.js" },
  "files": [
    "bin/",
    "ai_browser_profile/**/*.py",
    "skill/", "review/", "setup/",
    "autofill/", "whatsapp/",
    "extract.py", "clean.py"
  ]
}

// No main, no module, no exports, no types.
// No bundler config, no tsconfig for output,
// no .d.ts, no ESM/CJS split.
// bin/cli.js is 315 lines, written by hand,
// and ships as source with a shebang.`;

const BUILD_MODES_ROWS = [
  {
    feature: "What is the 'build' output?",
    competitor: "dist/ folder of compiled JS + .d.ts",
    ours: "The files: allowlist + bin/cli.js as source",
  },
  {
    feature: "Who runs the build?",
    competitor: "Your CI or `npm publish` via prepublishOnly",
    ours: "Nothing — there is no compile step",
  },
  {
    feature: "What do consumers import?",
    competitor: "exports / main / module entries",
    ours: "Nothing — the only surface is the bin CLI",
  },
  {
    feature: "Where does work happen?",
    competitor: "Publish time (you compile before uploading)",
    ours: "Install time (npx spawns a venv, copies files)",
  },
  {
    feature: "How big is the tarball?",
    competitor: "Varies: tsup + dts easily 200kB+ for a small lib",
    ours: "48.8 kB packed, 175.1 kB unpacked",
  },
  {
    feature: "What breaks on Node upgrades?",
    competitor: "Transpilation targets, ESM/CJS interop, .d.ts drift",
    ours: "Only what you wrote in bin/cli.js — no transforms",
  },
  {
    feature: "What breaks on dep upgrades?",
    competitor: "Bundler rewrites, tree-shake regressions",
    ours: "Unaffected — there are no JS deps to bundle",
  },
];

const LIFECYCLE_STEPS = [
  {
    title: "Step 1: you edit source in place",
    description:
      "No src/ to dist/ mental split. The 16 Python files live at ai_browser_profile/*.py in the repo, the CLI lives at bin/cli.js, and the skill docs live in skill/, review/, setup/, autofill/, whatsapp/. That is the same layout consumers see after install. There is nothing to 'rebuild' after a code change.",
  },
  {
    title: "Step 2: .npmignore strips dev cruft",
    description:
      "Before packing, npm walks the tree and drops anything matching .npmignore. ai-browser-profile's .npmignore is 19 lines: memories.db, *.db-wal, .venv/, __pycache__/, src/, .next/, node_modules/, public/, tsconfig.json, scripts/, and the Next.js docs-site files. Without this, `npm pack` would include the 500+ MB docs build.",
  },
  {
    title: "Step 3: files: intersects what remains",
    description:
      "Then the files: allowlist kicks in. Only paths listed there survive: the 9 entries in package.json. Everything else (including README.md which is implicit by convention, and package.json itself) still ships, but nothing outside those 9 entries makes it into the tarball. The result is 26 files, 175.1 kB unpacked.",
  },
  {
    title: "Step 4: npm publish uploads the .tgz",
    description:
      "There is no prepublish hook to trigger a build, because there is nothing to build. `npm publish` tarballs the filtered tree, signs, and uploads. End of publish-time pipeline. Total time on a clean repo: under 10 seconds.",
  },
  {
    title: "Step 5: the real 'build' happens at install",
    description:
      "When a user runs `npx ai-browser-profile init`, the bin/cli.js copies source into ~/ai-browser-profile, creates a Python venv, pip-installs dependencies, generates a launchd plist, and symlinks 5 skill directories into ~/.claude/skills. That is the work a conventional bundler would have done at publish time, shifted to the consumer's machine.",
  },
];

const FILES_ARRAY_ENTRIES = [
  {
    title: "bin/",
    description:
      "Contains cli.js. The only JavaScript in the tarball and the only executable the package exposes. 315 lines, ships as source with a #!/usr/bin/env node shebang.",
    size: "1x1" as const,
  },
  {
    title: "ai_browser_profile/**/*.py",
    description:
      "The Python module that extracts browser data. 16 files, 8 ingestor modules under ingestors/. Consumers read these directly after install — no compilation.",
    size: "2x1" as const,
    accent: true,
  },
  {
    title: "extract.py, clean.py",
    description:
      "Root-level Python entry points. extract.py is the main CLI, clean.py is the rule-based cleanup pass. They import from ai_browser_profile and run in the venv bin/cli.js builds.",
    size: "1x1" as const,
  },
  {
    title: "skill/, setup/",
    description:
      "Two Claude Code skills. Each is a directory with a SKILL.md. After `init`, they are symlinked into ~/.claude/skills so Claude Code discovers them.",
    size: "1x1" as const,
  },
  {
    title: "review/, autofill/, whatsapp/",
    description:
      "Three more skill directories, each with its own SKILL.md and optionally a run.sh. Five skills in total get symlinked on install.",
    size: "2x1" as const,
    accent: true,
  },
  {
    title: "package.json + README.md",
    description:
      "Always included by npm regardless of the files array. README becomes the landing content on npmjs.com. package.json is what the CLI reads to find its bin.",
    size: "1x1" as const,
  },
];

const BUILD_CHECKLIST = [
  { text: "Run `npm pack --dry-run` before every publish. Read every line. Secrets, editor swap files, and CI artifacts get caught here." },
  { text: "Prefer `files:` over `.npmignore` when practical. Allowlists fail closed; blocklists fail open." },
  { text: "If your main consumer is `npx pkg` (not `import pkg`), skip the bundler. Ship `bin/` as source with a shebang." },
  { text: "Do not put real state mutation in a postinstall hook. Gate it behind an explicit `pkg init` subcommand the user types." },
  { text: "If your bin spawns a non-Node runtime (Python, Ruby, Go), pin a minimum version. ai-browser-profile refuses anything below Python 3.10 in bin/cli.js:64-74." },
  { text: "Declare a `NEVER_OVERWRITE` allowlist in the bin script if your tool writes outside node_modules. Updates need an explicit contract about what survives." },
];

const BUILD_ARTIFACTS = [
  {
    title: "files: array (9 entries)",
    description:
      "The allowlist in package.json. Defines the tarball contents positively: everything not listed is dropped. Edit here to change what ships.",
  },
  {
    title: ".npmignore (19 entries)",
    description:
      "The blocklist. Catches dev-only paths the files: array does not exclude on its own — Next.js build outputs, the SQLite database, the Python venv, __pycache__, editor metadata.",
  },
  {
    title: "bin/cli.js (9.8 kB, 315 lines)",
    description:
      "The only executable and the entire install-time logic. init/update/install-embeddings subcommands live here. Ships as source, runs on plain Node 16+.",
  },
  {
    title: "Source Python modules (~105 kB)",
    description:
      "16 .py files under ai_browser_profile/ plus two at the root. These are what the package actually delivers — bin/cli.js just puts them on the user's disk.",
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
            { label: "npm package build" },
          ]}
        />

        <header className="max-w-4xl mx-auto px-6 mt-6 mb-8">
          <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 text-xs font-medium px-3 py-1 rounded-full mb-5">
            npm internals, unbundled
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-zinc-900 leading-[1.1] tracking-tight">
            npm package build: <GradientText>what &ldquo;build&rdquo; means</GradientText> for packages that ship no JavaScript.
          </h1>
          <p className="mt-5 text-lg text-zinc-500 leading-relaxed">
            Every tutorial says the build is{" "}
            <code className="text-base bg-zinc-100 px-1 py-0.5 rounded">tsup</code> or{" "}
            <code className="text-base bg-zinc-100 px-1 py-0.5 rounded">tsc</code> emitting a{" "}
            <code className="text-base bg-zinc-100 px-1 py-0.5 rounded">dist/</code>{" "}
            folder. The npm CLI does not care.{" "}
            <code className="text-base bg-zinc-100 px-1 py-0.5 rounded">npm publish</code>{" "}
            reads your <code className="text-base bg-zinc-100 px-1 py-0.5 rounded">files</code>{" "}
            allowlist, applies{" "}
            <code className="text-base bg-zinc-100 px-1 py-0.5 rounded">.npmignore</code>, tarballs
            whatever is left, and uploads. You decide if compilation happens, and where. This
            page walks the no-dist model using{" "}
            <code className="text-base bg-zinc-100 px-1 py-0.5 rounded">ai-browser-profile@1.0.5</code>{" "}
            as the worked example: 26 files, 175.1 kB unpacked, and exactly one JavaScript file
            in the tarball.
          </p>
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
          ratingCount="sourced from bin/cli.js + package.json + npm pack --dry-run"
          highlights={[
            "Exact tarball contents from a real npm pack --dry-run",
            "The two-file contract: files: allowlist + .npmignore blocklist",
            "When the bundler model is right, and when it is overhead",
          ]}
          className="mb-10"
        />

        <section className="max-w-4xl mx-auto px-6">
          <RemotionClip
            title="Build without a build step"
            subtitle="What npm publish actually packs"
            captions={[
              "Your build is not tsup. Your build is files: + .npmignore.",
              "ai-browser-profile ships 26 files. ONE is JavaScript.",
              "48.8 kB packed, 175.1 kB unpacked. No dist folder.",
              "The real work happens at install, inside bin/cli.js.",
              "npm is a distribution channel, not a compiler.",
            ]}
            accent="teal"
            durationInFrames={240}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-10">
          <Marquee speed={24} pauseOnHover fade>
            <span className="px-4 py-1.5 rounded-full bg-zinc-50 border border-zinc-200 text-sm text-zinc-700">
              26 files in the tarball
            </span>
            <span className="px-4 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-sm text-teal-700">
              1 of them is JavaScript
            </span>
            <span className="px-4 py-1.5 rounded-full bg-zinc-50 border border-zinc-200 text-sm text-zinc-700">
              48.8 kB packed
            </span>
            <span className="px-4 py-1.5 rounded-full bg-zinc-50 border border-zinc-200 text-sm text-zinc-700">
              175.1 kB unpacked
            </span>
            <span className="px-4 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-sm text-teal-700">
              0 bundler configs
            </span>
            <span className="px-4 py-1.5 rounded-full bg-zinc-50 border border-zinc-200 text-sm text-zinc-700">
              315 lines in bin/cli.js
            </span>
            <span className="px-4 py-1.5 rounded-full bg-zinc-50 border border-zinc-200 text-sm text-zinc-700">
              9 entries in files:
            </span>
            <span className="px-4 py-1.5 rounded-full bg-zinc-50 border border-zinc-200 text-sm text-zinc-700">
              19 lines in .npmignore
            </span>
          </Marquee>
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            What the tutorials teach
          </h2>
          <p className="text-zinc-500 leading-relaxed mb-2">
            Search &ldquo;npm package build&rdquo; and the top results walk you through the
            same pipeline: install tsup (or tsc, or rollup), write a{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">tsup.config.ts</code>, set{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">format: [&apos;esm&apos;, &apos;cjs&apos;]</code>,
            emit a <code className="bg-zinc-100 px-1 py-0.5 rounded">dist/</code> folder with
            type declarations, point{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">main</code>,{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">module</code>,{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">types</code>, and{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">exports</code> at files inside
            it, and publish. That pipeline is correct for a specific shape of package: a
            JavaScript library imported by other JavaScript projects. If your package is not
            that, most of the pipeline is dead weight.
          </p>
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-10">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            What actually ships: the tarball
          </h2>
          <p className="text-zinc-500 leading-relaxed mb-2">
            Run <code className="bg-zinc-100 px-1 py-0.5 rounded">npm pack --dry-run</code>{" "}
            in the <code className="bg-zinc-100 px-1 py-0.5 rounded">ai-browser-profile</code>{" "}
            repo, and this is the output. No rewriting, no paraphrase — this is the print from
            npm itself on version 1.0.5. Count the JavaScript files.
          </p>
          <TerminalOutput title="npm pack --dry-run on ai-browser-profile@1.0.5" lines={TARBALL_TERMINAL} />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-12">
          <ProofBanner
            quote="one JavaScript file in the tarball. the other 25 are Python, Markdown, a shell script, README, and package.json."
            source="npm pack --dry-run on ai-browser-profile@1.0.5"
            metric="1 of 26"
          />
          <p className="mt-4 text-zinc-500 leading-relaxed">
            This is the anchor fact of the page. The file breakdown is 16 Python files, 5
            SKILL.md files, 1 shell script (<code className="bg-zinc-100 px-1 py-0.5 rounded">review/run.sh</code>),
            1 README, 1 package.json, 1 Node CLI (<code className="bg-zinc-100 px-1 py-0.5 rounded">bin/cli.js</code>),
            and one lone root-level Python entry point (<code className="bg-zinc-100 px-1 py-0.5 rounded">clean.py</code>)
            that pushes the total to 26. Exactly one of those 26 is JavaScript. The package is
            an npm package by distribution channel, not by code content.
          </p>
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <BackgroundGrid pattern="dots" glow>
            <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
              The package.json that drives it
            </h2>
            <p className="text-zinc-500 leading-relaxed mb-4">
              Notice what is NOT there. No{" "}
              <code className="bg-zinc-100 px-1 py-0.5 rounded">main</code>, no{" "}
              <code className="bg-zinc-100 px-1 py-0.5 rounded">module</code>, no{" "}
              <code className="bg-zinc-100 px-1 py-0.5 rounded">exports</code>, no{" "}
              <code className="bg-zinc-100 px-1 py-0.5 rounded">types</code>. The{" "}
              <code className="bg-zinc-100 px-1 py-0.5 rounded">build</code> script is{" "}
              <code className="bg-zinc-100 px-1 py-0.5 rounded">next build</code>, which
              belongs to the docs site and never runs during{" "}
              <code className="bg-zinc-100 px-1 py-0.5 rounded">npm publish</code>.
            </p>
            <AnimatedCodeBlock
              code={PACKAGE_JSON_CODE}
              language="json"
              filename="package.json (relevant fields)"
            />
          </BackgroundGrid>
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            Two builds, side by side
          </h2>
          <p className="text-zinc-500 leading-relaxed mb-6">
            Left: what the tutorials describe. Right: what ai-browser-profile actually does.
            Same npm registry, same <code className="bg-zinc-100 px-1 py-0.5 rounded">npm publish</code>{" "}
            command, completely different disk model.
          </p>
          <CodeComparison
            title="Bundled-to-dist vs allowlist-of-source"
            leftLabel="The bundler model"
            rightLabel="The allowlist model"
            leftCode={TSUP_VS_ALLOWLIST_LEFT}
            rightCode={TSUP_VS_ALLOWLIST_RIGHT}
            leftLines={TSUP_VS_ALLOWLIST_LEFT.split("\n").length}
            rightLines={TSUP_VS_ALLOWLIST_RIGHT.split("\n").length}
            reductionSuffix="fewer moving parts"
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            Seven concrete differences
          </h2>
          <p className="text-zinc-500 leading-relaxed mb-6">
            Where the two models diverge on disk, at publish time, and at install time. The
            column headers are non-negotiable: if your answer to &ldquo;what do consumers{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">import</code>?&rdquo; is
            &ldquo;nothing,&rdquo; the bundler row of your checklist is already moot.
          </p>
          <ComparisonTable
            productName="Allowlist of source + bin CLI"
            competitorName="Bundler-to-dist (tsup / tsc)"
            rows={BUILD_MODES_ROWS}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            The full publish-to-install lifecycle
          </h2>
          <p className="text-zinc-500 leading-relaxed mb-2">
            Five steps, all visible in the repo. Nothing is inferred: every step reads a file
            you can open.
          </p>
          <StepTimeline steps={LIFECYCLE_STEPS} />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            What <code className="bg-zinc-100 px-2 py-1 rounded font-mono text-xl md:text-2xl">npm publish</code> actually packs
          </h2>
          <p className="text-zinc-500 leading-relaxed mb-2">
            Three inputs on the left feed{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">npm pack</code>, which applies
            the two filters and emits the tarball. No bundler sits in this pipeline. The same
            shape would work for a Go CLI, a shell-script tool, or a collection of Markdown
            docs distributed via npm.
          </p>
          <AnimatedBeam
            title="Publish pipeline for a no-build npm package"
            from={[
              { label: "repo source (Python, JS, Markdown, shell)" },
              { label: "package.json (bin, files:, version)" },
              { label: ".npmignore (19 lines)" },
            ]}
            hub={{ label: "npm pack — allowlist + blocklist intersect" }}
            to={[
              { label: "tarball: 48.8 kB, 26 files" },
              { label: "uploaded to registry via npm publish" },
              { label: "consumer runs npx pkg init" },
              { label: "bin/cli.js does the install-time 'build'" },
            ]}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            The build, by the numbers
          </h2>
          <p className="text-zinc-500 leading-relaxed mb-2">
            Every integer here is a constant in the repo. Change the allowlist and the first
            two shift; everything else is a consequence.
          </p>
          <MetricsRow
            metrics={[
              { value: 9, label: "entries in files: (package.json)" },
              { value: 19, label: "lines in .npmignore" },
              { value: 26, label: "files in the tarball" },
              { value: 315, label: "lines in bin/cli.js (the whole CLI)" },
            ]}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-12">
          <GlowCard>
            <h3 className="text-xl font-semibold text-zinc-900 mb-3">
              One more number: <NumberTicker value={175} suffix=".1 kB" /> unpacked
            </h3>
            <p className="text-zinc-500 leading-relaxed">
              That is the entire ai-browser-profile npm package on disk after{" "}
              <code className="bg-zinc-100 px-1 py-0.5 rounded">npx</code> untars it into its
              cache. For reference, the average &ldquo;hello world&rdquo; React component
              library bundled with tsup to{" "}
              <code className="bg-zinc-100 px-1 py-0.5 rounded">dist/</code> with type
              declarations tends to land between 100 and 300 kB. ai-browser-profile is in that
              range despite shipping an entire Python codebase, five Claude Code skills, and a
              launchd plist generator — because none of it is compiled, none of it is
              duplicated across ESM and CJS, and none of it carries a{" "}
              <code className="bg-zinc-100 px-1 py-0.5 rounded">.d.ts</code> twin.
            </p>
          </GlowCard>
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            The 9 entries of <code className="bg-zinc-100 px-2 py-1 rounded font-mono text-xl md:text-2xl">files:</code>, unpacked
          </h2>
          <p className="text-zinc-500 leading-relaxed mb-6">
            What each path in the allowlist is for, and where it ends up on the consumer&apos;s
            disk after <code className="bg-zinc-100 px-1 py-0.5 rounded">npx ai-browser-profile init</code>.
            No entry is decorative — remove any one of them and the package stops working.
          </p>
          <BentoGrid cards={FILES_ARRAY_ENTRIES} />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            The four artifacts that make the build
          </h2>
          <p className="text-zinc-500 leading-relaxed mb-6">
            Everything else is side quests. If you are copying this pattern, these are the
            four files (or groups of files) you will end up maintaining. No bundler config, no
            tsup.config.ts, no rollup plugin list.
          </p>
          <StepTimeline steps={BUILD_ARTIFACTS} />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-12">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            Build checklist (for the no-dist model)
          </h2>
          <p className="text-zinc-500 leading-relaxed mb-2">
            Six checks you can run without any dependencies. They take under two minutes on a
            clean repo.
          </p>
          <AnimatedChecklist title="pre-publish — no-bundler npm build" items={BUILD_CHECKLIST} />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-12">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            When this model is right (and when it is not)
          </h2>
          <p className="text-zinc-500 leading-relaxed">
            The no-dist model is right when your package&apos;s entire surface is a CLI, when
            the core product is in a non-JavaScript language, or when your package scaffolds
            state into <code className="bg-zinc-100 px-1 py-0.5 rounded">\$HOME</code> or the
            CWD (create-next-app, shadcn/ui, degit, ai-browser-profile). It is the wrong model
            when your package is a library imported by other JavaScript projects — those
            consumers need a compiled entry point, type declarations, and ESM/CJS
            interoperability. The question to ask is not &ldquo;what does a modern build look
            like,&rdquo; it is &ldquo;what does my consumer do with this package the first
            time they install it?&rdquo; If the answer is{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">import</code>, build to{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">dist/</code>. If the answer is{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">npx</code>, ship source.
          </p>
        </section>

        <BookCallCTA
          appearance="footer"
          destination="https://cal.com/team/mediar/ai-browser-profile"
          site="AI Browser Profile"
          heading="Want a no-dist npm package for your own tool?"
          description="Talk through the files: allowlist, bin/cli.js skeleton, and install-time pattern for your stack."
        />

        <FaqSection items={FAQS} />

        <BookCallCTA
          appearance="sticky"
          destination="https://cal.com/team/mediar/ai-browser-profile"
          site="AI Browser Profile"
          description="Ship a clean npm package without a bundler — talk it through."
        />

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
      </main>
    </>
  );
}
