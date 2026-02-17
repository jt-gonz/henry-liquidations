import pandas as pd
import re

def process_data(input_file, output_file):
    # Load the data
    df = pd.read_csv(input_file)

    # Expanded Color Mapping
    color_map = {
        'Black': '#000000', 'Gray': '#808080', 'Brown': '#964B00', 'Red': '#FF0000',
        'Charcoal': '#36454F', 'Sand': '#C2B280', 'White': '#FFFFFF', 'Chocolate': '#D2691E',
        'Blue': '#0000FF', 'Oyster': '#EAE0C8', 'Beige': '#F5F5DC', 'Pink': '#FFC0CB',
        'Ivory': '#FFFFF0', 'Silver': '#C0C0C0', 'Navy': '#000080', 'Gold': '#FFD700'
    }

    def parse_unit_id(uid):
        # Robust parsing: Split on the first space only.
        # "U13 Elle" -> code="U13", name="Elle"
        # "U93-R Hunnely" -> code="U93-R", name="Hunnely"
        s = str(uid).strip()
        parts = s.split(' ', 1)
        
        if len(parts) == 2:
            id_code = parts[0].strip()
            name = parts[1].strip()
        else:
            # Fallback for weird data
            id_code = s
            name = s

        # Extract a number for sorting purposes (e.g., 93 from U93-R)
        # If no number found, default to 0
        num_match = re.search(r'(\d+)', id_code)
        num = int(num_match.group(1)) if num_match else 0
        
        return id_code, num, name

    # Apply the parsing logic
    df['unit_id'] = df['unit_id'].str.strip()
    # Create new columns: 'uid_code' (e.g. U93-R), 'sort_num' (93), 'model_name' (Hunnely)
    df[['uid_code', 'sort_num', 'model_name']] = df['unit_id'].apply(lambda x: pd.Series(parse_unit_id(x)))
    
    # Handle price
    df['price'] = pd.to_numeric(df['price'], errors='coerce').fillna(0)

    def extract_colors(text):
        found_hex = []
        if pd.isna(text): return found_hex
        for color_name, hex_val in color_map.items():
            if re.search(r'\b' + re.escape(color_name) + r'\b', text, re.IGNORECASE):
                found_hex.append(hex_val)
        return found_hex

    processed_rows = []

    # GROUPING LOGIC:
    # Group by model_name, collection AND price.
    for (model_name, collection, price), group in df.groupby(['model_name', 'collection', 'price'], sort=False):
        # Sort by the extracted number so U13 comes before U14
        group = group.sort_values('sort_num')
        
        # 1. Product Name: Just the model name (e.g., "Elle")
        product_name = model_name

        # 2. Slug & Image Arrays
        slug_ids = []
        image_urls = []

        for _, row in group.iterrows():
            # Use the extracted code directly (e.g., "U93-R")
            code = row['uid_code']
            slug_ids.append(code)

            # Image URL
            safe_filename = row['unit_id'].replace(' ', '_')
            url = f"https://udrgctjqqcaalqzpbbyg.supabase.co/storage/v1/object/public/product-images/{safe_filename}.png"
            image_urls.append(url)

        # Construct Slug: u93-r-u94-r-hunnely
        # Join all IDs with dashes, then add the model name
        slug_base = "-".join(slug_ids)
        slug_model = model_name.lower().replace(' ', '-')
        final_slug = f"{slug_base}-{slug_model}".lower()

        # Combine colors
        all_colors = []
        for desc in group['description']:
            all_colors.extend(extract_colors(desc))
        unique_colors = sorted(list(set(all_colors)))

        # Format Description
        first_row = group.iloc[0]
        desc_parts = [p.strip() for p in str(first_row['description']).split(';') if p.strip()]
        formatted_desc = "\n".join([f"- {p}" for p in desc_parts])

        # Format Dimensions
        dim_parts = [p.strip() for p in str(first_row['dimensions']).split(';') if p.strip()]
        formatted_dims = []
        for d in dim_parts:
            if ':' in d:
                title, val = d.split(':', 1)
                formatted_dims.append(f"- **{title.strip()}:**{val}")
            else:
                formatted_dims.append(f"- {d}")
        
        combined_text = formatted_desc + "\n" + "\n".join(formatted_dims)

        # Stock logic
        raw_available = bool(first_row.get('available', 1))
        is_in_stock = raw_available and (price > 0)

        # Build Entry
        entry = {
            'name': product_name,
            'slug': final_slug,
            'description': combined_text,
            'price': price,
            'category': collection,
            'image_url': image_urls,
            'in_stock': is_in_stock,
            'colors': unique_colors
        }
        processed_rows.append(entry)

    # Final output
    out_df = pd.DataFrame(processed_rows)
    out_df.to_csv(output_file, index=False)
    print(f"Successfully processed {len(out_df)} products.")
    
    # Debug print to verify fix
    sample = out_df[out_df['slug'].str.contains('nan', na=False)]
    if not sample.empty:
        print("WARNING: 'nan' still found in slugs!")
        print(sample[['name', 'slug']].head())
    else:
        print("Verification: No 'nan' found in slugs.")

if __name__ == "__main__":
    process_data('~/projects/product/full_catalog_with_price.csv', 'units_processed.csv')
