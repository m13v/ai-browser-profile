---
name: user-memories
description: "Query accumulated user memories (identity, contacts, accounts, addresses, payment, preferences) extracted from browser data. Use when you need context about the user to help with any task: form filling, emailing, booking, payments, or any task where knowing the user's info helps."
---

# User Memories

A self-ranking database of everything learned about the user from browser data. Memories are ranked by how often they're accessed vs how often they appear in search results — frequently useful memories rise, noise sinks.

## Quick Reference

| Item | Value |
|------|-------|
| Database | `/Users/matthewdi/user-memories/memories.db` |
| Module | `/Users/matthewdi/user-memories/user_memories/` |
| Rebuild | `cd /Users/matthewdi/user-memories && python extract.py` |

## How to Use

### Search by tags

```python
import sys
sys.path.insert(0, "/Users/matthewdi/user-memories")
from user_memories import MemoryDB

mem = MemoryDB("/Users/matthewdi/user-memories/memories.db")

# Search returns results ranked by hit_rate (accessed/appeared), then confidence
results = mem.search(["identity", "email"], limit=10)
for r in results:
    print(f'{r["key"]}: {r["value"]} (conf={r["confidence"]:.1f})')

# When you actually USE a memory, mark it accessed — this trains the ranking
mem.mark_accessed(results[0]["id"])

mem.close()
```

### Quick SQL queries

```bash
sqlite3 /Users/matthewdi/user-memories/memories.db
```

```sql
-- All identity info
SELECT m.key, m.value, m.confidence FROM memories m
JOIN memory_tags t ON m.id = t.memory_id WHERE t.tag = 'identity'
ORDER BY m.confidence DESC;

-- All emails
SELECT m.value, m.confidence, m.source FROM memories m
JOIN memory_tags t ON m.id = t.memory_id WHERE t.tag = 'email'
ORDER BY m.confidence DESC;

-- All contacts
SELECT m.key, m.value FROM memories m
JOIN memory_tags t ON m.id = t.memory_id WHERE t.tag = 'contact'
ORDER BY m.accessed_count DESC, m.confidence DESC;

-- Most accessed memories (the ones that proved useful)
SELECT key, value, accessed_count, appeared_count,
       CAST(accessed_count AS REAL) / MAX(appeared_count, 1) AS hit_rate
FROM memories WHERE accessed_count > 0
ORDER BY hit_rate DESC;

-- Search by key pattern
SELECT key, value, confidence FROM memories WHERE key LIKE 'account:%' ORDER BY confidence DESC;
```

## Available Tags

| Tag | What it covers | Example keys |
|-----|---------------|-------------|
| `identity` | Name, email, phone, company | `first_name`, `last_name`, `full_name`, `email`, `phone`, `company` |
| `email` | All email addresses | `email` |
| `phone` | Phone numbers | `phone` |
| `address` | Physical addresses | `street_address`, `city`, `state`, `zip`, `country` |
| `location` | Same as address | (alias) |
| `company` | Employer/org names | `company` |
| `contact` | People the user knows | `contact:{Name}`, `linkedin:{Name}` |
| `communication` | Emails, phones, contacts, messaging | `email`, `phone`, `contact:*` |
| `account` | Service accounts + tool usage | `account:{domain}`, `tool:{Service}` |
| `credential` | Login usernames per domain | `account:{domain}` |
| `tool` | Tools/services used | `tool:GitHub`, `tool:Slack`, `tool:Stripe` |
| `payment` | Card holder names, expiry | `card_holder_name`, `card_expiry`, `card_nickname` |
| `work` | Work-related (company, dev tools, LinkedIn) | `company`, `tool:GitHub`, `linkedin:*` |
| `social` | Social platforms | `tool:LinkedIn`, `tool:X/Twitter` |
| `dev` | Dev tools | `tool:GitHub`, `tool:Vercel` |
| `finance` | Financial tools | `tool:Stripe`, `tool:QuickBooks` |
| `ai` | AI tools | `tool:ChatGPT`, `tool:Claude` |

## Ranking System

Every `search()` call increments `appeared_count` for all returned memories. When the agent actually uses a memory (fills a form, includes in an email, etc.), call `mark_accessed(id)` to increment `accessed_count`.

**hit_rate** = `accessed_count / appeared_count`

Memories that appear in results but never get used naturally sink in ranking. Memories that get used every time they appear rise to the top. This creates a self-tuning system with no manual curation.

## Task-Specific Tag Queries

| Task | Tags to search |
|------|---------------|
| Fill out a form | `["identity", "email", "phone", "address"]` |
| Send an email | `["email", "communication"]` + search contact by name |
| Book a flight/hotel | `["identity", "address", "payment"]` |
| Log into a service | `["account", "credential"]` |
| Invoice a client | `["identity", "company", "address", "payment"]` |
| Find a contact | `["contact"]` + filter by key pattern |
| Dev/deploy task | `["account", "dev"]` |
| Social media post | `["account", "social"]` |

## Rebuilding Memories

To refresh from latest browser data:

```bash
cd /Users/matthewdi/user-memories
source .venv/bin/activate
python extract.py                                    # full scan
python extract.py --browsers arc chrome              # specific browsers
python extract.py --no-indexeddb --no-localstorage   # fast, skip LevelDB
```

This reads browser files directly (History, Login Data, Web Data, IndexedDB, Local Storage). The memory database preserves `appeared_count` and `accessed_count` across rebuilds via UPSERT logic — rankings are never lost.
