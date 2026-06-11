"""Supabase client bootstrap for BazaarMind."""
from __future__ import annotations

import os

from dotenv import load_dotenv
from supabase import create_client



load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"))

supabase_url = os.getenv("SUPABASE_URL")
supabase_service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if supabase_url and supabase_service_role_key:
    supabase = create_client(supabase_url, supabase_service_role_key)
else:
    supabase = None