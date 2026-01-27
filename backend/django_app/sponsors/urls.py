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

    # Finance endpoints
    path('<slug:slug>/finance/', views.SponsorFinanceOverviewView.as_view(), name='sponsor-finance-overview'),
    path('<slug:slug>/cohorts/<uuid:cohort_id>/billing/', views.SponsorCohortBillingView.as_view(), name='sponsor-cohort-billing'),
    path('<slug:slug>/invoices/', views.GenerateInvoiceView.as_view(), name='generate-invoice'),
    path('<slug:slug>/payments/', views.MarkPaymentView.as_view(), name='mark-payment'),
    path('<slug:slug>/payments/summary/', views.PaymentSummaryView.as_view(), name='payment-summary'),
    path('<slug:slug>/payments/process/', views.ProcessPaymentView.as_view(), name='process-payment'),
    path('<slug:slug>/revenue-share/<uuid:revenue_share_id>/pay/', views.ProcessRevenueSharePaymentView.as_view(), name='process-revenue-share-payment'),
    path('<slug:slug>/payment-terms/', views.PaymentTermsView.as_view(), name='payment-terms'),
    path('<slug:slug>/finance/stream/', views.FinanceRealtimeView.as_view(), name='finance-realtime'),

    # Finance endpoints
    path('<slug:slug>/finance/', views.SponsorFinanceOverviewView.as_view(), name='sponsor-finance-overview'),
    path('<slug:slug>/cohorts/<uuid:cohort_id>/billing/', views.SponsorCohortBillingView.as_view(), name='sponsor-cohort-billing'),
    path('<slug:slug>/invoices/', views.GenerateInvoiceView.as_view(), name='generate-invoice'),
    path('<slug:slug>/payments/', views.MarkPaymentView.as_view(), name='mark-payment'),
    path('<slug:slug>/payments/summary/', views.PaymentSummaryView.as_view(), name='payment-summary'),
    path('<slug:slug>/payments/process/', views.ProcessPaymentView.as_view(), name='process-payment'),
    path('<slug:slug>/revenue-share/<uuid:revenue_share_id>/pay/', views.ProcessRevenueSharePaymentView.as_view(), name='process-revenue-share-payment'),
    path('<slug:slug>/payment-terms/', views.PaymentTermsView.as_view(), name='payment-terms'),
]

