#!/usr/bin/env python3
"""
Test modified Supabase client
"""
from backend.supabase_client import get_supabase_client

print("Testing modified Supabase client...")
try:
    client = get_supabase_client()
    print("✅ Client created successfully!")
    print(f"Auth URL: {client.auth_url}")
    print(f"Rest URL: {client.rest_url}")
except Exception as e:
    print(f"❌ Error: {e}")
    print(f"Error type: {type(e)}")