#!/usr/bin/env python3
"""
Upload units_processed.csv to Supabase products table.

This script reads the CSV file, processes the descriptions to convert **text** to <strong>text</strong>,
and uploads all products to the Supabase database.

Usage:
    # With encrypted .env (recommended):
    npx dotenvx run -- python3 scripts/upload_products.py
    
    # Or with decrypted .env:
    python3 scripts/upload_products.py

Requirements:
    pip install supabase pandas
"""

import csv
import json
import os
import re
import subprocess
import sys
from typing import List, Dict, Any


def get_env_var(key: str) -> str:
    """Get environment variable, trying multiple methods."""
    # First try regular environment
    value = os.getenv(key)
    if value:
        return value
    
    # Try using dotenvx to decrypt
    try:
        result = subprocess.run(
            ['npx', 'dotenvx', 'run', '--', 'sh', '-c', f'echo "${key}"'],
            capture_output=True,
            text=True,
            cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        )
        if result.returncode == 0:
            output = result.stdout.strip()
            # Filter out the dotenvx log line
            lines = [l for l in output.split('\n') if not l.startswith('[') and l.strip()]
            if lines:
                return lines[-1]
    except Exception:
        pass
    
    return None


def process_description(desc: str) -> str:
    """
    Convert Markdown-style **bold** text to HTML <strong> tags.
    """
    if not desc:
        return ""
    
    # Replace **text** with <strong>text</strong>
    desc = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', desc)
    desc = desc.strip()
    
    return desc


def parse_colors(colors_str: str) -> List[str]:
    """
    Parse the colors column from the CSV.
    """
    if not colors_str or colors_str.strip() == '':
        return []
    
    try:
        return eval(colors_str)
    except:
        try:
            return json.loads(colors_str)
        except:
            return []


def parse_csv_multiline(filepath: str) -> List[Dict[str, Any]]:
    """
    Parse the CSV file handling multiline descriptions.
    """
    products = []
    
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            try:
                product = {
                    'name': row['name'].strip(),
                    'slug': row['slug'].strip(),
                    'description': process_description(row['description']),
                    'price': float(row['price']) if row['price'] else 0.0,
                    'category': row['category'].strip() if row['category'] else None,
                    'image_url': row['image_url'].strip() if row['image_url'] else None,
                    'in_stock': row['in_stock'].strip().lower() == 'true' if row['in_stock'] else True,
                    'colors': parse_colors(row.get('colors', ''))
                }
                products.append(product)
            except Exception as e:
                print(f"Error parsing row: {row.get('name', 'Unknown')} - {e}")
                continue
    
    return products


def upload_to_supabase(products: List[Dict[str, Any]], supabase):
    """
    Upload products to Supabase in batches.
    """
    batch_size = 50
    total = len(products)
    
    print(f"Starting upload of {total} products...")
    
    for i in range(0, total, batch_size):
        batch = products[i:i + batch_size]
        
        try:
            response = supabase.table('products').upsert(batch).execute()
            print(f"Uploaded batch {i//batch_size + 1}/{(total + batch_size - 1)//batch_size} "
                  f"({i + len(batch)}/{total} products)")
        except Exception as e:
            print(f"Error uploading batch {i//batch_size + 1}: {e}")
            for product in batch:
                try:
                    supabase.table('products').upsert([product]).execute()
                except Exception as e2:
                    print(f"  Failed: {product['name']} - {e2}")
    
    print(f"\nUpload complete! {total} products processed.")


def main():
    try:
        from supabase import create_client, Client
    except ImportError:
        print("Error: supabase package not installed.")
        print("Please run: pip3 install supabase")
        sys.exit(1)
    
    # Get Supabase credentials
    supabase_url = get_env_var('PUBLIC_SUPABASE_URL')
    supabase_key = get_env_var('SUPABASE_SERVICE_ROLE_KEY') or get_env_var('PUBLIC_SUPABASE_ANON_KEY')
    
    if not supabase_url:
        print("Error: PUBLIC_SUPABASE_URL not found.")
        print("\nPlease run with dotenvx:")
        print("  npx dotenvx run -- python3 scripts/upload_products.py")
        sys.exit(1)
    
    if not supabase_key:
        print("Error: No Supabase key found.")
        print("\nPlease run with dotenvx:")
        print("  npx dotenvx run -- python3 scripts/upload_products.py")
        sys.exit(1)
    
    print(f"Connecting to Supabase: {supabase_url}")
    
    # Initialize Supabase client
    supabase = create_client(supabase_url, supabase_key)
    
    # Path to CSV file
    csv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'units_processed.csv')
    
    if not os.path.exists(csv_path):
        print(f"Error: CSV file not found at {csv_path}")
        sys.exit(1)
    
    print("Parsing CSV file...")
    products = parse_csv_multiline(csv_path)
    
    if not products:
        print("No products found in CSV file!")
        sys.exit(1)
    
    # Show first product as example
    print(f"\nFound {len(products)} products")
    print("\nFirst product example:")
    print(f"  Name: {products[0]['name']}")
    print(f"  Slug: {products[0]['slug']}")
    print(f"  Price: ${products[0]['price']}")
    print(f"  Category: {products[0]['category']}")
    print(f"  Description preview:")
    print(f"    {products[0]['description'][:150]}...")
    
    # Ask for confirmation
    confirm = input("\nProceed with upload? (yes/no): ").strip().lower()
    if confirm not in ['yes', 'y']:
        print("Upload cancelled.")
        sys.exit(0)
    
    # Upload to Supabase
    upload_to_supabase(products, supabase)
    
    print("\nDone!")


if __name__ == '__main__':
    main()
