"""Orchestrate memory extraction from all sources."""

import logging
from pathlib import Path

from user_memories.db import MemoryDB
from user_memories.ingestors.browser_scan import ingest_scan_db
from user_memories.ingestors.webdata import ingest_webdata

log = logging.getLogger(__name__)


def extract_memories(scan_db_path: str = "../browser-scanner/scan.db",
                     memories_db_path: str = "memories.db") -> MemoryDB:
    """Build the memories database from scan.db + direct Web Data extraction."""
    mem = MemoryDB(memories_db_path)
    log.info("Extracting memories...")

    # 1. Direct Web Data extraction (address profiles, form autofill, credit cards)
    ingest_webdata(mem)

    # 2. Extract from scan.db (logins, history, indexeddb, local storage)
    scan_path = Path(scan_db_path)
    if scan_path.exists():
        log.info(f"  scan.db: {scan_path}")
        ingest_scan_db(mem, scan_db_path)

    mem.conn.commit()
    stats = mem.stats()
    log.info(
        f"Memories: {stats['total_memories']} total, "
        f"tags: {', '.join(f'{t}={c}' for t, c in list(stats['by_tag'].items())[:10])}"
    )
    return mem
