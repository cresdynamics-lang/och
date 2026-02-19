"""
API views for Subscription Engine.
"""
import os
from django.utils import timezone
from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import SubscriptionPlan, UserSubscription, PaymentTransaction
from .serializers import (
    SubscriptionPlanSerializer,
    UserSubscriptionSerializer,
    SubscriptionStatusSerializer,
    UpgradeSubscriptionSerializer,
)
from .utils import get_user_tier
from student_dashboard.services import DashboardAggregationService
import logging

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def subscription_status(request):
    """
    GET /api/v1/subscription/status
    Get user's subscription status.
    """
    user = request.user
    
    try:
        subscription = user.subscription
        plan = subscription.plan
    except UserSubscription.DoesNotExist:
        # Default to free tier
        return Response({
            'tier': 'free',
            'days_enhanced_left': None,
            'can_upgrade': True,
            'features': [],
            'next_payment': None,
            'status': 'active',
            'ai_coach_daily_limit': 0,
        })
    
    # Map DB tier to frontend tier name
    # DB: free | starter | premium   →   Frontend: free | starter | professional
    TIER_MAP = {'free': 'free', 'starter': 'starter', 'premium': 'professional'}
    tier = TIER_MAP.get(plan.tier, plan.tier)

    # Can upgrade if not already on premium/professional
    can_upgrade = plan.tier not in ('premium',)

    return Response({
        'tier': tier,
        'plan_name': plan.name,
        'plan_tier': plan.tier,
        'days_enhanced_left': subscription.days_enhanced_left,
        'enhanced_access_until': subscription.enhanced_access_expires_at,
        'can_upgrade': can_upgrade,
        'features': plan.features or [],
        'next_payment': subscription.current_period_end,
        'next_billing_date': subscription.current_period_end,
        'status': subscription.status,
        'current_period_start': subscription.current_period_start,
        'current_period_end': subscription.current_period_end,
        'ai_coach_daily_limit': plan.ai_coach_daily_limit,
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upgrade_subscription(request):
    """
    POST /api/v1/subscription/upgrade
    Upgrade subscription (creates Stripe session or mocks upgrade).
    """
    serializer = UpgradeSubscriptionSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    plan_identifier = serializer.validated_data['plan']
    mock_upgrade = request.data.get('mock', False)
    
    # Try to find plan by name first, then by tier
    # Frontend sends: 'starter_3', 'professional_7' as plan names
    try:
        plan = SubscriptionPlan.objects.get(name=plan_identifier)
    except SubscriptionPlan.DoesNotExist:
        try:
            # Try by tier (e.g., 'starter', 'premium', 'free')
            # Map frontend tier names to backend tier values
            tier_mapping = {
                'starter_3': 'starter',
                'professional_7': 'premium',
                'free': 'free',
            }
            tier = tier_mapping.get(plan_identifier, plan_identifier)
            plan = SubscriptionPlan.objects.get(tier=tier)
        except SubscriptionPlan.DoesNotExist:
            return Response(
                {'error': f'Invalid plan: {plan_identifier}. Available plans: {list(SubscriptionPlan.objects.values_list("name", flat=True))}'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    user = request.user
    stripe_key = os.environ.get('STRIPE_SECRET_KEY')
    
    # If mock upgrade or Stripe not configured, upgrade directly
    if mock_upgrade or not stripe_key:
        try:
            with transaction.atomic():
                # Get or create subscription
                subscription, created = UserSubscription.objects.get_or_create(
                    user=user,
                    defaults={
                        'plan': plan,
                        'status': 'active',
                        'current_period_start': timezone.now(),
                        'current_period_end': timezone.now() + timezone.timedelta(days=30),
                    }
                )
                
                # Update subscription if it already exists
                if not created:
                    subscription.plan = plan
                    subscription.status = 'active'
                    subscription.current_period_start = timezone.now()
                    subscription.current_period_end = timezone.now() + timezone.timedelta(days=30)
                
                # Set enhanced access for starter_3 (180 days) for both new and existing subscriptions
                if plan.tier == 'starter' or 'starter' in plan.tier.lower():
                    subscription.enhanced_access_expires_at = timezone.now() + timezone.timedelta(days=180)
                else:
                    subscription.enhanced_access_expires_at = None
                
                subscription.save()
                
                # Create a payment transaction record for the upgrade (mock payment for development)
                if mock_upgrade or not stripe_key:
                    PaymentTransaction.objects.create(
                        user=user,
                        subscription=subscription,
                        amount=plan.price_monthly or 0,
                        currency='USD',
                        status='completed',
                        gateway_transaction_id=f'mock_upgrade_{subscription.id}',
                        processed_at=timezone.now(),
                    )
                    logger.info(f"Created mock payment transaction for upgrade: User {user.email} to {plan.name}")
                
                # Update marketplace profile tier if exists
                try:
                    marketplace_profile = user.marketplace_profile
                    # Map subscription plan tier to marketplace tier
                    tier_mapping = {
                        'free': 'free',
                        'starter': 'starter',
                        'starter_3': 'starter',
                        'premium': 'professional',
                        'professional_7': 'professional',
                        'professional': 'professional',
                    }
                    marketplace_tier = tier_mapping.get(plan.tier, tier_mapping.get(plan.name, 'free'))
                    marketplace_profile.tier = marketplace_tier
                    marketplace_profile.last_updated_at = timezone.now()
                    marketplace_profile.save()
                    logger.info(f"Updated marketplace profile tier to {marketplace_tier} for user {user.email}")
                except Exception as marketplace_error:
                    # Marketplace profile doesn't exist or error updating - that's ok
                    logger.debug(f"Marketplace profile update skipped: {marketplace_error}")
                
                logger.info(f"Mock upgrade successful: User {user.email} upgraded to {plan.name} ({plan.tier})")
                
                return Response({
                    'success': True,
                    'plan': plan.name,
                    'tier': plan.tier,
                    'message': 'Subscription upgraded successfully',
                }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Mock upgrade error: {e}")
            return Response(
                {'error': f'Failed to upgrade subscription: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    # Otherwise, use Stripe checkout
    stripe_session_id = None
    if stripe_key:
        try:
            import stripe
            stripe.api_key = stripe_key
            
            # Get or create customer
            customer_id = None
            if hasattr(user, 'subscription') and user.subscription.stripe_subscription_id:
                # Get customer from existing subscription
                subscription = stripe.Subscription.retrieve(user.subscription.stripe_subscription_id)
                customer_id = subscription.customer
            else:
                # Create new customer
                customer = stripe.Customer.create(
                    email=user.email,
                    name=user.get_full_name() or user.email,
                )
                customer_id = customer.id
            
            # Create checkout session
            session = stripe.checkout.Session.create(
                customer=customer_id,
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': plan.name.replace('_', ' ').title(),
                        },
                        'unit_amount': int(plan.price_monthly * 100) if plan.price_monthly else 0,
                        'recurring': {
                            'interval': 'month',
                        },
                    },
                    'quantity': 1,
                }],
                mode='subscription',
                success_url=f"{os.environ.get('FRONTEND_URL', 'http://localhost:3000')}/subscription/success?session_id={{CHECKOUT_SESSION_ID}}",
                cancel_url=f"{os.environ.get('FRONTEND_URL', 'http://localhost:3000')}/subscription/cancel",
            )
            stripe_session_id = session.id
        except Exception as e:
            logger.error(f"Stripe error: {e}")
            # Fallback to mock upgrade if Stripe fails
            # Try mock upgrade instead
            try:
                with transaction.atomic():
                    subscription, created = UserSubscription.objects.get_or_create(
                        user=user,
                        defaults={
                            'plan': plan,
                            'status': 'active',
                            'current_period_start': timezone.now(),
                            'current_period_end': timezone.now() + timezone.timedelta(days=30),
                        }
                    )
                    if not created:
                        subscription.plan = plan
                        subscription.status = 'active'
                        subscription.current_period_start = timezone.now()
                        subscription.current_period_end = timezone.now() + timezone.timedelta(days=30)
                        if plan.tier == 'starter' or 'starter' in plan.tier.lower():
                            subscription.enhanced_access_expires_at = timezone.now() + timezone.timedelta(days=180)
                        subscription.save()
                    
                    return Response({
                        'success': True,
                        'plan': plan.name,
                        'tier': plan.tier,
                        'message': 'Subscription upgraded successfully (mock upgrade due to Stripe error)',
                    }, status=status.HTTP_200_OK)
            except Exception as upgrade_error:
                logger.error(f"Mock upgrade error after Stripe failure: {upgrade_error}")
                return Response(
                    {'error': 'Payment processing failed and mock upgrade also failed'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
    
    return Response({
        'stripe_session_id': stripe_session_id,
        'plan': plan.name,
        'message': 'Redirect to Stripe checkout' if stripe_session_id else 'Upgrade pending',
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def stripe_webhook(request):
    """
    POST /api/v1/subscription/webhooks/stripe
    Handle Stripe webhooks.
    """
    import json
    import hmac
    import hashlib
    
    stripe_key = os.environ.get('STRIPE_SECRET_KEY')
    webhook_secret = os.environ.get('STRIPE_WEBHOOK_SECRET')
    
    if not stripe_key or not webhook_secret:
        return Response({'error': 'Stripe not configured'}, status=status.HTTP_400_BAD_REQUEST)
    
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    
    try:
        import stripe
        stripe.api_key = stripe_key
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except ValueError:
        return Response({'error': 'Invalid payload'}, status=status.HTTP_400_BAD_REQUEST)
    except stripe.error.SignatureVerificationError:
        return Response({'error': 'Invalid signature'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Handle events
    from subscriptions.tasks import process_stripe_webhook_task
    process_stripe_webhook_task.delay(event)
    
    return Response({'status': 'received'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def billing_history(request):
    """
    GET /api/v1/subscription/billing-history
    Get user's billing history (payment transactions).
    """
    user = request.user
    
    # Get payment transactions for this user
    transactions = PaymentTransaction.objects.filter(
        user=user,
        status='completed'
    ).select_related('subscription', 'gateway').order_by('-created_at')[:12]  # Last 12 transactions
    
    billing_history = []
    for transaction in transactions:
        # Get plan name from subscription
        plan_name = 'Subscription'
        if transaction.subscription and transaction.subscription.plan:
            plan_name = transaction.subscription.plan.name.replace('_', ' ').title()
        
        billing_history.append({
            'id': str(transaction.id),
            'date': transaction.created_at.isoformat(),
            'amount': float(transaction.amount),
            'currency': transaction.currency,
            'status': transaction.status,
            'description': f'{plan_name} - {transaction.created_at.strftime("%B %Y")}',
            'gateway_transaction_id': transaction.gateway_transaction_id,
        })
    
    # If no transactions but user has subscription, create entries from subscription periods
    if not billing_history:
        try:
            subscription = user.subscription
            if subscription:
                # Create billing entry for current period
                billing_history.append({
                    'id': f'sub_{subscription.id}',
                    'date': subscription.current_period_start.isoformat() if subscription.current_period_start else timezone.now().isoformat(),
                    'amount': float(subscription.plan.price_monthly or 0),
                    'currency': 'USD',
                    'status': subscription.status,
                    'description': f'{subscription.plan.name.replace("_", " ").title()} - {subscription.current_period_start.strftime("%B %Y") if subscription.current_period_start else timezone.now().strftime("%B %Y")}',
                    'gateway_transaction_id': subscription.stripe_subscription_id or 'subscription',
                })
        except UserSubscription.DoesNotExist:
            pass
    
    return Response({
        'billing_history': billing_history,
        'total': len(billing_history),
    }, status=status.HTTP_200_OK)


# ── NEW ENDPOINTS ────────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_plans(request):
    """
    GET /api/v1/subscription/plans
    Return all active subscription plans for the pricing/upgrade UI.
    """
    plans = SubscriptionPlan.objects.all().order_by('price_monthly')
    data = []
    for p in plans:
        mode_note = ''
        if p.tier == 'starter':
            mode_note = 'First 6 months: Enhanced Access (full features). After: Normal Mode (limited).'
        data.append({
            'id': str(p.id),
            'name': p.name,
            'tier': p.tier,
            'price_monthly': float(p.price_monthly or 0),
            'features': p.features or [],
            'ai_coach_daily_limit': p.ai_coach_daily_limit,
            'portfolio_item_limit': p.portfolio_item_limit,
            'missions_access_type': p.missions_access_type,
            'mentorship_access': p.mentorship_access,
            'talentscope_access': p.talentscope_access,
            'marketplace_contact': p.marketplace_contact,
            'enhanced_access_days': p.enhanced_access_days,
            'mode_note': mode_note,
        })
    return Response(data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def simulate_payment(request):
    """
    POST /api/v1/subscription/simulate-payment
    Simulates a full payment checkout (no real gateway).
    Body: { "plan": "starter_3" | "professional_7" | "free" }

    Flow mirrors a real payment success:
      1. Resolve plan
      2. Create/update UserSubscription (status=active, 30-day period)
      3. Set enhanced_access_expires_at for starter tier (180 days, first time only)
      4. Log a completed PaymentTransaction (sim_...)
      5. Sync MarketplaceProfile tier
    """
    plan_identifier = request.data.get('plan')
    if not plan_identifier:
        return Response({'error': 'plan is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        plan = SubscriptionPlan.objects.get(name=plan_identifier)
    except SubscriptionPlan.DoesNotExist:
        # Map old tier names or use tier directly
        tier_map = {'starter_3': 'starter', 'professional_7': 'premium', 'free': 'free'}
        tier = tier_map.get(plan_identifier, plan_identifier)
        plan = SubscriptionPlan.objects.filter(tier=tier).first()
        if not plan:
            available = list(SubscriptionPlan.objects.values_list('name', 'tier', flat=False))
            return Response(
                {'error': f'Plan "{plan_identifier}" not found. Available: {available}'},
                status=status.HTTP_400_BAD_REQUEST
            )

    user = request.user
    now = timezone.now()

    try:
        with transaction.atomic():
            existing = UserSubscription.objects.filter(user=user).first()

            # Enhanced access: only set once per lifetime on first starter subscription
            enhanced_until = None
            if plan.tier == 'starter':
                if existing and existing.enhanced_access_expires_at:
                    enhanced_until = existing.enhanced_access_expires_at  # keep original window
                else:
                    enhanced_until = now + timezone.timedelta(days=180)

            subscription, _ = UserSubscription.objects.update_or_create(
                user=user,
                defaults={
                    'plan': plan,
                    'status': 'active',
                    'current_period_start': now,
                    'current_period_end': now + timezone.timedelta(days=30),
                    'enhanced_access_expires_at': enhanced_until,
                }
            )

            # Log simulated payment transaction
            import uuid as _uuid
            sim_tx_id = f'sim_{_uuid.uuid4().hex[:12]}'
            PaymentTransaction.objects.create(
                user=user,
                subscription=subscription,
                amount=plan.price_monthly or 0,
                currency='USD',
                status='completed',
                gateway_transaction_id=sim_tx_id,
                gateway_response={'simulated': True, 'plan': plan.name},
                processed_at=now,
            )

            # Sync MarketplaceProfile
            mp_map = {'free': 'free', 'starter': 'starter', 'premium': 'professional'}
            mp_tier = mp_map.get(plan.tier, 'free')
            try:
                mp = user.marketplace_profile
                mp.tier = mp_tier
                mp.last_updated_at = now
                mp.save(update_fields=['tier', 'last_updated_at'])
            except Exception:
                pass

            days_left = subscription.days_enhanced_left
            if plan.tier == 'premium':
                mode = 'professional'
            elif days_left and days_left > 0:
                mode = 'enhanced'
            else:
                mode = 'normal'

            logger.info(f'[simulate_payment] {user.email} → {plan.name} | tx={sim_tx_id} | mode={mode}')

            return Response({
                'success': True,
                'transaction_id': sim_tx_id,
                'plan': plan.name,
                'tier': plan.tier,
                'mode': mode,
                'enhanced_access_days_left': days_left,
                'period_end': subscription.current_period_end,
                'message': f'Payment simulated. You are now on the {plan.name} plan.',
            }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f'[simulate_payment] Error for {user.email}: {e}')
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_subscription(request):
    """
    POST /api/v1/subscription/cancel
    Marks subscription as canceled. Access continues until current_period_end;
    the scheduler then downgrades to Free Tier automatically.
    """
    user = request.user
    try:
        subscription = user.subscription
    except UserSubscription.DoesNotExist:
        return Response({'error': 'No active subscription found'}, status=status.HTTP_404_NOT_FOUND)

    if subscription.status == 'canceled':
        return Response({'error': 'Subscription is already canceled'}, status=status.HTTP_400_BAD_REQUEST)

    subscription.status = 'canceled'
    subscription.save(update_fields=['status', 'updated_at'])

    logger.info(f'[cancel_subscription] {user.email} canceled. Access until {subscription.current_period_end}')

    return Response({
        'success': True,
        'message': 'Subscription canceled. You retain access until the end of your billing period.',
        'access_until': subscription.current_period_end,
    }, status=status.HTTP_200_OK)
