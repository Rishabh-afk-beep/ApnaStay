from collections import defaultdict
from datetime import datetime, timedelta, timezone

from app.models.schemas.analytics import AdminAnalyticsOverview, PublicStatsOut, OwnerAnalyticsOut, DailyStat
from app.repositories.engagement_repository import fallback_counts
from app.repositories.firestore_client import get_firestore_client
from app.repositories.property_repository import fallback_property_counts
from app.repositories.review_repository import fallback_review_count

class AnalyticsRepository:
    def get_overview(self) -> AdminAnalyticsOverview:
        client = get_firestore_client()
        if client is None:
            counts = fallback_counts()
            property_counts = fallback_property_counts()
            return AdminAnalyticsOverview(
                total_properties=property_counts["total_properties"],
                live_properties=property_counts["live_properties"],
                pending_properties=property_counts["pending_properties"],
                total_inquiries=counts["total_inquiries"],
                total_shortlists=counts["total_shortlists"],
                total_alerts=counts["total_alerts"],
                total_reviews=fallback_review_count(),
            )

        properties = [doc.to_dict() for doc in client.collection("properties").stream()]
        inquiries = list(client.collection("inquiries").stream())
        shortlists = list(client.collection("shortlists").stream())
        alerts = list(client.collection("alerts").stream())
        reviews = list(client.collection("reviews").stream())

        total_properties = len(properties)
        live_properties = len([p for p in properties if p.get("visibility_status") == "live"])
        pending_properties = len([p for p in properties if p.get("approval_status") == "pending"])

        return AdminAnalyticsOverview(
            total_properties=total_properties,
            live_properties=live_properties,
            pending_properties=pending_properties,
            total_inquiries=len(inquiries),
            total_shortlists=len(shortlists),
            total_alerts=len(alerts),
            total_reviews=len(reviews),
        )

    def get_public_stats(self) -> PublicStatsOut:
        client = get_firestore_client()
        if client is None:
            # Fallback only when Firebase is completely unavailable (local dev without credentials)
            return PublicStatsOut(
                verified_listings=0,
                colleges_covered=0,
                students_active=0,
                cities_active=0,
            )

        try:
            properties = list(client.collection("properties").where("visibility_status", "==", "live").stream())
            colleges = list(client.collection("colleges").where("status", "==", "active").stream())
            users = list(client.collection("users").where("role", "==", "student").stream())

            cities: set = set()
            for doc in colleges:
                data = doc.to_dict()
                city = data.get("city", "").strip()
                if city:
                    cities.add(city.lower())

            return PublicStatsOut(
                verified_listings=len(properties),
                colleges_covered=len(colleges),
                students_active=len(users),
                cities_active=len(cities) if cities else 1,
            )
        except Exception:
            return PublicStatsOut(
                verified_listings=0,
                colleges_covered=0,
                students_active=0,
                cities_active=0,
            )

    def get_owner_analytics(self, owner_uid: str) -> OwnerAnalyticsOut:
        client = get_firestore_client()
        if client is None:
            return OwnerAnalyticsOut(
                total_views=0, total_shortlists=0, total_inquiries=0, daily_stats=[]
            )

        # 1. Fetch properties owned by the user
        properties = list(client.collection("properties").where("owner_uid", "==", owner_uid).stream())
        property_ids = [doc.id for doc in properties]

        if not property_ids:
            return OwnerAnalyticsOut(
                total_views=0, total_shortlists=0, total_inquiries=0, daily_stats=[]
            )

        # In Firestore, 'in' queries are limited to 10 items.
        # We'll batch them if property_ids > 10.
        def fetch_in_batches(collection_name: str, field: str, ids: list[str]):
            docs = []
            for i in range(0, len(ids), 10):
                batch = ids[i : i + 10]
                q = client.collection(collection_name).where(field, "in", batch).stream()
                docs.extend([d.to_dict() for d in q])
            return docs

        views = fetch_in_batches("recent_views", "property_id", property_ids)
        shortlists = fetch_in_batches("shortlists", "property_id", property_ids)
        inquiries = fetch_in_batches("inquiries", "property_id", property_ids)

        now = datetime.now(timezone.utc)
        dates = [(now - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(29, -1, -1)]
        
        daily_map = {date: {"views": 0, "shortlists": 0, "inquiries": 0} for date in dates}

        def process_docs(docs, date_field, map_key):
            for doc in docs:
                date_str = doc.get(date_field)
                if date_str:
                    try:
                        d = date_str.split("T")[0]
                        if d in daily_map:
                            daily_map[d][map_key] += 1
                    except Exception:
                        pass

        process_docs(views, "viewed_at", "views")
        process_docs(shortlists, "created_at", "shortlists")
        process_docs(inquiries, "created_at", "inquiries")

        daily_stats = [
            DailyStat(
                date=d,
                views=daily_map[d]["views"],
                shortlists=daily_map[d]["shortlists"],
                inquiries=daily_map[d]["inquiries"],
            )
            for d in dates
        ]

        return OwnerAnalyticsOut(
            total_views=len(views),
            total_shortlists=len(shortlists),
            total_inquiries=len(inquiries),
            daily_stats=daily_stats,
        )
