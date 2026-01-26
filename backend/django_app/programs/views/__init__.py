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
# Note: Director ViewSets moved to separate files or handled via director_dashboard_views
# These imports are commented out until ViewSets are recreated if needed
# from .director_views import (
#     DirectorProgramViewSet, DirectorTrackViewSet, DirectorCohortViewSet,
#     DirectorMentorViewSet, DirectorDashboardViewSet
# )
from .rules_views import DirectorProgramRuleViewSet
from .program_management_views import ProgramManagementViewSet
# from .mentor_assignment_views import MentorAssignmentViewSet  # Temporarily disabled due to syntax errors

__all__ = [
    'ProgramViewSet', 'TrackViewSet', 'CohortViewSet',
    'ProgramRuleViewSet', 'CertificateViewSet',
    'MilestoneViewSet', 'ModuleViewSet',
    'MentorshipCycleViewSet',
    'DirectorProgramRuleViewSet',
    'ProgramManagementViewSet',
    # 'MentorAssignmentViewSet',  # Temporarily disabled due to syntax errors
    'director_dashboard',
]

