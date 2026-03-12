---
name: user-memories-setup
description: "Set up user-memories for a new user. Installs via npm, creates Python venv, extracts browser data, and optionally enables semantic search. Use when: 'set up user memories', 'install user memories', 'configure user memories'."
---

# User Memories Setup

Interactive setup wizard for user-memories. Walk the user through installation and first extraction.

## When to use

- First-time setup of user-memories
- Reinstalling after a fresh machine setup
- Troubleshooting a broken installation

## Prerequisites

- Node.js 16+ (for `npx`)
- Python 3.10+
- macOS (browser paths are macOS-specific)

---

## Setup Flow

Run each step sequentially. **After each step, print a progress status to the user** so they can follow along:

```
[1/7] Install ............ done (12s)
[2/7] Verify ............. done (1s)
[3/7] Extract ............ running...
```

### Step 1: Install via npm

Check if already installed:

```bash
ls ~/user-memories/extract.py 2>/dev/null && echo "FOUND" || echo "NOT_FOUND"
```

If NOT_FOUND, install:
```bash
npx user-memories init
```

This:
- Copies Python source + skills to `~/user-memories/`
- Creates a Python venv at `~/user-memories/.venv/`
- Installs core deps (`ccl_chromium_reader`, `numpy`)
- Symlinks skills into `~/.claude/skills/`

To update code later without touching data:
```bash
npx user-memories update
```

**Tell the user:** "Installed user-memories to ~/user-memories. Python venv created, core deps installed, skills symlinked."

### Step 2: Verify the installation

```bash
~/user-memories/.venv/bin/python -c "
import sys
sys.path.insert(0, '$HOME/user-memories')
from user_memories import MemoryDB
print('MemoryDB imported successfully')
"
```

Expected: `MemoryDB imported successfully`

If it fails, check:
- Python venv exists: `ls ~/user-memories/.venv/bin/python`
- Deps installed: `~/user-memories/.venv/bin/pip list | grep ccl`

**Tell the user:** "Python environment verified - MemoryDB loads correctly."

### Step 3: Run extraction

**IMPORTANT:** Run extraction in the background so you can report progress to the user. The extraction has 8 stages and logs timing for each.

```bash
cd ~/user-memories && source .venv/bin/activate && python extract.py 2>&1
```

This scans all detected browsers (Arc, Chrome, Brave, Edge, Safari, Firefox) and extracts:
- Autofill profiles (names, emails, phones, addresses)
- Login data (accounts per domain)
- Browser history (tools/services used)
- Bookmarks (interests, tool usage)
- IndexedDB (WhatsApp contacts)
- Local Storage (LinkedIn connections)
- Notion (workspace contacts, if configured)
- Embeddings (semantic vectors, backfilled at end)

**INTERIM PROFILE:** The extraction pipeline prints an interim profile after the fast steps (autofill, history, bookmarks, logins, Notion — ~1s total) but before the slow steps (WhatsApp ~10s, embeddings ~3min). **As soon as you see the "Interim profile ready" log line, show the profile to the user immediately.** Don't wait for WhatsApp or embeddings to finish — the profile already has all identity, email, address, payment, account, and tool data. WhatsApp only adds a contact count.

Look for this in the logs:
```
Interim profile ready (WhatsApp + embeddings still running):
## User Profile
**Name:** ...
```

**Show this to the user right away**, then let the extraction continue in the background. Tell them: "Here's your profile from browser data. WhatsApp contacts and semantic embeddings are still processing..."

**After extraction + cleanup finish, report a final summary to the user:**

```
Extraction complete:
  Browsers scanned: 8 profiles (Arc, Chrome, Safari, Firefox)
  Raw memories: 5,878
  After cleanup: 5,431
  Time: 54s

  Breakdown:
    Autofill:      0.1s  (forms, addresses, cards)
    History:       1.8s  (tools & services)
    Bookmarks:     0.4s  (interests & links)
    Logins:        2.1s  (saved accounts)
    LinkedIn:      8.7s  (connections)
    Notion:        0.1s  (contacts & pages)
    WhatsApp:     15.3s  (contacts)
    Embeddings:   22.4s  (semantic vectors)
```

### Step 4: Verify extraction

```bash
~/user-memories/.venv/bin/python -c "
import sys, os
sys.path.insert(0, os.path.expanduser('~/user-memories'))
from user_memories import MemoryDB
mem = MemoryDB(os.path.expanduser('~/user-memories/memories.db'))
stats = mem.stats()
print(f'Total memories: {stats[\"total_memories\"]}')
print()
print(mem.profile_text())
mem.close()
"
```

**Show the profile to the user.** Check that name, email, phone, address look reasonable. If the primary email is wrong (a contact's email ranked higher), note that the review pipeline will fix this.

### Step 5: Set up automation (optional)

Ask: "Do you want weekly automatic extraction + review? (y/n)"

If yes (macOS):
```bash
ln -sf ~/user-memories/launchd/com.m13v.memory-review.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.m13v.memory-review.plist
```

Schedule: extracts new browser data weekly, then runs Claude to review new entries.

### Step 6: Summary

Print a final status card:

```
Setup Complete

  Location:     ~/user-memories
  Database:     ~/user-memories/memories.db
  Python:       ~/user-memories/.venv/bin/python
  Skills:       ~/.claude/skills/user-memories (+ 4 more)

  Memories:     5,431
  Embeddings:   5,431 vectors (semantic search enabled)
  Automation:   launchd weekly / not set up

  Try it:       Tell Claude "what's my email address"
  Update:       npx user-memories update
  Review:       /memory-review (Claude-powered cleanup)
```
