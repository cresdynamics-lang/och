"""
SMS utilities for MFA OTP delivery.
Supports Textbelt (testing) and Twilio (production).
All credentials from .env (see .env.example).
"""
import logging

import requests
from django.conf import settings

logger = logging.getLogger(__name__)


def send_sms_otp(phone_e164: str, code: str) -> bool:
    """
    Send OTP code via SMS.
    phone_e164: E.164 format (e.g. +1234567890)
    code: 6-digit OTP string
    Returns True if sent successfully, False otherwise.
    """
    provider = getattr(settings, 'SMS_PROVIDER', 'textbelt').lower()
    message = f'Your Ongoza CyberHub verification code is: {code}. Valid for 10 minutes.'

    if provider == 'textbelt':
        return _send_via_textbelt(phone_e164, message)
    if provider == 'twilio':
        return _send_via_twilio(phone_e164, message)
    logger.warning('Unknown SMS_PROVIDER=%s, skipping send', provider)
    return False


def _send_via_textbelt(phone_e164: str, message: str) -> bool:
    """Send via Textbelt API (https://textbelt.com) for testing."""
    api_key = getattr(settings, 'TEXTSMS_API_KEY', None) or ''
    if not api_key:
        logger.warning('TEXTSMS_API_KEY not set; SMS not sent (testing).')
        return False
    # Textbelt expects phone without + for some endpoints; use as-is
    payload = {
        'phone': phone_e164.strip(),
        'message': message,
        'key': api_key,
    }
    try:
        r = requests.post(
            'https://textbelt.com/text',
            json=payload,
            timeout=10,
        )
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


def _send_via_twilio(phone_e164: str, message: str) -> bool:
    """Send via Twilio REST API for production."""
    account_sid = getattr(settings, 'TWILIO_ACCOUNT_SID', None) or ''
    auth_token = getattr(settings, 'TWILIO_AUTH_TOKEN', None) or ''
    from_number = getattr(settings, 'TWILIO_FROM_NUMBER', None) or ''
    if not all([account_sid, auth_token, from_number]):
        logger.warning('Twilio credentials not set; SMS not sent.')
        return False
    url = f'https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json'
    auth = (account_sid, auth_token)
    data = {
        'To': phone_e164.strip(),
        'From': from_number,
        'Body': message,
    }
    try:
        r = requests.post(url, auth=auth, data=data, timeout=10)
        if r.status_code in (200, 201):
            return True
        logger.warning('Twilio SMS failed: %s %s', r.status_code, r.text[:200])
        return False
    except Exception as e:
        logger.exception('Twilio SMS error: %s', e)
        return False
