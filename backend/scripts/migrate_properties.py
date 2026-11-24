import os
import sys
from google.cloud import firestore

# Add backend directory to path so we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.firebase import initialize_firebase
from app.repositories.firestore_client import get_firestore_client


def run_migration() -> None:
    """Normalize legacy property documents to the current canonical schema."""
    initialize_firebase()
    client = get_firestore_client()
    if not client:
        print("Could not connect to Firestore. Ensure credentials are set.")
        return

    properties_ref = client.collection("properties")
    docs = properties_ref.stream()

    migrated_count = 0
    for doc in docs:
        data = doc.to_dict()
        updates = {}

        # 1. Normalize college id
        if "nearest_college_id" in data and "primary_college_id" not in data:
            updates["primary_college_id"] = data["nearest_college_id"]
            updates["nearest_college_id"] = firestore.DELETE_FIELD

        # 2. Normalize legacy single status field -> approval_status + visibility_status
        if "status" in data and ("approval_status" not in data or "visibility_status" not in data):
            legacy_status = data.get("status")
            if legacy_status == "live":
                updates["approval_status"] = data.get("approval_status", "approved")
                updates["visibility_status"] = data.get("visibility_status", "live")
            else:
                updates["approval_status"] = data.get("approval_status", "pending")
                updates["visibility_status"] = data.get("visibility_status", "hidden")
            updates["status"] = firestore.DELETE_FIELD
            updates["availability_status"] = data.get("availability_status", "available")

        # 3. Normalize other legacy fields
        if "deposit_amount" in data and "security_deposit" not in data:
            updates["security_deposit"] = data["deposit_amount"]
            updates["deposit_amount"] = firestore.DELETE_FIELD

        if "is_featured" in data and "featured" not in data:
            updates["featured"] = data["is_featured"]
            updates["is_featured"] = firestore.DELETE_FIELD

        if "avg_rating" in data and "rating_avg" not in data:
            updates["rating_avg"] = data["avg_rating"]
            updates["avg_rating"] = firestore.DELETE_FIELD

        if "images" in data and "image_urls" not in data:
            updates["image_urls"] = data["images"]
            updates["images"] = firestore.DELETE_FIELD

        if "cover_image" in data and "cover_image_url" not in data:
            updates["cover_image_url"] = data["cover_image"]
            updates["cover_image"] = firestore.DELETE_FIELD

        if updates:
            print(f"Migrating property {doc.id}...")
            doc.reference.update(updates)
            migrated_count += 1

    print(f"Migration complete. Updated {migrated_count} properties.")


if __name__ == "__main__":
    run_migration()
