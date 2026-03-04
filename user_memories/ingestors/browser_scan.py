"""Ingest memories from a browser-scanner scan.db file."""

import json
import sqlite3
import logging

from user_memories.db import MemoryDB
from user_memories.ingestors.constants import SERVICE_NAMES

log = logging.getLogger(__name__)


def ingest_scan_db(mem: MemoryDB, scan_db_path: str):
    """Extract memories from an existing scan.db."""
    conn = sqlite3.connect(scan_db_path)
    conn.row_factory = sqlite3.Row

    # --- Logins -> accounts ---
    try:
        for row in conn.execute("SELECT DISTINCT domain, username, use_count FROM logins WHERE username != '' ORDER BY use_count DESC LIMIT 200"):
            domain = row["domain"]
            username = row["username"]
            use_count = row["use_count"] or 0
            conf = 0.9 if use_count > 20 else 0.7 if use_count > 5 else 0.5

            mem.upsert(f"account:{domain}", username,
                       ["account", "credential"], conf, f"login:{domain}")

            if "@" in username:
                mem.upsert("email", username, ["identity", "email", "communication"],
                           conf, f"login:{domain}")
    except sqlite3.OperationalError:
        pass

    # --- Top domains -> tools/services ---
    try:
        for row in conn.execute("SELECT domain, SUM(visit_count) as total FROM visits WHERE domain != '' GROUP BY domain ORDER BY total DESC LIMIT 200"):
            domain = row["domain"]
            total = row["total"]
            if domain in SERVICE_NAMES:
                service = SERVICE_NAMES[domain]
                conf = 0.9 if total > 100 else 0.7 if total > 20 else 0.5
                tags = ["account", "tool"]
                if service in ("GitHub", "GitLab", "Vercel", "Netlify", "Supabase", "Firebase", "CodeSandbox"):
                    tags.append("work")
                    tags.append("dev")
                elif service in ("Gmail", "Slack", "WhatsApp", "Discord", "Microsoft Teams", "Missive", "OpenPhone"):
                    tags.append("communication")
                elif service in ("LinkedIn", "X/Twitter", "Instagram", "Facebook", "Reddit", "YouTube", "Product Hunt"):
                    tags.append("social")
                elif service in ("Stripe", "QuickBooks", "Coinbase", "Gusto", "Polymarket"):
                    tags.append("finance")
                elif service in ("ChatGPT", "Claude", "Anthropic Console"):
                    tags.append("ai")
                mem.upsert(f"tool:{service}", str(total),
                           tags, conf, f"history:{domain}")
    except sqlite3.OperationalError:
        pass

    # --- WhatsApp contacts ---
    try:
        rows = conn.execute(
            "SELECT value_json FROM indexeddb_records WHERE origin LIKE '%whatsapp%' AND store='contact' AND value_json != ''"
        ).fetchall()
        for row in rows:
            try:
                data = json.loads(row["value_json"])
                if isinstance(data, str):
                    data = json.loads(data)
                name = data.get("name") or data.get("pushname") or data.get("verifiedName") or ""
                phone = data.get("phoneNumber") or ""
                jid = data.get("id") or ""
                if not name:
                    continue
                if not phone and "@c.us" in str(jid):
                    phone = str(jid).split("@")[0]
                    if phone.startswith("+"):
                        pass
                    elif len(phone) > 5:
                        phone = "+" + phone

                tags = ["contact", "communication"]
                is_biz = data.get("isBusiness") or data.get("isEnterprise")
                if is_biz:
                    tags.append("work")

                if phone:
                    mem.upsert(f"contact:{name}", phone,
                               tags, 0.7, "whatsapp")
                else:
                    mem.upsert(f"contact:{name}", jid,
                               tags, 0.5, "whatsapp")
            except (json.JSONDecodeError, TypeError, AttributeError):
                continue
    except sqlite3.OperationalError:
        pass

    # --- LinkedIn connections from Local Storage ---
    try:
        rows = conn.execute(
            "SELECT value FROM local_storage WHERE origin LIKE '%linkedin%' AND key='linkedin_assistant_profiles'"
        ).fetchall()
        for row in rows:
            val = row["value"] if isinstance(row["value"], str) else row[0]
            try:
                data = json.loads(val)
                profiles = data.get("profiles", {})
                for url, profile in profiles.items():
                    name = profile.get("name", "")
                    title = profile.get("title", "")
                    if not name:
                        continue
                    value = title if title else url
                    mem.upsert(f"linkedin:{name}", value,
                               ["contact", "work", "social"], 0.6, "linkedin")
            except json.JSONDecodeError:
                pass
    except sqlite3.OperationalError:
        pass

    conn.close()
