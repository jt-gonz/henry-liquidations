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
        # Format: [Prefix][Number] [Name] -> (Prefix, Number, Name)
        # Handles U13 Elle, ST110 Amelia, etc.
        match = re.match(r'([A-Z]+)(\d+)\s+(.+)', str(uid))
        if match:
            return match.group(1), int(match.group(2)), match.group(3).strip()
        return None, None, str(uid).strip()

    # Create temporary columns for logic
    df[['uid_prefix', 'uid_num', 'model_name']] = df['unit_id'].apply(lambda x: pd.Series(parse_unit_id(x)))

    def extract_colors(text):
        found_hex = []
        if pd.isna(text): return found_hex
        for color_name, hex_val in color_map.items():
            if re.search(r'\b' + re.escape(color_name) + r'\b', text, re.IGNORECASE):
                found_hex.append(hex_val)
        return found_hex

    processed_rows = []

    # Group by model_name and collection to combine sequential unit_ids (e.g. U30, U31 Phillip)
    for (model_name, collection), group in df.groupby(['model_name', 'collection'], sort=False):
        group = group.sort_values('uid_num')
        
        # Use the first unit_id in the sequence as the primary name
        primary_unit_id = group.iloc[0]['unit_id']
        
        # Combine colors from all descriptions in the group
        all_colors = []
        for desc in group['description']:
            all_colors.extend(extract_colors(desc))
        unique_colors = sorted(list(set(all_colors)))

        # Format Description (Bullets)
        first_row = group.iloc[0]
        desc_parts = [p.strip() for p in str(first_row['description']).split(';') if p.strip()]
        formatted_desc = "\n".join([f"- {p}" for p in desc_parts])

        # Format Dimensions (Bullets + Bold Titles)
        dim_parts = [p.strip() for p in str(first_row['dimensions']).split(';') if p.strip()]
        formatted_dims = []
        for d in dim_parts:
            if ':' in d:
                title, val = d.split(':', 1)
                formatted_dims.append(f"- **{title.strip()}:**{val}")
            else:
                formatted_dims.append(f"- {d}")
        
        # Dimensions are placed lower than description
        combined_text = formatted_desc + "\n" + "\n".join(formatted_dims)

        # Build Entry
        entry = {
            'name': primary_unit_id,
            'slug': primary_unit_id.lower().replace(' ', '-'),
            'description': combined_text,
            'price': 0,
            'category': collection,
            # Path matches name with space replaced by underscore
            'image_url': f"https://udrgctjqqcaalqzpbbyg.supabase.co/storage/v1/object/public/product-images/{primary_unit_id.replace(' ', '_')}.png",
            'in_stock': True,
            'colors': unique_colors
        }
        processed_rows.append(entry)

    # Final output
    out_df = pd.DataFrame(processed_rows)
    out_df.to_csv(output_file, index=False)
    print(f"Successfully processed {len(out_df)} unique products.")

if __name__ == "__main__":
    process_data('~/projects/product/units_output.csv', 'units_processed.csv')
