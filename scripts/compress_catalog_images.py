#!/usr/bin/env python3
"""
Compresses every image under catalog-import/ in the `product-images`
Supabase Storage bucket in place: downloads the original, resizes +
re-encodes it (same target used for admin uploads - see
src/lib/utils/imageCompression.js), and re-uploads it to the SAME
path with upsert, so every product's image_url keeps working
unchanged. Fixes the project hitting its storage quota - the catalog
import re-hosted AMPTAB's full-resolution source images as-is
(some 25-44MB each).

Usage:
    npx dotenvx run -- python3 scripts/compress_catalog_images.py
"""

import io
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

from PIL import Image

BUCKET = "product-images"
PREFIX = "catalog-import"
TARGET_BYTES = 400 * 1024
MAX_DIMENSIONS = [1600, 1400, 1200, 1000]
JPEG_QUALITIES = [80, 70, 60, 50]


def list_all(supabase, prefix):
    out, offset, page = [], 0, 1000
    while True:
        batch = supabase.storage.from_(BUCKET).list(
            prefix, {"limit": page, "offset": offset, "sortBy": {"column": "name", "order": "asc"}}
        )
        if not batch:
            break
        for e in batch:
            full = f"{prefix}/{e['name']}"
            out.append({"path": full, "size": (e.get("metadata") or {}).get("size", 0)})
        if len(batch) < page:
            break
        offset += page
    return out


def compress(original_bytes):
    """Mirrors compressImage() in src/lib/utils/imageCompression.js."""
    img = Image.open(io.BytesIO(original_bytes))
    img = img.convert("RGB")

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
        print("  npx dotenvx run -- python3 scripts/compress_catalog_images.py")
        sys.exit(1)

    supabase = create_client(url, key)

    print(f"Listing files under {PREFIX}/ ...")
    only_file = os.getenv("COMPRESS_ONLY_FILE")
    if only_file:
        with open(only_file) as fh:
            wanted = {line.strip() for line in fh if line.strip()}
        files = [f for f in list_all(supabase, PREFIX) if f["path"] in wanted]
    else:
        files = list_all(supabase, PREFIX)
    limit = os.getenv("COMPRESS_LIMIT")
    if limit:
        files = files[: int(limit)]
    total_before = sum(f["size"] for f in files)
    print(f"{len(files)} files, {total_before / 1024 / 1024:.1f} MB total\n")

    workers = int(os.getenv("COMPRESS_WORKERS", "3"))
    results = []

    def process(f):
        path = f["path"]
        last_exc = None
        for attempt in range(4):
            try:
                public_url = supabase.storage.from_(BUCKET).get_public_url(path)
                resp = requests.get(public_url, timeout=60)
                resp.raise_for_status()
                original_size = len(resp.content)
                compressed = compress(resp.content)
                if compressed is None or len(compressed) >= original_size:
                    return (path, original_size, original_size, "kept original (already smaller)")
                supabase.storage.from_(BUCKET).upload(
                    path, compressed, {"content-type": "image/jpeg", "upsert": "true"}
                )
                return (path, original_size, len(compressed), "ok")
            except Exception as e:
                last_exc = e
                time.sleep(2 * (attempt + 1))
        return (path, f["size"], f["size"], f"FAILED: {last_exc}")

    print(f"Compressing + re-uploading with {workers} workers (this will take a while)...")
    with ThreadPoolExecutor(max_workers=workers) as ex:
        futures = [ex.submit(process, f) for f in files]
        for i, fut in enumerate(as_completed(futures)):
            path, before, after, status = fut.result()
            results.append((path, before, after, status))
            if (i + 1) % 25 == 0 or status.startswith("FAILED"):
                print(f"  [{i + 1}/{len(files)}] {path}: {before/1024:.0f}KB -> {after/1024:.0f}KB ({status})")

    total_after = sum(r[2] for r in results)
    failures = [r for r in results if r[3].startswith("FAILED")]

    print("\n" + "=" * 60)
    print("COMPRESSION COMPLETE")
    print("=" * 60)
    print(f"  Before: {total_before / 1024 / 1024:.1f} MB")
    print(f"  After:  {total_after / 1024 / 1024:.1f} MB")
    print(f"  Saved:  {(total_before - total_after) / 1024 / 1024:.1f} MB")
    print(f"  Failures: {len(failures)}")
    for p, _, _, s in failures:
        print(f"    {p}: {s}")


if __name__ == "__main__":
    main()
