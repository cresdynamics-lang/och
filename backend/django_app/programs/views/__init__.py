"""
Programs views package.
"""
from .standard_views import (
    ProgramViewSet, TrackViewSet, CohortViewSet,
    ProgramRuleViewSet, CertificateViewSet,
    MilestoneViewSet, ModuleViewSet,
    MentorshipCycleViewSet,
    director_dashboard
)
from .rules_views import DirectorProgramRuleViewSet
from .program_management_views import ProgramManagementViewSet
from .director_management_views import (
    DirectorProgramManagementViewSet,
    DirectorTrackManagementViewSet,
    DirectorCohortManagementViewSet,
    DirectorMentorManagementViewSet
)
from .director_calendar_views import DirectorCalendarViewSet
from .director_lifecycle_views import DirectorCohortLifecycleViewSet
from .director_rules_views import DirectorProgramRulesViewSet
from .director_reports_views import DirectorReportsViewSet
from .director_advanced_analytics_views import DirectorAdvancedAnalyticsViewSet
from .director_certificate_views import DirectorCertificateViewSet
# from .mentor_assignment_views import MentorAssignmentViewSet  # Temporarily disabled due to syntax errors

__all__ = [
    'ProgramViewSet', 'TrackViewSet', 'CohortViewSet',
    'ProgramRuleViewSet', 'CertificateViewSet',
    'MilestoneViewSet', 'ModuleViewSet',
    'MentorshipCycleViewSet',
    'DirectorProgramRuleViewSet',
    'ProgramManagementViewSet',
    'DirectorProgramManagementViewSet',
    'DirectorTrackManagementViewSet',
    'DirectorCohortManagementViewSet',
    'DirectorMentorManagementViewSet',
    'DirectorCalendarViewSet',
    'DirectorCohortLifecycleViewSet',
    'DirectorProgramRulesViewSet',
    'DirectorReportsViewSet',
    'DirectorAdvancedAnalyticsViewSet',
    'DirectorCertificateViewSet',
    # 'MentorAssignmentViewSet',  # Temporarily disabled due to syntax errors
    'director_dashboard',
]

