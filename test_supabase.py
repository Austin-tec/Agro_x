#!/usr/bin/env python3
"""
Test Supabase client connection
"""
import os
from supabase import create_client

# Test the key
url = "https://mnqfdjntfwjtemdrlcdu.supabase.co"
key = "sb_publishable_a2LepX7nz2RzmjqyJLalLQ__9kY8D3P"

print(f"URL: {url}")
print(f"Key: {key}")
print(f"Key length: {len(key)}")
print(f"Key contains dots: {'.' in key}")

try:
    client = create_client(url, key)
    print("✅ Supabase client created successfully!")
    print(f"Client auth URL: {client.auth_url}")
except Exception as e:
    print(f"❌ Error creating client: {e}")
    print(f"Error type: {type(e)}")