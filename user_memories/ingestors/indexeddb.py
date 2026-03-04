"""Ingest WhatsApp contacts from Chromium IndexedDB (LevelDB)."""

import json
import shutil
import tempfile
import logging
from pathlib import Path

from user_memories.db import MemoryDB
from user_memories.ingestors.browser_detect import BrowserProfile

log = logging.getLogger(__name__)


def _copy_dir(src: Path) -> Path:
    """Copy a directory to temp to avoid browser locks."""
    tmp = Path(tempfile.mkdtemp(prefix="user_memories_idb_"))
    dst = tmp / src.name
    shutil.copytree(src, dst)
    return dst


def _serialize_value(val, depth=0):
    """Recursively convert ccl IndexedDB value to JSON-safe dict."""
    if depth > 20:
        return "<nested too deep>"
    if val is None:
        return None
    if isinstance(val, (bool, int, float, str)):
        return val
    if isinstance(val, bytes):
        try:
            return val.decode("utf-8")
        except UnicodeDecodeError:
            return f"<binary {len(val)} bytes>"
    if isinstance(val, dict):
        return {str(k): _serialize_value(v, depth + 1) for k, v in val.items()}
    if isinstance(val, (list, tuple)):
        return [_serialize_value(v, depth + 1) for v in val]
    if hasattr(val, "value"):
        return _serialize_value(val.value, depth + 1)
    return str(val)


def ingest_indexeddb(mem: MemoryDB, profiles: list[BrowserProfile]):
    """Extract WhatsApp contacts from Chromium IndexedDB."""
    from ccl_chromium_reader import ccl_chromium_indexeddb

    total = 0
    for profile in profiles:
        if profile.browser in ("safari", "firefox"):
            continue

        idb_root = profile.path / "IndexedDB"
        if not idb_root.exists():
            continue

        # Only look for WhatsApp origins
        for db_dir in sorted(idb_root.glob("*whatsapp*_0.indexeddb.leveldb")):
            origin = db_dir.name.split("_0.indexeddb")[0]
            blob_dir = db_dir.parent / db_dir.name.replace(".leveldb", ".blob")

            tmp_db = _copy_dir(db_dir)
            tmp_blob = _copy_dir(blob_dir) if blob_dir.exists() else None

            try:
                wrapper = ccl_chromium_indexeddb.WrappedIndexDB(
                    str(tmp_db),
                    str(tmp_blob) if tmp_blob else None,
                )

                for db_id in wrapper.database_ids:
                    try:
                        db = wrapper[db_id.name, db_id.origin]
                    except Exception:
                        continue

                    if "contact" not in db.object_store_names:
                        continue

                    for record in db["contact"].iterate_records():
                        try:
                            data = _serialize_value(record.value)
                            if not isinstance(data, dict):
                                continue

                            name = data.get("name") or data.get("pushname") or data.get("verifiedName") or ""
                            phone = data.get("phoneNumber") or ""
                            jid = data.get("id") or ""
                            if not name:
                                continue
                            if not phone and "@c.us" in str(jid):
                                phone = str(jid).split("@")[0]
                                if not phone.startswith("+") and len(phone) > 5:
                                    phone = "+" + phone

                            tags = ["contact", "communication"]
                            if data.get("isBusiness") or data.get("isEnterprise"):
                                tags.append("work")

                            if phone:
                                mem.upsert(f"contact:{name}", phone, tags, 0.7, "whatsapp")
                            else:
                                mem.upsert(f"contact:{name}", jid, tags, 0.5, "whatsapp")
                            total += 1
                        except Exception:
                            continue

            except Exception as e:
                log.warning(f"Failed to read WhatsApp IndexedDB for {profile.browser}/{profile.name}: {e}")
            finally:
                shutil.rmtree(tmp_db.parent, ignore_errors=True)
                if tmp_blob:
                    shutil.rmtree(tmp_blob.parent, ignore_errors=True)

    log.info(f"  IndexedDB: {total} WhatsApp contacts")
