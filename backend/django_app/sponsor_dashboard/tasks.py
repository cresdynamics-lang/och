"""
Background tasks for sponsor dashboard cache refresh.
"""
from celery import shared_task
from django.utils import timezone
from organizations.models import Organization
from .services import SponsorDashboardService


@shared_task
def refresh_sponsor_dashboard_cache(org_id: int):
    """
    Refresh sponsor dashboard cache for an organization.
    Runs every 5 minutes.
    """
    try:
        SponsorDashboardService.refresh_sponsor_cache(org_id)
        return f"Cache refreshed for org {org_id}"
    except Exception as e:
        return f"Error refreshing cache for org {org_id}: {str(e)}"


@shared_task
def refresh_all_sponsor_caches():
    """
    Refresh all sponsor dashboard caches.
    Runs every 5 minutes.
    """
    sponsors = Organization.objects.filter(org_type='sponsor', status='active')
    results = []
    for sponsor in sponsors:
        try:
            SponsorDashboardService.refresh_sponsor_cache(sponsor.id)
            results.append(f"Refreshed {sponsor.name}")
        except Exception as e:
            results.append(f"Error for {sponsor.name}: {str(e)}")
    return results


@shared_task
def refresh_sponsor_cohort_details(org_id: int, cohort_id: str):
    """
    Refresh sponsor cohort dashboard details.
    """
    try:
        SponsorDashboardService.refresh_cohort_details(org_id, cohort_id)
        return f"Cohort details refreshed for org {org_id}, cohort {cohort_id}"
    except Exception as e:
        return f"Error refreshing cohort details: {str(e)}"


@shared_task
def sync_student_aggregates(org_id: int, cohort_id: str = None):
    """
    Sync student aggregates for a sponsor organization.
    Checks consent and populates readiness/completion data.
    """
    from .services import SponsorDashboardService
    try:
        SponsorDashboardService.sync_student_aggregates(org_id, cohort_id)
        return f"Student aggregates synced for org {org_id}" + (f", cohort {cohort_id}" if cohort_id else "")
    except Exception as e:
        return f"Error syncing student aggregates: {str(e)}"

