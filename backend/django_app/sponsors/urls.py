"""
URL patterns for the Sponsors app.
"""
from django.urls import path
from . import views

app_name = 'sponsors'

urlpatterns = [
    # Sponsor listing and details
    path('', views.sponsor_list, name='sponsor-list'),
    path('<slug:slug>/', views.sponsor_detail, name='sponsor-detail'),

    # Main dashboard endpoint
    path('<slug:slug>/dashboard/', views.SponsorDashboardView.as_view(), name='sponsor-dashboard'),

    # Real-time streaming
    path('<slug:slug>/stream/', views.sponsor_stream, name='sponsor-stream'),

    # Export
    path('<slug:slug>/export/', views.sponsor_export, name='sponsor-export'),

    # Cohorts management
    path('<slug:slug>/cohorts/', views.SponsorCohortsListView.as_view(), name='sponsor-cohorts-list'),
    path('<slug:slug>/cohorts/<uuid:cohort_id>/', views.SponsorCohortsDetailView.as_view(), name='sponsor-cohort-detail'),
    path('<slug:slug>/cohorts/<uuid:cohort_id>/students/', views.AddStudentsToCohortView.as_view(), name='add-students-to-cohort'),
    path('<slug:slug>/cohorts/<uuid:cohort_id>/interventions/', views.CohortAIInterventionView.as_view(), name='cohort-ai-interventions'),

    # Legacy interventions endpoint
    path('<slug:slug>/cohorts/<uuid:cohort_id>/legacy-interventions/', views.SponsorInterventionView.as_view(), name='sponsor-interventions'),
]

