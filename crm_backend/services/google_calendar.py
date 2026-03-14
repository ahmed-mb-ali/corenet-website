"""
Google Calendar + Meet integration via Service Account with domain-wide delegation.
Gracefully skips if GOOGLE_SERVICE_ACCOUNT_JSON env var is not set.
"""

import os
import json
import base64
import uuid
import logging
from datetime import date, time, datetime, timedelta

logger = logging.getLogger(__name__)

SCOPES = ["https://www.googleapis.com/auth/calendar"]
TIMEZONE = "Asia/Riyadh"
ADMIN_EMAIL = os.environ.get("GOOGLE_ADMIN_EMAIL", "sales@corenet.sa")


def _strip_plus_alias(email: str) -> str:
    """Strip +alias from email: sales+admin@x.com → sales@x.com"""
    local, domain = email.split("@", 1)
    local = local.split("+", 1)[0]
    return f"{local}@{domain}"


def _get_credentials(impersonate_email: str):
    """Build delegated credentials for the given user email."""
    raw = os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON")
    if not raw:
        return None

    try:
        from google.oauth2 import service_account

        info = json.loads(base64.b64decode(raw))
        creds = service_account.Credentials.from_service_account_info(
            info, scopes=SCOPES
        )
        # Strip +alias so sales+admin@corenet.sa → sales@corenet.sa
        return creds.with_subject(_strip_plus_alias(impersonate_email))
    except Exception as e:
        logger.warning("Failed to build Google credentials: %s", e)
        return None


def create_meet_event(
    rep_email: str,
    client_name: str,
    client_email: str,
    booking_date: date,
    start_time: time,
    end_time: time,
) -> dict | None:
    """
    Create a Google Calendar event with Google Meet on the rep's calendar.
    Returns {"event_id": str, "meet_url": str} on success, None on failure.
    """
    creds = _get_credentials(rep_email)
    if not creds:
        return None

    try:
        from googleapiclient.discovery import build

        service = build("calendar", "v3", credentials=creds)

        start_dt = datetime.combine(booking_date, start_time)
        end_dt = datetime.combine(booking_date, end_time)

        event = {
            "summary": f"Corenet Meeting — {client_name}",
            "description": f"Sales meeting with {client_name} ({client_email})",
            "start": {
                "dateTime": start_dt.isoformat(),
                "timeZone": TIMEZONE,
            },
            "end": {
                "dateTime": end_dt.isoformat(),
                "timeZone": TIMEZONE,
            },
            "attendees": list({e["email"]: e for e in [
                {"email": rep_email},
                {"email": client_email},
                {"email": ADMIN_EMAIL},
            ]}.values()),
            "conferenceData": {
                "createRequest": {
                    "requestId": str(uuid.uuid4()),
                    "conferenceSolutionKey": {"type": "hangoutsMeet"},
                },
            },
            "reminders": {
                "useDefault": False,
                "overrides": [
                    {"method": "email", "minutes": 30},
                    {"method": "popup", "minutes": 10},
                ],
            },
        }

        created = service.events().insert(
            calendarId="primary",
            body=event,
            conferenceDataVersion=1,
            sendUpdates="all",
        ).execute()

        meet_url = None
        if created.get("conferenceData", {}).get("entryPoints"):
            for ep in created["conferenceData"]["entryPoints"]:
                if ep.get("entryPointType") == "video":
                    meet_url = ep["uri"]
                    break

        return {
            "event_id": created["id"],
            "meet_url": meet_url,
        }

    except Exception as e:
        logger.error("Failed to create Google Calendar event: %s", e)
        return None


def delete_event(rep_email: str, event_id: str) -> bool:
    """
    Delete a Google Calendar event (cancels the meeting + Meet link).
    Sends cancellation notifications to all attendees.
    Returns True on success, False on failure.
    """
    creds = _get_credentials(rep_email)
    if not creds:
        return False

    try:
        from googleapiclient.discovery import build

        service = build("calendar", "v3", credentials=creds)
        service.events().delete(
            calendarId="primary",
            eventId=event_id,
            sendUpdates="all",
        ).execute()
        logger.info("Deleted calendar event %s for %s", event_id, rep_email)
        return True

    except Exception as e:
        logger.error("Failed to delete Google Calendar event %s: %s", event_id, e)
        return False


def update_event(
    rep_email: str,
    event_id: str,
    new_date: date,
    new_start: time,
    new_end: time,
    client_name: str | None = None,
) -> dict | None:
    """
    Update date/time of a Google Calendar event.
    Sends update notifications to all attendees.
    Returns {"event_id": str, "meet_url": str} on success, None on failure.
    """
    creds = _get_credentials(rep_email)
    if not creds:
        return None

    try:
        from googleapiclient.discovery import build

        service = build("calendar", "v3", credentials=creds)

        start_dt = datetime.combine(new_date, new_start)
        end_dt = datetime.combine(new_date, new_end)

        patch_body: dict = {
            "start": {"dateTime": start_dt.isoformat(), "timeZone": TIMEZONE},
            "end": {"dateTime": end_dt.isoformat(), "timeZone": TIMEZONE},
        }
        if client_name:
            patch_body["summary"] = f"Corenet Meeting — {client_name}"

        updated = service.events().patch(
            calendarId="primary",
            eventId=event_id,
            body=patch_body,
            sendUpdates="all",
        ).execute()

        meet_url = None
        if updated.get("conferenceData", {}).get("entryPoints"):
            for ep in updated["conferenceData"]["entryPoints"]:
                if ep.get("entryPointType") == "video":
                    meet_url = ep["uri"]
                    break

        return {
            "event_id": updated["id"],
            "meet_url": meet_url,
        }

    except Exception as e:
        logger.error("Failed to update Google Calendar event %s: %s", event_id, e)
        return None
