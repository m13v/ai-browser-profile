"""Ingest account/email memories from Chromium Login Data."""

import shutil
import sqlite3
import logging

from user_memories.db import MemoryDB
from user_memories.ingestors.browser_detect import BrowserProfile, copy_db, domain

log = logging.getLogger(__name__)


def ingest_logins(mem: MemoryDB, profiles: list[BrowserProfile]):
    """Extract account and email memories from Chromium Login Data files."""
    total = 0
    for profile in profiles:
        if profile.browser in ("safari", "firefox"):
            continue  # No Login Data SQLite for these

        tmp = copy_db(profile.path / "Login Data")
        if not tmp:
            continue
        try:
            conn = sqlite3.connect(f"file:{tmp}?mode=ro", uri=True)
            conn.row_factory = sqlite3.Row
            for row in conn.execute(
                "SELECT origin_url, username_value, times_used FROM logins "
                "WHERE username_value != '' ORDER BY times_used DESC LIMIT 200"
            ):
                d = domain(row["origin_url"])
                username = row["username_value"]
                use_count = row["times_used"] or 0
                conf = 0.9 if use_count > 20 else 0.7 if use_count > 5 else 0.5

                mem.upsert(f"account:{d}", username,
                           ["account", "credential"], conf, f"login:{d}")

                if "@" in username:
                    mem.upsert("email", username, ["identity", "email", "communication"],
                               conf, f"login:{d}")
                total += 1
            conn.close()
        except Exception as e:
            log.warning(f"Failed to read Login Data for {profile.browser}/{profile.name}: {e}")
        finally:
            shutil.rmtree(tmp.parent, ignore_errors=True)

    log.info(f"  Logins: {total} account entries")
