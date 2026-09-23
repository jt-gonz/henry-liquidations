#!/usr/bin/env python3
"""
Dry-run comparison of catalog_import.csv (parsed from the AMPTAB catalog
PDF, see scripts/parse_catalog_pdf.py) against the live Supabase `products`
table. READ-ONLY: this makes no writes to the database or storage bucket.
It only reports what an upsert-by-slug would do, so it can be reviewed
before scripts/upload_catalog_import.py (or similar) is ever run for real.

Usage:
    npx dotenvx run -- python3 scripts/diff_against_supabase.py
"""

import csv
import json
import os
import subprocess
import sys

CSV_PATH = "catalog_import.csv"


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


def main():
    try:
        from supabase import create_client
    except ImportError:
        print("Error: supabase package not installed. Run: pip3 install supabase")
        sys.exit(1)

    url = get_env_var("PUBLIC_SUPABASE_URL")
    key = get_env_var("SUPABASE_SERVICE_ROLE_KEY") or get_env_var("PUBLIC_SUPABASE_ANON_KEY")
    if not url or not key:
        print("Error: Supabase credentials not found. Run with:")
        print("  npx dotenvx run -- python3 scripts/diff_against_supabase.py")
        sys.exit(1)

    print(f"Connecting to {url} (read-only select)...")
    supabase = create_client(url, key)

    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        catalog_rows = list(csv.DictReader(f))
    catalog_by_slug = {r["slug"]: r for r in catalog_rows}
    print(f"Loaded {len(catalog_rows)} rows from {CSV_PATH}")

    existing = []
    page_size = 1000
    offset = 0
    while True:
        resp = (
            supabase.table("products")
            .select("id,name,slug,price,category,image_url,in_stock")
            .range(offset, offset + page_size - 1)
            .execute()
        )
        batch = resp.data or []
        existing.extend(batch)
        if len(batch) < page_size:
            break
        offset += page_size
    print(f"Fetched {len(existing)} existing products from Supabase")

    existing_by_slug = {r["slug"]: r for r in existing}

    new_products, price_changes, unchanged = [], [], []
    for slug, row in catalog_by_slug.items():
        db_row = existing_by_slug.get(slug)
        new_price = float(row["price"])
        if db_row is None:
            new_products.append(row)
        else:
            old_price = float(db_row["price"])
            if abs(old_price - new_price) > 0.001:
                price_changes.append((db_row, row, old_price, new_price))
            else:
                unchanged.append(row)

    not_in_catalog = [r for slug, r in existing_by_slug.items() if slug not in catalog_by_slug]

    print("\n" + "=" * 60)
    print("DRY RUN SUMMARY (no writes made)")
    print("=" * 60)
    print(f"  New products to insert:        {len(new_products)}")
    print(f"  Existing products, price change: {len(price_changes)}")
    print(f"  Existing products, unchanged:   {len(unchanged)}")
    print(f"  In DB but not in this catalog:  {len(not_in_catalog)} (left untouched either way)")

    if price_changes:
        print(f"\n--- Price changes ({len(price_changes)}) ---")
        for db_row, row, old_price, new_price in price_changes[:30]:
            direction = "UP" if new_price > old_price else "DOWN"
            print(f"  [{direction}] {row['slug']}: ${old_price:.2f} -> ${new_price:.2f}  ({row['name']})")
        if len(price_changes) > 30:
            print(f"  ... and {len(price_changes) - 30} more (see report file)")

    if new_products:
        print(f"\n--- New products ({len(new_products)}) ---")
        for row in new_products[:30]:
            print(f"  {row['slug']}: ${float(row['price']):.2f}  ({row['name']})")
        if len(new_products) > 30:
            print(f"  ... and {len(new_products) - 30} more (see report file)")

    # Full detailed report to disk for review.
    report_path = "catalog_diff_report.csv"
    with open(report_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["action", "slug", "name", "old_price", "new_price", "category", "in_stock", "image_count"])
        for row in new_products:
            writer.writerow(["NEW", row["slug"], row["name"], "", row["price"], row["category"], row["in_stock"], len(json.loads(row["image_url"]))])
        for db_row, row, old_price, new_price in price_changes:
            writer.writerow(["PRICE_CHANGE", row["slug"], row["name"], old_price, new_price, row["category"], row["in_stock"], len(json.loads(row["image_url"]))])
        for row in unchanged:
            writer.writerow(["UNCHANGED", row["slug"], row["name"], row["price"], row["price"], row["category"], row["in_stock"], len(json.loads(row["image_url"]))])
        for r in not_in_catalog:
            writer.writerow(["IN_DB_NOT_IN_CATALOG", r["slug"], r["name"], r["price"], "", r["category"], r["in_stock"], ""])

    print(f"\nFull detailed report written to {report_path}")
    print("No changes were made to Supabase. Review the report, then decide on next steps.")


if __name__ == "__main__":
    main()
