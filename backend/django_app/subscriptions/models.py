"""
Subscription Engine models - Tier management and Stripe integration.
"""
import uuid
from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from users.models import User


# Subscription Tier Constants
TIER_FREE = 'free'
TIER_STARTER = 'starter'
TIER_PREMIUM = 'premium'


class SubscriptionPlan(models.Model):
    """Subscription plan definition - Three-tier system: Free, Starter ($3), Premium ($7)."""
    TIER_CHOICES = [
        (TIER_FREE, 'Free Tier'),
        (TIER_STARTER, 'Starter Tier ($3/month)'),
        (TIER_PREMIUM, 'Premium Tier ($7/month)'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        help_text='e.g., "free", "starter", "premium"'
    )
    tier = models.CharField(
        max_length=20,
        choices=TIER_CHOICES,
        db_index=True,
        help_text='Subscription tier level'
    )
    price_monthly = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        help_text='Monthly price (NULL for free tier)'
    )
    features = models.JSONField(
        default=list,
        blank=True,
        help_text='Feature flags: ["curriculum_read", "profiler_full", "missions", "ai_coach", "portfolio", "talentscope", "mentorship", "marketplace"]'
    )
    # Feature-specific limits
    ai_coach_daily_limit = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        help_text='AI Coach interactions per day (NULL = unlimited)'
    )
    portfolio_item_limit = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        help_text='Portfolio items limit (NULL = unlimited)'
    )
    missions_access_type = models.CharField(
        max_length=50,
        choices=[
            ('none', 'No Missions'),
            ('ai_only', 'AI-Only Missions'),
            ('full', 'Full Missions (including Capstones and Labs)'),
        ],
        default='none',
        help_text='Type of mission access'
    )
    mentorship_access = models.BooleanField(
        default=False,
        help_text='Full mentorship access (group sessions, recordings, reviews)'
    )
    talentscope_access = models.CharField(
        max_length=50,
        choices=[
            ('none', 'No Access'),
            ('basic', 'Basic TalentScope'),
            ('preview', 'Preview Mode'),
            ('full', 'Full Analytics (readiness, CV scoring, Mentor Influence Index)'),
        ],
        default='none',
        help_text='TalentScope access level'
    )
    marketplace_contact = models.BooleanField(
        default=False,
        help_text='Enable employer contact via Marketplace'
    )
    enhanced_access_days = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        help_text='Enhanced access period in days (e.g., 180 for Starter tier)'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'subscription_plans'
        indexes = [
            models.Index(fields=['tier']),
        ]
    
    def __str__(self):
        price_str = f"${self.price_monthly}/mo" if self.price_monthly else "Free"
        return f"{self.get_tier_display()} - {price_str}"


class UserSubscription(models.Model):
    """User subscription record."""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('past_due', 'Past Due'),
        ('canceled', 'Canceled'),
        ('trial', 'Trial'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='subscription',
        db_index=True
    )
    plan = models.ForeignKey(
        SubscriptionPlan,
        on_delete=models.PROTECT,
        related_name='user_subscriptions',
        db_index=True
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='trial',
        db_index=True
    )
    current_period_start = models.DateTimeField(null=True, blank=True)
    current_period_end = models.DateTimeField(null=True, blank=True)
    enhanced_access_expires_at = models.DateTimeField(
        null=True,
        blank=True,
        db_index=True,
        help_text='180 days for starter_enhanced'
    )
    stripe_subscription_id = models.CharField(
        max_length=255,
        unique=True,
        null=True,
        blank=True,
        db_index=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_subscriptions'
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['status', 'current_period_end']),
        ]
    
    def __str__(self):
        return f"Subscription: {self.user.email} - {self.plan.name} ({self.status})"
    
    @property
    def days_enhanced_left(self):
        """Calculate days remaining for enhanced access."""
        if not self.enhanced_access_expires_at:
            return None
        delta = self.enhanced_access_expires_at - timezone.now()
        return max(0, delta.days)


class PaymentGateway(models.Model):
    """Payment gateway configuration for admin management."""
    GATEWAY_CHOICES = [
        ('stripe', 'Stripe'),
        ('paystack', 'Paystack'),
        ('flutterwave', 'Flutterwave'),
        ('mpesa', 'M-Pesa'),
        ('orange_money', 'Orange Money'),
        ('airtel_money', 'Airtel Money'),
        ('visa_mastercard', 'Visa/Mastercard'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50, choices=GATEWAY_CHOICES, unique=True, db_index=True)
    enabled = models.BooleanField(default=False, help_text='Enable this payment gateway')
    api_key = models.CharField(max_length=255, blank=True, help_text='Public/API key')
    secret_key = models.CharField(max_length=255, blank=True, help_text='Secret key (encrypted)')
    webhook_secret = models.CharField(max_length=255, blank=True, help_text='Webhook signing secret')
    webhook_url = models.URLField(blank=True, help_text='Webhook endpoint URL')
    test_mode = models.BooleanField(default=True, help_text='Use test/sandbox mode')
    metadata = models.JSONField(default=dict, blank=True, help_text='Additional gateway-specific settings')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'payment_gateways'
        verbose_name = 'Payment Gateway'
        verbose_name_plural = 'Payment Gateways'
    
    def __str__(self):
        return f"{self.get_name_display()} ({'Enabled' if self.enabled else 'Disabled'})"


class PaymentTransaction(models.Model):
    """Payment transaction record."""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
        ('canceled', 'Canceled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payment_transactions', db_index=True)
    gateway = models.ForeignKey(PaymentGateway, on_delete=models.PROTECT, related_name='transactions', null=True, blank=True)
    subscription = models.ForeignKey(UserSubscription, on_delete=models.SET_NULL, related_name='payments', null=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    currency = models.CharField(max_length=3, default='USD')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', db_index=True)
    gateway_transaction_id = models.CharField(max_length=255, blank=True, db_index=True, help_text='External gateway transaction ID')
    gateway_response = models.JSONField(default=dict, blank=True, help_text='Raw gateway response')
    failure_reason = models.TextField(blank=True, help_text='Reason for failure if status is failed')
    processed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'payment_transactions'
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['gateway_transaction_id']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"Payment: {self.user.email} - {self.amount} {self.currency} ({self.status})"


class SubscriptionRule(models.Model):
    """Admin-configurable subscription rules and settings."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    rule_name = models.CharField(max_length=100, unique=True, db_index=True, help_text='e.g., "upgrade_instant", "downgrade_end_cycle"')
    rule_type = models.CharField(
        max_length=50,
        choices=[
            ('upgrade', 'Upgrade Rule'),
            ('downgrade', 'Downgrade Rule'),
            ('grace_period', 'Grace Period'),
            ('enhanced_access', 'Enhanced Access Period'),
        ],
        db_index=True
    )
    enabled = models.BooleanField(default=True)
    value = models.JSONField(default=dict, help_text='Rule configuration (e.g., {"days": 7, "action": "downgrade"})')
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'subscription_rules'
        verbose_name = 'Subscription Rule'
        verbose_name_plural = 'Subscription Rules'
    
    def __str__(self):
        return f"{self.rule_name} ({self.get_rule_type_display()})"


class PaymentSettings(models.Model):
    """Global payment and subscription settings for admin configuration."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    setting_key = models.CharField(max_length=100, unique=True, db_index=True)
    setting_value = models.JSONField(default=dict)
    description = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='payment_settings_updates')
    
    class Meta:
        db_table = 'payment_settings'
        verbose_name = 'Payment Setting'
        verbose_name_plural = 'Payment Settings'
    
    def __str__(self):
        return f"{self.setting_key}"
