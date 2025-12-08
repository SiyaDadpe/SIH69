from __future__ import annotations

from typing import Optional
from pathlib import Path
from pymongo import MongoClient
from dotenv import load_dotenv
from .config import Config


_client: Optional[MongoClient] = None


def _attempt_env_discovery():
    """Attempt to locate a .env file outside the current working directory.

    Tries common relative locations (repository root, server/.env). Loads the
    first found to pull in MONGO_URI if missing.
    """
    candidates = [
        Path.cwd() / ".env",
        Path.cwd().parent / ".env",
        Path.cwd() / "server" / ".env",
        Path.cwd().parent / "server" / ".env",
    ]
    for c in candidates:
        if c.exists():
            load_dotenv(dotenv_path=c)
            return c
    return None


def _validate_uri(conn: str):
    """Basic sanity checks with conservative placeholder detection.

    Avoid false positives like usernames containing 'user'. We only treat values
    as placeholders if they exactly equal known template tokens or angle-bracketed
    markers.
    """
    lowered = conn.lower()
    if not (lowered.startswith("mongodb://") or lowered.startswith("mongodb+srv://")):
        raise RuntimeError("Mongo URI must start with mongodb:// or mongodb+srv://")

    # Extract credential and host parts for exact token matching
    after_scheme = conn.split("://", 1)[1]
    cred_part = ""
    host_and_rest = after_scheme
    if "@" in after_scheme:
        cred_part, host_and_rest = after_scheme.split("@", 1)
    username = ""
    password = ""
    if cred_part and ":" in cred_part:
        username, password = cred_part.split(":", 1)

    host_part = host_and_rest.split("/", 1)[0]

    placeholder_exact = {"user", "username", "pass", "password", "host"}
    angle_tokens = ["<user>", "<username>", "<password>", "<pass>", "<host>"]

    if username.lower() in placeholder_exact:
        raise RuntimeError("Mongo URI username is a placeholder. Replace '" + username + "' with your actual user.")
    if password.lower() in placeholder_exact:
        raise RuntimeError("Mongo URI password is a placeholder. Replace '" + password + "' with your actual password.")
    if host_part.lower() in placeholder_exact:
        raise RuntimeError("Mongo URI host is a placeholder. Replace '" + host_part + "' with your cluster host domain.")
    for ang in angle_tokens:
        if ang in conn:
            raise RuntimeError(f"Mongo URI contains angle-bracket placeholder '{ang}'. Replace it with a real value.")

    # Minimal SRV hostname guard
    if lowered.startswith("mongodb+srv://"):
        if host_part.count('.') < 1:
            raise RuntimeError(
                f"Mongo SRV hostname '{host_part}' looks invalid. Use the full cluster domain e.g. cluster0.xxxxx.mongodb.net")


def get_mongo_client(uri: Optional[str] = None) -> MongoClient:
    """Get a singleton MongoClient using env/Config settings, with fallback discovery.

    Adds pre-validation to provide clear feedback if a template URI was supplied.
    """
    global _client
    if _client is None:
        conn = uri or Config.MONGO_URI
        if not conn:
            found = _attempt_env_discovery()
            if not found:
                raise RuntimeError(
                    "MONGO_URI is not set. Provide it via --mongo-uri flag, environment variable, or .env (searched: repo root, server/.env)."
                )
            # reload config after dotenv
            conn = uri or Config.MONGO_URI or ''
        if not conn:
            raise RuntimeError("MONGO_URI still missing after .env discovery.")
        _validate_uri(conn)
        _client = MongoClient(conn)
    return _client


def get_collection(db_name: Optional[str] = None, collection_name: Optional[str] = None):
    """Return a handle to the configured collection."""
    client = get_mongo_client()
    db = client[db_name or Config.MONGO_DB_NAME]
    return db[collection_name or Config.MONGO_COLLECTION]
