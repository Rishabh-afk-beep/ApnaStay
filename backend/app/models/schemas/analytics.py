from pydantic import BaseModel


class AdminAnalyticsOverview(BaseModel):
    total_properties: int
    live_properties: int
    pending_properties: int
    total_inquiries: int
    total_shortlists: int
    total_alerts: int
    total_reviews: int


class PublicStatsOut(BaseModel):
    verified_listings: int
    colleges_covered: int
    students_active: int
    cities_active: int
