"""
Booking confirmation email via Amazon SES.
Gracefully skips if SES_ENABLED env var is not set or SES is not configured.
"""

import os
import re
import logging
from datetime import date, time

logger = logging.getLogger(__name__)

SES_REGION = os.environ.get("SES_REGION", "us-east-1")
SENDER_EMAIL = os.environ.get("SES_SENDER_EMAIL", "sales@corenet.sa")
SENDER_NAME = os.environ.get("SES_SENDER_NAME", "Corenet")

ARABIC_PATTERN = re.compile(r"[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]")


def _detect_lang(name: str, message: str | None, lang_hint: str | None) -> str:
    """Detect language: use frontend hint first, fallback to Arabic char detection."""
    if lang_hint and lang_hint in ("ar", "en"):
        return lang_hint
    text = f"{name} {message or ''}"
    if ARABIC_PATTERN.search(text):
        return "ar"
    return "en"


def _format_time_12h(t: time, lang: str) -> str:
    h, m = t.hour, t.minute
    suffix_en = "PM" if h >= 12 else "AM"
    suffix_ar = "م" if h >= 12 else "ص"
    h12 = h % 12 or 12
    if lang == "ar":
        return f"{h12}:{m:02d} {suffix_ar}"
    return f"{h12}:{m:02d} {suffix_en}"


def _format_date_display(d: date, lang: str) -> str:
    months_en = ["January", "February", "March", "April", "May", "June",
                 "July", "August", "September", "October", "November", "December"]
    months_ar = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
                 "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"]
    days_en = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    days_ar = ["الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"]

    day_name = days_ar[d.weekday()] if lang == "ar" else days_en[d.weekday()]
    month_name = months_ar[d.month - 1] if lang == "ar" else months_en[d.month - 1]

    if lang == "ar":
        return f"{day_name}، {d.day} {month_name} {d.year}"
    return f"{day_name}, {month_name} {d.day}, {d.year}"


def _build_html(client_name: str, booking_date: date, start_time: time,
                meet_url: str | None, lang: str) -> str:
    """Build a professional HTML email template."""
    is_ar = lang == "ar"
    direction = "rtl" if is_ar else "ltr"
    align = "right" if is_ar else "left"

    date_str = _format_date_display(booking_date, lang)
    time_str = _format_time_12h(start_time, lang)
    tz_label = "توقيت السعودية" if is_ar else "Arabia Standard Time"

    # Text content
    if is_ar:
        greeting = f"مرحباً {client_name}،"
        thank_you = "شكراً لاختيارك كورنت! يسعدنا التواصل معك."
        confirmed = "تم تأكيد موعدك"
        date_label = "التاريخ"
        time_label = "الوقت"
        duration_label = "المدة"
        duration_val = "30 دقيقة"
        meet_label = "رابط الاجتماع"
        join_btn = "انضم إلى Google Meet"
        closing = "نتطلع للتحدث معك قريباً!"
        team = "فريق مبيعات كورنت"
        footer = "هذا البريد تم إرساله تلقائياً من كورنت"
    else:
        greeting = f"Hi {client_name},"
        thank_you = "Thank you for choosing Corenet! We're excited to connect with you."
        confirmed = "Your meeting is confirmed"
        date_label = "Date"
        time_label = "Time"
        duration_label = "Duration"
        duration_val = "30 minutes"
        meet_label = "Meeting Link"
        join_btn = "Join Google Meet"
        closing = "We look forward to speaking with you!"
        team = "Corenet Sales Team"
        footer = "This email was sent automatically from Corenet"

    meet_section = ""
    if meet_url:
        meet_section = f"""
        <tr>
          <td style="padding:8px 16px;font-family:Arial,sans-serif;font-size:13px;color:#5c5c5c;{f'text-align:right' if is_ar else ''}">{meet_label}</td>
          <td style="padding:8px 16px;font-family:Arial,sans-serif;font-size:13px;{f'text-align:right' if is_ar else ''}">
            <a href="{meet_url}" style="color:#3ab874;text-decoration:none;font-weight:600">{join_btn} →</a>
          </td>
        </tr>
        """

    meet_button = ""
    if meet_url:
        meet_button = f"""
        <div style="text-align:center;margin:24px 0 8px">
          <a href="{meet_url}" style="display:inline-block;background:#3ab874;color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:12px">
            {"🎥 " + join_btn}
          </a>
        </div>
        """

    return f"""<!DOCTYPE html>
<html dir="{direction}" lang="{lang}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f7f8fc;font-family:Arial,sans-serif">
  <div style="max-width:520px;margin:0 auto;padding:32px 16px">
    <!-- Logo -->
    <div style="text-align:center;margin-bottom:24px">
      <span style="font-size:22px;font-weight:700;color:#0f3d2e;letter-spacing:1px">CORENET</span>
    </div>

    <!-- Card -->
    <div style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06)">
      <!-- Green header -->
      <div style="background:#0f3d2e;padding:24px 28px;text-align:{align}">
        <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.6)">{confirmed}</p>
        <p style="margin:0;font-family:Arial,sans-serif;font-size:18px;font-weight:700;color:#ffffff">✓ {confirmed}</p>
      </div>

      <!-- Body -->
      <div style="padding:28px;text-align:{align}">
        <p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:16px;font-weight:600;color:#02022c">{greeting}</p>
        <p style="margin:0 0 24px;font-family:Arial,sans-serif;font-size:14px;color:#5c5c5c;line-height:1.6">{thank_you}</p>

        <!-- Details table -->
        <table style="width:100%;border-collapse:collapse;background:#f7f8fc;border-radius:12px;overflow:hidden" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:8px 16px;font-family:Arial,sans-serif;font-size:13px;color:#5c5c5c;{f'text-align:right' if is_ar else ''}">{date_label}</td>
            <td style="padding:8px 16px;font-family:Arial,sans-serif;font-size:13px;font-weight:600;color:#02022c;{f'text-align:right' if is_ar else ''}">{date_str}</td>
          </tr>
          <tr>
            <td style="padding:8px 16px;font-family:Arial,sans-serif;font-size:13px;color:#5c5c5c;{f'text-align:right' if is_ar else ''}">{time_label}</td>
            <td style="padding:8px 16px;font-family:Arial,sans-serif;font-size:13px;font-weight:600;color:#02022c;{f'text-align:right' if is_ar else ''}">{time_str} ({tz_label})</td>
          </tr>
          <tr>
            <td style="padding:8px 16px;font-family:Arial,sans-serif;font-size:13px;color:#5c5c5c;{f'text-align:right' if is_ar else ''}">{duration_label}</td>
            <td style="padding:8px 16px;font-family:Arial,sans-serif;font-size:13px;font-weight:600;color:#02022c;{f'text-align:right' if is_ar else ''}">{duration_val}</td>
          </tr>
          {meet_section}
        </table>

        {meet_button}

        <p style="margin:24px 0 0;font-family:Arial,sans-serif;font-size:14px;color:#5c5c5c;line-height:1.6">{closing}</p>
        <p style="margin:8px 0 0;font-family:Arial,sans-serif;font-size:14px;font-weight:600;color:#02022c">{team}</p>
      </div>
    </div>

    <!-- Footer -->
    <p style="text-align:center;margin:20px 0 0;font-family:Arial,sans-serif;font-size:11px;color:#999">{footer}</p>
  </div>
</body>
</html>"""


def send_booking_confirmation(
    client_email: str,
    client_name: str,
    booking_date: date,
    start_time: time,
    meet_url: str | None = None,
    lang_hint: str | None = None,
    message: str | None = None,
) -> bool:
    """
    Send booking confirmation email via SES.
    Returns True on success, False on failure. Never raises.
    """
    if not os.environ.get("SES_ENABLED"):
        logger.info("SES not enabled, skipping confirmation email")
        return False

    lang = _detect_lang(client_name, message, lang_hint)

    try:
        import boto3

        ses = boto3.client("ses", region_name=SES_REGION)

        subject_en = "Your Meeting with Corenet is Confirmed!"
        subject_ar = "تم تأكيد موعدك مع كورنت!"
        subject = subject_ar if lang == "ar" else subject_en

        html_body = _build_html(client_name, booking_date, start_time, meet_url, lang)

        ses.send_email(
            Source=f"{SENDER_NAME} <{SENDER_EMAIL}>",
            Destination={"ToAddresses": [client_email]},
            Message={
                "Subject": {"Data": subject, "Charset": "UTF-8"},
                "Body": {
                    "Html": {"Data": html_body, "Charset": "UTF-8"},
                },
            },
        )
        logger.info("Confirmation email sent to %s (lang=%s)", client_email, lang)
        return True

    except Exception as e:
        logger.error("Failed to send confirmation email to %s: %s", client_email, e)
        return False


def _build_cancellation_html(client_name: str, booking_date: date, start_time: time,
                              lang: str) -> str:
    """Build a professional cancellation email template."""
    is_ar = lang == "ar"
    direction = "rtl" if is_ar else "ltr"
    align = "right" if is_ar else "left"

    date_str = _format_date_display(booking_date, lang)
    time_str = _format_time_12h(start_time, lang)

    if is_ar:
        greeting = f"مرحباً {client_name}،"
        body_text = "نود إعلامك بأن الاجتماع التالي تم إلغاؤه."
        heading = "تم إلغاء الاجتماع"
        date_label = "التاريخ"
        time_label = "الوقت"
        closing = "نعتذر عن أي إزعاج. إذا كنت ترغب في حجز موعد جديد، يرجى زيارة موقعنا."
        team = "فريق مبيعات كورنت"
        footer = "هذا البريد تم إرساله تلقائياً من كورنت"
    else:
        greeting = f"Hi {client_name},"
        body_text = "We would like to inform you that the following meeting has been cancelled."
        heading = "Meeting Cancelled"
        date_label = "Date"
        time_label = "Time"
        closing = "We apologize for any inconvenience. If you would like to book a new meeting, please visit our website."
        team = "Corenet Sales Team"
        footer = "This email was sent automatically from Corenet"

    return f"""<!DOCTYPE html>
<html dir="{direction}" lang="{lang}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f7f8fc;font-family:Arial,sans-serif">
  <div style="max-width:520px;margin:0 auto;padding:32px 16px">
    <div style="text-align:center;margin-bottom:24px">
      <span style="font-size:22px;font-weight:700;color:#0f3d2e;letter-spacing:1px">CORENET</span>
    </div>
    <div style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06)">
      <div style="background:#e53e3e;padding:24px 28px;text-align:{align}">
        <p style="margin:0;font-family:Arial,sans-serif;font-size:18px;font-weight:700;color:#ffffff">✕ {heading}</p>
      </div>
      <div style="padding:28px;text-align:{align}">
        <p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:16px;font-weight:600;color:#02022c">{greeting}</p>
        <p style="margin:0 0 24px;font-family:Arial,sans-serif;font-size:14px;color:#5c5c5c;line-height:1.6">{body_text}</p>
        <table style="width:100%;border-collapse:collapse;background:#f7f8fc;border-radius:12px;overflow:hidden" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:8px 16px;font-family:Arial,sans-serif;font-size:13px;color:#5c5c5c;{f'text-align:right' if is_ar else ''}">{date_label}</td>
            <td style="padding:8px 16px;font-family:Arial,sans-serif;font-size:13px;font-weight:600;color:#02022c;text-decoration:line-through;{f'text-align:right' if is_ar else ''}">{date_str}</td>
          </tr>
          <tr>
            <td style="padding:8px 16px;font-family:Arial,sans-serif;font-size:13px;color:#5c5c5c;{f'text-align:right' if is_ar else ''}">{time_label}</td>
            <td style="padding:8px 16px;font-family:Arial,sans-serif;font-size:13px;font-weight:600;color:#02022c;text-decoration:line-through;{f'text-align:right' if is_ar else ''}">{time_str}</td>
          </tr>
        </table>
        <p style="margin:24px 0 0;font-family:Arial,sans-serif;font-size:14px;color:#5c5c5c;line-height:1.6">{closing}</p>
        <p style="margin:8px 0 0;font-family:Arial,sans-serif;font-size:14px;font-weight:600;color:#02022c">{team}</p>
      </div>
    </div>
    <p style="text-align:center;margin:20px 0 0;font-family:Arial,sans-serif;font-size:11px;color:#999">{footer}</p>
  </div>
</body>
</html>"""


def _build_reschedule_html(client_name: str, old_date: date, old_time: time,
                            new_date: date, new_time: time,
                            meet_url: str | None, lang: str) -> str:
    """Build a professional reschedule email template."""
    is_ar = lang == "ar"
    direction = "rtl" if is_ar else "ltr"
    align = "right" if is_ar else "left"

    old_date_str = _format_date_display(old_date, lang)
    old_time_str = _format_time_12h(old_time, lang)
    new_date_str = _format_date_display(new_date, lang)
    new_time_str = _format_time_12h(new_time, lang)
    tz_label = "توقيت السعودية" if is_ar else "Arabia Standard Time"

    if is_ar:
        greeting = f"مرحباً {client_name}،"
        body_text = "نود إعلامك بأن موعد اجتماعك قد تم تغييره."
        heading = "تم تغيير موعد الاجتماع"
        old_label = "الموعد السابق"
        new_label = "الموعد الجديد"
        date_label = "التاريخ"
        time_label = "الوقت"
        meet_label = "رابط الاجتماع"
        join_btn = "انضم إلى Google Meet"
        closing = "نتطلع للتحدث معك في الموعد الجديد!"
        team = "فريق مبيعات كورنت"
        footer = "هذا البريد تم إرساله تلقائياً من كورنت"
    else:
        greeting = f"Hi {client_name},"
        body_text = "We would like to inform you that your meeting has been rescheduled."
        heading = "Meeting Rescheduled"
        old_label = "Previous"
        new_label = "New Schedule"
        date_label = "Date"
        time_label = "Time"
        meet_label = "Meeting Link"
        join_btn = "Join Google Meet"
        closing = "We look forward to speaking with you at the new time!"
        team = "Corenet Sales Team"
        footer = "This email was sent automatically from Corenet"

    meet_section = ""
    if meet_url:
        meet_section = f"""
        <div style="text-align:center;margin:20px 0 8px">
          <a href="{meet_url}" style="display:inline-block;background:#3ab874;color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:12px">
            {"🎥 " + join_btn}
          </a>
        </div>
        """

    return f"""<!DOCTYPE html>
<html dir="{direction}" lang="{lang}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f7f8fc;font-family:Arial,sans-serif">
  <div style="max-width:520px;margin:0 auto;padding:32px 16px">
    <div style="text-align:center;margin-bottom:24px">
      <span style="font-size:22px;font-weight:700;color:#0f3d2e;letter-spacing:1px">CORENET</span>
    </div>
    <div style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06)">
      <div style="background:#f59e0b;padding:24px 28px;text-align:{align}">
        <p style="margin:0;font-family:Arial,sans-serif;font-size:18px;font-weight:700;color:#ffffff">🔄 {heading}</p>
      </div>
      <div style="padding:28px;text-align:{align}">
        <p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:16px;font-weight:600;color:#02022c">{greeting}</p>
        <p style="margin:0 0 24px;font-family:Arial,sans-serif;font-size:14px;color:#5c5c5c;line-height:1.6">{body_text}</p>

        <!-- Old schedule -->
        <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:12px;font-weight:600;color:#e53e3e;text-transform:uppercase;letter-spacing:0.5px">{old_label}</p>
        <table style="width:100%;border-collapse:collapse;background:#fef2f2;border-radius:12px;overflow:hidden;margin-bottom:16px" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:8px 16px;font-family:Arial,sans-serif;font-size:13px;color:#5c5c5c;{f'text-align:right' if is_ar else ''}">{date_label}</td>
            <td style="padding:8px 16px;font-family:Arial,sans-serif;font-size:13px;font-weight:600;color:#02022c;text-decoration:line-through;{f'text-align:right' if is_ar else ''}">{old_date_str}</td>
          </tr>
          <tr>
            <td style="padding:8px 16px;font-family:Arial,sans-serif;font-size:13px;color:#5c5c5c;{f'text-align:right' if is_ar else ''}">{time_label}</td>
            <td style="padding:8px 16px;font-family:Arial,sans-serif;font-size:13px;font-weight:600;color:#02022c;text-decoration:line-through;{f'text-align:right' if is_ar else ''}">{old_time_str}</td>
          </tr>
        </table>

        <!-- New schedule -->
        <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:12px;font-weight:600;color:#3ab874;text-transform:uppercase;letter-spacing:0.5px">{new_label}</p>
        <table style="width:100%;border-collapse:collapse;background:#f0fdf4;border-radius:12px;overflow:hidden" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:8px 16px;font-family:Arial,sans-serif;font-size:13px;color:#5c5c5c;{f'text-align:right' if is_ar else ''}">{date_label}</td>
            <td style="padding:8px 16px;font-family:Arial,sans-serif;font-size:13px;font-weight:600;color:#02022c;{f'text-align:right' if is_ar else ''}">{new_date_str}</td>
          </tr>
          <tr>
            <td style="padding:8px 16px;font-family:Arial,sans-serif;font-size:13px;color:#5c5c5c;{f'text-align:right' if is_ar else ''}">{time_label}</td>
            <td style="padding:8px 16px;font-family:Arial,sans-serif;font-size:13px;font-weight:600;color:#02022c;{f'text-align:right' if is_ar else ''}">{new_time_str} ({tz_label})</td>
          </tr>
        </table>

        {meet_section}

        <p style="margin:24px 0 0;font-family:Arial,sans-serif;font-size:14px;color:#5c5c5c;line-height:1.6">{closing}</p>
        <p style="margin:8px 0 0;font-family:Arial,sans-serif;font-size:14px;font-weight:600;color:#02022c">{team}</p>
      </div>
    </div>
    <p style="text-align:center;margin:20px 0 0;font-family:Arial,sans-serif;font-size:11px;color:#999">{footer}</p>
  </div>
</body>
</html>"""


def send_cancellation_email(
    client_email: str,
    client_name: str,
    booking_date: date,
    start_time: time,
    lang_hint: str | None = None,
) -> bool:
    """Send meeting cancellation email via SES."""
    if not os.environ.get("SES_ENABLED"):
        logger.info("SES not enabled, skipping cancellation email")
        return False

    lang = _detect_lang(client_name, None, lang_hint)

    try:
        import boto3

        ses = boto3.client("ses", region_name=SES_REGION)

        subject = "تم إلغاء موعدك مع كورنت" if lang == "ar" else "Your Meeting with Corenet Has Been Cancelled"
        html_body = _build_cancellation_html(client_name, booking_date, start_time, lang)

        ses.send_email(
            Source=f"{SENDER_NAME} <{SENDER_EMAIL}>",
            Destination={"ToAddresses": [client_email]},
            Message={
                "Subject": {"Data": subject, "Charset": "UTF-8"},
                "Body": {"Html": {"Data": html_body, "Charset": "UTF-8"}},
            },
        )
        logger.info("Cancellation email sent to %s", client_email)
        return True

    except Exception as e:
        logger.error("Failed to send cancellation email to %s: %s", client_email, e)
        return False


def send_reschedule_email(
    client_email: str,
    client_name: str,
    old_date: date,
    old_time: time,
    new_date: date,
    new_time: time,
    meet_url: str | None = None,
    lang_hint: str | None = None,
) -> bool:
    """Send meeting reschedule email via SES."""
    if not os.environ.get("SES_ENABLED"):
        logger.info("SES not enabled, skipping reschedule email")
        return False

    lang = _detect_lang(client_name, None, lang_hint)

    try:
        import boto3

        ses = boto3.client("ses", region_name=SES_REGION)

        subject = "تم تغيير موعد اجتماعك مع كورنت" if lang == "ar" else "Your Meeting with Corenet Has Been Rescheduled"
        html_body = _build_reschedule_html(client_name, old_date, old_time, new_date, new_time, meet_url, lang)

        ses.send_email(
            Source=f"{SENDER_NAME} <{SENDER_EMAIL}>",
            Destination={"ToAddresses": [client_email]},
            Message={
                "Subject": {"Data": subject, "Charset": "UTF-8"},
                "Body": {"Html": {"Data": html_body, "Charset": "UTF-8"}},
            },
        )
        logger.info("Reschedule email sent to %s", client_email)
        return True

    except Exception as e:
        logger.error("Failed to send reschedule email to %s: %s", client_email, e)
        return False
