"""
URL configuration for Subscription Engine.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import subscription_status, upgrade_subscription, stripe_webhook, billing_history
from .admin_views import (
    SubscriptionPlanViewSet, UserSubscriptionAdminViewSet,
    PaymentGatewayViewSet, PaymentTransactionViewSet,
    SubscriptionRuleViewSet, PaymentSettingsViewSet
)

app_name = 'subscriptions'

# Admin router
admin_router = DefaultRouter()
admin_router.register(r'admin/plans', SubscriptionPlanViewSet, basename='admin-plan')
admin_router.register(r'admin/subscriptions', UserSubscriptionAdminViewSet, basename='admin-subscription')
admin_router.register(r'admin/gateways', PaymentGatewayViewSet, basename='admin-gateway')
admin_router.register(r'admin/transactions', PaymentTransactionViewSet, basename='admin-transaction')
admin_router.register(r'admin/rules', SubscriptionRuleViewSet, basename='admin-rule')
admin_router.register(r'admin/settings', PaymentSettingsViewSet, basename='admin-setting')

urlpatterns = [
    # Public/user endpoints
    path('subscription/status', subscription_status, name='status'),
    path('subscription/upgrade', upgrade_subscription, name='upgrade'),
    path('subscription/billing-history', billing_history, name='billing-history'),
    path('subscription/webhooks/stripe', stripe_webhook, name='stripe-webhook'),
    # Admin endpoints
    path('', include(admin_router.urls)),
]

