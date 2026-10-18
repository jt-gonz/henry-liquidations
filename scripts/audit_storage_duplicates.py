#!/usr/bin/env python3
"""
Audits the `product-images` Supabase Storage bucket: lists every file
recursively, finds exact-content duplicates (same eTag/hash stored
under different paths), and finds orphaned files no product's
image_url array references. Read-only - prints a report, deletes
nothing.

Usage:
    npx dotenvx run -- python3 scripts/audit_storage_duplicates.py
"""

import os
import sys
from collections import defaultdict
from urllib.parse import urlparse, unquote

BUCKET = "product-images"


def list_all(supabase, prefix=""):
    out = []
    offset, page = 0, 1000
    while True:
        batch = supabase.storage.from_(BUCKET).list(
            prefix, {"limit": page, "offset": offset, "sortBy": {"column": "name", "order": "asc"}}
        )
        if not batch:
            break
        for e in batch:
            if e.get("id") is None and e.get("metadata") is None:
                # folder - recurse
                sub_prefix = f"{prefix}/{e['name']}" if prefix else e["name"]
                out.extend(list_all(supabase, sub_prefix))
            else:
                full_path = f"{prefix}/{e['name']}" if prefix else e["name"]
                out.append({
                    "path": full_path,
                    "id": e.get("id"),
                    "size": (e.get("metadata") or {}).get("size", 0),
                    "etag": (e.get("metadata") or {}).get("eTag", ""),
                })
        if len(batch) < page:
            break
        offset += page
    return out


def fetch_all(supabase, table, columns):
    rows, offset, page = [], 0, 1000
    while True:
        resp = supabase.table(table).select(columns).range(offset, offset + page - 1).execute()
        batch = resp.data or []
        rows.extend(batch)
        if len(batch) < page:
            break
        offset += page
    return rows


def path_from_public_url(url, project_url):
    marker = f"/storage/v1/object/public/{BUCKET}/"
    if marker not in url:
        return None
    return unquote(url.split(marker, 1)[1])


def main():
    from supabase import create_client

    url = os.getenv("PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        print("Error: need PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Run with:")
        print("  npx dotenvx run -- python3 scripts/audit_storage_duplicates.py")
        sys.exit(1)

    supabase = create_client(url, key)

    print("Listing all objects in the bucket (recursive)...")
    files = list_all(supabase)
    total_size = sum(f["size"] for f in files)
    print(f"{len(files)} files, {total_size / 1024 / 1024:.1f} MB total\n")

    # ── Exact-content duplicates (same eTag, different path) ──────────
    by_etag = defaultdict(list)
    for f in files:
        if f["etag"]:
            by_etag[f["etag"]].append(f)

    dupe_groups = {etag: fs for etag, fs in by_etag.items() if len(fs) > 1}
    dupe_waste = sum(sum(f["size"] for f in fs[1:]) for fs in dupe_groups.values())
    print(f"Exact-content duplicate groups: {len(dupe_groups)}")
    print(f"  Wasted space if de-duped (keep 1 per group): {dupe_waste / 1024 / 1024:.1f} MB")
    for etag, fs in sorted(dupe_groups.items(), key=lambda kv: -sum(f['size'] for f in kv[1]))[:15]:
        print(f"  [{len(fs)}x, {fs[0]['size']/1024:.0f} KB each] " + ", ".join(f["path"] for f in fs[:4]) +
              (" ..." if len(fs) > 4 else ""))

    # ── Orphaned files (not referenced by any product.image_url) ──────
    print("\nFetching product image_url references...")
    products = fetch_all(supabase, "products", "id,image_url")
    referenced_paths = set()
    for p in products:
        for u in (p.get("image_url") or []):
            path = path_from_public_url(u, url)
            if path:
                referenced_paths.add(path)

    orphans = [f for f in files if f["path"] not in referenced_paths]
    orphan_size = sum(f["size"] for f in orphans)
    print(f"Files not referenced by any product: {len(orphans)} ({orphan_size / 1024 / 1024:.1f} MB)")
    for f in orphans[:20]:
        print(f"  {f['path']}  ({f['size']/1024:.0f} KB)")
    if len(orphans) > 20:
        print(f"  ... and {len(orphans) - 20} more")

    print("\n" + "=" * 60)
    print(f"Total bucket size:        {total_size / 1024 / 1024:.1f} MB")
    print(f"Duplicate-content waste:  {dupe_waste / 1024 / 1024:.1f} MB across {len(dupe_groups)} groups")
    print(f"Orphaned (unreferenced):  {orphan_size / 1024 / 1024:.1f} MB across {len(orphans)} files")


if __name__ == "__main__":
    main()
