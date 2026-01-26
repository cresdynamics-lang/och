"""
Admin interface for Subscription Engine.
"""
from django.contrib import admin
from .models import (
    SubscriptionPlan, UserSubscription, PaymentGateway,
    PaymentTransaction, SubscriptionRule, PaymentSettings
)


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'tier', 'price_monthly', 'missions_access_type',
        'mentorship_access', 'talentscope_access', 'marketplace_contact',
        'enhanced_access_days', 'created_at'
    ]
    list_filter = ['tier', 'mentorship_access', 'marketplace_contact', 'created_at']
    search_fields = ['name', 'tier']
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'tier', 'price_monthly')
        }),
        ('Feature Access', {
            'fields': (
                'missions_access_type', 'mentorship_access',
                'talentscope_access', 'marketplace_contact'
            )
        }),
        ('Limits', {
            'fields': (
                'ai_coach_daily_limit', 'portfolio_item_limit',
                'enhanced_access_days'
            )
        }),
        ('Features', {
            'fields': ('features',)
        }),
    )


@admin.register(UserSubscription)
class UserSubscriptionAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'plan', 'status', 'current_period_start',
        'current_period_end', 'enhanced_access_expires_at', 'created_at'
    ]
    list_filter = ['status', 'plan', 'created_at']
    search_fields = ['user__email', 'user__username', 'stripe_subscription_id']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('User & Plan', {
            'fields': ('user', 'plan')
        }),
        ('Status', {
            'fields': ('status', 'current_period_start', 'current_period_end')
        }),
        ('Enhanced Access', {
            'fields': ('enhanced_access_expires_at',)
        }),
        ('Stripe Integration', {
            'fields': ('stripe_subscription_id',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(PaymentGateway)
class PaymentGatewayAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'enabled', 'test_mode', 'updated_at'
    ]
    list_filter = ['enabled', 'test_mode', 'name']
    search_fields = ['name']
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'enabled', 'test_mode')
        }),
        ('API Credentials', {
            'fields': ('api_key', 'secret_key')
        }),
        ('Webhook Configuration', {
            'fields': ('webhook_secret', 'webhook_url')
        }),
        ('Additional Settings', {
            'fields': ('metadata',)
        }),
    )


@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'gateway', 'amount', 'currency', 'status',
        'subscription', 'created_at'
    ]
    list_filter = ['status', 'gateway', 'currency', 'created_at']
    search_fields = [
        'user__email', 'user__username', 'gateway_transaction_id'
    ]
    readonly_fields = ['created_at', 'updated_at', 'processed_at']
    fieldsets = (
        ('Transaction Details', {
            'fields': ('user', 'gateway', 'subscription', 'amount', 'currency', 'status')
        }),
        ('Gateway Information', {
            'fields': ('gateway_transaction_id', 'gateway_response')
        }),
        ('Status', {
            'fields': ('failure_reason', 'processed_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(SubscriptionRule)
class SubscriptionRuleAdmin(admin.ModelAdmin):
    list_display = [
        'rule_name', 'rule_type', 'enabled', 'updated_at'
    ]
    list_filter = ['rule_type', 'enabled', 'created_at']
    search_fields = ['rule_name', 'description']
    fieldsets = (
        ('Rule Information', {
            'fields': ('rule_name', 'rule_type', 'enabled', 'description')
        }),
        ('Configuration', {
            'fields': ('value',)
        }),
    )


@admin.register(PaymentSettings)
class PaymentSettingsAdmin(admin.ModelAdmin):
    list_display = [
        'setting_key', 'updated_at', 'updated_by'
    ]
    search_fields = ['setting_key', 'description']
    readonly_fields = ['updated_at']
    fieldsets = (
        ('Setting', {
            'fields': ('setting_key', 'setting_value', 'description')
        }),
        ('Metadata', {
            'fields': ('updated_by', 'updated_at')
        }),
    )
