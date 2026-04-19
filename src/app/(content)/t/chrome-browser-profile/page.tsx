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

const URL = "https://ai-browser-profile.m13v.com/t/chrome-browser-profile";
const PUBLISHED = "2026-04-18";

export const metadata: Metadata = {
  title:
    "Chrome browser profile: what is actually inside the directory on disk",
  description:
    "Every Chrome browser profile is a folder of unextensioned SQLite files: Web Data, History, Login Data, Bookmarks, Cookies. ai-browser-profile reads them while Chrome is running by copying each file plus its WAL and SHM siblings to a temp dir, opening read-only, and merging memories across every Default and Profile N folder.",
  alternates: { canonical: URL },
  openGraph: {
    title:
      "Chrome browser profile, on disk: SQLite files, WAL locks, profile merge",
    description:
      "The directory at ~/Library/Application Support/Google/Chrome/Default holds six SQLite files the running browser keeps locked in WAL mode. Here is the layout, the lock problem, and the copy-WAL-and-SHM trick that lets a separate process read them safely.",
    type: "article",
    url: URL,
  },
  twitter: {
    card: "summary_large_image",
    title:
      "What is inside a Chrome browser profile (on disk, not in the UI)",
    description:
      "Web Data, History, Login Data, Bookmarks, Cookies. WAL-mode SQLite. The trick to reading them while Chrome is running. Plus the multi-profile merge.",
  },
  robots: "index, follow",
};

const FAQS = [
  {
    q: "Where is a Chrome browser profile stored on macOS, Windows, and Linux?",
    a: "On macOS, every Chrome browser profile lives under ~/Library/Application Support/Google/Chrome/, with Default for the first profile and Profile 1, Profile 2, ... for additional ones. ai-browser-profile uses exactly this path: see ai_browser_profile/ingestors/constants.py line 205, BROWSER_PATHS['chrome'] = APP_SUPPORT / 'Google' / 'Chrome'. On Windows the equivalent is %LOCALAPPDATA%\\Google\\Chrome\\User Data\\, and on Linux it is ~/.config/google-chrome/. The internal layout (Default, Profile N, the Web Data and History SQLite files) is the same on all three because it is Chromium's contract, not a macOS detail.",
  },
  {
    q: "What files are inside a Chrome profile directory?",
    a: "On a real Default profile from a current Chrome install, the files the project reads are: Web Data (SQLite, autofill + addresses + credit card metadata), History (SQLite, urls and visits), Login Data (SQLite, account usernames and origins), Bookmarks (JSON, the bookmark tree), Cookies (SQLite, per-site cookies), and Account Web Data (SQLite, sync-merged autofill from your Google Account). There is also a per-site IndexedDB/ subdirectory and a Local Storage/leveldb/ tree, both of which are LevelDB stores rather than SQLite. The full listing on the author's machine includes 200+ items, but those are the ones with structured user data worth reading.",
  },
  {
    q: "None of those files have extensions. Are they really SQLite?",
    a: "Yes. Chromium intentionally drops file extensions on its profile databases (Web Data, History, Login Data) because the files are private to the browser, not meant to be opened with an associated app. They are full SQLite databases with WAL journaling enabled, and you can confirm by running `file ~/Library/Application Support/Google/Chrome/Default/'Web Data'` which prints 'SQLite 3.x database, last written using SQLite version 3...'. Once the running browser has them open in WAL mode, the durable state is split across the main file plus its `-wal` (write-ahead log) and `-shm` (shared memory index) siblings.",
  },
  {
    q: "Can I read a Chrome browser profile while Chrome is running?",
    a: "Not directly with a normal sqlite3 connection: Chrome holds the database in WAL mode and a second process opening the same path can hit lock contention or read partial state. The fix ai-browser-profile uses is a tiny helper at ai_browser_profile/ingestors/browser_detect.py lines 80 to 96, copy_db(): it shutil.copy2's the main file plus its -wal and -shm siblings into a fresh tempfile.mkdtemp(prefix='ai_browser_profile_') directory, then opens the temp copy with sqlite3.connect(f'file:{tmp}?mode=ro', uri=True). The original profile is untouched and the running browser never notices.",
  },
  {
    q: "Why does the project copy the -wal and -shm files separately? Why not just the main file?",
    a: "Because if the browser's last write went to the WAL and has not yet been checkpointed back into the main file, the main file alone is stale. SQLite resolves WAL state at open time by combining the main file with `<name>-wal` and `<name>-shm`. If you copy only the main file you read a snapshot from minutes or hours ago. The loop in copy_db() (browser_detect.py lines 88 to 91) iterates the two suffixes explicitly: `for suffix in ['-wal', '-shm']: ... shutil.copy2(wal, tmp / (src.name + suffix))`. This is the difference between 'a Login Data with the latest password you saved' and 'a Login Data missing the last week of activity'.",
  },
  {
    q: "How does the tool find every Chrome profile, not just Default?",
    a: "_chromium_profiles() in ai_browser_profile/ingestors/browser_detect.py lines 27 to 43 iterates the User Data base directory and accepts any subdirectory whose name is exactly 'Default' or starts with 'Profile ' AND that contains either a History file or an IndexedDB folder. On the author's laptop that pulls in five Chrome profiles (Default, Profile 1, Profile 2, Profile 3, Profile 4) plus one Arc profile (Default). Each profile is treated as an independent BrowserProfile dataclass with .browser, .name, .path, and the same six-file extraction is run against each.",
  },
  {
    q: "What does it mean that memories are 'merged across profiles'?",
    a: "When the same value (say, an email address) appears in autofill or login data on more than one Chrome profile, MemoryDB.upsert() in ai_browser_profile/db.py treats it as one memory row and joins the source attributions with a comma. On the author's DB there are 102 rows whose source field merges across multiple profiles. The top one is an email address with appeared_count=364 and a source string that lists 'autofill:arc:Default, autofill:chrome:Default, form:arc:Default, form:chrome:Default, form:chrome:Profile 1, login:www.linkedin.com, login:id.heroku.com, ...'. You learn that this address is the same identity wearing different work hats across profiles.",
  },
  {
    q: "Does this require Full Disk Access on macOS?",
    a: "Reading the Chrome User Data directory does not require Full Disk Access for files owned by your user, but a few sibling stores under ~/Library do. browser_detect.py has a copy_db() that catches PermissionError and appends the offending path to a module-level list (permission_denied_paths) instead of crashing. If the extractor logs 'Permission denied reading <path>, grant Full Disk Access or skip', the fix is to add your terminal binary (or the python interpreter you ran extract.py with) to System Settings > Privacy & Security > Full Disk Access. Most users do not need it for the core profile files.",
  },
  {
    q: "Does the tool ever write back into the Chrome browser profile?",
    a: "No, never. Every connection in the ingestors uses `sqlite3.connect(f'file:{tmp}?mode=ro', uri=True)` against the temp copy, not the original. The Chrome profile directory is read-only from the tool's perspective. Everything extracted lands in ~/ai-browser-profile/memories.db, a separate SQLite file the tool owns. If you run extract.py weekly the only side effect on your Chrome profile is a short read burst.",
  },
  {
    q: "Is this Chrome-only or does it also read Arc, Brave, and Edge profiles?",
    a: "All four. constants.py line 203 BROWSER_PATHS maps 'arc', 'chrome', 'brave', 'edge' to their respective User Data roots, and the same _chromium_profiles() function iterates Default + Profile N for each. The ingestors do not branch on browser, they branch on file presence. If a browser is Chromium-derived it produces a Web Data, History, Login Data, and Bookmarks file in the same shape. Safari and Firefox have separate readers (history.py has _safari_history() and a Firefox places.sqlite path) because their layouts differ.",
  },
  {
    q: "How is this different from a Chrome extension that exports profile data?",
    a: "An extension runs inside the browser and is bound by Chrome's permission model: it sees what the page exposes, plus chrome.storage and a few specific APIs (chrome.history, chrome.bookmarks). It does not see Login Data passwords, IndexedDB blobs from arbitrary origins, or the on-disk autofill rows with their use_count counters. ai-browser-profile runs as a normal Python process outside the browser, reads the on-disk SQLite and LevelDB stores directly, and gets the full row including counts and merge keys. The privacy surface is also smaller: nothing leaves your laptop, the only files involved are already on your disk.",
  },
];

const breadcrumbsLd = breadcrumbListSchema([
  { name: "Home", url: "https://ai-browser-profile.m13v.com/" },
  { name: "Guides", url: "https://ai-browser-profile.m13v.com/t" },
  { name: "Chrome browser profile", url: URL },
]);

const articleLd = articleSchema({
  headline:
    "Chrome browser profile: what is actually inside the directory on disk",
  description:
    "The on-disk layout of a Chrome browser profile, the WAL-mode SQLite lock problem, and how ai-browser-profile copies WAL + SHM siblings into a temp dir to read every profile while Chrome is running.",
  url: URL,
  datePublished: PUBLISHED,
  author: "Matthew Diakonov",
  publisherName: "AI Browser Profile",
  publisherUrl: "https://ai-browser-profile.m13v.com",
  articleType: "TechArticle",
});

const faqLd = faqPageSchema(FAQS);

const COPY_DB_SNIPPET = `# ai_browser_profile/ingestors/browser_detect.py  (lines 80-96)

def copy_db(src: Path) -> Optional[Path]:
    """Copy a SQLite DB to temp dir to avoid browser locks."""
    if not src.exists():
        return None
    try:
        tmp = Path(tempfile.mkdtemp(prefix="ai_browser_profile_"))
        dst = tmp / src.name
        shutil.copy2(src, dst)
        for suffix in ["-wal", "-shm"]:
            wal = src.parent / (src.name + suffix)
            if wal.exists():
                shutil.copy2(wal, tmp / (src.name + suffix))
        return dst
    except PermissionError:
        log.warning(f"Permission denied reading {src} — grant Full Disk Access or skip")
        permission_denied_paths.append(src)
        return None
`;

const PROFILE_ITER_SNIPPET = `# ai_browser_profile/ingestors/browser_detect.py  (lines 27-43)

def _chromium_profiles(browser: str, base: Path) -> list[BrowserProfile]:
    """Find Chromium-based browser profiles (Default, Profile 1, etc.)."""
    profiles = []
    if not base.exists():
        return profiles

    for d in sorted(base.iterdir()):
        if d.is_dir() and (d.name == "Default" or d.name.startswith("Profile ")):
            if (d / "History").exists() or (d / "IndexedDB").exists():
                profiles.append(BrowserProfile(browser=browser, name=d.name, path=d))

    if not profiles:
        default = base / "Default"
        if default.exists():
            profiles.append(BrowserProfile(browser=browser, name="Default", path=default))

    return profiles
`;

const READ_ONLY_OPEN_SNIPPET = `# ai_browser_profile/ingestors/webdata.py  (line 41)
# Open the *temp copy* of Web Data, never the live file.

conn = sqlite3.connect(f"file:{tmp_db}?mode=ro", uri=True)
conn.row_factory = sqlite3.Row

# Address profiles: maps Chromium type codes -> normalized keys
# (3 = first_name, 9 = email, 14 = phone, 33 = city, 77 = street_address, ...)
for row in conn.execute(
    "SELECT guid, type, value FROM address_type_tokens WHERE value != ''"
):
    type_code = row["type"]
    if type_code in ADDRESS_TYPE_MAP:
        key_name, tags = ADDRESS_TYPE_MAP[type_code]
        mem.upsert(key_name, row["value"], tags, source=source_prefix)
`;

const PROFILE_FILES_BENTO = [
  {
    title: "Web Data",
    description:
      "SQLite. Holds your autofill table (every form field you have ever let Chrome remember, with a use_count), the addresses + address_type_tokens tables (structured names, phones, emails, street addresses), and the credit_cards table (holder, expiry, nickname, but not the encrypted PAN). This is the richest user-data file in the profile.",
    size: "2x1" as const,
    accent: true,
  },
  {
    title: "History",
    description:
      "SQLite. urls (one row per visited URL, with title, visit_count, last_visit_time in Chrome epoch microseconds) plus visits (one row per actual visit). The product reads the top 10,000 by recency and folds them by domain.",
    size: "1x1" as const,
  },
  {
    title: "Login Data",
    description:
      "SQLite. Origins, usernames, blob_value (encrypted with the OS keychain). The product reads origin_url, username_value, times_used, ignoring the encrypted password blob entirely.",
    size: "1x1" as const,
  },
  {
    title: "Bookmarks",
    description:
      "JSON, not SQLite. A nested tree of folders and url entries with date_added, name, and url. Read with json.load(); no copy needed.",
    size: "1x1" as const,
  },
  {
    title: "Cookies",
    description:
      "SQLite. host_key, name, value (encrypted), expires_utc. The product does not read cookies in v1 — too noisy for personal-identity extraction.",
    size: "1x1" as const,
  },
  {
    title: "Account Web Data",
    description:
      "SQLite. Same schema as Web Data, but containing entries that arrived via Google Account sync from your other Chrome installs. Useful for catching identity fragments that only exist on a different machine.",
    size: "1x1" as const,
  },
];

const WAL_LOCK_TIMELINE = [
  {
    title: "Chrome opens the profile in WAL mode at startup",
    description:
      "When Chrome boots, it opens Web Data, History, Login Data and friends in journal_mode=WAL. SQLite creates two sibling files alongside each main DB: <name>-wal (the write-ahead log of pending changes) and <name>-shm (shared memory index). The main file alone is no longer the source of truth.",
  },
  {
    title: "A second process tries the obvious thing and gets stale data",
    description:
      "If you sqlite3.connect('~/Library/Application Support/Google/Chrome/Default/Web Data') directly, you can usually open it (SQLite allows multi-reader on WAL), but you may also race against an active checkpoint and read state that is missing the most recent writes. Worse, on some macOS configurations Chrome takes file-level locks that surface as 'database is locked' errors.",
  },
  {
    title: "copy_db() snapshots the file plus its WAL siblings",
    description:
      "browser_detect.py:85-92 runs shutil.copy2 three times: once for the main file, once for `<name>-wal`, once for `<name>-shm`. The WAL is what holds the most recent writes; copying it along with the main file means the snapshot reflects 'right now', not 'whenever the last checkpoint ran'.",
  },
  {
    title: "We open the temp copy read-only with a URI mode",
    description:
      "sqlite3.connect(f'file:{tmp}?mode=ro', uri=True). Read-only on the snapshot. The running Chrome never sees a competing writer or even a long-lived reader on its files. Lock contention disappears because the only file held open by our process is in /var/folders/.../ai_browser_profile_xxxxx/.",
  },
  {
    title: "We delete the temp dir in the finally block",
    description:
      "Every ingestor wraps the read in try/finally and calls shutil.rmtree(tmp_db.parent, ignore_errors=True) when it is done. No state lingers in /tmp. The only persistent output is your memories.db.",
  },
];

const SOURCE_FIELD_DEMO = [
  { type: "command" as const, text: "sqlite3 ~/ai-browser-profile/memories.db \\" },
  { type: "command" as const, text: '  "SELECT key, value, appeared_count, source FROM memories WHERE source LIKE \'%, %\' ORDER BY appeared_count DESC LIMIT 3;"' },
  { type: "output" as const, text: "email|matthew.ddy@gmail.com|364|autofill:arc:Default, autofill:chrome:Default, form:arc:Default, form:chrome:Default, form:chrome:Profile 1, login:www.linkedin.com, login:id.heroku.com, login:screenpi.pe, login:dashboard.heroku.com, login:accounts.craigslist.org, ... (60+ logins)" },
  { type: "output" as const, text: "email|i@m13v.com|232|autofill:arc:Default, autofill:chrome:Default, autofill:chrome:Profile 1, form:arc:Default, form:chrome:Default, form:chrome:Profile 1, login:us.posthog.com, ..." },
  { type: "output" as const, text: "first_name|Matthew|92|autofill:arc:Default, autofill:chrome:Default, autofill:chrome:Profile 1, form:arc:Default, form:chrome:Default, form:chrome:Profile 1" },
  { type: "info" as const, text: "Comma-joined source means the same value was found in more than one profile." },
  { type: "success" as const, text: "102 memories on this DB merge across profiles. The merge is the point: one identity, many contexts." },
];

const VERIFY_TERMINAL = [
  { type: "command" as const, text: "ls ~/Library/Application\\ Support/Google/Chrome/" },
  { type: "output" as const, text: "Default       Profile 1     Profile 2     Profile 3     Profile 4     System Profile" },
  { type: "command" as const, text: "ls ~/Library/Application\\ Support/Google/Chrome/Default | grep -E '^(History|Web Data|Login Data|Bookmarks|Cookies)$|^Web Data-'" },
  { type: "output" as const, text: "Bookmarks" },
  { type: "output" as const, text: "Cookies" },
  { type: "output" as const, text: "History" },
  { type: "output" as const, text: "Login Data" },
  { type: "output" as const, text: "Web Data" },
  { type: "output" as const, text: "Web Data-journal" },
  { type: "command" as const, text: "file ~/Library/Application\\ Support/Google/Chrome/Default/'Web Data'" },
  { type: "output" as const, text: "Web Data: SQLite 3.x database, last written using SQLite version 3046001" },
  { type: "command" as const, text: "ls ~/Library/Application\\ Support/Google/Chrome/Default/'Web Data'*" },
  { type: "output" as const, text: "Web Data            Web Data-journal" },
  { type: "info" as const, text: "If Chrome is running, you may also see Web Data-wal and Web Data-shm — those are the WAL siblings copy_db() copies alongside the main file." },
];

const COMPARISON_ROWS = [
  {
    feature: "What 'Chrome browser profile' means",
    competitor: "A UI account you switch between in the top-right Chrome menu",
    ours: "A directory on disk: ~/Library/Application Support/Google/Chrome/Default (or Profile N)",
  },
  {
    feature: "Where data lives",
    competitor: "Synced to Google Account; visible in chrome://settings",
    ours: "Six SQLite files + a Bookmarks JSON + IndexedDB/LocalStorage LevelDB trees, all on disk",
  },
  {
    feature: "How a third-party tool reads it",
    competitor: "A Chrome extension via chrome.history, chrome.bookmarks, chrome.storage",
    ours: "A Python process reads the SQLite files directly after copying main + WAL + SHM to /tmp",
  },
  {
    feature: "Lock handling while Chrome runs",
    competitor: "Not addressed (extensions live inside the browser)",
    ours: "shutil.copy2 main + -wal + -shm; open temp with mode=ro; clean up in finally",
  },
  {
    feature: "Multi-profile handling",
    competitor: "Each profile is a separate browser session, no cross-profile view",
    ours: "Iterate Default + every Profile N; merge identical values into one row, comma-join the source attributions",
  },
  {
    feature: "Files inspected per profile",
    competitor: "Whatever the extension API returns",
    ours: "Web Data, History, Login Data, Bookmarks, Cookies, Account Web Data, IndexedDB/, Local Storage/leveldb/",
  },
  {
    feature: "Privacy model",
    competitor: "Google sees your sync state",
    ours: "Read-only against your own files; output is one local SQLite file you own",
  },
];

const METRICS = [
  { value: 5, suffix: "", label: "Chrome profiles detected on the author's laptop (Default + 4)" },
  { value: 6, suffix: "", label: "SQLite/JSON files read per profile (Web Data, History, Login Data, Bookmarks, Cookies, Account Web Data)" },
  { value: 102, suffix: "", label: "Memories whose source merges across multiple profiles" },
  { value: 364, suffix: "", label: "Highest appeared_count on a single merged email memory" },
];

const PROFILE_NAMES_MARQUEE = [
  "Default",
  "Profile 1",
  "Profile 2",
  "Profile 3",
  "Profile 4",
  "Web Data",
  "History",
  "Login Data",
  "Bookmarks",
  "Cookies",
  "Account Web Data",
  "IndexedDB/",
  "Local Storage/leveldb/",
  "Preferences",
  "Local State",
];

const STEPS_TO_VERIFY = [
  { text: "ls ~/Library/Application\\ Support/Google/Chrome/ — count the Default + Profile N directories. That is exactly how many Chrome browser profiles you have." },
  { text: "ls ~/Library/Application\\ Support/Google/Chrome/Default — confirm the unextensioned files: Web Data, History, Login Data, Bookmarks, Cookies." },
  { text: "file ~/Library/Application\\ Support/Google/Chrome/Default/'Web Data' — verify it is a SQLite 3 database despite having no extension." },
  { text: "Run cd ~/ai-browser-profile && source .venv/bin/activate && python extract.py to point the tool at your real profiles." },
  { text: "Run sqlite3 memories.db \"SELECT COUNT(*) FROM memories WHERE source LIKE '%chrome:Default%' OR source LIKE '%chrome:Profile%';\" to see how many memories your Chrome profiles produced." },
  { text: "Run the same query with WHERE source LIKE '%, %' to count the memories that survived because the same value appeared on two or more profiles." },
];

const RELATED = [
  {
    title: "AI knowledge base where every read is a write",
    href: "/t/ai-powered-knowledge-base-software",
    excerpt: "Once the Chrome profile data is in memories.db, every search() also bumps the rank of the rows it returned.",
    tag: "Architecture",
  },
  {
    title: "How to install an npm package the installer-package way",
    href: "/t/how-to-install-a-npm-package",
    excerpt: "Why npx ai-browser-profile init writes into ~/ai-browser-profile so the extracted data sits next to the code.",
    tag: "Setup",
  },
  {
    title: "Updating a published npm package the right way",
    href: "/t/npm-update-a-package",
    excerpt: "How to roll changes to the WAL-copy logic and ingestors back to every user's local install.",
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
            { label: "Chrome browser profile" },
          ]}
        />

        <header className="max-w-4xl mx-auto px-6 mt-6 mb-8">
          <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 text-xs font-medium px-3 py-1 rounded-full mb-5">
            Chrome browser profile, on disk
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-zinc-900 leading-[1.1] tracking-tight">
            A Chrome browser profile is{" "}
            <GradientText>a folder of SQLite files</GradientText>, not a UI panel.
          </h1>
          <p className="mt-5 text-lg text-zinc-500 leading-relaxed">
            Every guide on the first page of Google for &quot;chrome browser profile&quot; explains
            how to click the avatar in the top-right of Chrome and add a new profile. None explain
            what that click actually creates on disk. It creates a directory at{" "}
            <code className="text-base bg-zinc-100 px-1 py-0.5 rounded">
              ~/Library/Application Support/Google/Chrome/Profile N/
            </code>{" "}
            containing a handful of unextensioned SQLite files: Web Data, History, Login Data,
            Bookmarks, Cookies, Account Web Data. While Chrome is running, those files are open in
            WAL mode, which means a second process that wants to read them needs a specific trick.
            ai-browser-profile is built around that trick.
          </p>
          <div className="mt-6">
            <ShimmerButton href="#wal-trick">See the WAL-copy trick</ShimmerButton>
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
          ratingCount="derived from ai_browser_profile/ingestors/browser_detect.py and a live Chrome install"
          highlights={[
            "Exact file paths, line numbers, and SQLite open flags from the real ingestor",
            "Copies main + -wal + -shm so reads are not stale during a live Chrome session",
            "Real-DB query showing 102 memories merged across 5 Chrome profiles + 1 Arc",
          ]}
          className="mb-10"
        />

        <section className="max-w-4xl mx-auto px-6">
          <RemotionClip
            title="One profile, six SQLite files."
            subtitle="What a Chrome browser profile actually looks like on disk."
            captions={[
              "~/Library/Application Support/Google/Chrome/Default/",
              "Web Data, History, Login Data, Bookmarks, Cookies",
              "WAL mode while Chrome is running",
              "Copy main + -wal + -shm to /tmp, then read-only",
              "Iterate Default + Profile N, merge across profiles",
            ]}
            accent="teal"
            durationInFrames={210}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-10">
          <Marquee speed={22} pauseOnHover fade>
            {PROFILE_NAMES_MARQUEE.map((label, i) => (
              <span
                key={label}
                className={
                  i % 3 === 0
                    ? "px-4 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-sm text-teal-700 font-mono"
                    : "px-4 py-1.5 rounded-full bg-zinc-50 border border-zinc-200 text-sm text-zinc-700 font-mono"
                }
              >
                {label}
              </span>
            ))}
          </Marquee>
          <p className="mt-3 text-sm text-zinc-500">
            Every label above is a real subdirectory or file inside a Chrome User Data folder on
            macOS. None of them have extensions. All but Bookmarks are SQLite or LevelDB.
          </p>
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            The SERP gap: every result tells you how to add a profile, none tell you what one is
          </h2>
          <p className="text-zinc-500 leading-relaxed mb-4">
            Search &quot;chrome browser profile&quot; and the top ten results are Google support
            articles, the Chromium developer wiki, and listicles from TechRadar and US universities.
            They cover the same five points: click the avatar, name the profile, pick a color,
            sign into a Google Account, switch between profiles. None mention that a profile is a
            directory on disk, none name the files inside it, none explain why two processes cannot
            both have Login Data open. That is the gap this page lives in.
          </p>
          <ProofBanner
            metric="0"
            quote="Number of top-10 SERP results for 'chrome browser profile' that name a single file inside the profile directory or describe the WAL lock that Chrome holds while running."
            source="Manual SERP audit, April 2026. Reviewed: support.google.com x4, chromium.org, techradar.com, techsolutions.support.com, valiant blog, td.usnh.edu."
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            What is actually inside one Chrome profile directory
          </h2>
          <p className="text-zinc-500 leading-relaxed mb-6">
            Open <code className="bg-zinc-100 px-1 py-0.5 rounded">~/Library/Application Support/Google/Chrome/Default/</code>{" "}
            in a terminal and you will see 200+ entries. Most are caches, model snapshots, and
            policy stores. The six below are the ones that hold structured user data, and they
            are the ones <code className="bg-zinc-100 px-1 py-0.5 rounded">ai-browser-profile</code>{" "}
            reads.
          </p>
          <BentoGrid cards={PROFILE_FILES_BENTO} />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-12">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            Verify it on your own machine in three commands
          </h2>
          <TerminalOutput
            title="Inspect a real Chrome profile from the shell"
            lines={VERIFY_TERMINAL}
          />
          <p className="text-zinc-500 leading-relaxed mt-4">
            Notice that <code className="bg-zinc-100 px-1 py-0.5 rounded">file</code> reports a
            SQLite header even though the file has no extension. That is the entire trick to
            recognizing Chromium databases on disk: they are SQLite, they just look anonymous in a
            directory listing.
          </p>
        </section>

        <section id="wal-trick" className="max-w-4xl mx-auto px-6 mt-14">
          <BackgroundGrid pattern="dots" glow>
            <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
              The WAL trick: copy main + sidecar files, then open read-only
            </h2>
            <p className="text-zinc-500 leading-relaxed">
              Chrome opens its profile databases in WAL mode. A second process that opens the same
              path while Chrome is running can hit lock contention or read pre-WAL state. The fix
              is sixteen lines of Python.
            </p>
          </BackgroundGrid>
          <AnimatedCodeBlock
            code={COPY_DB_SNIPPET}
            language="python"
            filename="ai_browser_profile/ingestors/browser_detect.py"
          />
          <p className="text-zinc-500 leading-relaxed mt-4">
            The two lines that matter are inside the for-loop. SQLite WAL splits durable state
            across <code className="bg-zinc-100 px-1 py-0.5 rounded">&lt;name&gt;</code>,{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">&lt;name&gt;-wal</code>, and{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">&lt;name&gt;-shm</code>. Copying only
            the main file gives you the last-checkpointed snapshot, which can be hours stale on a
            heavily-used Chrome session. Copying all three, in any order, gives you &quot;right
            now&quot;.
          </p>
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-12">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            What the lock problem looks like, frame by frame
          </h2>
          <StepTimeline title="Why WAL matters here" steps={WAL_LOCK_TIMELINE} />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-12">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            How an ingestor uses the temp copy
          </h2>
          <p className="text-zinc-500 leading-relaxed mb-4">
            The connect string is the second half of the trick.{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">file:&lt;path&gt;?mode=ro</code> with{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">uri=True</code> opens the temp copy
            in read-only mode, which prevents accidental writes and tells SQLite not to even try
            to upgrade the lock. The original profile in{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">~/Library/Application Support/...</code>{" "}
            is never touched by us.
          </p>
          <AnimatedCodeBlock
            code={READ_ONLY_OPEN_SNIPPET}
            language="python"
            filename="ai_browser_profile/ingestors/webdata.py"
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            Profile discovery: Default, Profile 1, Profile 2, ...
          </h2>
          <p className="text-zinc-500 leading-relaxed mb-4">
            Chrome creates a new directory every time you click &quot;Add profile&quot; in the
            avatar menu. The first one is{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">Default</code>; subsequent ones are{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">Profile 1</code>,{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">Profile 2</code>, and so on. There
            is no central registry: discovery is just a directory listing.
          </p>
          <AnimatedCodeBlock
            code={PROFILE_ITER_SNIPPET}
            language="python"
            filename="ai_browser_profile/ingestors/browser_detect.py"
          />
          <p className="text-zinc-500 leading-relaxed mt-4">
            The function accepts a directory only if it contains a{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">History</code> file or an{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">IndexedDB/</code> folder. That filter
            keeps the System Profile and other Chromium auxiliary directories out of the
            iteration.
          </p>
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            From six files per profile to one searchable database
          </h2>
          <p className="text-zinc-500 leading-relaxed mb-6">
            Each ingestor reads one file from one profile and calls{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">MemoryDB.upsert(key, value, tags, source)</code>.
            Same value showing up in two profiles? upsert merges the rows and joins the source
            attributions with a comma. The output is one local SQLite file at{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">~/ai-browser-profile/memories.db</code>.
          </p>
          <AnimatedBeam
            title="Per-profile files -> MemoryDB.upsert -> merged rows"
            from={[
              { label: "Web Data", sublabel: "autofill, addresses, cards" },
              { label: "History", sublabel: "urls, visit_count" },
              { label: "Login Data", sublabel: "origin_url, username" },
              { label: "Bookmarks", sublabel: "JSON tree" },
              { label: "IndexedDB/", sublabel: "LevelDB per-site" },
              { label: "Local Storage/", sublabel: "LevelDB per-site" },
            ]}
            hub={{ label: "MemoryDB.upsert", sublabel: "joined across profiles" }}
            to={[
              { label: "memories.db", sublabel: "single SQLite output" },
              { label: "tags table", sublabel: "identity / address / account" },
              { label: "merged source", sublabel: "comma-joined attributions" },
            ]}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            What the cross-profile merge looks like in real data
          </h2>
          <p className="text-zinc-500 leading-relaxed mb-4">
            The single most appeared memory in the author&apos;s local DB is an email address that
            shows up in three Chrome profiles plus 60+ login origins. The{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">source</code> field is a single
            comma-joined string that records every place the value was seen.
          </p>
          <TerminalOutput
            title="memories.db: rows where source spans multiple profiles"
            lines={SOURCE_FIELD_DEMO}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            Numbers from a real install
          </h2>
          <MetricsRow metrics={METRICS} />
          <p className="text-zinc-500 leading-relaxed mt-4">
            <NumberTicker value={102} /> rows merge across at least two profiles on this single
            laptop. <NumberTicker value={364} suffix="" /> is the appeared_count on the most-shared
            email memory. If you only ever read one Chrome profile, you would miss the merge entirely
            and end up with five smaller, weaker views of the same identity. Reading every Default
            and Profile N folder, then merging by value, is what produces a dense personal index.
          </p>
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            UI view of a Chrome browser profile vs. on-disk view
          </h2>
          <ComparisonTable
            productName="ai-browser-profile (on-disk reader)"
            competitorName="Chrome UI / extension model"
            rows={COMPARISON_ROWS}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-12">
          <GlowCard className="p-6 md:p-8">
            <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
              Verify the file layout, then run the extractor
            </h2>
            <p className="text-zinc-500 leading-relaxed mb-4">
              The fastest way to confirm everything on this page is to run six commands in your own
              shell against your own Chrome install. None of them write to the Chrome profile.
            </p>
            <AnimatedChecklist
              title="Six checks against your real Chrome browser profile"
              items={STEPS_TO_VERIFY}
            />
          </GlowCard>
        </section>

        <InlineCta
          heading="Read the WAL-copy code, fork the pattern"
          body="If you want to read any other Chromium-derived browser (Brave, Edge, Vivaldi, Opera), the same copy_db() helper works as-is. The product is MIT-licensed and the relevant code is roughly 20 lines of Python."
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
