# user-memories

Standalone tool that extracts user knowledge (identity, contacts, accounts, addresses, payments) from browser data into a self-ranking SQLite database.

## Quick Start

```bash
cd /Users/matthewdi/user-memories
source .venv/bin/activate
python extract.py                                    # scan all browsers
python extract.py --browsers arc chrome              # specific browsers only
python extract.py --no-indexeddb --no-localstorage   # skip LevelDB (fast)
python extract.py --output /path/to/memories.db      # custom output path
```

## Structure

- `extract.py` — CLI entry point
- `user_memories/__init__.py` — exports MemoryDB, extract_memories
- `user_memories/db.py` — MemoryDB class (schema, upsert, search, supersession, staleness decay, entity linking, profile)
- `user_memories/extract.py` — extract_memories() orchestrator
- `user_memories/ingestors/browser_detect.py` — BrowserProfile, detect_browsers(), copy_db(), domain()
- `user_memories/ingestors/constants.py` — lookup maps + browser paths (self-contained)
- `user_memories/ingestors/webdata.py` — reads Web Data files directly (autofill, addresses, credit cards)
- `user_memories/ingestors/history.py` — reads browser History SQLite (tool/service usage)
- `user_memories/ingestors/logins.py` — reads Login Data SQLite (accounts, emails)
- `user_memories/ingestors/indexeddb.py` — reads WhatsApp IndexedDB via ccl_chromium_reader (contacts)
- `user_memories/ingestors/localstorage.py` — reads LinkedIn Local Storage via ccl_chromium_reader (connections)

## Design

- **Reads browser files directly** — no intermediary scan.db needed
- **One pip dependency**: `ccl_chromium_reader` (for IndexedDB + Local Storage LevelDB files). Everything else is stdlib.
- **Ingestors pattern** — each data source is a separate module, easy to add new ones
- **Self-ranking** — hit_rate = accessed_count / appeared_count, no manual curation

## Git

Commit and push changes to current branch when done. Individual commits per file.
