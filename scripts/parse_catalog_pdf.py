#!/usr/bin/env python3
"""
Parse "The Full Catalog - AMP Tablet (TM) CMS.pdf" (an AMPTAB CMS export) into a
CSV of individual sellable products, matching the schema used by
scripts/upload_products.py (name, slug, description, price, category,
image_url, in_stock, colors) plus extra source columns for review
(item_code, entry_name, available_stock, msrp, raw_category).

How the PDF is structured (reverse-engineered):
- 90 pages. Page 90 (index 89) is a "TABLE OF CONTENTS" and is skipped.
- Pages 0-88 hold 50 "catalog entries" (e.g. "Shrink Wrap", "B067"). A page
  starts a new entry iff its first line is "Download: Web-size Full-size"
  (or the title page). Continuation pages (long entries) do not repeat that
  line.
- Simple entries (supplies) are a single row: Item name, Price, then a
  handful of dimension numbers, then key:value footer lines (Description:,
  Feature:, Category:, MSRP:, Collection:, ...).
- Furniture entries are a table with one row per SKU (both individual
  pieces like "B067-K" and pre-bundled combos like "B067-KDM"), followed by
  the same kind of key:value footer lines shared by the whole entry.
- Every photo thumbnail is a PDF link (kind Shop2ViewPictureSigned) whose
  `desc` query param is the *row's own item code* (e.g. "B067-KDM"),
  repeated identically for every thumbnail in that row's carousel. Runs of
  consecutive links sharing the same `desc` reliably delimit each row and
  give the row's item code and vertical (y) extent on the page - far more
  reliable than trying to re-derive the code from wrapped table text.
- The gallery of photos is shared across all rows of an entry (a nightstand
  row shows the same photos as the bed row). We narrow it down per-row with
  a filename heuristic: an image "belongs" to a row if its filename starts
  with one of the row's constituent single-letter codes (from the row's own
  code, or from its "Groupings:" field for combo rows). Images that don't
  match ANY row's code in the entry are "generic" and attached to every row
  as a fallback so nothing ends up with zero photos.
- DownloadFullSizeImage / DownloadWebSizeImage (same name+nameSignature as
  the ViewPictureSigned link) return the raw JPEG directly - verified via
  curl, no session/auth needed beyond the signature already embedded in the
  PDF link.
"""

import csv
import json
import re
import sys
from urllib.parse import urlparse, parse_qs, unquote, urlencode

import fitz  # PyMuPDF

PDF_PATH = "The Full Catalog - AMP Tablet ™ CMS.pdf"
OUT_CSV = "catalog_import.csv"

PRICE_RE = re.compile(r"^\$[\d,]+\.\d{2}$")
INT_RE = re.compile(r"^\d+$")
NUM_RE = re.compile(r"^\d+(\.\d+)?$")
ENTRY_HEADER_RE = re.compile(r"^\xa0?\s*(\d+):\s*(.+)$")
FOOTER_KEY_RE = re.compile(
    r"^(Description|Feature|Feature 1 Item|Groupings|Category|Cubes|"
    r"Number of Boxes|Net Weight|Gross Weight|MSRP|Collection|"
    r"Boxes per Unit|Slats per Bed):\s*(.*)$"
)

COLOR_MAP = {
    "Black": "#000000", "Gray": "#808080", "Grey": "#808080", "Brown": "#964B00",
    "Red": "#FF0000", "Charcoal": "#36454F", "Sand": "#C2B280", "White": "#FFFFFF",
    "Chocolate": "#D2691E", "Blue": "#0000FF", "Oyster": "#EAE0C8", "Beige": "#F5F5DC",
    "Pink": "#FFC0CB", "Ivory": "#FFFFF0", "Silver": "#C0C0C0", "Navy": "#000080",
    "Gold": "#FFD700",
}

CATEGORY_MAP = {
    # Matches the ALL-CAPS "X COLLECTION" convention seen in live
    # products.category values (not the categories.value slug format).
    "bedrooms": "BEDROOM COLLECTION",
    "living room": "LIVING ROOM COLLECTION",
    "dining": "DINING COLLECTION",
    "recliners": "RECLINER COLLECTION",
    "accents": "ACCENTS COLLECTION",
    "occasional": "OCCASIONAL COLLECTION",
    "accessories": "ACCESSORIES COLLECTION",
    "office": "OFFICE COLLECTION",
    "outdoor": "OUTDOOR COLLECTION",
    "supplies": "ACCESSORIES COLLECTION",
}


HEADER_TOKENS = {
    "Item", "Price", "Width", "Depth", "Height", "Box Width", "Box Depth",
    "Box Height", "Available Stock", "Photos", "Description", "Groupings",
    "Volume", "Net Weight", "Gross Weight", "MSRP", "Boxes per Unit",
    "Slats per Bed", "Box", "Net", "Weight", "Gross", "Available", "Stock",
    "Boxes", "per", "Unit", "Cubes", "Number of Boxes", "Feature",
    "Feature 1 Item", "Category", "Collection",
    "Download: Web-size Full-size", "Closeout", "The Full Catalog",
    "Powered by AMPTAB, Inc.",
}


def get_lines(page):
    """Plain-text lines in natural document (reading) order - proven to
    match the row-major table layout, unlike a y-sorted reconstruction."""
    text = page.get_text()
    # A handful of glyphs in the source PDF (e.g. a bullet in one entry's
    # Feature text) decode to a literal NUL, which Postgres text columns
    # reject outright - strip stray control chars, keep it plain text.
    text = "".join(ch for ch in text if ch == "\n" or ch == "\t" or ord(ch) >= 32)
    return [ln.strip().lstrip("\xa0").strip() for ln in text.split("\n") if ln.strip()]


def is_noise_line(text):
    if text in HEADER_TOKENS:
        return True
    if text.startswith("Prepared for") or text.startswith("Showing"):
        return True
    if ENTRY_HEADER_RE.match(text):
        return True
    if FOOTER_KEY_RE.match(text):
        return True
    return False


def get_view_links(page):
    """Return [(name, desc, uri)] for Shop2ViewPictureSigned links, in
    natural link order (already verified to match row-major reading order)."""
    out = []
    for l in page.get_links():
        uri = l.get("uri", "")
        if "Shop2ViewPictureSigned" not in uri:
            continue
        q = parse_qs(urlparse(uri).query)
        name = unquote(q.get("name", [""])[0])
        desc = unquote(q.get("desc", [""])[0])
        out.append((name, desc, uri))
    return out


def full_size_url(view_uri):
    q = parse_qs(urlparse(view_uri).query)
    name = q.get("name", [""])[0]
    sig = q.get("nameSignature", [""])[0]
    root = q.get("root_link_id", [""])[0]
    # parse_qs already URL-decoded these (e.g. "B033-D & M.jpg" has a
    # literal "&"); must re-encode when rebuilding the query string or a
    # bare "&" splits it into a bogus extra param and 404s.
    query = urlencode({"name": name, "nameSignature": sig, "root_link_id": root})
    return f"https://cms.amptab.com/Manufacturer/169382/DownloadFullSizeImage?{query}"


def find_entry_page_groups(doc):
    """Group page indices into entries. A page starts a new entry iff its
    first line is 'Download: Web-size Full-size' or it's the title page."""
    groups = []
    current = []
    for i in range(doc.page_count - 1):  # skip trailing TOC page
        page = doc[i]
        text = page.get_text()
        first_line = text.split("\n", 1)[0].strip()
        is_start = first_line.startswith("Download:") or first_line.startswith("The Full Catalog")
        if is_start and current:
            groups.append(current)
            current = []
        current.append(i)
    if current:
        groups.append(current)
    return groups


def extract_footer_fields(all_lines):
    """Scan all lines of an entry for 'Key: value' footer fields."""
    fields = {}
    for text in all_lines:
        m = FOOTER_KEY_RE.match(text)
        if m:
            key, val = m.group(1), m.group(2).strip()
            # Don't overwrite an already-captured non-empty value with an empty one
            if val or key not in fields:
                fields.setdefault(key, val)
                if val:
                    fields[key] = val
    return fields


def extract_colors(*texts):
    found = []
    for text in texts:
        if not text:
            continue
        for name, hexval in COLOR_MAP.items():
            if re.search(r"\b" + re.escape(name) + r"\b", text, re.IGNORECASE):
                found.append(hexval)
    return sorted(set(found))


def map_category(raw):
    if not raw:
        return "Other"
    return CATEGORY_MAP.get(raw.strip().lower(), raw.strip())


def split_name_and_overflow(name):
    """A rare schema variant (e.g. 'Memory Foam Pillows') inlines Feature /
    Feature 1 Item text into the same column run as the row's own
    Description, producing one long blob instead of a short title. Detect
    and unwind it: collapse an exact doubled duplicate (Feature and
    Feature 1 Item are identical text there), then split off any run-on
    sentence text (lowercase words) from the ALL-CAPS/title-cased leading
    portion. Returns (short_name, leftover_description_or_None)."""
    n = len(name)
    if n > 20 and n % 2 == 0 and name[: n // 2].strip() == name[n // 2:].strip():
        name = name[: n // 2].strip()

    if len(name) <= 80:
        return name, None

    # The true title is ALL-CAPS ("KING SHREDDED BAMBOO... PILLOW"); the
    # run-on feature text that follows is only Title-Cased ("King Size,
    # 100% Memory Foam..."), which is the real distinguishing signal (not
    # just "starts with a lowercase letter" - "King" starts uppercase).
    words = name.split(" ")
    split_at = len(words)
    for idx, w in enumerate(words):
        letters = "".join(ch for ch in w if ch.isalpha())
        if letters and not letters.isupper():
            split_at = idx
            break
    if split_at == len(words) or split_at == 0:
        return name, None
    return " ".join(words[:split_at]).strip(), " ".join(words[split_at:]).strip()


def slugify(*parts):
    s = "-".join(p for p in parts if p)
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def normalize(s):
    return re.sub(r"\s+", "", s).lower()


def parse_rows_sequential(row_codes, data_lines):
    """Walk the flat, noise-stripped, row-major line stream once, carving
    it into one segment per expected row code (from the link `desc` runs).
    Returns a list aligned with row_codes; entries are None if a price
    couldn't be located for that row."""
    results = []
    i, n = 0, len(data_lines)

    for ridx, code in enumerate(row_codes):
        target = normalize(code)

        # Consume leading lines that reconstruct this row's own item code
        # (e.g. "B067-" + "KDM" -> "b067-kdm"), matching link `desc`.
        acc, start_i = "", i
        matched = False
        while i < n:
            acc += normalize(data_lines[i])
            i += 1
            if acc == target:
                matched = True
                break
            if len(acc) > len(target) + 8:
                break
        if not matched:
            i = start_i  # couldn't find the code textually; don't eat data

        # Consume lines until the first price -> Description/name.
        desc_lines = []
        price = None
        while i < n:
            if PRICE_RE.match(data_lines[i]):
                price = data_lines[i]
                i += 1
                break
            desc_lines.append(data_lines[i])
            i += 1
        if price is None:
            results.append(None)
            continue

        name = " ".join(desc_lines).strip() or code

        # Consume trailing cells (dims/groupings/msrp/stock) until either a
        # second price (MSRP) turns up, or the next row's code starts being
        # reconstructed, or we run out of data.
        next_target = normalize(row_codes[ridx + 1]) if ridx + 1 < len(row_codes) else None
        msrp, available_stock, last_int = None, None, None
        while i < n:
            if next_target:
                probe = normalize(data_lines[i])
                if probe and next_target.startswith(probe):
                    break
            if PRICE_RE.match(data_lines[i]):
                msrp = data_lines[i]
                available_stock = last_int
                i += 1
                # MSRP is immediately followed by a "Boxes per Unit" cell
                # (when non-blank); consume any trailing bare integers so
                # they don't leak into the next row's item-code match.
                while i < n and INT_RE.match(data_lines[i]):
                    i += 1
                break
            if INT_RE.match(data_lines[i]):
                last_int = data_lines[i]
            i += 1

        if available_stock is None and last_int is not None:
            available_stock = last_int

        price_val = float(price.replace("$", "").replace(",", ""))
        msrp_val = float(msrp.replace("$", "").replace(",", "")) if msrp else None
        stock_val = int(available_stock) if available_stock is not None else None

        results.append({
            "name": name,
            "price": price_val,
            "msrp": msrp_val,
            "available_stock": stock_val,
            "groupings_text": "",
        })

    return results


def try_match_code_at(data_lines, i, code_pat, max_tokens=4):
    """Try to complete a code_pat match by concatenating up to max_tokens
    lines starting at i. Returns the resulting item code string, or None."""
    acc = ""
    for j in range(i, min(i + max_tokens, len(data_lines))):
        acc += normalize(data_lines[j])
        if code_pat.fullmatch(acc):
            return acc
    return None


def parse_rows_autodetect(entry_prefix, data_lines):
    """Some catalog entries (seen on 'Closeout' pages) reuse the exact same
    `desc` value on every photo link regardless of row, so the link-based
    row segmentation collapses a multi-row table into one row. This is a
    self-contained fallback: it finds row boundaries purely from the text,
    by recognizing the entry's own "{prefix}-{suffix}" item-code pattern
    wherever it appears in the row-major line stream - no pre-known code
    list required. Returns (item_codes, parsed_rows), both aligned."""
    prefix_norm = normalize(entry_prefix)
    code_pat = re.compile(rf"^{re.escape(prefix_norm)}-[a-z0-9]{{1,6}}$")

    codes, results = [], []
    i, n = 0, len(data_lines)

    while i < n:
        acc, code = "", None
        j = i
        while j < n:
            acc += normalize(data_lines[j])
            j += 1
            if code_pat.fullmatch(acc):
                code = acc
                break
            if len(acc) > len(prefix_norm) + 8:
                break
        if code is None:
            # Not a code starting here (leading/stray header fragment,
            # header wrapping varies unpredictably by page) - skip a
            # token and keep looking rather than giving up on the entry.
            i += 1
            continue
        i = j

        desc_lines, price = [], None
        while i < n:
            if PRICE_RE.match(data_lines[i]):
                price = data_lines[i]
                i += 1
                break
            desc_lines.append(data_lines[i])
            i += 1
        if price is None:
            break

        name = " ".join(desc_lines).strip() or code

        # A "Groupings" cell (grouped/combo rows only) immediately follows
        # the price: a comma-separated list of this entry's own item codes,
        # e.g. "B045-K, B045-D, B045-M", which can itself wrap arbitrarily
        # ("B093-" / "M,"). Its last item has no trailing comma, making it
        # textually indistinguishable from a genuine new row's code. Rather
        # than parse the wrapping, just consume everything up to the first
        # plain dimension number (Width always follows Groupings, and
        # groupings entries never look like a bare number). Capture the
        # text (not just skip it) - it's the authoritative list of this
        # bundle row's component item codes.
        groupings_text = ""
        if i < n and "," in data_lines[i]:
            groupings_parts = []
            while i < n and not NUM_RE.match(data_lines[i]):
                groupings_parts.append(data_lines[i])
                i += 1
            groupings_text = "".join(groupings_parts)

        msrp, available_stock, last_int = None, None, None
        while i < n:
            if try_match_code_at(data_lines, i, code_pat) is not None:
                break
            if PRICE_RE.match(data_lines[i]):
                msrp = data_lines[i]
                available_stock = last_int
                i += 1
                while i < n and INT_RE.match(data_lines[i]):
                    i += 1
                break
            if INT_RE.match(data_lines[i]):
                last_int = data_lines[i]
            i += 1

        if available_stock is None and last_int is not None:
            available_stock = last_int

        price_val = float(price.replace("$", "").replace(",", ""))
        msrp_val = float(msrp.replace("$", "").replace(",", "")) if msrp else None
        stock_val = int(available_stock) if available_stock is not None else None

        # Reconstruct a display-cased code: "{EntryPrefix}-{UPPER-SUFFIX}"
        suffix = code[len(prefix_norm) + 1:]
        display_code = f"{entry_prefix}-{suffix.upper()}"

        codes.append(display_code)
        results.append({
            "name": name,
            "price": price_val,
            "msrp": msrp_val,
            "available_stock": stock_val,
            "groupings_text": groupings_text,
        })

    return codes, results


def component_codes(item_code, group_prefix, groupings_text):
    """Return the set of single-component suffixes this row represents,
    e.g. 'B067-KDM' with Groupings 'B067-K, B067-D, B067-M' -> {'K','D','M'}."""
    codes = set()
    if groupings_text:
        for part in groupings_text.split(","):
            part = part.strip()
            if part.startswith(group_prefix + "-"):
                codes.add(part[len(group_prefix) + 1:].strip())
    own_suffix = item_code[len(group_prefix) + 1:] if item_code.startswith(group_prefix + "-") else item_code
    if own_suffix:
        codes.add(own_suffix)
    return codes


def full_groupings_codes(group_prefix, groupings_text):
    """Return the row's own Groupings entries as full item codes, in
    order, e.g. 'B067-K, B067-D, B067-M' -> ['B067-K','B067-D','B067-M'].
    Empty for standalone piece rows (no Groupings text at all) - this is
    what distinguishes a bundle row from a piece row."""
    if not groupings_text:
        return []
    codes = []
    for part in groupings_text.split(","):
        part = part.strip()
        if part.startswith(group_prefix + "-"):
            codes.append(part)
    return codes


def assign_images(rows, all_images, group_prefix):
    """all_images: ordered list of (filename, full_url) unique by filename.
    Returns {item_code: [urls]}."""
    # Build per-row constituent code sets
    row_codes = {r["item_code"]: r["_component_codes"] for r in rows}
    all_single_codes = set()
    for codes in row_codes.values():
        all_single_codes |= codes

    def label_of(filename):
        base = re.sub(r"\.(jpg|jpeg|png|webp)$", "", filename, flags=re.IGNORECASE)
        if base.startswith(group_prefix + "-"):
            return base[len(group_prefix) + 1:].strip()
        if base == group_prefix:
            return ""  # master/hero image
        return base

    specific = {}   # item_code -> [urls]
    generic = []    # urls with no specific single-code match
    for filename, url in all_images:
        label = label_of(filename)
        if label == "":
            generic.append(url)
            continue
        first_token = re.split(r"[\s_-]", label, 1)[0]
        matched_codes = {c for c in all_single_codes if first_token == c}
        if not matched_codes:
            generic.append(url)
            continue
        for item_code, codes in row_codes.items():
            if matched_codes & codes:
                specific.setdefault(item_code, []).append(url)

    result = {}
    for r in rows:
        code = r["item_code"]
        urls = specific.get(code, []) + [u for u in generic if u not in specific.get(code, [])]
        # de-dup preserving order
        seen = set()
        deduped = []
        for u in urls:
            if u not in seen:
                seen.add(u)
                deduped.append(u)
        result[code] = deduped
    return result


def process_entry(doc, page_idxs, entry_num, entry_name):
    # Gather links (for row-code sequence + images) and text lines, per page, in order.
    page_links = {i: get_view_links(doc[i]) for i in page_idxs}
    page_lines = {i: get_lines(doc[i]) for i in page_idxs}

    # Ordered, de-duplicated (run-length-encoded) sequence of row item codes,
    # derived from consecutive-equal `desc` values across all of the entry's
    # photo links (each row's whole carousel repeats the same desc).
    row_codes = []
    prev_desc = None
    for i in page_idxs:
        for name, desc, uri in page_links[i]:
            if desc != prev_desc:
                row_codes.append(desc)
                prev_desc = desc

    if not row_codes:
        return []

    # The very first photo (the entry's hero/preview thumbnail, shown before
    # the data table starts) has desc == the bare entry code, not a real
    # row. Drop it so it doesn't swallow the real first row's data.
    if len(row_codes) > 1 and row_codes[0].strip().lower() == entry_name.strip().lower():
        row_codes = row_codes[1:]

    # Collect all unique images across the whole entry, in first-seen order.
    seen_files = {}
    for i in page_idxs:
        for name, desc, uri in page_links[i]:
            if name not in seen_files:
                seen_files[name] = full_size_url(uri)
    all_images = list(seen_files.items())

    # Flat, noise-stripped, row-major line stream spanning all of the
    # entry's pages, then carved into one segment per row.
    all_lines = [ln for i in page_idxs for ln in page_lines[i]]
    data_lines = [ln for ln in all_lines if not is_noise_line(ln)]

    # Primary: detect row codes directly from the text (self-contained,
    # doesn't depend on link `desc` values being distinct per row - some
    # 'Closeout' entries reuse one constant desc for the whole table).
    auto_codes, auto_rows = parse_rows_autodetect(entry_name, data_lines)

    if len(auto_codes) >= len(row_codes):
        used_codes, parsed_rows = auto_codes, auto_rows
    else:
        # Fall back to the link-desc method (needed for entries whose item
        # codes don't share the entry name as a prefix, e.g. simple supply
        # items or "MEMORY FOAM PILLOWS" -> "A5000"/"A5001").
        used_codes, parsed_rows = row_codes, parse_rows_sequential(row_codes, data_lines)

    rows_out = []
    for code, parsed in zip(used_codes, parsed_rows):
        if parsed is None:
            continue
        parsed["item_code"] = code
        rows_out.append(parsed)

    # Footer (entry-level) fields, scanned across the whole entry's lines.
    footer = extract_footer_fields(all_lines)

    group_prefix = entry_name.strip()
    for r in rows_out:
        # Each row carries its OWN inline Groupings text (captured during
        # parsing) - a combo/bundle row like "B067-KDM" lists "B067-K,
        # B067-D, B067-M"; a standalone piece row has none. The entry-level
        # footer "Groupings:" field is always blank (it's a distinct, always
        # empty key on these pages) so must not be used here.
        r["_component_codes"] = component_codes(r["item_code"], group_prefix, r.get("groupings_text"))
        r["bundle_component_codes"] = full_groupings_codes(group_prefix, r.get("groupings_text"))

    image_map = assign_images(rows_out, all_images, group_prefix)

    for r in rows_out:
        r["image_urls"] = image_map.get(r["item_code"], [])
        r["entry_num"] = entry_num
        r["entry_name"] = entry_name
        r["raw_category"] = footer.get("Category", "")
        r["collection"] = footer.get("Collection", "")
        r["feature"] = footer.get("Feature", "")
        r["entry_description"] = footer.get("Description", "")
        # Simple (single-row) schema pages have no inline Description
        # column at all - Item is followed directly by Price - so the row
        # parser falls back to using the item code as the name. Use the
        # entry-level footer "Description:" field instead when available.
        if r["name"].strip().lower() == r["item_code"].strip().lower() and footer.get("Description"):
            r["name"] = footer["Description"]
        if r["msrp"] is None and footer.get("MSRP"):
            try:
                r["msrp"] = float(footer["MSRP"].replace("$", "").replace(",", ""))
            except ValueError:
                pass

    return rows_out


def main():
    doc = fitz.open(PDF_PATH)
    entry_groups = find_entry_page_groups(doc)
    print(f"Found {len(entry_groups)} entries across {doc.page_count} pages", file=sys.stderr)

    all_rows = []
    for group in entry_groups:
        first_page_text = doc[group[0]].get_text()
        lines = first_page_text.split("\n")
        entry_num, entry_name = None, None
        for line in lines[:6]:
            m = ENTRY_HEADER_RE.match(line.strip())
            if m:
                entry_num, entry_name = int(m.group(1)), m.group(2).strip()
                break
        if entry_name is None:
            print(f"WARN: could not find entry header on page {group[0]}", file=sys.stderr)
            continue

        rows = process_entry(doc, group, entry_num, entry_name)
        print(f"  entry {entry_num}: {entry_name} -> {len(rows)} product row(s)", file=sys.stderr)
        all_rows.extend(rows)

    # Build final CSV rows in the schema of units_processed.csv (+ extras)
    out_rows = []
    for r in all_rows:
        short_name, overflow = split_name_and_overflow(r["name"])
        r["name"] = short_name

        colors = extract_colors(r["name"], r.get("feature", ""))
        desc_parts = []
        if overflow:
            desc_parts.append(overflow)
        if r.get("feature"):
            desc_parts.append(r["feature"])
        if r.get("entry_description") and r["entry_description"] != r.get("feature"):
            desc_parts.append(r["entry_description"])
        description = "\n".join(desc_parts)

        display_name = r["name"].title() if r["name"].isupper() else r["name"]
        slug_name = slugify(r["name"])
        slug_code = slugify(r["item_code"])
        slug = slug_name if slug_code in slug_name else slugify(r["item_code"], r["name"])

        out_rows.append({
            "item_code": r["item_code"],
            "name": display_name,
            "slug": slug,
            "description": description,
            "price": f"{r['price']:.2f}",
            "category": map_category(r["raw_category"]),
            "raw_category": r["raw_category"],
            "collection": r.get("collection", ""),
            "image_url": json.dumps(r["image_urls"]),
            "in_stock": "true" if (r["available_stock"] is None or r["available_stock"] > 0) else "false",
            "available_stock": r["available_stock"] if r["available_stock"] is not None else "",
            "msrp": f"{r['msrp']:.2f}" if r.get("msrp") is not None else "",
            "colors": json.dumps(colors),
            "entry_num": r["entry_num"],
            "entry_name": r["entry_name"],
            "bundle_component_codes": json.dumps(r.get("bundle_component_codes", [])),
        })

    fieldnames = [
        "item_code", "name", "slug", "description", "price", "category",
        "raw_category", "collection", "image_url", "in_stock",
        "available_stock", "msrp", "colors", "entry_num", "entry_name",
        "bundle_component_codes",
    ]
    with open(OUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(out_rows)

    print(f"\nWrote {len(out_rows)} products to {OUT_CSV}", file=sys.stderr)


if __name__ == "__main__":
    main()
