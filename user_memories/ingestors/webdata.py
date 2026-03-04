"""Ingest memories directly from Chromium Web Data files (address profiles, autofill, cards)."""

import shutil
import sqlite3
import tempfile
import logging
from pathlib import Path
from typing import Optional

from user_memories.db import MemoryDB
from user_memories.ingestors.constants import (
    ADDRESS_TYPE_MAP, AUTOFILL_FIELD_MAP, BROWSER_PATHS,
)

log = logging.getLogger(__name__)


def _copy_db(src: Path) -> Optional[Path]:
    """Copy a SQLite DB to temp dir to avoid browser locks."""
    if not src.exists():
        return None
    tmp = Path(tempfile.mkdtemp(prefix="user_memories_"))
    dst = tmp / src.name
    shutil.copy2(src, dst)
    for suffix in ["-wal", "-shm"]:
        wal = src.parent / (src.name + suffix)
        if wal.exists():
            shutil.copy2(wal, tmp / (src.name + suffix))
    return dst


def _extract_webdata(mem: MemoryDB, browser: str, profile: str, webdata_path: Path):
    """Extract address profiles, form autofill, and credit card info from Web Data."""
    tmp_db = _copy_db(webdata_path)
    if not tmp_db:
        return
    source_prefix = f"autofill:{browser}:{profile}"

    try:
        conn = sqlite3.connect(f"file:{tmp_db}?mode=ro", uri=True)
        conn.row_factory = sqlite3.Row

        # --- Structured address profiles ---
        use_counts = {}
        try:
            for row in conn.execute("SELECT guid, use_count FROM addresses"):
                use_counts[row["guid"]] = row["use_count"]
        except sqlite3.OperationalError:
            pass

        try:
            for row in conn.execute("SELECT guid, type, value FROM address_type_tokens WHERE value != ''"):
                type_code = row["type"]
                if type_code not in ADDRESS_TYPE_MAP:
                    continue
                key_name, tags = ADDRESS_TYPE_MAP[type_code]
                use_count = use_counts.get(row["guid"], 0)

                if use_count > 50:
                    conf = 0.9
                elif use_count > 10:
                    conf = 0.7
                elif use_count > 3:
                    conf = 0.6
                else:
                    conf = 0.4

                mem.upsert(key_name, row["value"], tags, conf, source_prefix)
        except sqlite3.OperationalError:
            pass

        # --- Form autofill entries ---
        try:
            for row in conn.execute("SELECT name, value, count FROM autofill WHERE value != '' ORDER BY count DESC LIMIT 200"):
                field = row["name"].lower()
                if field not in AUTOFILL_FIELD_MAP:
                    continue
                key_name, tags = AUTOFILL_FIELD_MAP[field]
                use_count = row["count"]

                if use_count > 50:
                    conf = 0.8
                elif use_count > 10:
                    conf = 0.6
                else:
                    conf = 0.4

                mem.upsert(key_name, row["value"], tags, conf, f"form:{browser}:{profile}")
        except sqlite3.OperationalError:
            pass

        # --- Credit cards (metadata only, no card numbers) ---
        try:
            for row in conn.execute("SELECT name_on_card, expiration_month, expiration_year, nickname FROM credit_cards"):
                if row["name_on_card"]:
                    mem.upsert("card_holder_name", row["name_on_card"],
                               ["payment", "identity"], 0.8, f"card:{browser}:{profile}")
                if row["expiration_month"] and row["expiration_year"]:
                    mem.upsert("card_expiry", f"{row['expiration_month']:02d}/{row['expiration_year']}",
                               ["payment"], 0.7, f"card:{browser}:{profile}")
                if row["nickname"]:
                    mem.upsert("card_nickname", row["nickname"],
                               ["payment"], 0.7, f"card:{browser}:{profile}")
        except sqlite3.OperationalError:
            pass

        conn.close()
    except Exception as e:
        log.warning(f"Failed to extract Web Data for {browser}/{profile}: {e}")
    finally:
        shutil.rmtree(tmp_db.parent, ignore_errors=True)


def ingest_webdata(mem: MemoryDB):
    """Extract memories from all Chromium Web Data files."""
    for browser, base in BROWSER_PATHS.items():
        if not base.exists():
            continue
        for d in sorted(base.iterdir()):
            if d.is_dir() and (d.name == "Default" or d.name.startswith("Profile ")):
                webdata = d / "Web Data"
                if webdata.exists():
                    log.info(f"  Web Data: {browser}/{d.name}")
                    _extract_webdata(mem, browser, d.name, webdata)
