"""MemoryDB — schema, upsert, search, mark_accessed, stats."""

import sqlite3
from datetime import datetime, timezone

SCHEMA = """
CREATE TABLE IF NOT EXISTS memories (
    id INTEGER PRIMARY KEY,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    confidence REAL DEFAULT 0.5,
    source TEXT,
    appeared_count INTEGER DEFAULT 0,
    accessed_count INTEGER DEFAULT 0,
    created_at TEXT,
    last_appeared_at TEXT,
    last_accessed_at TEXT,
    UNIQUE(key, value)
);

CREATE TABLE IF NOT EXISTS memory_tags (
    memory_id INTEGER REFERENCES memories(id) ON DELETE CASCADE,
    tag TEXT NOT NULL,
    PRIMARY KEY (memory_id, tag)
);
CREATE INDEX IF NOT EXISTS idx_tags ON memory_tags(tag);
"""


class MemoryDB:
    def __init__(self, path: str = "memories.db"):
        self.path = path
        self.conn = sqlite3.connect(path)
        self.conn.execute("PRAGMA journal_mode=WAL")
        self.conn.execute("PRAGMA foreign_keys=ON")
        self.conn.executescript(SCHEMA)

    def upsert(self, key: str, value: str, tags: list[str],
               confidence: float = 0.5, source: str = ""):
        """Insert or update a memory. If it exists, bump confidence if new source."""
        if not value or not value.strip():
            return
        value = value.strip()
        now = datetime.now(timezone.utc).isoformat()

        existing = self.conn.execute(
            "SELECT id, confidence, source FROM memories WHERE key=? AND value=?",
            (key, value),
        ).fetchone()

        if existing:
            mem_id, old_conf, old_source = existing
            new_conf = old_conf
            if source and old_source and source not in old_source:
                new_conf = min(1.0, old_conf + 0.1)
                source = f"{old_source}, {source}"
            self.conn.execute(
                "UPDATE memories SET confidence=?, source=? WHERE id=?",
                (new_conf, source, mem_id),
            )
        else:
            cursor = self.conn.execute(
                "INSERT INTO memories (key, value, confidence, source, created_at) VALUES (?, ?, ?, ?, ?)",
                (key, value, confidence, source, now),
            )
            mem_id = cursor.lastrowid

        for tag in tags:
            self.conn.execute(
                "INSERT OR IGNORE INTO memory_tags (memory_id, tag) VALUES (?, ?)",
                (mem_id, tag),
            )

        return mem_id

    def search(self, tags: list[str], limit: int = 20) -> list[dict]:
        """Search memories by tags, ranked by hit_rate then accessed_count then confidence."""
        placeholders = ",".join("?" for _ in tags)
        rows = self.conn.execute(f"""
            SELECT DISTINCT m.id, m.key, m.value, m.confidence, m.source,
                   m.appeared_count, m.accessed_count,
                   m.last_appeared_at, m.last_accessed_at,
                   CASE WHEN m.appeared_count = 0 THEN 0.0
                        ELSE CAST(m.accessed_count AS REAL) / m.appeared_count
                   END AS hit_rate
            FROM memories m
            JOIN memory_tags t ON m.id = t.memory_id
            WHERE t.tag IN ({placeholders})
            ORDER BY hit_rate DESC, m.accessed_count DESC, m.confidence DESC
            LIMIT ?
        """, (*tags, limit)).fetchall()

        now = datetime.now(timezone.utc).isoformat()
        ids = [r[0] for r in rows]
        if ids:
            id_placeholders = ",".join("?" for _ in ids)
            self.conn.execute(
                f"UPDATE memories SET appeared_count = appeared_count + 1, last_appeared_at = ? WHERE id IN ({id_placeholders})",
                (now, *ids),
            )
            self.conn.commit()

        return [
            {
                "id": r[0], "key": r[1], "value": r[2], "confidence": r[3],
                "source": r[4], "appeared_count": r[5] + 1, "accessed_count": r[6],
                "hit_rate": r[9],
            }
            for r in rows
        ]

    def mark_accessed(self, memory_id: int):
        """Mark a memory as actually used by the consuming agent."""
        now = datetime.now(timezone.utc).isoformat()
        self.conn.execute(
            "UPDATE memories SET accessed_count = accessed_count + 1, last_accessed_at = ? WHERE id = ?",
            (now, memory_id),
        )
        self.conn.commit()

    def stats(self) -> dict:
        """Return summary stats about the memory database."""
        total = self.conn.execute("SELECT COUNT(*) FROM memories").fetchone()[0]
        by_tag = self.conn.execute(
            "SELECT tag, COUNT(*) FROM memory_tags GROUP BY tag ORDER BY COUNT(*) DESC"
        ).fetchall()
        top_accessed = self.conn.execute(
            "SELECT key, value, accessed_count FROM memories WHERE accessed_count > 0 ORDER BY accessed_count DESC LIMIT 10"
        ).fetchall()
        return {
            "total_memories": total,
            "by_tag": {r[0]: r[1] for r in by_tag},
            "top_accessed": [{"key": r[0], "value": r[1], "accessed": r[2]} for r in top_accessed],
        }

    def close(self):
        self.conn.commit()
        self.conn.close()
