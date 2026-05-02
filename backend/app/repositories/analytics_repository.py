from app.models.schemas.analytics import AdminAnalyticsOverview, PublicStatsOut
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
