import re
from typing import Optional


def normalize_phone_number(phone: str, default_country_code: str = "+91") -> str:
    """
    Cleans and formats phone numbers into standardized international E.164 format,
    or lowercases and strips email addresses.
    Example: '9876543210' -> '+919876543210'
             'kamal@gmail.com' -> 'kamal@gmail.com'
    """
    clean = phone.strip()
    if "@" in clean:
        return clean.lower()

    clean = re.sub(r"[\s\-\(\)]", "", clean)
    if clean.startswith("+"):
        return clean
    if clean.startswith("0"):
        clean = clean[1:]
    if len(clean) == 10:
        return f"{default_country_code}{clean}"
    return f"+{clean}"
