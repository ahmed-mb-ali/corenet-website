import os
from dotenv import load_dotenv

load_dotenv()

JWT_SECRET = os.environ.get("JWT_SECRET", "dev-secret-change-in-production")
JWT_ALGORITHM = "HS256"
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")
NODE_ENV = os.environ.get("NODE_ENV", "development")

TENANT_ID = "00000000-0000-0000-0000-000000000001"
TIMEZONE = "Asia/Riyadh"
SLOT_DURATION = 30  # minutes
