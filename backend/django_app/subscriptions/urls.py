"""
URL configuration for Subscription Engine.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    subscription_status, upgrade_subscription, stripe_webhook, billing_history,
    list_plans, simulate_payment, cancel_subscription, list_user_subscriptions,
    paystack_config, paystack_initialize, paystack_verify,
)
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
    # ── User-facing subscription endpoints ──────────────────────────────────
    path('subscription/status', subscription_status, name='status'),
    path('subscription/plans', list_plans, name='plans'),          # pricing page
    path('subscription/users', list_user_subscriptions, name='user-subscriptions'),  # finance dashboard
    path('subscription/upgrade', upgrade_subscription, name='upgrade'),
    path('subscription/simulate-payment', simulate_payment, name='simulate-payment'),
    path('subscription/cancel', cancel_subscription, name='cancel'),
    path('subscription/billing-history', billing_history, name='billing-history'),
    path('subscription/webhooks/stripe', stripe_webhook, name='stripe-webhook'),
    path('subscription/paystack/config', paystack_config, name='paystack-config'),
    path('subscription/paystack/initialize', paystack_initialize, name='paystack-initialize'),
    path('subscription/paystack/verify', paystack_verify, name='paystack-verify'),
    # ── Admin endpoints ──────────────────────────────────────────────────────
    path('', include(admin_router.urls)),
]

