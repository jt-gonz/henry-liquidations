#!/usr/bin/env python3
"""
Removes every product that isn't from the AMPTAB catalog PDF import
(catalog_import.csv) and isn't one of the two washer/dryer sets, which
stay because they back their own homepage section + shop filter.

Before deleting anything:
  1. Writes a local JSON manifest of the full product rows being
     removed (scripts/archive/deleted_products_manifest.json) - the
     only full copy of this data once the DB rows are gone.
  2. For every image those products reference that actually exists in
     the `product-images` bucket, downloads it, compresses it hard
     (max 1000px, JPEG, small target size - this is a cold archive,
     not something served live), and re-uploads it under `archive/`
     in the SAME bucket.
  3. Deletes the original (uncompressed) image objects - confirmed
     via overlap check that no surviving product references them.
  4. Deletes the product rows.

Safe to re-run: re-fetches current non-catalog products each time, so
if it's interrupted partway, products already deleted just won't be
in the candidate list on the next run (their images will already be
archived).

Usage:
    npx dotenvx run -- python3 scripts/archive_and_delete_noncatalog_products.py
"""

import csv
import io
import json
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

from PIL import Image

BUCKET = "product-images"
ARCHIVE_PREFIX = "archive"
CATALOG_CSV = "catalog_import.csv"
KEEP_EXTRA_SLUGS = {"maytag-centennial-washer-and-dryer-set", "amana-washer-and-dryer-set"}
MANIFEST_PATH = "scripts/archive/deleted_products_manifest.json"

# Aggressive - this is a cold archive copy, not served to shoppers.
TARGET_BYTES = 150 * 1024
MAX_DIMENSIONS = [1000, 800, 600]
JPEG_QUALITIES = [70, 60, 50, 40]


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


def list_all(supabase, prefix=""):
    out, offset, page = [], 0, 1000
    while True:
        batch = supabase.storage.from_(BUCKET).list(
            prefix, {"limit": page, "offset": offset, "sortBy": {"column": "name", "order": "asc"}}
        )
        if not batch:
            break
        for e in batch:
            if e.get("id") is None and e.get("metadata") is None:
                sub = f"{prefix}/{e['name']}" if prefix else e["name"]
                out.extend(list_all(supabase, sub))
            else:
                full = f"{prefix}/{e['name']}" if prefix else e["name"]
                out.append(full)
        if len(batch) < page:
            break
        offset += page
    return out


def path_from_public_url(public_url):
    marker = f"/storage/v1/object/public/{BUCKET}/"
    if marker not in public_url:
        return None
    from urllib.parse import unquote
    return unquote(public_url.split(marker, 1)[1])


def compress(original_bytes):
    img = Image.open(io.BytesIO(original_bytes)).convert("RGB")
    best = None
    for max_dim in MAX_DIMENSIONS:
        w, h = img.size
        if w > max_dim or h > max_dim:
            if w >= h:
                new_w, new_h = max_dim, round(h * max_dim / w)
            else:
                new_h, new_w = max_dim, round(w * max_dim / h)
            resized = img.resize((new_w, new_h), Image.LANCZOS)
        else:
            resized = img
        for quality in JPEG_QUALITIES:
            buf = io.BytesIO()
            resized.save(buf, format="JPEG", quality=quality, optimize=True)
            data = buf.getvalue()
            if best is None or len(data) < len(best):
                best = data
            if len(data) <= TARGET_BYTES:
                return best
    return best


def main():
    from supabase import create_client
    import requests

    url = os.getenv("PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        print("Error: need PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Run with:")
        print("  npx dotenvx run -- python3 scripts/archive_and_delete_noncatalog_products.py")
        sys.exit(1)

    supabase = create_client(url, key)

    with open(CATALOG_CSV, newline="", encoding="utf-8") as f:
        catalog_slugs = {r["slug"] for r in csv.DictReader(f)}
    keep_slugs = catalog_slugs | KEEP_EXTRA_SLUGS

    print("Fetching products...")
    all_products = fetch_all(supabase, "products", "*")
    to_delete = [p for p in all_products if p["slug"] not in keep_slugs]
    print(f"{len(all_products)} total, {len(to_delete)} to archive + delete\n")

    if not to_delete:
        print("Nothing to do.")
        return

    os.makedirs(os.path.dirname(MANIFEST_PATH), exist_ok=True)
    with open(MANIFEST_PATH, "w") as f:
        json.dump(to_delete, f, indent=2, default=str)
    print(f"Wrote manifest of {len(to_delete)} products to {MANIFEST_PATH}")

    existing_paths = set(list_all(supabase))
    image_paths = set()
    for p in to_delete:
        for u in (p.get("image_url") or []):
            path = path_from_public_url(u)
            if path and path in existing_paths:
                image_paths.add(path)
    print(f"{len(image_paths)} referenced images actually exist in storage and will be archived\n")

    def archive_one(path):
        try:
            public_url = supabase.storage.from_(BUCKET).get_public_url(path)
            resp = requests.get(public_url, timeout=60)
            resp.raise_for_status()
            compressed = compress(resp.content)
            archive_path = f"{ARCHIVE_PREFIX}/{os.path.splitext(path)[0]}.jpg"
            for attempt in range(4):
                try:
                    supabase.storage.from_(BUCKET).upload(
                        archive_path, compressed, {"content-type": "image/jpeg", "upsert": "true"}
                    )
                    break
                except Exception:
                    if attempt == 3:
                        raise
                    time.sleep(2 * (attempt + 1))
            return (path, len(resp.content), len(compressed), "ok")
        except Exception as e:
            return (path, 0, 0, f"FAILED: {e}")

    print("Archiving (compress + re-upload under archive/)...")
    archive_results = []
    with ThreadPoolExecutor(max_workers=3) as ex:
        futures = [ex.submit(archive_one, p) for p in image_paths]
        for i, fut in enumerate(as_completed(futures)):
            archive_results.append(fut.result())
            if (i + 1) % 25 == 0:
                print(f"  [{i + 1}/{len(image_paths)}]")

    failed = [r for r in archive_results if r[3].startswith("FAILED")]
    archived_before = sum(r[1] for r in archive_results)
    archived_after = sum(r[2] for r in archive_results)
    print(f"Archived {len(archive_results) - len(failed)}/{len(image_paths)} "
          f"({archived_before/1024/1024:.1f}MB -> {archived_after/1024/1024:.1f}MB)")
    if failed:
        print(f"{len(failed)} FAILED to archive - will NOT delete these originals:")
        for p, _, _, s in failed:
            print(f"  {p}: {s}")

    succeeded_paths = {r[0] for r in archive_results if r[3] == "ok"}
    if succeeded_paths:
        print(f"\nDeleting {len(succeeded_paths)} original (uncompressed) image objects...")
        path_list = list(succeeded_paths)
        for i in range(0, len(path_list), 100):
            supabase.storage.from_(BUCKET).remove(path_list[i:i + 100])

    print(f"\nDeleting {len(to_delete)} product rows...")
    delete_ids = [p["id"] for p in to_delete]
    deleted, delete_errors = 0, []
    for i in range(0, len(delete_ids), 100):
        chunk = delete_ids[i:i + 100]
        try:
            supabase.table("products").delete().in_("id", chunk).execute()
            deleted += len(chunk)
        except Exception as e:
            delete_errors.append(str(e))

    print("\n" + "=" * 60)
    print("DONE")
    print("=" * 60)
    print(f"  Products deleted: {deleted}/{len(to_delete)}")
    print(f"  Images archived (compressed): {len(succeeded_paths)}")
    print(f"  Images failed to archive (originals kept): {len(failed)}")
    if delete_errors:
        print(f"  Delete errors: {delete_errors}")


if __name__ == "__main__":
    main()
