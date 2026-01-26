"""
Job matching algorithm for matching students to job postings.
"""
from decimal import Decimal
from typing import List, Dict, Set
from .models import JobPosting, MarketplaceProfile


def calculate_match_score(job: JobPosting, profile: MarketplaceProfile) -> Decimal:
    """
    Calculate match score (0-100) between a job posting and student profile.
    
    Algorithm:
    1. Skills match (70% weight): Compare required_skills vs profile.skills
    2. Readiness score (20% weight): Use profile.readiness_score
    3. Job fit score (10% weight): Use profile.job_fit_score
    
    Returns: Decimal between 0 and 100
    """
    score = Decimal('0.0')
    
    # 1. Skills matching (70% weight)
    if job.required_skills and profile.skills:
        job_skills = set(skill.lower().strip() for skill in job.required_skills)
        profile_skills = set(skill.lower().strip() for skill in profile.skills)
        
        if job_skills:
            # Calculate Jaccard similarity (intersection over union)
            intersection = len(job_skills & profile_skills)
            union = len(job_skills | profile_skills)
            
            if union > 0:
                skills_similarity = Decimal(intersection) / Decimal(union)
                score += skills_similarity * Decimal('70.0')
    
    # 2. Readiness score (20% weight)
    if profile.readiness_score is not None:
        readiness_weight = Decimal(str(profile.readiness_score)) / Decimal('100.0')
        score += readiness_weight * Decimal('20.0')
    
    # 3. Job fit score (10% weight)
    if profile.job_fit_score is not None:
        job_fit_weight = Decimal(str(profile.job_fit_score)) / Decimal('100.0')
        score += job_fit_weight * Decimal('10.0')
    
    # Ensure score is between 0 and 100
    return min(max(score, Decimal('0.0')), Decimal('100.0'))


def get_matching_jobs_for_student(
    user,
    limit: int = 50,
    min_match_score: float = 0.0,
    job_type: str = None,
) -> List[Dict]:
    """
    Get job postings matched to a student with match scores.
    
    Args:
        user: The student User object
        limit: Maximum number of jobs to return
        min_match_score: Minimum match score (0-100)
        job_type: Filter by job type (optional)
    
    Returns:
        List of dicts with job data and match_score
    """
    try:
        profile = user.marketplace_profile
    except MarketplaceProfile.DoesNotExist:
        return []
    
    # Get active jobs
    jobs = JobPosting.objects.filter(
        is_active=True
    ).select_related('employer')
    
    # Filter by job type if specified
    if job_type:
        jobs = jobs.filter(job_type=job_type)
    
    # Filter out expired jobs
    from django.utils import timezone
    from django.db import models
    jobs = jobs.filter(
        models.Q(application_deadline__isnull=True) |
        models.Q(application_deadline__gte=timezone.now())
    )
    
    # Calculate match scores
    matched_jobs = []
    for job in jobs:
        match_score = calculate_match_score(job, profile)
        
        if float(match_score) >= min_match_score:
            matched_jobs.append({
                'job': job,
                'match_score': match_score,
            })
    
    # Sort by match score (descending)
    matched_jobs.sort(key=lambda x: x['match_score'], reverse=True)
    
    # Limit results
    return matched_jobs[:limit]
