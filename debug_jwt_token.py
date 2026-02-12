#!/usr/bin/env python
"""
Debug JWT Token Utility
Decodes a JWT token and shows its expiration details.
"""
import sys
from datetime import datetime, timezone
from jose import jwt, JWTError
import os
from pathlib import Path

# Add Django app to path to access settings
django_path = Path(__file__).parent / 'backend' / 'django_app'
sys.path.insert(0, str(django_path))

# Load environment variables
from dotenv import load_dotenv
env_path = django_path / '.env'
if env_path.exists():
    load_dotenv(env_path)

# Get JWT secret key
JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY') or os.getenv('DJANGO_SECRET_KEY', '')
JWT_ALGORITHM = os.getenv('JWT_ALGORITHM', 'HS256')

def decode_token_details(token_string):
    """Decode JWT token and show detailed information."""
    try:
        # Decode without verification first to see all claims
        unverified = jwt.get_unverified_claims(token_string)
        print("\n" + "="*70)
        print("UNVERIFIED TOKEN CLAIMS (Raw Data)")
        print("="*70)
        for key, value in unverified.items():
            if key in ['exp', 'iat']:
                # Convert Unix timestamp to human-readable
                dt = datetime.fromtimestamp(value, tz=timezone.utc)
                print(f"{key:15} : {value} ({dt})")
            else:
                print(f"{key:15} : {value}")

        # Now verify the token
        print("\n" + "="*70)
        print("TOKEN VERIFICATION")
        print("="*70)
        print(f"Secret Key     : {JWT_SECRET_KEY[:20]}... (length: {len(JWT_SECRET_KEY)})")
        print(f"Algorithm      : {JWT_ALGORITHM}")

        verified = jwt.decode(
            token_string,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM],
        )
        print("✓ Token verification: SUCCESS")
        print(f"✓ User ID: {verified.get('user_id')}")

        # Check expiration
        exp = verified.get('exp')
        iat = verified.get('iat')
        now = datetime.now(timezone.utc)
        now_timestamp = int(now.timestamp())

        print("\n" + "="*70)
        print("TIME ANALYSIS")
        print("="*70)
        print(f"Current Time (UTC) : {now} (timestamp: {now_timestamp})")

        if iat:
            issued_at = datetime.fromtimestamp(iat, tz=timezone.utc)
            age_seconds = now_timestamp - iat
            age_minutes = age_seconds / 60
            print(f"Token Issued At    : {issued_at} (timestamp: {iat})")
            print(f"Token Age          : {age_minutes:.2f} minutes ({age_seconds} seconds)")

        if exp:
            expires_at = datetime.fromtimestamp(exp, tz=timezone.utc)
            remaining_seconds = exp - now_timestamp
            remaining_minutes = remaining_seconds / 60
            print(f"Token Expires At   : {expires_at} (timestamp: {exp})")
            print(f"Time Remaining     : {remaining_minutes:.2f} minutes ({remaining_seconds} seconds)")

            if remaining_seconds < 0:
                print(f"\n⚠️  TOKEN IS EXPIRED by {abs(remaining_minutes):.2f} minutes!")
            elif remaining_seconds < 300:  # Less than 5 minutes
                print(f"\n⚠️  TOKEN EXPIRES SOON (less than 5 minutes remaining)")
            else:
                print(f"\n✓ Token is valid and has {remaining_minutes:.2f} minutes remaining")

        return True

    except JWTError as e:
        print(f"\n❌ JWT ERROR: {str(e)}")
        print(f"\nToken preview: {token_string[:50]}...")
        return False
    except Exception as e:
        print(f"\n❌ UNEXPECTED ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Main function."""
    print("\n" + "="*70)
    print("JWT TOKEN DEBUGGER")
    print("="*70)

    if len(sys.argv) > 1:
        # Token provided as command-line argument
        token = sys.argv[1]
        print("Using token from command-line argument")
    else:
        # Prompt for token
        print("\nPaste your JWT token (from localStorage.access_token):")
        print("Press Enter twice when done.\n")
        token = input().strip()

    if not token:
        print("❌ No token provided!")
        print("\nUsage:")
        print("  python debug_jwt_token.py YOUR_TOKEN_HERE")
        print("\nOr run without arguments and paste token when prompted.")
        return

    decode_token_details(token)

    print("\n" + "="*70)
    print("\nDone!")


if __name__ == '__main__':
    main()
