#!/usr/bin/env python3
"""
Backfills product_sets (see supabase/migrations/018_product_sets.sql)
from catalog_import.csv's entry_num column — which groups every piece
and pre-built bundle of one physical furniture collection together,
but never made it into the live `products` table on the original
import.

For each entry_num with more than one row:
  1. Derive the set's display name from the common leading word(s)
     shared by its standalone pieces' names (e.g. "White King Bed",
     "White Dresser", "White Mirror" -> "White"), suffixed with the
     category label. Falls back to "<Category> Set" if the pieces
     don't share a common prefix (a handful of sets pair mismatched
     finishes, e.g. a "Blue Velvet" bed with a plain "Silver" mirror).
  2. Pick a hero image: whichever image URL appears in the most
     member rows' own image_url arrays (the supplier's shared
     whole-set overview shot, confirmed present in every member's
     gallery — not just one product's main photo).
  3. Insert one product_sets row.
  4. Update every member product: set_id, piece_type (the item_code
     suffix after the entry_name prefix, e.g. "D" for dresser, "KDMCN"
     for a 5-piece bundle), item_code.

entry_nums with exactly one row (packing tape, a lone mirror, etc.)
are left alone entirely - those products keep set_id = null and
behave exactly as a normal standalone product always has.

Safe to re-run: looks up existing product_sets by slug and skips/
updates rather than duplicating.

Usage:
    npx dotenvx run -- python3 scripts/backfill_product_sets.py
"""

import csv
import json
import os
import re
import subprocess
import sys
from collections import Counter, defaultdict

CSV_PATH = "catalog_import.csv"

# The storefront uses the supplier's own taxonomy (see
# supabase/migrations/021_supplier_category_taxonomy.sql), which the
# CSV carries verbatim in its `raw_category` column — not the looser
# `category` column, which still holds the old "<Room> COLLECTION"
# names from the original import.
SUPPLIER_CATEGORY_VALUES = {
    "Bedrooms": "BEDROOMS",
    "Living Rooms": "LIVING_ROOMS",
    "Dining Rooms": "DINING_ROOMS",
    "Occasional": "OCCASIONAL",
    "Accent Chair": "ACCENT_CHAIR",
    "Accents & TV Stands": "ACCENTS_TV_STANDS",
    "Bunk Beds": "BUNK_BEDS",
    "Day Beds": "DAY_BEDS",
    "Glamour": "GLAMOUR",
    "Stools": "STOOLS",
    "Accessories": "ACCESSORIES",
    "Supplies": "SUPPLIES",
}

# How a set made of each category's pieces is named, e.g. the B071
# bedroom pieces become the "White Bedroom Set". Keep these strings
# stable: the set's slug is derived from this name, so changing one
# re-slugs (and therefore duplicates) every set in that category.
CATEGORY_LABELS = {
    "Bedrooms": "Bedroom Set",
    "Living Rooms": "Living Room Set",
    "Dining Rooms": "Dining Set",
    "Occasional": "Occasional Set",
    "Accent Chair": "Accent Chair Set",
    "Accents & TV Stands": "Accents Set",
    "Bunk Beds": "Bunk Bed Set",
    "Day Beds": "Day Bed Set",
    "Glamour": "Glamour Set",
    "Stools": "Stool Set",
    "Accessories": "Accessories Set",
    "Supplies": "Supplies Set",
}

# Piece-type words to strip off the end of an individual piece's name
# when looking for the shared finish/style prefix. Longest first so
# e.g. "King Bed" matches before a bare "Bed" would.
PIECE_SUFFIXES = [
    "King Bed Frame", "Queen Bed Frame", "King Bed", "Queen Bed",
    "Night Stand", "Nightstand", "Dresser", "Mirror", "Chest", "Bench",
]


def get_env_var(key: str) -> str:
    value = os.getenv(key)
    if value:
        return value
    result = subprocess.run(
        ["npx", "dotenvx", "run", "--", "sh", "-c", f'echo "${key}"'],
        capture_output=True, text=True,
        cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    )
    lines = [l for l in result.stdout.strip().split("\n") if not l.startswith("[") and l.strip()]
    return lines[-1] if lines else None


def slugify(text):
    text = re.sub(r"[^a-zA-Z0-9]+", "-", text.strip().lower())
    return re.sub(r"-+", "-", text).strip("-")


def strip_piece_suffix(name):
    for suffix in PIECE_SUFFIXES:
        if name.endswith(suffix):
            return name[: -len(suffix)].strip()
    return None  # didn't match a known individual-piece shape (e.g. a bundle name)


def pick_primary_member(member_ids, slug_to_product):
    """Which member gets is_primary_listing — the one grid/category
    cards show for this whole set. Same priority as the set page's own
    default selection (src/routes/product/[slug]/+page.server.js):
    the fullest in-stock bundle, else the first in-stock individual
    piece, else just the first member — so the card a shopper clicks
    always matches what they land on."""
    bundles, pieces = [], []
    for pid, r in member_ids:
        product = slug_to_product[r["slug"]]
        (bundles if product.get("bundle_component_ids") else pieces).append((pid, r, product))

    bundles.sort(key=lambda t: len(t[2]["bundle_component_ids"]), reverse=True)
    for pid, r, product in bundles:
        if product["in_stock"]:
            return pid
    for pid, r, product in pieces:
        if product["in_stock"]:
            return pid
    return (bundles[0] if bundles else pieces[0])[0] if (bundles or pieces) else member_ids[0][0]


def common_prefix_words(names):
    """Common leading words across all names, comparing each word only
    up to a "/" — e.g. "White/Gray" and "White" count as matching on
    "White" (a few sets pair a "White/Gray Line" bed+dresser+chest+
    nightstand with a plainly-named "White ... Mirror"; these are
    still the same finish, just inconsistently labeled upstream)."""
    word_lists = [n.split() for n in names if n]
    if not word_lists:
        return ""
    prefix = []
    for words in zip(*word_lists):
        normalized = {w.lower().split("/")[0] for w in words}
        if len(normalized) == 1:
            prefix.append(words[0].split("/")[0])
        else:
            break
    return " ".join(prefix)


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
        print("  npx dotenvx run -- python3 scripts/backfill_product_sets.py")
        sys.exit(1)

    supabase = create_client(url, key)

    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    print(f"Loaded {len(rows)} rows from {CSV_PATH}")

    groups = defaultdict(list)
    for r in rows:
        groups[r["entry_num"]].append(r)

    multi_row_groups = {k: v for k, v in groups.items() if len(v) > 1}
    print(f"{len(groups) - len(multi_row_groups)} solo items (no set) skipped")
    print(f"{len(multi_row_groups)} sets to backfill")

    # Resolve every slug to its live product id (+ already-rehosted
    # image_url array — the CSV's own image_url column still points at
    # the original amptab.com signed URLs, which is NOT what's actually
    # live on the site) up front.
    existing = []
    offset, page = 0, 1000
    while True:
        batch = (
            supabase.table("products")
            .select("id,slug,image_url,in_stock,bundle_component_ids,price")
            .range(offset, offset + page - 1)
            .execute()
            .data
        )
        existing.extend(batch)
        if len(batch) < page:
            break
        offset += page
    slug_to_product = {p["slug"]: p for p in existing}
    print(f"{len(slug_to_product)} products in the live table")

    created, updated_products, skipped_sets, missing_slugs = 0, 0, [], []

    for entry_num, entry_rows in multi_row_groups.items():
        entry_name = entry_rows[0]["entry_name"]
        # The supplier's own category name ("Bedrooms"), which both the
        # stored categories.value and the set's display label derive from.
        supplier_category = entry_rows[0]["raw_category"]
        category = SUPPLIER_CATEGORY_VALUES.get(
            supplier_category, supplier_category.upper().replace(" ", "_")
        )

        # Resolve this set's member products; skip (and report) any row
        # whose slug isn't actually live (e.g. sold through/removed
        # since the CSV snapshot was taken).
        member_ids = []
        for r in entry_rows:
            product = slug_to_product.get(r["slug"])
            if product is None:
                missing_slugs.append(r["slug"])
                continue
            member_ids.append((product["id"], r))

        # Only standalone pieces (not bundles) contribute to the
        # finish-name heuristic. A bundle's item_code suffix is always
        # multiple piece letters (e.g. "KDMCN"); an individual piece's
        # is always exactly one (e.g. "D"). Name-suffix matching alone
        # isn't reliable here — a bundle like "King Bed Frame - Dresser
        # - Mirror" ends in a real piece word ("Mirror") too, and would
        # silently contaminate the prefix with bundle text.
        piece_names = []
        for pid, r in member_ids:
            suffix = r["item_code"][len(entry_name) + 1 :] if r["item_code"].startswith(entry_name + "-") else ""
            if len(suffix) != 1:
                continue
            stripped = strip_piece_suffix(r["name"])
            if stripped:
                piece_names.append(stripped)

        finish = common_prefix_words(piece_names)
        category_label = CATEGORY_LABELS.get(supplier_category, "Set")
        set_name = f"{finish} {category_label}".strip() if finish else f"{category_label} ({entry_name})"
        set_slug = slugify(f"{set_name} {entry_name}")

        # Hero image: whichever URL shows up in the most member
        # products' own (already-rehosted) image_url arrays — the
        # supplier's shared whole-set overview shot.
        image_counts = Counter()
        for pid, r in member_ids:
            for img in slug_to_product[r["slug"]]["image_url"] or []:
                image_counts[img] += 1
        hero_image_url = image_counts.most_common(1)[0][0] if image_counts else None

        if len(member_ids) < 2:
            skipped_sets.append(entry_name)
            continue

        # Cheapest way into the set — grid cards show it as "From $X",
        # since the card's own listing is usually the priciest bundle.
        member_prices = [
            float(slug_to_product[r["slug"]]["price"])
            for pid, r in member_ids
            if slug_to_product[r["slug"]].get("price") is not None
        ]
        min_price = min(member_prices) if member_prices else None

        existing_set = (
            supabase.table("product_sets").select("id").eq("slug", set_slug).maybe_single().execute()
        )
        if existing_set and existing_set.data:
            set_id = existing_set.data["id"]
            supabase.table("product_sets").update({
                "member_count": len(member_ids),
                "min_price": min_price,
            }).eq("id", set_id).execute()
        else:
            inserted = (
                supabase.table("product_sets")
                .insert({
                    "slug": set_slug,
                    "name": set_name,
                    "category": category,
                    "hero_image_url": hero_image_url,
                    "member_count": len(member_ids),
                    "min_price": min_price,
                })
                .execute()
            )
            set_id = inserted.data[0]["id"]
            created += 1

        primary_pid = pick_primary_member(member_ids, slug_to_product)

        for pid, r in member_ids:
            piece_type = r["item_code"][len(entry_name) + 1:] if r["item_code"].startswith(entry_name + "-") else r["item_code"]
            supabase.table("products").update({
                "set_id": set_id,
                "piece_type": piece_type,
                "item_code": r["item_code"],
                "is_primary_listing": pid == primary_pid,
            }).eq("id", pid).execute()
            updated_products += 1

    print(f"\nCreated {created} product_sets rows")
    print(f"Updated {updated_products} products with set_id/piece_type/item_code")
    if skipped_sets:
        print(f"Skipped {len(skipped_sets)} sets with <2 live members: {skipped_sets}")
    if missing_slugs:
        print(f"{len(missing_slugs)} CSV slugs not found live (already removed?): {missing_slugs}")


if __name__ == "__main__":
    main()
