#!/usr/bin/env python3
"""CLI entry point for user-memories extraction."""

import argparse
import logging

from user_memories import extract_memories

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("extract")


def main():
    parser = argparse.ArgumentParser(description="Extract user memories from browser data")
    parser.add_argument("--scan-db", default="../browser-scanner/scan.db",
                        help="Path to browser-scanner scan.db (default: ../browser-scanner/scan.db)")
    parser.add_argument("--output", "-o", default="memories.db",
                        help="Output memories database path (default: memories.db)")
    args = parser.parse_args()

    mem = extract_memories(scan_db_path=args.scan_db, memories_db_path=args.output)
    stats = mem.stats()
    log.info(f"Done — {stats['total_memories']} memories in {args.output}")
    mem.close()


if __name__ == "__main__":
    main()
