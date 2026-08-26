import os
import sys
from google.cloud import firestore

# Add backend directory to path so we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.firebase import get_firestore_client

def run_migration():
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
        
        # 2. Normalize status
        if "approval_status" in data or "visibility_status" in data:
            is_approved = data.get("approval_status") == "approved"
            is_live = data.get("visibility_status") == "live"
            
            if is_approved and is_live:
                updates["status"] = "live"
            else:
                updates["status"] = "hidden"
                
            updates["approval_status"] = firestore.DELETE_FIELD
            updates["visibility_status"] = firestore.DELETE_FIELD
            updates["availability_status"] = data.get("availability_status", "available")
            
        # 3. Normalize other legacy fields
        if "deposit_amount" in data:
            updates["security_deposit"] = data["deposit_amount"]
            updates["deposit_amount"] = firestore.DELETE_FIELD
            
        if "is_featured" in data:
            updates["featured"] = data["is_featured"]
            updates["is_featured"] = firestore.DELETE_FIELD
            
        if "avg_rating" in data:
            updates["rating_avg"] = data["avg_rating"]
            updates["avg_rating"] = firestore.DELETE_FIELD

        if updates:
            print(f"Migrating property {doc.id}...")
            doc.reference.update(updates)
            migrated_count += 1

    print(f"Migration complete. Updated {migrated_count} properties.")

if __name__ == "__main__":
    run_migration()
