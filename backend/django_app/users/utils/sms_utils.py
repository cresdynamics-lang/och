"""
SMS utilities for MFA OTP delivery.
Supports TextSMS (sms.textsms.co.ke), Textbelt (testing), and Twilio.
All credentials from .env (see .env.example).
"""
import logging
import re

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

TEXTSMS_API_URL = 'https://sms.textsms.co.ke/api/services/sendsms/'


def _format_phone_textsms(phone: str) -> str:
    """
    Format phone for TextSMS (Kenya).
    Strip non-digits; if starts with 0, replace with 254.
    """
    phone = re.sub(r'[^0-9]', '', phone.strip())
    if phone.startswith('0'):
        phone = '254' + phone[1:]
    return phone


def send_sms_otp(phone_number: str, code: str) -> bool:
    """
    Send OTP code via SMS.
    phone_number: E.164 or local (e.g. +254712345678 or 0712345678)
    code: 6-digit OTP string
    Returns True if sent successfully, False otherwise.
    """
    provider = getattr(settings, 'SMS_PROVIDER', 'textsms').lower()
    message = (
        f"Ongoza CyberHub\n\n"
        f"Your verification code is: {code}. "
        f"Valid for 10 minutes. Do not share this code with anyone."
    )

    if provider == 'textsms':
        return _send_via_textsms(phone_number, message)
    if provider == 'textbelt':
        return _send_via_textbelt(phone_number, message)
    if provider == 'twilio':
        return _send_via_twilio(phone_number, message)
    logger.warning('Unknown SMS_PROVIDER=%s, skipping send', provider)
    return False


def _send_via_textsms(phone_number: str, message: str) -> bool:
    """
    Send via TextSMS (https://sms.textsms.co.ke).
    Uses apikey, partnerID, shortcode (senderId), mobile, message.
    """
    partner_id = getattr(settings, 'TEXTSMS_PARTNER_ID', None) or ''
    api_key = getattr(settings, 'TEXTSMS_API_KEY', None) or ''
    sender_id = getattr(settings, 'TEXTSMS_SENDER_ID', None) or ''

    if not all([partner_id, api_key, sender_id]):
        logger.warning(
            'TextSMS credentials not set (TEXTSMS_PARTNER_ID, TEXTSMS_API_KEY, TEXTSMS_SENDER_ID); SMS not sent.'
        )
        return False

    mobile = _format_phone_textsms(phone_number)

    data = {
        'apikey': api_key,
        'partnerID': partner_id,
        'message': message,
        'shortcode': sender_id,
        'mobile': mobile,
    }

    try:
        response = requests.post(TEXTSMS_API_URL, data=data, timeout=10)
        logger.info('TextSMS API response: %s %s', response.status_code, response.text[:500])

        if response.ok:
            try:
                response_data = response.json()
                return response_data.get('success', True)
            except Exception:
                return True
        return False
    except Exception as e:
        logger.exception('TextSMS sending failed: %s', e)
        return False


def _send_via_textbelt(phone_number: str, message: str) -> bool:
    """Send via Textbelt API (https://textbelt.com) for testing."""
    api_key = getattr(settings, 'TEXTSMS_API_KEY', None) or getattr(settings, 'TEXTBELT_API_KEY', None) or ''
    if not api_key:
        logger.warning('TEXTSMS_API_KEY / TEXTBELT_API_KEY not set; SMS not sent.')
        return False
    payload = {
        'phone': phone_number.strip().lstrip('+'),
        'message': message,
        'key': api_key,
    }
    try:
        r = requests.post('https://textbelt.com/text', json=payload, timeout=10)
        if r.status_code == 200:
            data = r.json()
            if data.get('success'):
                return True
            logger.warning('Textbelt reported success=false: %s', data)
            return False
        logger.warning('Textbelt SMS failed: %s %s', r.status_code, r.text[:200])
        return False
    except Exception as e:
        logger.exception('Textbelt SMS error: %s', e)
        return False


def _send_via_twilio(phone_number: str, message: str) -> bool:
    """Send via Twilio REST API."""
    account_sid = getattr(settings, 'TWILIO_ACCOUNT_SID', None) or ''
    auth_token = getattr(settings, 'TWILIO_AUTH_TOKEN', None) or ''
    from_number = getattr(settings, 'TWILIO_FROM_NUMBER', None) or ''
    if not all([account_sid, auth_token, from_number]):
        logger.warning('Twilio credentials not set; SMS not sent.')
        return False
    phone = phone_number.strip()
    if not phone.startswith('+'):
        phone = '+' + phone
    url = f'https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json'
    auth = (account_sid, auth_token)
    data = {'To': phone, 'From': from_number, 'Body': message}
    try:
        r = requests.post(url, auth=auth, data=data, timeout=10)
        if r.status_code in (200, 201):
            return True
        logger.warning('Twilio SMS failed: %s %s', r.status_code, r.text[:200])
        return False
    except Exception as e:
        logger.exception('Twilio SMS error: %s', e)
        return False
