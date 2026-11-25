import logging
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone

from google.cloud import firestore_v1

from app.models.schemas.analytics import AdminAnalyticsOverview, DailyStat, OwnerAnalyticsOut, PublicStatsOut
from app.repositories.engagement_repository import fallback_counts
from app.repositories.firestore_client import get_firestore_client
from app.repositories.property_repository import fallback_property_counts
from app.repositories.review_repository import fallback_review_count

logger = logging.getLogger(__name__)


def _count_query(query) -> int:
    res = query.count().get()
    return int(res[0][0].value) if res and res[0] else 0


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

        props_ref = client.collection("properties")
        total_properties = _count_query(props_ref)
        live_properties = _count_query(
            props_ref.where(filter=firestore_v1.FieldFilter("visibility_status", "==", "live"))
        )
        pending_properties = _count_query(
            props_ref.where(filter=firestore_v1.FieldFilter("approval_status", "==", "pending"))
        )

        return AdminAnalyticsOverview(
            total_properties=total_properties,
            live_properties=live_properties,
            pending_properties=pending_properties,
            total_inquiries=_count_query(client.collection("inquiries")),
            total_shortlists=_count_query(client.collection("shortlists")),
            total_alerts=_count_query(client.collection("alerts")),
            total_reviews=_count_query(client.collection("reviews")),
        )

    def get_public_stats(self) -> PublicStatsOut:
        client = get_firestore_client()
        if client is None:
            from app.repositories.college_repository import _FALLBACK_COLLEGES

            counts = fallback_property_counts()
            cities = {c.get("city", "").strip().lower() for c in _FALLBACK_COLLEGES.values() if c.get("city")}
            return PublicStatsOut(
                verified_listings=counts["live_properties"],
                colleges_covered=len(_FALLBACK_COLLEGES),
                students_active=1,
                cities_active=len(cities) if cities else 1,
            )

        try:
            def _count_live_listings() -> int:
                return _count_query(
                    client.collection("properties").where(
                        filter=firestore_v1.FieldFilter("visibility_status", "==", "live")
                    )
                )

            def _count_students() -> int:
                return _count_query(
                    client.collection("users").where(
                        filter=firestore_v1.FieldFilter("role", "==", "student")
                    )
                )

            def _fetch_college_cities() -> tuple[int, int]:
                colleges = list(
                    client.collection("colleges")
                    .where(filter=firestore_v1.FieldFilter("status", "==", "active"))
                    .select(["city"])
                    .stream()
                )
                cities: set[str] = set()
                for doc in colleges:
                    city = (doc.to_dict().get("city") or "").strip()
                    if city:
                        cities.add(city.lower())
                return len(colleges), (len(cities) if cities else 1)

            with ThreadPoolExecutor(max_workers=3) as pool:
                fut_listings = pool.submit(_count_live_listings)
                fut_students = pool.submit(_count_students)
                fut_colleges = pool.submit(_fetch_college_cities)

                verified_listings = fut_listings.result()
                students_active = fut_students.result()
                colleges_covered, cities_active = fut_colleges.result()

            return PublicStatsOut(
                verified_listings=verified_listings,
                colleges_covered=colleges_covered,
                students_active=students_active,
                cities_active=cities_active,
            )
        except Exception as exc:
            logger.warning("[Analytics] Failed to load public stats: %s", exc)
            return PublicStatsOut(
                verified_listings=0,
                colleges_covered=0,
                students_active=0,
                cities_active=0,
            )

    def get_owner_analytics(self, owner_uid: str) -> OwnerAnalyticsOut:
        client = get_firestore_client()
        if client is None:
            return OwnerAnalyticsOut(total_views=0, total_shortlists=0, total_inquiries=0, daily_stats=[])

        properties = list(
            client.collection("properties")
            .where(filter=firestore_v1.FieldFilter("owner_uid", "==", owner_uid))
            .select([])
            .stream()
        )
        property_ids = [doc.id for doc in properties]

        if not property_ids:
            return OwnerAnalyticsOut(total_views=0, total_shortlists=0, total_inquiries=0, daily_stats=[])

        def fetch_in_batches(collection_name: str, field: str, ids: list[str]):
            docs = []
            for i in range(0, len(ids), 10):
                batch = ids[i : i + 10]
                q = client.collection(collection_name).where(filter=firestore_v1.FieldFilter(field, "in", batch)).stream()
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
