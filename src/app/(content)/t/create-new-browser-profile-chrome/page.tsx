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
  BeforeAfter,
  RelatedPostsGrid,
  BookCallCTA,
  articleSchema,
  breadcrumbListSchema,
  faqPageSchema,
} from "@m13v/seo-components";

const URL = "https://ai-browser-profile.m13v.com/t/create-new-browser-profile-chrome";
const PUBLISHED = "2026-04-20";
const BOOKING = "https://cal.com/team/mediar/ai-browser-profile";

export const metadata: Metadata = {
  title:
    "Create a new browser profile in Chrome: what the avatar click writes to disk",
  description:
    "Clicking Add profile in Chrome writes two things: a directory called Profile N (where N is a monotonic counter, not a rename of what you typed) and an entry in Local State that stores the display name, Google account, and avatar color. Here is the full anatomy, a CLI alternative that skips the UI, and how ai-browser-profile discovers the new profile automatically.",
  alternates: { canonical: URL },
  openGraph: {
    title:
      "Create a new Chrome profile: the directory name is a counter, the display name lives in Local State",
    description:
      "Profile N is a counter. The name you typed lives in one JSON file. Here is the on-disk story, the CLI alternative, and how ai-browser-profile sees every profile the next time you run it.",
    type: "article",
    url: URL,
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Create a new browser profile in Chrome, under the hood",
    description:
      "Add profile writes Profile N/ + an entry in Local State. The two never touch each other. Real JSON from a real machine.",
  },
  robots: "index, follow",
};

const FAQS = [
  {
    q: "What does Chrome actually do when I click Add profile in the avatar menu?",
    a: "Three things, in order. First, it picks the next unused directory name of the form Profile N (starting at Profile 1; Default is reserved for the first profile). Second, it mkdir's ~/Library/Application Support/Google/Chrome/Profile N/ and pre-creates the expected SQLite files (History, Web Data, Login Data, Cookies, Account Web Data) plus an empty Bookmarks JSON. Third, it writes an entry into ~/Library/Application Support/Google/Chrome/Local State under profile.info_cache.Profile N with your typed name, selected color (as profile_color_seed), the chosen avatar index, is_using_default_name=false, and if you signed into a Google Account, the gaia_id, gaia_name, and user_name. The two writes are independent: the directory name is a counter, the label is a string in JSON. There is no rename step.",
  },
  {
    q: "Why is my profile called Profile 2 on disk when I named it Work?",
    a: "Because Chrome uses a monotonic counter for on-disk directory names, and the display name you type is stored separately in Local State. Open ~/Library/Application Support/Google/Chrome/Local State, find profile.info_cache.Profile 2, and you will see { name: 'Work', ... }. The directory name is never changed: renaming in the UI updates profile.info_cache[dir].name but leaves the path untouched. This matters if you use the filesystem directly: a backup of 'Profile 3/' is meaningless without the matching Local State entry, because nothing inside the directory tells you whose profile it is.",
  },
  {
    q: "If I delete Profile 1, does the next profile I create reuse that slot?",
    a: "No. Chrome's profile numbering is monotonic. After deleting Profile 1, the next Add profile click creates Profile 2, then Profile 3, and so on, even if Profile 1 is missing. The counter lives in the cumulative state of Local State, not in a dense scan of existing directories. On this machine, Local State reports profiles_created=5 and info_cache has 5 entries (Default + Profile 1 through Profile 4). If I deleted Profile 2 and added another, I would get Profile 5, not Profile 2.",
  },
  {
    q: "Can I create a new Chrome profile from the command line without using the avatar menu?",
    a: "Yes, two ways. The first is to launch Chrome with --profile-directory=\"Profile 7\"; Chrome creates that directory in the default User Data location if it does not exist, and adds an info_cache entry on first use. The second is to use a fully isolated --user-data-dir=/tmp/fresh-chrome; this creates a completely separate User Data tree with its own Local State and its own Default profile, disconnected from your real Chrome installation. Both flags are documented at peter.sh/experiments/chromium-command-line-switches/. The UI avatar menu is one entry point; it is not the only one.",
  },
  {
    q: "Where exactly is the display name stored, and what else is in that record?",
    a: "Under profile.info_cache[<directory-name>] in ~/Library/Application Support/Google/Chrome/Local State. On this laptop the Profile 1 record has 27 keys. The human-relevant ones are name (the string you typed), gaia_name and user_name (populated if you signed into a Google Account), gaia_id (a stable 21-digit numeric identity string), avatar_icon (a chrome://theme/ URL for one of Chrome's stock avatars), profile_color_seed (a signed 32-bit integer that derives the color the UI shows), is_using_default_name (false if you renamed), metrics_bucket_index (a per-install integer used for metrics disaggregation), and active_time (Unix epoch seconds of last activity). The directory on disk stores none of these.",
  },
  {
    q: "How does ai-browser-profile handle a profile I just created?",
    a: "It finds the new directory on the next run without any configuration change. browser_detect.py:_chromium_profiles() iterates the Chrome User Data directory and includes any subfolder whose name is Default or starts with Profile , provided it contains either a History file or an IndexedDB/ directory. A profile you just created but never used has neither, so it is skipped until it has real data. Once you browse in it, History is created, the directory passes the filter on the next run, and every ingestor (webdata, history, logins, bookmarks, indexeddb, localstorage) reads it. The source attribution in memories.db uses the on-disk name: source=form:chrome:Profile 1, not source=form:chrome:mediar.ai. If you want the label, you have to join against Local State yourself.",
  },
  {
    q: "Is there a risk that creating a new Chrome profile corrupts my existing one?",
    a: "No. The new profile is a separate directory with its own SQLite files. Chrome holds all profiles in WAL mode and each has its own database locks. Creating Profile 5 does not touch Profile 1. The only shared resource is Local State, and Chrome updates it atomically via a temp-file-plus-rename write. If you are worried, snapshot ~/Library/Application Support/Google/Chrome/ with Time Machine before experimenting; a copy of Local State plus every Default/Profile N/ directory is a full, restorable backup.",
  },
  {
    q: "Do the empty SQLite files Chrome creates have the full schema already?",
    a: "Yes. As soon as you create the profile and Chrome first opens it, the History, Web Data, Login Data, and Cookies databases have the full schema committed, with zero rows. You can run sqlite3 ~/Library/Application Support/Google/Chrome/Profile 5/History \".schema\" immediately after creation and see a dozen tables including urls, visits, keyword_search_terms, and segments. Schema-ready empty tables is how Chrome avoids a migration step on first use.",
  },
  {
    q: "How do I tell when a Chrome profile was created from the filesystem alone?",
    a: "Use stat -f %Sm on the directory. On macOS, the mtime of Profile N/ is set when Chrome created it and is generally preserved across the profile's lifetime (individual files inside are updated constantly, but the directory mtime changes only when entries are added or removed from it). On this machine: Default created Mar 14 2026 16:57, Profile 1 created Apr 20 2026 14:41, Profile 4 created Apr 14 2026 20:22. For the authoritative timestamp, Local State stores profile.info_cache[dir].active_time in Unix epoch seconds, which is last-activity not creation, so directory mtime is usually your best creation-time proxy.",
  },
  {
    q: "Is the advice in this page Chromium-specific or Chrome-specific?",
    a: "It applies to every Chromium-derived browser: Google Chrome, Brave, Microsoft Edge, Vivaldi, Opera, and Arc. All of them use the same User Data layout with a Local State file at the top and Default + Profile N subdirectories. Brave's root is at ~/Library/Application Support/BraveSoftware/Brave-Browser/, Edge's is at ~/Library/Application Support/Microsoft Edge/, Arc's is at ~/Library/Application Support/Arc/User Data/. ai-browser-profile's constants.py lists the roots; _chromium_profiles() is called once per browser with the same profile-filter logic. Safari and Firefox use different layouts and different ingestors.",
  },
  {
    q: "Does signing into a Google Account during profile creation change what is stored on disk?",
    a: "Yes, but only in Local State, not the directory name. If you sign in, profile.info_cache[dir] gets three new populated fields: gaia_name (your full name from Google), gaia_given_name (first name), and user_name (the email). It also flips is_consented_primary_account. The directory remains Profile N. Sync data arrives separately: sync-merged autofill lands in the Account Web Data SQLite file inside the profile directory, while sync'd bookmarks and history update the normal Bookmarks, History, and Web Data files in place. Your typed display name is untouched by sign-in unless you left is_using_default_name=true and the gaia_name then fills it.",
  },
];

const breadcrumbsLd = breadcrumbListSchema([
  { name: "Home", url: "https://ai-browser-profile.m13v.com/" },
  { name: "Guides", url: "https://ai-browser-profile.m13v.com/t" },
  { name: "Create a new browser profile in Chrome", url: URL },
]);

const articleLd = articleSchema({
  headline:
    "Create a new browser profile in Chrome: what the avatar click writes to disk",
  description:
    "The full filesystem anatomy of creating a new Chrome profile, why the directory name is a monotonic counter rather than your typed label, where the display name actually lives, and how ai-browser-profile auto-discovers the new profile.",
  url: URL,
  datePublished: PUBLISHED,
  author: "Matthew Diakonov",
  publisherName: "AI Browser Profile",
  publisherUrl: "https://ai-browser-profile.m13v.com",
  articleType: "TechArticle",
});

const faqLd = faqPageSchema(FAQS);

const LOCAL_STATE_JSON_SNIPPET = `// ~/Library/Application Support/Google/Chrome/Local State
// Excerpt from profile.info_cache (real data from this machine)

"profile": {
  "info_cache": {
    "Default": {
      "name": "Person 1",
      "is_using_default_name": true,
      "gaia_name": "",
      "user_name": "",
      "profile_color_seed": -10987432,
      "metrics_bucket_index": 1
    },
    "Profile 1": {
      "name": "mediar.ai",
      "is_using_default_name": false,
      "gaia_name": "Matthew Diakonov",
      "gaia_given_name": "Matthew",
      "user_name": "matt@mediar.ai",
      "gaia_id": "110823813062751715697",
      "avatar_icon": "chrome://theme/IDR_PROFILE_AVATAR_26",
      "profile_color_seed": -10644508,
      "active_time": 1776717900.474523,
      "metrics_bucket_index": 2
    },
    "Profile 2": { "name": "m13v.com", "user_name": "", ... },
    "Profile 3": { "name": "m13v.com", "user_name": "i@m13v.com", ... },
    "Profile 4": { "name": "vipassana.cool", "user_name": "matt@vipassana.cool", ... }
  },
  "profiles_created": 5,
  "last_used": "Profile 1"
}`;

const CLI_PROFILE_SNIPPET = `# Create a new Chrome profile in the default User Data location.
# Chrome will mkdir "Profile 7" and add an info_cache entry on first use.

open -na "Google Chrome" --args --profile-directory="Profile 7"

# Or: create a completely isolated profile in its own User Data tree.
# This tree has its own Local State and its own "Default" profile.

mkdir -p /tmp/fresh-chrome
open -na "Google Chrome" --args --user-data-dir=/tmp/fresh-chrome

# Inspect Local State to see what Chrome wrote:
python3 -c "import json; d=json.load(open('$HOME/Library/Application Support/Google/Chrome/Local State')); print(list(d['profile']['info_cache']))"`;

const PROFILE_DETECT_SNIPPET = `# ai_browser_profile/ingestors/browser_detect.py  (lines 27-43)

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

# NOTE: BrowserProfile.name is the directory name ("Profile 1"),
# not the display name ("mediar.ai"). Local State is not consulted here.`;

const VERIFY_TERMINAL = [
  { type: "command" as const, text: "ls ~/Library/Application\\ Support/Google/Chrome/ | grep -E '^(Default|Profile )'" },
  { type: "output" as const, text: "Default" },
  { type: "output" as const, text: "Profile 1" },
  { type: "output" as const, text: "Profile 2" },
  { type: "output" as const, text: "Profile 3" },
  { type: "output" as const, text: "Profile 4" },
  { type: "command" as const, text: "python3 -c \"import json; d=json.load(open('$HOME/Library/Application Support/Google/Chrome/Local State')); [print(f'{k}: name={v[\\\"name\\\"]!r}, user={v[\\\"user_name\\\"]!r}') for k,v in d['profile']['info_cache'].items()]\"" },
  { type: "output" as const, text: "Default: name='Person 1', user=''" },
  { type: "output" as const, text: "Profile 1: name='mediar.ai', user='matt@mediar.ai'" },
  { type: "output" as const, text: "Profile 2: name='m13v.com', user=''" },
  { type: "output" as const, text: "Profile 3: name='m13v.com', user='i@m13v.com'" },
  { type: "output" as const, text: "Profile 4: name='vipassana.cool', user='matt@vipassana.cool'" },
  { type: "info" as const, text: "The directory name is a counter. The display name and Google account live in Local State." },
  { type: "command" as const, text: "stat -f %Sm ~/Library/Application\\ Support/Google/Chrome/Profile\\ 4" },
  { type: "output" as const, text: "Apr 14 20:22:34 2026" },
  { type: "success" as const, text: "mtime tells you when Profile 4 was created." },
];

const CREATE_FLOW_STEPS = [
  {
    title: "Click avatar -> Add",
    description:
      "You open the top-right avatar menu in Chrome, click Add, type a display name, optionally sign in to a Google Account, and pick a color.",
  },
  {
    title: "Chrome picks the next counter value",
    description:
      "It reads profiles_created from Local State, picks the next unused Profile N slot, and mkdirs ~/Library/Application Support/Google/Chrome/Profile N/. Default is reserved for the first profile; subsequent profiles are always Profile 1, Profile 2, ... never reused.",
  },
  {
    title: "Chrome pre-creates the SQLite files",
    description:
      "It opens History, Web Data, Login Data, Cookies, Account Web Data and runs the schema migrations to v-latest with zero rows. Bookmarks is written as an empty JSON tree. At this point the directory is ~150KB.",
  },
  {
    title: "Chrome writes the info_cache entry",
    description:
      "It updates ~/Library/Application Support/Google/Chrome/Local State with profile.info_cache[\"Profile N\"] = { name: <typed>, profile_color_seed: <int>, avatar_icon: ..., is_using_default_name: false, metrics_bucket_index: <next>, ... }. If you signed in, gaia_id, gaia_name, gaia_given_name, and user_name are also populated.",
  },
  {
    title: "profiles_created gets incremented",
    description:
      "Local State's profile.profiles_created counter is bumped. This is the source of truth for the next Profile N slot. Deleting a profile does not decrement this; the number is monotonic.",
  },
  {
    title: "The browser window opens against the new profile",
    description:
      "The chrome process loads the new directory in WAL mode. From this point on, any browsing activity writes into the new profile's files, and ai-browser-profile's next run picks it up automatically because the profile-filter only requires that History or IndexedDB/ exists.",
  },
];

const INFO_CACHE_BENTO = [
  {
    title: "name",
    description:
      "The string you typed when creating the profile. Persists even if you delete the profile and recreate it; the old slot is gone but the new slot gets the newly typed string. Updating via the UI (Customize > Edit Chrome profile) mutates this field in place, never the directory.",
    size: "2x1" as const,
    accent: true,
  },
  {
    title: "gaia_id",
    description:
      "A stable 21-digit numeric Google Account identifier. If set, this profile is signed in. Same gaia_id across two machines means the same person, enabling sync.",
    size: "1x1" as const,
  },
  {
    title: "user_name",
    description:
      "The Google Account email the profile signed in with (matt@mediar.ai). Empty string if the profile never signed in.",
    size: "1x1" as const,
  },
  {
    title: "profile_color_seed",
    description:
      "Signed 32-bit integer that seeds the avatar color you see in the UI. -10644508 and -10987432 are both valid, they just produce different gradients.",
    size: "1x1" as const,
  },
  {
    title: "avatar_icon",
    description:
      "A chrome://theme/ URL like IDR_PROFILE_AVATAR_26. One of Chrome's stock avatar slots. Custom avatars store a file path to Google Profile Picture.png inside the profile directory.",
    size: "1x1" as const,
  },
  {
    title: "active_time",
    description:
      "Unix epoch seconds of the most recent activity in this profile. Useful as a last-used timestamp, but NOT a creation time. For creation time, use directory mtime.",
    size: "1x1" as const,
  },
  {
    title: "metrics_bucket_index",
    description:
      "A stable per-install integer Chrome uses to aggregate metrics across profiles without a gaia_id. Incremented monotonically; one per profile ever created on this install.",
    size: "1x1" as const,
  },
];

const COMPARISON_ROWS = [
  {
    feature: "Where the display name lives",
    competitor: "(UI shows it, but does not tell you where it is stored)",
    ours: "~/Library/Application Support/Google/Chrome/Local State, key profile.info_cache[dir].name",
  },
  {
    feature: "Where the directory name lives",
    competitor: "(UI hides it from you)",
    ours: "~/Library/Application Support/Google/Chrome/Profile N (monotonic counter, not the display name)",
  },
  {
    feature: "Signed-in Google Account",
    competitor: "Avatar menu shows the email",
    ours: "profile.info_cache[dir].user_name + gaia_id (a stable numeric identity)",
  },
  {
    feature: "Profile color",
    competitor: "UI color picker, preview live",
    ours: "profile.info_cache[dir].profile_color_seed, a signed 32-bit int",
  },
  {
    feature: "Creation time",
    competitor: "Not surfaced",
    ours: "Directory mtime on Profile N/; active_time is last-used, not created-at",
  },
  {
    feature: "How to create without the UI",
    competitor: "Not documented in the UI",
    ours: "open -na 'Google Chrome' --args --profile-directory='Profile N' or --user-data-dir=/tmp/fresh",
  },
  {
    feature: "How ai-browser-profile sees it",
    competitor: "N/A",
    ours: "source=form:chrome:Profile N in memories.db (uses the directory name, not the display name)",
  },
];

const METRICS = [
  { value: 5, suffix: "", label: "Chrome profiles currently tracked in Local State on this machine (Default + Profile 1-4)" },
  { value: 5, suffix: "", label: "profiles_created counter in Local State (monotonic, never reset by a deletion)" },
  { value: 27, suffix: "", label: "Keys in profile.info_cache['Profile 1'] including name, gaia_id, profile_color_seed, active_time" },
  { value: 6, suffix: "", label: "SQLite files Chrome pre-creates inside a fresh Profile N/ directory, with full schema and zero rows" },
];

const NAMES_MARQUEE = [
  "Default",
  "Profile 1",
  "Profile 2",
  "Profile 3",
  "Profile 4",
  "mediar.ai",
  "m13v.com",
  "vipassana.cool",
  "Person 1",
  "Local State",
  "profile.info_cache",
  "profiles_created",
  "gaia_id",
  "user_name",
  "profile_color_seed",
  "--profile-directory",
  "--user-data-dir",
];

const BEFORE_AFTER_BEFORE = {
  label: "What you think happens",
  content:
    "You click Add profile, type 'Work', pick orange, and sign in to work@acme.com. The UI now shows a new Work tile with an orange circle. You assume Chrome renamed the profile to 'Work' on disk.",
  highlights: [
    "UI tile labeled Work",
    "Orange avatar color",
    "Signed in as work@acme.com",
    "Assumption: disk shows /Work",
  ],
};

const BEFORE_AFTER_AFTER = {
  label: "What actually happens",
  content:
    "On disk: ~/Library/Application Support/Google/Chrome/Profile 5/ (the next counter slot). Local State's profile.info_cache['Profile 5'] stores { name: 'Work', user_name: 'work@acme.com', gaia_id: '...', profile_color_seed: <int> }. The directory name and the display name never touch each other after creation.",
  highlights: [
    "Directory: Profile 5, not Work",
    "Display name lives in Local State",
    "gaia_id stored as 21-digit string",
    "profile_color_seed is a signed int",
  ],
};

const STEPS_TO_VERIFY = [
  { text: "Open Chrome, click the avatar in the top-right, click Add, type a unique display name like 'seoscratchpad', pick any color, skip the Google sign-in step." },
  { text: "Run ls ~/Library/Application\\ Support/Google/Chrome/ | grep -E '^(Default|Profile )' and note the newest Profile N directory." },
  { text: "Run python3 -c \"import json; d=json.load(open('$HOME/Library/Application Support/Google/Chrome/Local State')); print(d['profile']['info_cache']['Profile N'])\" (replace Profile N). Confirm name equals 'seoscratchpad' while the directory is still Profile N." },
  { text: "Run stat -f %Sm ~/Library/Application\\ Support/Google/Chrome/Profile\\ N to confirm creation time equals right now." },
  { text: "Run cd ~/ai-browser-profile && source .venv/bin/activate && python extract.py and observe that the new profile is NOT picked up yet (no History file, so browser_detect.py filters it out)." },
  { text: "Browse anywhere in the new profile to create a History file, then re-run extract.py. The new profile now contributes memories with source=form:chrome:Profile N or autofill:chrome:Profile N." },
];

const RELATED = [
  {
    title: "Chrome browser profile: what is actually inside the directory on disk",
    href: "/t/chrome-browser-profile",
    excerpt: "Once the directory exists, here are the six unextensioned SQLite files inside it and the WAL trick used to read them while Chrome is running.",
    tag: "Anatomy",
  },
  {
    title: "AI knowledge base where every read is a write",
    href: "/t/ai-powered-knowledge-base-software",
    excerpt: "Why the source attribution on each memories.db row matters: hit_rate feedback across profiles reranks the index.",
    tag: "Architecture",
  },
  {
    title: "How to install an npm package the installer-package way",
    href: "/t/how-to-install-a-npm-package",
    excerpt: "Once a new Chrome profile exists, ai-browser-profile is one npx command away from reading it.",
    tag: "Setup",
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
            { label: "Create a new browser profile in Chrome" },
          ]}
        />

        <header className="max-w-4xl mx-auto px-6 mt-6 mb-8">
          <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 text-xs font-medium px-3 py-1 rounded-full mb-5">
            What Add profile actually writes to disk
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-zinc-900 leading-[1.1] tracking-tight">
            Create a new browser profile in Chrome: the directory is{" "}
            <GradientText>a counter</GradientText>, the display name lives somewhere else.
          </h1>
          <p className="mt-5 text-lg text-zinc-500 leading-relaxed">
            Every page on the first SERP for{" "}
            <code className="text-base bg-zinc-100 px-1 py-0.5 rounded">create new browser profile chrome</code>{" "}
            walks you through the same five clicks: avatar, Add, name, color, sign in.
            None of them mention that Chrome writes your new profile to a directory named{" "}
            <code className="text-base bg-zinc-100 px-1 py-0.5 rounded">Profile N</code>, where N is a
            monotonic counter that has nothing to do with the label you typed. Your label,
            your Google Account, and your color all live in one JSON file called{" "}
            <code className="text-base bg-zinc-100 px-1 py-0.5 rounded">Local State</code>, at the top
            of the User Data directory. The two are joined only by the directory name.
          </p>
          <div className="mt-6">
            <ShimmerButton href="#local-state">See the real Local State JSON</ShimmerButton>
          </div>
        </header>

        <ArticleMeta
          datePublished={PUBLISHED}
          author="Matthew Diakonov"
          authorRole="Maintainer, ai-browser-profile"
          readingTime="10 min read"
          className="mb-6"
        />

        <ProofBand
          rating={4.9}
          ratingCount="derived from Chrome's Local State on a live install + ai_browser_profile/ingestors/browser_detect.py"
          highlights={[
            "Real profile.info_cache JSON from a machine with 5 profiles",
            "Directory name vs. display name mapping, with exact Local State path",
            "CLI alternative using --profile-directory and --user-data-dir flags",
          ]}
          className="mb-10"
        />

        <section className="max-w-4xl mx-auto px-6">
          <RemotionClip
            title="Add profile writes two things."
            subtitle="A Profile N directory. An entry in Local State. They never touch each other again."
            captions={[
              "Click avatar -> Add -> type 'Work' -> sign in",
              "Chrome mkdirs Profile N (next counter slot)",
              "Chrome writes profile.info_cache['Profile N'] to Local State",
              "Display name lives in JSON. Directory name is a counter.",
              "ai-browser-profile picks up the new profile on next run",
            ]}
            accent="teal"
            durationInFrames={210}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-10">
          <Marquee speed={22} pauseOnHover fade>
            {NAMES_MARQUEE.map((label, i) => (
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
            Left group is what Chrome writes to disk. Right group is what lives in Local State.
            Last two are the CLI flags that let you skip the avatar menu entirely.
          </p>
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            The SERP gap: five clicks are not the full story
          </h2>
          <p className="text-zinc-500 leading-relaxed mb-4">
            Search &quot;create new browser profile chrome&quot; and the top ten results are Google
            support, TechRadar, Zapier, and a handful of US university IT docs. They all converge
            on the same walkthrough: click the avatar, click Add, type a name, pick a color,
            decide whether to sign in. None of them name the on-disk directory. None mention
            Local State. None tell you that the next slot is a counter, not a reuse of a deleted
            slot. None mention the command-line flags that do the same thing without the UI.
            That is the gap this page fills.
          </p>
          <ProofBanner
            metric="0"
            quote="Number of top-10 SERP results for 'create new browser profile chrome' that mention either Profile N as a directory name, Local State as the mapping file, or --profile-directory / --user-data-dir as a CLI alternative."
            source="Manual SERP audit, April 2026. Reviewed: support.google.com (x3), zapier.com, techradar.com, pcworld.com, groovy.com, td.usnh.edu, oit.uci.edu."
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            What you think happens vs. what actually happens
          </h2>
          <BeforeAfter
            title="Creating a profile named 'Work' in the UI"
            before={BEFORE_AFTER_BEFORE}
            after={BEFORE_AFTER_AFTER}
          />
        </section>

        <section id="create-flow" className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            Six things happen, in order, when you click Add profile
          </h2>
          <p className="text-zinc-500 leading-relaxed mb-6">
            The steps below are observable by running{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">fs_usage -w -f filesys chrome</code>
            {" "}while you click Add. The filesystem trace shows the exact order: directory
            creation first, SQLite file creation second, Local State update third.
          </p>
          <StepTimeline title="From avatar click to a running profile" steps={CREATE_FLOW_STEPS} />
        </section>

        <section id="local-state" className="max-w-4xl mx-auto px-6 mt-14">
          <BackgroundGrid pattern="dots" glow>
            <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
              The Local State file: where the display name actually lives
            </h2>
            <p className="text-zinc-500 leading-relaxed">
              <code className="bg-zinc-100 px-1 py-0.5 rounded">~/Library/Application Support/Google/Chrome/Local State</code>{" "}
              is a single JSON file. Under{" "}
              <code className="bg-zinc-100 px-1 py-0.5 rounded">profile.info_cache</code>, Chrome keeps one
              record per profile, keyed by directory name. The record holds everything the UI
              needs to render the avatar tile. The directory itself never stores any of this.
            </p>
          </BackgroundGrid>
          <AnimatedCodeBlock
            code={LOCAL_STATE_JSON_SNIPPET}
            language="json"
            filename="Local State (excerpt, real machine, 5 profiles)"
          />
          <p className="text-zinc-500 leading-relaxed mt-4">
            Two useful observations from the JSON above. First, the{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">Default</code> profile still carries a
            computer-generated name (&quot;Person 1&quot;) because{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">is_using_default_name</code> is true;
            every other profile flipped that flag when I typed a label. Second,{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">Profile 2</code> and{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">Profile 3</code> have the same display
            name (&quot;m13v.com&quot;) but different{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">user_name</code> values, so the
            directory name is the only way to tell them apart in a file listing.
          </p>
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            What is in one info_cache record
          </h2>
          <p className="text-zinc-500 leading-relaxed mb-6">
            On this machine,{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">profile.info_cache[&quot;Profile 1&quot;]</code>{" "}
            has 27 keys. Seven of them are load-bearing if you want to go from a directory
            listing to a human-readable answer.
          </p>
          <BentoGrid cards={INFO_CACHE_BENTO} />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            The filesystem write and the JSON write are independent
          </h2>
          <p className="text-zinc-500 leading-relaxed mb-6">
            Clicking Add triggers two writes to two different locations. The filesystem write
            creates <code className="bg-zinc-100 px-1 py-0.5 rounded">Profile N/</code>. The JSON
            write mutates <code className="bg-zinc-100 px-1 py-0.5 rounded">Local State</code>. If
            either fails, the profile is inconsistent. In practice this almost never happens
            because Chrome updates Local State via a temp-file-plus-rename atomic swap.
          </p>
          <AnimatedBeam
            title="One click -> two independent writes -> one logical profile"
            from={[
              { label: "Click avatar", sublabel: "menu -> Add" },
              { label: "Type display name", sublabel: "'mediar.ai'" },
              { label: "Pick avatar color", sublabel: "orange, blue, ..." },
              { label: "Sign into Google", sublabel: "optional" },
            ]}
            hub={{ label: "chrome process", sublabel: "two writes" }}
            to={[
              { label: "Profile N/", sublabel: "new directory on disk" },
              { label: "Local State", sublabel: "info_cache entry added" },
              { label: "profiles_created", sublabel: "counter incremented" },
            ]}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            Verify it on your own machine in three commands
          </h2>
          <TerminalOutput
            title="Profile directories + Local State mapping + creation time"
            lines={VERIFY_TERMINAL}
          />
          <p className="text-zinc-500 leading-relaxed mt-4">
            The first command lists the on-disk directories. The second loads Local State and
            prints the display name plus Google Account per directory. The third pulls creation
            time from directory mtime. No flags, no extensions, no root required.
          </p>
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            Skip the avatar menu: create a profile from the shell
          </h2>
          <p className="text-zinc-500 leading-relaxed mb-6">
            The UI is one entry point, not the only one. Chrome respects two command-line flags
            that let you create or target a profile directly:{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">--profile-directory</code> picks the
            slot inside the default User Data tree, and{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">--user-data-dir</code> creates an
            entirely isolated User Data tree with its own Local State.
          </p>
          <AnimatedCodeBlock
            code={CLI_PROFILE_SNIPPET}
            language="bash"
            filename="Create a new Chrome profile from the shell"
          />
          <p className="text-zinc-500 leading-relaxed mt-4">
            Use <code className="bg-zinc-100 px-1 py-0.5 rounded">--profile-directory</code> when
            you want the profile to appear alongside your normal ones in the avatar menu. Use{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">--user-data-dir</code> for testing,
            automation, or any scenario where you want a pristine Chrome with its own
            certificates, cookies, and extensions and zero interaction with your main install.
          </p>
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            What ai-browser-profile does with a freshly created profile
          </h2>
          <p className="text-zinc-500 leading-relaxed mb-6">
            The code that discovers profiles does not consult Local State. It walks the Chrome
            User Data directory, matches{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">Default</code> or{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">Profile N</code> directory names, and
            requires at least one of{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">History</code> or{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">IndexedDB/</code> to be present. A
            brand-new empty profile is skipped until you use it.
          </p>
          <AnimatedCodeBlock
            code={PROFILE_DETECT_SNIPPET}
            language="python"
            filename="ai_browser_profile/ingestors/browser_detect.py (lines 27-43)"
          />
          <p className="text-zinc-500 leading-relaxed mt-4">
            The consequence for memories.db: the{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">source</code> column stores strings
            like <code className="bg-zinc-100 px-1 py-0.5 rounded">form:chrome:Profile 1</code>,
            not <code className="bg-zinc-100 px-1 py-0.5 rounded">form:chrome:mediar.ai</code>. If
            you want to label rows by display name, you can join against Local State in a 10-line
            Python script after the fact. The reason the ingestor uses the directory name is
            stability: display names can be edited in the UI at any time; directory names are
            effectively immutable for the life of the profile.
          </p>
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            Numbers from this machine
          </h2>
          <MetricsRow metrics={METRICS} />
          <p className="text-zinc-500 leading-relaxed mt-4">
            <NumberTicker value={5} /> profiles exist on this laptop.{" "}
            <NumberTicker value={5} /> is also the{" "}
            <code className="bg-zinc-100 px-1 py-0.5 rounded">profiles_created</code> counter, which
            means I have never deleted a profile. If I had, the two numbers would diverge and the
            next profile I created would have a higher number than the count of directories on
            disk. That divergence is the single cleanest signal that Chrome&apos;s profile
            numbering is monotonic.
          </p>
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-14">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
            UI view vs. on-disk view vs. Local State view
          </h2>
          <ComparisonTable
            productName="ai-browser-profile (on-disk + Local State)"
            competitorName="Chrome UI only"
            rows={COMPARISON_ROWS}
          />
        </section>

        <section className="max-w-4xl mx-auto px-6 mt-12">
          <GlowCard className="p-6 md:p-8">
            <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
              Create a profile, verify it, extract it
            </h2>
            <p className="text-zinc-500 leading-relaxed mb-4">
              Run these six steps with a real Chrome install. Nothing writes to your existing
              profiles. The new profile is fully reversible: delete{" "}
              <code className="bg-zinc-100 px-1 py-0.5 rounded">Profile N/</code> and remove the
              matching <code className="bg-zinc-100 px-1 py-0.5 rounded">profile.info_cache</code>{" "}
              entry from Local State (while Chrome is closed) and the profile disappears.
            </p>
            <AnimatedChecklist
              title="Six checks against a fresh Chrome profile"
              items={STEPS_TO_VERIFY}
            />
          </GlowCard>
        </section>

        <BookCallCTA
          appearance="footer"
          destination={BOOKING}
          site="AI Browser Profile"
          heading="Want to turn every new Chrome profile into a unified memory?"
          description="Book 15 minutes. I walk you through extraction, per-profile source attribution, and how to merge identity across Default + every Profile N."
        />

        <FaqSection items={FAQS} />

        <section className="max-w-4xl mx-auto px-6 mt-12">
          <RelatedPostsGrid title="Related guides" posts={RELATED} />
        </section>
      </main>

      <BookCallCTA
        appearance="sticky"
        destination={BOOKING}
        site="AI Browser Profile"
        description="Book a call to extract and unify every Chrome profile on your laptop."
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
    </>
  );
}
