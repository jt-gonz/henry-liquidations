#!/usr/bin/env python3
"""
Upload catalog_import.csv (parsed from the AMPTAB catalog PDF by
scripts/parse_catalog_pdf.py) into the live Supabase `products` table.

Two-phase insert, since bundle products reference their component
pieces' real database IDs:
  1. Check every slug against the live table first - anything already
     present is skipped, so this script is safe to re-run.
  2. Download every unique product image from the AMPTAB CMS signed
     URLs and re-upload it once to the `product-images` storage bucket
     under `catalog-import/`, so listings don't depend on amptab.com.
  3. Insert all standalone "piece" rows (empty bundle_component_codes),
     recording item_code -> new product id.
  4. Insert all "bundle" rows, resolving bundle_component_codes to
     piece ids (from step 3, or from an already-existing product if
     this is a partial re-run) and storing them as bundle_component_ids.
     Bundles get stock_quantity = NULL - their availability is always
     computed live from the components (see src/lib/server/stock.js).

Requires supabase/migrations/005_stock_quantity_and_bundles.sql to have
already been run against the project (adds stock_quantity /
bundle_component_ids columns + the decrement_stock() function).

Usage:
    npx dotenvx run -- python3 scripts/upload_catalog_import.py
"""

import csv
import json
import os
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import urlparse, parse_qs, unquote

import requests

CSV_PATH = "catalog_import.csv"
BUCKET = "product-images"
STORAGE_PREFIX = "catalog-import"


def get_env_var(key: str) -> str:
    value = os.getenv(key)
    if value:
        return value
    try:
        result = subprocess.run(
            ["npx", "dotenvx", "run", "--", "sh", "-c", f'echo "${key}"'],
            capture_output=True, text=True,
            cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        )
        if result.returncode == 0:
            lines = [l for l in result.stdout.strip().split("\n") if not l.startswith("[") and l.strip()]
            if lines:
                return lines[-1]
    except Exception:
        pass
    return None


def sanitize_text(value):
    """Postgres text columns reject literal NUL bytes outright; a rare
    glyph in the source PDF decodes to one. Strip stray control chars
    from any string value before it goes anywhere near an insert."""
    if not isinstance(value, str):
        return value
    return "".join(ch for ch in value if ch in ("\n", "\t") or ord(ch) >= 32)


def sanitize_payload(payload):
    return {k: sanitize_text(v) for k, v in payload.items()}


def download_with_retries(src_url, attempts=3):
    last_exc = None
    for i in range(attempts):
        try:
            resp = requests.get(src_url, timeout=30)
            resp.raise_for_status()
            return resp
        except Exception as e:
            last_exc = e
            if i < attempts - 1:
                time.sleep(1.5 * (i + 1))
    raise last_exc


def sanitize_filename(url):
    q = parse_qs(urlparse(url).query)
    name = unquote(q.get("name", ["image.jpg"])[0])
    base, ext = os.path.splitext(name)
    ext = ext.lower() if ext.lower() in (".jpg", ".jpeg", ".png", ".webp") else ".jpg"
    safe = "".join(c if c.isalnum() or c in "-_" else "_" for c in base).strip("_")
    return f"{safe}{ext}"


def upload_images(supabase, urls):
    """Download each URL (with retries — the AMPTAB CMS is flaky under
    concurrency) and re-upload it to the storage bucket. Returns
    {src_url: public_url_or_None}."""
    if not urls:
        return {}

    print(f"Downloading and re-hosting {len(urls)} unique images to the '{BUCKET}' bucket...")

    def upload_one(src_url):
        try:
            resp = download_with_retries(src_url)
            path = f"{STORAGE_PREFIX}/{sanitize_filename(src_url)}"
            content_type = resp.headers.get("content-type", "image/jpeg")
            supabase.storage.from_(BUCKET).upload(
                path, resp.content, {"content-type": content_type, "upsert": "true"}
            )
            public_url = supabase.storage.from_(BUCKET).get_public_url(path)
            return src_url, public_url
        except Exception as e:
            print(f"  FAILED {src_url}: {e}")
            return src_url, None

    url_map = {}
    # Lower concurrency than a first pass might suggest — the AMPTAB CMS
    # (and/or this sandbox's outbound networking) returns transient
    # EAGAIN/connection-reset errors under higher parallelism.
    with ThreadPoolExecutor(max_workers=4) as ex:
        futures = [ex.submit(upload_one, u) for u in urls]
        for i, fut in enumerate(as_completed(futures)):
            src, pub = fut.result()
            url_map[src] = pub
            if (i + 1) % 50 == 0:
                print(f"  {i + 1}/{len(urls)}")

    ok = sum(1 for v in url_map.values() if v)
    print(f"Images done: {ok}/{len(urls)} succeeded")
    return url_map


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


def main():
    try:
        from supabase import create_client
    except ImportError:
        print("Error: supabase package not installed. Run: pip3 install supabase")
        sys.exit(1)

    url = get_env_var("PUBLIC_SUPABASE_URL")
    key = get_env_var("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        print("Error: need PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Run with:")
        print("  npx dotenvx run -- python3 scripts/upload_catalog_import.py")
        sys.exit(1)

    supabase = create_client(url, key)

    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    print(f"Loaded {len(rows)} rows from {CSV_PATH}")

    # ── 0. Verify the migration has been applied ──────────────────────
    try:
        supabase.table("products").select("stock_quantity,bundle_component_ids").limit(1).execute()
    except Exception:
        print("ERROR: stock_quantity / bundle_component_ids columns not found.")
        print("Run supabase/migrations/005_stock_quantity_and_bundles.sql in the Supabase SQL editor first.")
        sys.exit(1)

    # ── 1. Duplicate check against the live table ──────────────────────
    existing = fetch_all(supabase, "products", "id,slug")
    existing_slug_to_id = {r["slug"]: r["id"] for r in existing}
    print(f"{len(existing_slug_to_id)} products already in the database")

    new_rows = [r for r in rows if r["slug"] not in existing_slug_to_id]
    skipped = [r for r in rows if r["slug"] in existing_slug_to_id]
    print(f"{len(skipped)} rows already exist by slug (skipping), {len(new_rows)} new to insert")

    if not new_rows:
        print("Nothing new to upload.")
        return

    # ── 2. Download + re-host every unique image ───────────────────────
    all_urls = sorted({u for r in new_rows for u in json.loads(r["image_url"])})
    url_map = upload_images(supabase, all_urls)
    failed = [u for u, v in url_map.items() if v is None]

    def resolve_images(csv_image_urls):
        return [url_map.get(u) or u for u in csv_image_urls]

    # ── 3. Insert standalone pieces first ──────────────────────────────
    pieces = [r for r in new_rows if not json.loads(r["bundle_component_codes"])]
    bundles = [r for r in new_rows if json.loads(r["bundle_component_codes"])]
    code_to_slug = {r["item_code"]: r["slug"] for r in rows}
    code_to_id = {}

    print(f"Inserting {len(pieces)} piece products...")
    piece_errors = []
    for r in pieces:
        avail = int(r["available_stock"]) if r["available_stock"] else None
        payload = {
            "name": r["name"],
            "slug": r["slug"],
            "description": r["description"],
            "price": float(r["price"]),
            "category": r["category"],
            "image_url": resolve_images(json.loads(r["image_url"])),
            "in_stock": r["in_stock"] == "true",
            "colors": json.loads(r["colors"]) or None,
            "stock_quantity": avail,
        }
        try:
            resp = supabase.table("products").insert(sanitize_payload(payload)).execute()
            code_to_id[r["item_code"]] = resp.data[0]["id"]
        except Exception as e:
            print(f"  FAILED to insert {r['slug']}: {e}")
            piece_errors.append(r["item_code"])

    def resolve_component_id(code):
        if code in code_to_id:
            return code_to_id[code]
        slug = code_to_slug.get(code)
        return existing_slug_to_id.get(slug) if slug else None

    # ── 4. Insert bundles, resolving component ids ─────────────────────
    print(f"Inserting {len(bundles)} bundle products...")
    bundle_errors = []
    bundles_inserted = 0
    for r in bundles:
        component_codes = json.loads(r["bundle_component_codes"])
        component_ids = [resolve_component_id(c) for c in component_codes]
        if any(cid is None for cid in component_ids):
            missing = [c for c, cid in zip(component_codes, component_ids) if cid is None]
            print(f"  SKIPPED bundle {r['item_code']}: missing component(s) {missing}")
            bundle_errors.append(r["item_code"])
            continue
        payload = {
            "name": r["name"],
            "slug": r["slug"],
            "description": r["description"],
            "price": float(r["price"]),
            "category": r["category"],
            "image_url": resolve_images(json.loads(r["image_url"])),
            "in_stock": r["in_stock"] == "true",
            "colors": json.loads(r["colors"]) or None,
            "stock_quantity": None,
            "bundle_component_ids": component_ids,
        }
        try:
            supabase.table("products").insert(sanitize_payload(payload)).execute()
            bundles_inserted += 1
        except Exception as e:
            print(f"  FAILED to insert {r['slug']}: {e}")
            bundle_errors.append(r["item_code"])

    print("\n" + "=" * 60)
    print("UPLOAD COMPLETE")
    print("=" * 60)
    print(f"  Pieces inserted:   {len(pieces) - len(piece_errors)}/{len(pieces)}")
    print(f"  Bundles inserted:  {bundles_inserted}/{len(bundles)}")
    print(f"  Skipped (existing): {len(skipped)}")
    print(f"  Image upload failures (used original CMS URL instead): {len(failed)}")
    if piece_errors:
        print(f"  Piece errors: {piece_errors}")
    if bundle_errors:
        print(f"  Bundle errors: {bundle_errors}")

    if failed:
        print(f"\n{len(failed)} images fell back to amptab.com URLs — attempting to repair now...")
        repair_hotlinked_images(supabase)


def repair_hotlinked_images(supabase):
    """Find any product still pointing at an amptab.com URL (from a prior
    run's image-upload failures) and retry hosting those images. Safe to
    run standalone/repeatedly — only touches rows that still need it."""
    all_products = fetch_all(supabase, "products", "id,image_url")
    needs_repair = [
        p for p in all_products
        if any("amptab.com" in (u or "") for u in (p.get("image_url") or []))
    ]
    if not needs_repair:
        print("Nothing to repair — no products reference amptab.com URLs.")
        return

    stale_urls = sorted({u for p in needs_repair for u in p["image_url"] if "amptab.com" in (u or "")})
    print(f"{len(needs_repair)} products still reference {len(stale_urls)} amptab.com image(s)")

    url_map = upload_images(supabase, stale_urls)
    fixed_products, still_failing = 0, 0

    for p in needs_repair:
        new_urls = [url_map.get(u) or u for u in p["image_url"]]
        if new_urls == p["image_url"]:
            still_failing += 1
            continue
        try:
            supabase.table("products").update({"image_url": new_urls}).eq("id", p["id"]).execute()
            fixed_products += 1
        except Exception as e:
            print(f"  FAILED to update product {p['id']}: {e}")
            still_failing += 1

    print(f"Repair done: {fixed_products} product(s) updated, {still_failing} still reference amptab.com")


if __name__ == "__main__":
    main()
