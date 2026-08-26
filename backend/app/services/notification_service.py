import logging
import os
from typing import Optional

logger = logging.getLogger(__name__)

def send_inquiry_notification(owner_phone: Optional[str], property_title: str, inquiry_name: str, inquiry_phone: str, inquiry_message: str):
    """
    Sends an SMS/WhatsApp notification to the property owner using Twilio.
    Degrades to console logging if Twilio credentials are not set in the environment.
    """
    if not owner_phone:
        logger.warning(f"Cannot send notification for '{property_title}'. Owner phone is missing.")
        return

    # Check for Twilio credentials (optional in dev)
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    from_number = os.getenv("TWILIO_FROM_NUMBER")

    message_body = (
        f"🏠 NearMyColleges Inquiry!\n"
        f"You have a new inquiry for '{property_title}'.\n"
        f"Name: {inquiry_name}\n"
        f"Phone: {inquiry_phone}\n"
        f"Message: {inquiry_message}"
    )

    if account_sid and auth_token and from_number:
        try:
            # We import twilio here so it doesn't break if not installed when credentials aren't set
            from twilio.rest import Client
            client = Client(account_sid, auth_token)
            
            message = client.messages.create(
                body=message_body,
                from_=from_number,
                to=owner_phone
            )
            logger.info(f"[Twilio] Sent notification to {owner_phone}. SID: {message.sid}")
        except Exception as e:
            logger.error(f"Failed to send Twilio notification: {e}")
            logger.info(f"[Mock Notification] To: {owner_phone}\n{message_body}")
    else:
        # Fallback to console logging
        logger.info(f"[Mock Notification] Twilio credentials not found. Would have sent to: {owner_phone}\n{message_body}")
