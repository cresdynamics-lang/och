"""
ABAC Policy Engine for access control evaluation.
"""
from users.models import UserRole, ConsentScope
from users.policy_models import Policy


def evaluate_policy(user, resource, action, context=None):
    """
    Evaluate ABAC policies for access control.
    
    Args:
        user: User object
        resource: Resource type (e.g., 'portfolio', 'profiling')
        action: Action type (e.g., 'read', 'write')
        context: Additional context dict (e.g., {'cohort_id': '...', 'mentor_id': '...'})
    
    Returns:
        (allowed: bool, reason: str)
    """
    if context is None:
        context = {}
    
    # Get all active policies for this resource
    policies = Policy.objects.filter(
        resource=resource,
        active=True
    )
    
    # Check if action is in policy actions
    policies = [p for p in policies if action in p.actions]
    
    if not policies:
        # No policies = deny by default
        return False, "No policy found for this resource/action"
    
    # Evaluate each policy
    for policy in policies:
        if _evaluate_condition(policy.condition, user, context):
            if policy.effect == 'allow':
                return True, f"Policy '{policy.name}' allows access"
            else:  # deny
                return False, f"Policy '{policy.name}' denies access"
    
    # Default deny if no policy matches
    return False, "No matching policy found"


def _evaluate_condition(condition, user, context):
    """
    Evaluate policy condition against user and context.
    
    Condition format examples:
    {
        "user.role": "mentor",
        "match_exists": {"user_id": "mentor_id"},
        "consent_scopes.includes": "share_with_mentor",
        "user.cohort_id": "request.cohort_id"
    }
    """
    if not condition:
        return True  # No condition = always match
    
    # Check user role
    if 'user.role' in condition:
        user_roles = UserRole.objects.filter(
            user=user,
            is_active=True,
            role__name=condition['user.role']
        )
        if not user_roles.exists():
            return False
    
    # Check consent scopes
    if 'consent_scopes.includes' in condition:
        required_scope = condition['consent_scopes.includes']
        has_consent = ConsentScope.objects.filter(
            user=user,
            scope_type=required_scope,
            granted=True,
            expires_at__isnull=True
        ).exists()
        if not has_consent:
            return False
    
    # Check cohort/track matching
    if 'user.cohort_id' in condition:
        if user.cohort_id != context.get('cohort_id'):
            return False
    
    if 'user.track_key' in condition:
        if user.track_key != context.get('track_key'):
            return False
    
    # Check match_exists (e.g., mentor-mentee relationship)
    if 'match_exists' in condition:
        match_condition = condition['match_exists']
        # This would need to query the specific relationship
        # Placeholder for now
        pass
    
    # Check org_id matching
    if 'user.org_id' in condition:
        if str(user.org_id.id) != str(context.get('org_id')):
            return False
    
    return True


def check_permission(user, resource_type, action, context=None):
    """
    Check if user has permission for resource/action.
    Combines RBAC (role permissions) and ABAC (policy evaluation).
    """
    # First check RBAC (role-based permissions)
    user_roles = UserRole.objects.filter(user=user, is_active=True)
    
    for user_role in user_roles:
        # Check if role has permission
        role_permissions = user_role.role.permissions.filter(
            resource_type=resource_type,
            action=action
        )
        
        if role_permissions.exists():
            # Role has permission, now check ABAC policy
            allowed, reason = evaluate_policy(user, resource_type, action, context)
            if allowed:
                return True, reason
    
    # No role has permission
    return False, "User does not have required role permission"

