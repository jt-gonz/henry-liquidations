#!/usr/bin/env python3
"""
Applies a 10% discount to every product from the AMPTAB catalog import
(catalog_import.csv) whose price was just corrected to MSRP. Moves the
current price into compare_at_price (the "was" price shown struck
through) and sets price = 90% of it.

Requires supabase/migrations/006_compare_at_price.sql to have already
been run against the project (adds the compare_at_price column).

Usage:
    npx dotenvx run -- python3 scripts/apply_catalog_discount.py
"""

import csv
import os
import sys

CSV_PATH = "catalog_import.csv"
DISCOUNT = 0.10


def main():
    from supabase import create_client

    url = os.getenv("PUBLIC_SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        print("Error: need PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Run with:")
        print("  npx dotenvx run -- python3 scripts/apply_catalog_discount.py")
        sys.exit(1)

    supabase = create_client(url, key)

    try:
        supabase.table("products").select("compare_at_price").limit(1).execute()
    except Exception:
        print("ERROR: compare_at_price column not found.")
        print("Run supabase/migrations/006_compare_at_price.sql in the Supabase SQL editor first.")
        sys.exit(1)

    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    print(f"Loaded {len(rows)} rows from {CSV_PATH}")

    updated, missing, already_discounted = 0, [], 0
    for r in rows:
        slug = r["slug"]
        resp = supabase.table("products").select("id,price,compare_at_price").eq("slug", slug).execute()
        if not resp.data:
            missing.append(slug)
            continue
        product = resp.data[0]
        if product["compare_at_price"] is not None:
            already_discounted += 1
            continue
        original_price = product["price"]
        new_price = round(original_price * (1 - DISCOUNT), 2)
        supabase.table("products").update(
            {"price": new_price, "compare_at_price": original_price}
        ).eq("id", product["id"]).execute()
        updated += 1

    print("\n" + "=" * 60)
    print(f"Discounted:         {updated}")
    print(f"Already discounted: {already_discounted}")
    print(f"Missing in DB:      {len(missing)}")
    if missing:
        print(f"  Missing slugs: {missing}")


if __name__ == "__main__":
    main()
