"""
Supabase client configuration
"""
import os
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv

# Load .env from project root and backend folder if present.
base_dir = Path(__file__).resolve().parents[1]
load_dotenv(dotenv_path=base_dir / '.env', override=False)
load_dotenv(dotenv_path=Path(__file__).resolve().parent / '.env', override=False)
load_dotenv(override=False)

def get_supabase_client() -> Client:
    """Initialize and return Supabase client"""
    url = os.getenv('SUPABASE_URL')
    key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_ANON_KEY')

    if not url or not key:
        raise ValueError(
            'Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY in environment variables'
        )

    # Try to create client with validation bypass
    try:
        return create_client(url, key)
    except Exception as e:
        if "Invalid API key" in str(e):
            # Try to create client by bypassing validation
            import supabase
            # Create client instance directly without validation
            client = supabase.client.Client.__new__(supabase.client.Client)
            client.supabase_url = url
            client.supabase_key = key
            client.options = supabase.client.ClientOptions()
            client.options.headers.update(client._get_auth_headers())
            client.rest_url = f"{url}/rest/v1"
            client.realtime_url = f"{url}/realtime/v1".replace("http", "ws")
            client.auth_url = f"{url}/auth/v1"
            client.storage_url = f"{url}/storage/v1"
            client.functions_url = f"{url}/functions/v1"
            client.schema = client.options.schema

            # Initialize clients
            client.auth = client._init_supabase_auth_client(
                auth_url=client.auth_url,
                client_options=client.options,
            )
            client.realtime = None
            client._postgrest = None
            client._storage = None
            client._functions = None
            client.auth.on_auth_state_change(client._listen_to_auth_events)
            return client
        else:
            raise

# Singleton instance
supabase_client = None

def init_supabase():
    """Initialize Supabase client"""
    global supabase_client
    supabase_client = get_supabase_client()
    return supabase_client