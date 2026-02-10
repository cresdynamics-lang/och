"""
Recipe Engine services for profiler-based gap analysis and recommendations.
"""
import logging
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)


def verify_profiler_accessibility(user) -> Dict[str, Any]:
    """
    Verify that profiler results are accessible to Recipe Engine.
    
    Args:
        user: User instance
        
    Returns:
        {
            'accessible': bool,
            'session_id': str or None,
            'has_scores': bool,
            'has_breakdown': bool,
            'message': str
        }
    """
    try:
        from profiler.models import ProfilerSession, ProfilerResult
        
        profiler_session = ProfilerSession.objects.filter(
            user=user,
            status__in=['finished', 'locked']
        ).order_by('-completed_at').first()
        
        if not profiler_session:
            return {
                'accessible': False,
                'session_id': None,
                'has_scores': False,
                'has_breakdown': False,
                'message': 'No profiler session found'
            }
        
        has_scores = profiler_session.aptitude_score is not None or profiler_session.technical_exposure_score is not None
        
        has_breakdown = False
        try:
            result = profiler_session.result
            has_breakdown = bool(result.aptitude_breakdown) if result else False
        except ProfilerResult.DoesNotExist:
            pass
        
        return {
            'accessible': True,
            'session_id': str(profiler_session.id),
            'has_scores': has_scores,
            'has_breakdown': has_breakdown,
            'message': 'Profiler results accessible'
        }
    except Exception as e:
        logger.error(f"Failed to verify profiler accessibility for user {user.id}: {e}")
        return {
            'accessible': False,
            'session_id': None,
            'has_scores': False,
            'has_breakdown': False,
            'message': f'Error checking profiler: {str(e)}'
        }


def map_category_to_skill_codes(category: str) -> List[str]:
    """
    Map profiler category to skill codes for recipe matching.
    
    Args:
        category: Profiler category name (e.g., 'networking', 'security')
        
    Returns:
        List of skill codes
    """
    category_mapping = {
        'networking': ['NET', 'NETW', 'TCPIP', 'DNS', 'HTTP'],
        'security': ['SEC', 'SECOPS', 'SIEM', 'IDS', 'IPS'],
        'programming': ['PROG', 'PYTHON', 'BASH', 'SCRIPT'],
        'linux': ['LINUX', 'SYSADMIN', 'CLI'],
        'windows': ['WIN', 'WINDOWS', 'POWERSHELL'],
        'cloud': ['CLOUD', 'AWS', 'AZURE', 'GCP'],
        'cryptography': ['CRYPTO', 'ENCRYPT', 'HASH'],
        'forensics': ['DFIR', 'FORENSICS', 'INVESTIGATION'],
        'malware': ['MALWARE', 'REVERSE', 'ANALYSIS'],
        'web': ['WEB', 'WEBAPP', 'OWASP', 'XSS', 'SQLI'],
    }
    
    # Normalize category name
    category_lower = category.lower()
    
    # Direct match
    if category_lower in category_mapping:
        return category_mapping[category_lower]
    
    # Partial match
    for key, codes in category_mapping.items():
        if key in category_lower or category_lower in key:
            return codes
    
    return []


def analyze_gaps_from_profiler(user) -> Dict[str, Any]:
    """
    Analyze skill gaps based on profiler results.
    
    Args:
        user: User instance
        
    Returns:
        {
            'gaps': [
                {
                    'category': str,
                    'type': 'aptitude' | 'technical' | 'behavioral',
                    'score': float,
                    'priority': 'high' | 'medium' | 'low'
                }
            ],
            'recommended_recipe_skills': List[str],
            'aptitude_score': float,
            'technical_exposure_score': float,
        }
    """
    try:
        from profiler.models import ProfilerSession, ProfilerResult
        
        profiler_session = ProfilerSession.objects.filter(
            user=user,
            status__in=['finished', 'locked']
        ).order_by('-completed_at').first()
        
        if not profiler_session:
            return {
                'gaps': [],
                'recommended_recipe_skills': [],
                'aptitude_score': None,
                'technical_exposure_score': None,
            }
        
        gaps = []
        recommended_skills = []
        
        # Analyze aptitude breakdown
        aptitude_score = None
        try:
            result = profiler_session.result
            if result:
                aptitude_score = float(result.aptitude_score) if result.aptitude_score else None
                
                if result.aptitude_breakdown:
                    for category, score in result.aptitude_breakdown.items():
                        score_float = float(score) if score else 0
                        if score_float < 60:  # Below threshold
                            priority = 'high' if score_float < 40 else 'medium'
                            gaps.append({
                                'category': category,
                                'type': 'aptitude',
                                'score': score_float,
                                'priority': priority
                            })
                            # Map category to skill codes
                            skill_codes = map_category_to_skill_codes(category)
                            recommended_skills.extend(skill_codes)
        except ProfilerResult.DoesNotExist:
            pass
        except Exception as e:
            logger.warning(f"Failed to analyze aptitude breakdown: {e}")
        
        # Use session aptitude_score if result not available
        if aptitude_score is None and profiler_session.aptitude_score:
            aptitude_score = float(profiler_session.aptitude_score)
        
        # Analyze technical exposure
        technical_exposure_score = None
        if profiler_session.technical_exposure_score:
            technical_exposure_score = float(profiler_session.technical_exposure_score)
            if technical_exposure_score < 60:
                gaps.append({
                    'category': 'technical_exposure',
                    'type': 'technical',
                    'score': technical_exposure_score,
                    'priority': 'high' if technical_exposure_score < 40 else 'medium'
                })
                # Add general technical skills
                recommended_skills.extend(['TECH', 'BASICS', 'FUNDAMENTALS'])
        
        # Analyze behavioral profile
        if profiler_session.behavioral_profile:
            areas_for_growth = profiler_session.behavioral_profile.get('areas_for_growth', [])
            strengths = profiler_session.behavioral_profile.get('strengths', [])
            
            for area in areas_for_growth:
                gaps.append({
                    'category': area,
                    'type': 'behavioral',
                    'priority': 'medium'
                })
                # Map behavioral areas to soft-skill codes
                if 'communication' in area.lower():
                    recommended_skills.append('COMM')
                if 'leadership' in area.lower():
                    recommended_skills.append('LEAD')
                if 'documentation' in area.lower():
                    recommended_skills.append('DOC')
        
        # Remove duplicates
        recommended_skills = list(set(recommended_skills))
        
        return {
            'gaps': gaps,
            'recommended_recipe_skills': recommended_skills,
            'aptitude_score': aptitude_score,
            'technical_exposure_score': technical_exposure_score,
        }
        
    except Exception as e:
        logger.error(f"Failed to analyze gaps from profiler for user {user.id}: {e}", exc_info=True)
        return {
            'gaps': [],
            'recommended_recipe_skills': [],
            'aptitude_score': None,
            'technical_exposure_score': None,
        }
