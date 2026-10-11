#!/usr/bin/env python3
"""
One-off fix for the AMPTAB catalog import: scripts/upload_catalog_import.py
wrote the CSV's wholesale `price` column into products.price. The website
price should instead be the `msrp` column. Updates products.price = msrp
for every row in catalog_import.csv, matched by slug.

Usage:
    npx dotenvx run -- python3 scripts/fix_catalog_prices_to_msrp.py
"""

import csv
import os
import sys

CSV_PATH = "catalog_import.csv"


def main():
    from supabase import create_client

    url = os.getenv("PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        print("Error: need PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Run with:")
        print("  npx dotenvx run -- python3 scripts/fix_catalog_prices_to_msrp.py")
        sys.exit(1)

    supabase = create_client(url, key)

    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    print(f"Loaded {len(rows)} rows from {CSV_PATH}")

    updated, missing, already_correct = 0, [], 0
    for r in rows:
        slug = r["slug"]
        msrp = float(r["msrp"])
        resp = supabase.table("products").select("id,price").eq("slug", slug).execute()
        if not resp.data:
            missing.append(slug)
            continue
        product = resp.data[0]
        if abs(product["price"] - msrp) < 0.001:
            already_correct += 1
            continue
        supabase.table("products").update({"price": msrp}).eq("id", product["id"]).execute()
        updated += 1

    print("\n" + "=" * 60)
    print(f"Updated:        {updated}")
    print(f"Already msrp:   {already_correct}")
    print(f"Missing in DB:  {len(missing)}")
    if missing:
        print(f"  Missing slugs: {missing}")


if __name__ == "__main__":
    main()
