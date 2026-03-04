# user-memories

Standalone tool that extracts user knowledge (identity, contacts, accounts, addresses, payments) from browser data into a self-ranking SQLite database.

## Quick Start

```bash
cd /Users/matthewdi/user-memories
python extract.py                                    # uses ../browser-scanner/scan.db
python extract.py --scan-db /path/to/scan.db         # custom scan.db path
python extract.py --output /path/to/memories.db      # custom output path
```

## Structure

- `extract.py` — CLI entry point
- `user_memories/__init__.py` — exports MemoryDB, extract_memories
- `user_memories/db.py` — MemoryDB class (schema, upsert, search, mark_accessed, stats)
- `user_memories/extract.py` — extract_memories() orchestrator
- `user_memories/ingestors/constants.py` — lookup maps + browser paths (self-contained)
- `user_memories/ingestors/browser_scan.py` — reads scan.db (logins, visits, whatsapp, linkedin)
- `user_memories/ingestors/webdata.py` — reads Web Data files directly from browser profiles

## Design

- **No external dependencies** — pure stdlib (sqlite3, json, pathlib, shutil)
- **File-based contract** — reads `scan.db` (known schema) from browser-scanner, no code imports
- **Ingestors pattern** — each data source is a separate module, easy to add new ones

## Git

Commit and push changes to current branch when done. Individual commits per file.
