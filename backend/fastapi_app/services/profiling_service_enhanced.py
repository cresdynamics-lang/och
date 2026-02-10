"""
Enhanced AI Profiling Service for OCH Tier-0 Profiler
Comprehensive 7-module profiling system mapping users to 5 cybersecurity tracks.

Modules:
1. Identity & Value (VIP-based questions)
2. Cyber Aptitude (logic, patterns, reasoning)
3. Technical Exposure (multiple-choice & experience scoring)
4. Scenario Preferences (choose-your-path mini-stories)
5. Work Style & Behavioral Profile
6. Difficulty Level Self-Selection (with AI verification)
7. Role Fit Reflection (open-ended, stored as portfolio entry)
"""
import uuid
import logging
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime
from collections import defaultdict

logger = logging.getLogger(__name__)

from schemas.profiling import (
    ProfilingSession, ProfilingResponse, TrackRecommendation,
    ProfilingResult, ProfilingProgress, DeepInsights, TrackInfo
)
from schemas.profiling_tracks import OCH_TRACKS
from schemas.profiling_questions_enhanced import (
    ALL_PROFILING_QUESTIONS_ENHANCED, CATEGORY_WEIGHTS_ENHANCED,
    MIN_QUESTIONS_FOR_ASSESSMENT_ENHANCED
)


class EnhancedProfilingService:
    """
    Enhanced Tier-0 profiling service with 7 comprehensive modules.
    Maps users to 5 cybersecurity tracks with weighted scoring.
    """

    def __init__(self):
        self.questions = ALL_PROFILING_QUESTIONS_ENHANCED
        self.question_map = {q.id: q for q in self.questions}
        self.module_map = self._build_module_map()

    def _build_module_map(self) -> Dict[str, List[str]]:
        """Map questions to their modules."""
        modules = {
            "identity_value": [],
            "cyber_aptitude": [],
            "technical_exposure": [],
            "scenario_preference": [],
            "work_style": [],
            "difficulty_selection": [],
        }
        for q in self.questions:
            if q.category in modules:
                modules[q.category].append(q.id)
        return modules

    def get_module_progress(self, session: ProfilingSession) -> Dict[str, Any]:
        """
        Compute per-module progress for a session.

        Returns:
            {
              "modules": {
                "identity_value": {"answered": 3, "total": 10, "completed": false},
                ...
              },
              "current_module": "cyber_aptitude",
              "completed_modules": [...],
              "remaining_modules": [...]
            }
        """
        modules_summary: Dict[str, Dict[str, Any]] = {}
        # Count responses per question id
        answered_ids = {r.question_id for r in session.responses}

        for module_name, question_ids in self.module_map.items():
            total = len(question_ids)
            answered = len([qid for qid in question_ids if qid in answered_ids])
            completed = total > 0 and answered >= total
            modules_summary[module_name] = {
                "answered": answered,
                "total": total,
                "completed": completed,
            }

        completed_modules = [m for m, info in modules_summary.items() if info["completed"]]
        remaining_modules = [m for m in modules_summary.keys() if m not in completed_modules]

        # Determine current module: first non-complete module, or last if all complete
        current_module = remaining_modules[0] if remaining_modules else (
            completed_modules[-1] if completed_modules else None
        )

        return {
            "modules": modules_summary,
            "current_module": current_module,
            "completed_modules": completed_modules,
            "remaining_modules": remaining_modules,
        }

    def create_session(self, user_id: int) -> ProfilingSession:
        """
        Create a new profiling session for a user.
        
        Args:
            user_id: User ID from Django
            
        Returns:
            ProfilingSession: New session object
        """
        session = ProfilingSession(
            id=str(uuid.uuid4()),
            user_id=user_id,
            responses=[],
            started_at=datetime.utcnow(),
            scores=None,
            recommended_track=None
        )
        return session

    def get_questions_by_module(self, module_name: str) -> List[Dict]:
        """Get all questions for a specific module."""
        question_ids = self.module_map.get(module_name, [])
        return [self.get_question(qid) for qid in question_ids if self.get_question(qid)]

    def get_question(self, question_id: str) -> Optional[Dict]:
        """Get a question by ID."""
        question = self.question_map.get(question_id)
        if not question:
            return None

        return {
            "id": question.id,
            "question": question.question,
            "category": question.category,
            "module": self._get_module_from_category(question.category),
            "options": [
                {"value": opt.value, "text": opt.text}
                for opt in question.options
            ]
        }

    def _get_module_from_category(self, category: str) -> str:
        """Map category to module name."""
        category_to_module = {
            "identity_value": "Identity & Value",
            "cyber_aptitude": "Cyber Aptitude",
            "technical_exposure": "Technical Exposure",
            "scenario_preference": "Scenario Preferences",
            "work_style": "Work Style",
            "difficulty_selection": "Difficulty Selection",
        }
        return category_to_module.get(category, "General")

    def get_all_questions(self) -> List[Dict]:
        """Get all profiling questions organized by module."""
        questions_by_module = {}
        for module_name, question_ids in self.module_map.items():
            questions_by_module[module_name] = [
                self.get_question(qid) for qid in question_ids
            ]
        return questions_by_module

    def submit_response(self, session: ProfilingSession, question_id: str,
                       selected_option: str, response_time_ms: Optional[int] = None) -> bool:
        """Submit a response to a profiling question."""
        question = self.question_map.get(question_id)
        if not question:
            return False

        valid_options = [opt.value for opt in question.options]
        if selected_option not in valid_options:
            return False

        existing_response = next(
            (r for r in session.responses if r.question_id == question_id),
            None
        )

        if existing_response:
            existing_response.selected_option = selected_option
            existing_response.response_time_ms = response_time_ms
        else:
            response = ProfilingResponse(
                question_id=question_id,
                selected_option=selected_option,
                response_time_ms=response_time_ms
            )
            session.responses.append(response)

        return True

    def submit_reflection(self, session: ProfilingSession, 
                         why_cyber: str, what_achieve: str) -> bool:
        """
        Submit reflection responses (Module 7).
        These will be used for value statement extraction.
        """
        if not hasattr(session, 'reflection_responses'):
            session.reflection_responses = {}
        
        session.reflection_responses = {
            "why_cyber": why_cyber,
            "what_achieve": what_achieve,
            "submitted_at": datetime.utcnow().isoformat()
        }
        return True

    def extract_value_statement(self, session: ProfilingSession) -> str:
        """
        Extract value statement from identity/value questions and reflection.
        This becomes the first portfolio entry.
        """
        # Analyze identity/value responses
        identity_responses = [
            r for r in session.responses 
            if self.question_map.get(r.question_id, {}).category == "identity_value"
        ]
        
        # Get reflection responses
        reflection = getattr(session, 'reflection_responses', {})
        why_cyber = reflection.get("why_cyber", "")
        what_achieve = reflection.get("what_achieve", "")
        
        # Build value statement
        value_parts = []
        if why_cyber:
            value_parts.append(f"I am drawn to cybersecurity because: {why_cyber}")
        if what_achieve:
            value_parts.append(f"My goal is to: {what_achieve}")
        
        # Add insights from identity responses
        if identity_responses:
            value_parts.append("My core values align with protecting and advancing cybersecurity.")
        
        return " ".join(value_parts) if value_parts else "I am committed to advancing in cybersecurity."

    def create_value_statement_portfolio_entry(self, session: ProfilingSession, result: ProfilingResult) -> bool:
        """
        Create the first portfolio entry (Value Statement) automatically after profiler completion.
        This integrates with Django's portfolio system.
        """
        import requests
        import os
        
        value_statement = self.extract_value_statement(session)
        
        # Get Django API URL from environment
        django_api_url = os.getenv('DJANGO_API_URL', 'http://localhost:8000')
        
        # Get user's UUID (Django uses UUID for portfolio items)
        try:
            # Call Django API to get user UUID
            user_response = requests.get(
                f"{django_api_url}/api/v1/users/{session.user_id}/uuid",
                timeout=5
            )
            if user_response.status_code == 200:
                user_data = user_response.json()
                user_uuid = user_data.get('uuid_id') or user_data.get('uuid')
            else:
                # Fallback: try to create portfolio item directly with user_id
                user_uuid = str(session.user_id)
        except Exception as e:
            logger.warning(f"Could not fetch user UUID: {e}")
            user_uuid = str(session.user_id)
        
        # Create portfolio item via Django API
        try:
            portfolio_data = {
                'title': 'My Value Statement',
                'summary': value_statement,
                'type': 'reflection',
                'status': 'approved',  # Auto-approve value statement
                'visibility': 'private',  # Start as private, user can change later
                'skillTags': [],
                'evidenceFiles': []
            }
            
            # Note: This requires authentication token in production
            # For now, we'll create it via Django signal or task
            # The actual creation should happen in Django after profiler completion
            logger.info(f"Value statement extracted for user {session.user_id}: {value_statement[:100]}...")
            
            # Store value statement in session for Django to pick up
            if not hasattr(session, 'portfolio_metadata'):
                session.portfolio_metadata = {}
            session.portfolio_metadata['value_statement'] = value_statement
            session.portfolio_metadata['ready_for_portfolio'] = True
            
            return True
        except Exception as e:
            logger.error(f"Failed to create portfolio entry: {e}")
            return False

    def verify_difficulty_selection(self, session: ProfilingSession, 
                                   selected_difficulty: str) -> Dict[str, Any]:
        """
        Verify if user's difficulty self-selection is realistic based on their responses.
        Returns verification result with AI assessment.
        """
        # Calculate technical exposure score
        tech_exposure_responses = [
            r for r in session.responses
            if self.question_map.get(r.question_id, {}).category == "technical_exposure"
        ]
        
        tech_score = 0
        for response in tech_exposure_responses:
            question = self.question_map.get(response.question_id)
            if question:
                for option in question.options:
                    if option.value == response.selected_option:
                        # Higher scores indicate more experience
                        max_score = max(option.scores.values(), default=0)
                        tech_score += max_score
        
        # Map difficulty to expected score range
        difficulty_ranges = {
            "novice": (0, 5),
            "beginner": (5, 15),
            "intermediate": (15, 30),
            "advanced": (30, 50),
            "elite": (50, 100)
        }
        
        expected_range = difficulty_ranges.get(selected_difficulty, (0, 100))
        is_realistic = expected_range[0] <= tech_score <= expected_range[1]
        
        # Calculate confidence
        if is_realistic:
            confidence = "high" if abs(tech_score - sum(expected_range) / 2) < 5 else "medium"
            suggested_difficulty = selected_difficulty
        else:
            confidence = "low"
            # Suggest appropriate difficulty
            suggested_difficulty = "intermediate"
            for diff, (low, high) in difficulty_ranges.items():
                if low <= tech_score <= high:
                    suggested_difficulty = diff
                    break
        
        return {
            "selected_difficulty": selected_difficulty,
            "is_realistic": is_realistic,
            "confidence": confidence,
            "technical_exposure_score": tech_score,
            "suggested_difficulty": suggested_difficulty if not is_realistic else selected_difficulty,
            "reasoning": self._generate_difficulty_reasoning(selected_difficulty, tech_score, is_realistic)
        }

    def _generate_difficulty_reasoning(self, selected: str, score: int, is_realistic: bool) -> str:
        """Generate reasoning for difficulty verification."""
        if is_realistic:
            return f"Your technical exposure score ({score}) aligns well with {selected} level."
        else:
            return f"Based on your responses, {selected} may be challenging. Consider starting with a more appropriate level."

    def calculate_scores(self, session: ProfilingSession) -> Dict[str, float]:
        """
        Calculate track scores with enhanced weighted categories.
        Includes: Technical Aptitude, Problem-Solving, Work Style, 
        Scenario Preferences, Past Experience, Mission Mindset.
        """
        scores = defaultdict(float)
        category_counts = defaultdict(int)

        for response in session.responses:
            question = self.question_map.get(response.question_id)
            if not question:
                continue

            selected_option_data = None
            for option in question.options:
                if option.value == response.selected_option:
                    selected_option_data = option
                    break

            if not selected_option_data:
                continue

            # Apply enhanced category weight
            weight = CATEGORY_WEIGHTS_ENHANCED.get(question.category, 1.0)
            category_counts[question.category] += 1

            # Add weighted scores
            for track, score in selected_option_data.scores.items():
                scores[track] += score * weight

        # Enhanced normalization: scale to 0-100 range
        max_possible_score = sum(
            max(opt.scores.values(), default=0) * CATEGORY_WEIGHTS_ENHANCED.get(cat, 1.0)
            for q in self.questions
            for opt in q.options
            for cat in [q.category]
        ) / len(self.questions) * len(session.responses)

        normalized_scores = {}
        for track in OCH_TRACKS.keys():
            raw_score = scores[track]
            # Normalize to 0-100 scale
            if max_possible_score > 0:
                normalized = (raw_score / max_possible_score) * 100
            else:
                normalized = 0.0
            normalized_scores[track] = min(100.0, max(0.0, normalized))

        return dict(normalized_scores)

    def generate_recommendations(self, scores: Dict[str, float], session: Optional[ProfilingSession] = None) -> List[TrackRecommendation]:
        """Generate track recommendations with strengths and optimal paths, enhanced with behavioral pattern analysis."""
        # Extract behavioral patterns from session if available
        behavioral_patterns = self._extract_behavioral_patterns(session) if session else {}
        
        # Apply behavioral pattern adjustments to scores
        adjusted_scores = self._apply_behavioral_pattern_scoring(scores, behavioral_patterns)
        
        recommendations = []
        sorted_tracks = sorted(adjusted_scores.items(), key=lambda x: x[1], reverse=True)

        for i, (track_key, score) in enumerate(sorted_tracks):
            track_info = OCH_TRACKS[track_key]

            # Determine confidence level
            if i == 0 and score >= 70:
                confidence_level = "high"
            elif i == 0:
                confidence_level = "medium"
            elif i <= 2 and score >= 50:
                confidence_level = "medium"
            else:
                confidence_level = "low"

            reasoning = self._generate_reasoning(track_key, score, i + 1, adjusted_scores, behavioral_patterns)
            strengths_aligned = self._get_strengths_aligned(track_key, adjusted_scores)
            optimal_path = self._get_optimal_path(track_key)

            recommendation = TrackRecommendation(
                track_key=track_key,
                track_name=track_info.name,
                score=round(score, 1),
                confidence_level=confidence_level,
                reasoning=reasoning,
                career_suggestions=track_info.career_paths[:4],
                strengths_aligned=strengths_aligned,
                optimal_path=optimal_path
            )

            recommendations.append(recommendation)

        return recommendations
    
    def _extract_behavioral_patterns(self, session: ProfilingSession) -> Dict[str, float]:
        """Extract behavioral patterns from session responses for track alignment."""
        patterns = {
            'pattern_recognition': 0.0,
            'stability': 0.0,
            'risk_sensitivity': 0.0,
            'curiosity': 0.0,
            'exploration': 0.0,
            'analytical_lateral_thinking': 0.0,
            'documentation_clarity': 0.0,
            'structured_thinking': 0.0,
            'governance_alignment': 0.0,
            'creativity': 0.0,
            'automation_interest': 0.0,
            'systems_thinking': 0.0,
            'communication': 0.0,
            'decision_clarity': 0.0,
            'value_driven': 0.0,
        }
        
        if not session or not session.responses:
            return patterns
        
        # Analyze responses for behavioral indicators
        for response in session.responses:
            question = self.question_map.get(response.question_id)
            if not question:
                continue
            
            selected_option = response.selected_option
            
            # Pattern recognition indicators (Defender)
            if 'pattern' in question.question.lower() or 'recognize' in question.question.lower():
                if selected_option in ['A', 'B']:  # High pattern recognition
                    patterns['pattern_recognition'] += 1.0
            
            # Stability indicators (Defender)
            if 'stable' in question.question.lower() or 'consistent' in question.question.lower() or 'routine' in question.question.lower():
                if selected_option in ['A', 'B']:
                    patterns['stability'] += 1.0
            
            # Risk sensitivity indicators (Defender)
            if 'risk' in question.question.lower() and ('assess' in question.question.lower() or 'evaluate' in question.question.lower()):
                if selected_option in ['A', 'B']:
                    patterns['risk_sensitivity'] += 1.0
            
            # Curiosity indicators (Offensive)
            if 'curious' in question.question.lower() or 'explore' in question.question.lower() or 'discover' in question.question.lower():
                if selected_option in ['B', 'C']:
                    patterns['curiosity'] += 1.0
                    patterns['exploration'] += 1.0
            
            # Analytical lateral thinking (Offensive)
            if 'think' in question.question.lower() and ('different' in question.question.lower() or 'creative' in question.question.lower()):
                if selected_option in ['B', 'C']:
                    patterns['analytical_lateral_thinking'] += 1.0
            
            # Documentation clarity (GRC)
            if 'document' in question.question.lower() or 'report' in question.question.lower() or 'compliance' in question.question.lower():
                if selected_option in ['A', 'B']:
                    patterns['documentation_clarity'] += 1.0
            
            # Structured thinking (GRC)
            if 'structure' in question.question.lower() or 'organize' in question.question.lower() or 'framework' in question.question.lower():
                if selected_option in ['A', 'B']:
                    patterns['structured_thinking'] += 1.0
            
            # Governance alignment (GRC)
            if 'governance' in question.question.lower() or 'compliance' in question.question.lower() or 'regulation' in question.question.lower():
                if selected_option in ['A', 'B']:
                    patterns['governance_alignment'] += 1.0
            
            # Creativity (Innovation)
            if 'creative' in question.question.lower() or 'innovate' in question.question.lower() or 'design' in question.question.lower():
                if selected_option in ['B', 'C']:
                    patterns['creativity'] += 1.0
            
            # Automation interest (Innovation)
            if 'automate' in question.question.lower() or 'tool' in question.question.lower() or 'script' in question.question.lower():
                if selected_option in ['B', 'C']:
                    patterns['automation_interest'] += 1.0
            
            # Systems thinking (Innovation)
            if 'system' in question.question.lower() or 'architecture' in question.question.lower() or 'design' in question.question.lower():
                if selected_option in ['B', 'C']:
                    patterns['systems_thinking'] += 1.0
            
            # Communication (Leadership)
            if 'communicate' in question.question.lower() or 'explain' in question.question.lower() or 'present' in question.question.lower():
                if selected_option in ['C', 'D']:
                    patterns['communication'] += 1.0
            
            # Decision clarity (Leadership)
            if 'decide' in question.question.lower() or 'decision' in question.question.lower() or 'choose' in question.question.lower():
                if selected_option in ['C', 'D']:
                    patterns['decision_clarity'] += 1.0
            
            # Value-driven (Leadership)
            if 'value' in question.question.lower() or 'business' in question.question.lower() or 'objective' in question.question.lower():
                if selected_option in ['C', 'D']:
                    patterns['value_driven'] += 1.0
        
        # Normalize patterns to 0-1 scale based on response count
        response_count = len(session.responses)
        if response_count > 0:
            for key in patterns:
                patterns[key] = min(1.0, patterns[key] / max(1, response_count / 10))
        
        return patterns
    
    def _apply_behavioral_pattern_scoring(self, base_scores: Dict[str, float], patterns: Dict[str, float]) -> Dict[str, float]:
        """Apply behavioral pattern adjustments to track scores."""
        adjusted_scores = base_scores.copy()
        
        # Defender: High pattern-recognition + high stability + risk sensitivity
        defender_boost = (
            patterns.get('pattern_recognition', 0) * 0.4 +
            patterns.get('stability', 0) * 0.3 +
            patterns.get('risk_sensitivity', 0) * 0.3
        )
        if 'defender' in adjusted_scores:
            adjusted_scores['defender'] += defender_boost * 15  # Boost up to 15 points
        
        # Offensive: High curiosity + high exploration + analytical lateral thinking
        offensive_boost = (
            patterns.get('curiosity', 0) * 0.35 +
            patterns.get('exploration', 0) * 0.35 +
            patterns.get('analytical_lateral_thinking', 0) * 0.3
        )
        if 'offensive' in adjusted_scores:
            adjusted_scores['offensive'] += offensive_boost * 15
        
        # GRC: High documentation clarity + structured thinking + governance alignment
        grc_boost = (
            patterns.get('documentation_clarity', 0) * 0.35 +
            patterns.get('structured_thinking', 0) * 0.35 +
            patterns.get('governance_alignment', 0) * 0.3
        )
        if 'grc' in adjusted_scores:
            adjusted_scores['grc'] += grc_boost * 15
        
        # Innovation: High creativity + automation interest + systems thinking
        innovation_boost = (
            patterns.get('creativity', 0) * 0.35 +
            patterns.get('automation_interest', 0) * 0.35 +
            patterns.get('systems_thinking', 0) * 0.3
        )
        if 'innovation' in adjusted_scores:
            adjusted_scores['innovation'] += innovation_boost * 15
        
        # Leadership: High communication + decision clarity + value-driven responses
        leadership_boost = (
            patterns.get('communication', 0) * 0.35 +
            patterns.get('decision_clarity', 0) * 0.35 +
            patterns.get('value_driven', 0) * 0.3
        )
        if 'leadership' in adjusted_scores:
            adjusted_scores['leadership'] += leadership_boost * 15
        
        # Cap all scores at 100
        for key in adjusted_scores:
            adjusted_scores[key] = min(100.0, max(0.0, adjusted_scores[key]))
        
        return adjusted_scores

    def _generate_reasoning(self, track_key: str, score: float, rank: int, all_scores: Dict[str, float], behavioral_patterns: Dict[str, float] = None) -> List[str]:
        """Generate reasoning text for a track recommendation with behavioral pattern insights."""
        track_info = OCH_TRACKS[track_key]
        reasoning = []

        if rank == 1:
            reasoning.append(f"Your responses show a strong alignment with the {track_info.name} track ({score:.1f}% match).")
        elif rank == 2:
            reasoning.append(f"You demonstrate solid potential in the {track_info.name} track ({score:.1f}% match).")
        else:
            reasoning.append(f"You show some alignment with {track_info.name} characteristics ({score:.1f}% match).")

        # Track-specific reasoning with behavioral pattern insights
        if behavioral_patterns:
            if track_key == "defender":
                if behavioral_patterns.get('pattern_recognition', 0) > 0.6:
                    reasoning.append("Your high pattern-recognition ability makes you excellent at identifying threats and anomalies.")
                if behavioral_patterns.get('stability', 0) > 0.6:
                    reasoning.append("Your preference for stability aligns with defensive security operations.")
                if behavioral_patterns.get('risk_sensitivity', 0) > 0.6:
                    reasoning.append("Your risk sensitivity helps you prioritize and respond to security incidents effectively.")
            
            elif track_key == "offensive":
                if behavioral_patterns.get('curiosity', 0) > 0.6:
                    reasoning.append("Your high curiosity drives you to explore vulnerabilities and attack vectors.")
                if behavioral_patterns.get('exploration', 0) > 0.6:
                    reasoning.append("Your exploration mindset aligns with penetration testing and ethical hacking.")
                if behavioral_patterns.get('analytical_lateral_thinking', 0) > 0.6:
                    reasoning.append("Your analytical lateral thinking helps you find creative exploitation paths.")
            
            elif track_key == "grc":
                if behavioral_patterns.get('documentation_clarity', 0) > 0.6:
                    reasoning.append("Your documentation clarity is essential for compliance and audit requirements.")
                if behavioral_patterns.get('structured_thinking', 0) > 0.6:
                    reasoning.append("Your structured thinking aligns with governance frameworks and standards.")
                if behavioral_patterns.get('governance_alignment', 0) > 0.6:
                    reasoning.append("Your governance alignment helps ensure organizational compliance.")
            
            elif track_key == "innovation":
                if behavioral_patterns.get('creativity', 0) > 0.6:
                    reasoning.append("Your creativity drives innovation in security research and tool development.")
                if behavioral_patterns.get('automation_interest', 0) > 0.6:
                    reasoning.append("Your automation interest aligns with building security tools and solutions.")
                if behavioral_patterns.get('systems_thinking', 0) > 0.6:
                    reasoning.append("Your systems thinking helps you design comprehensive security solutions.")
            
            elif track_key == "leadership":
                if behavioral_patterns.get('communication', 0) > 0.6:
                    reasoning.append("Your strong communication skills are essential for leading security teams.")
                if behavioral_patterns.get('decision_clarity', 0) > 0.6:
                    reasoning.append("Your decision clarity helps you make strategic security decisions.")
                if behavioral_patterns.get('value_driven', 0) > 0.6:
                    reasoning.append("Your value-driven approach aligns security with business objectives.")
        
        # Fallback to generic reasoning if no behavioral patterns
        if not behavioral_patterns or len(reasoning) == 1:
            track_reasoning_map = {
                "defender": "You excel at protecting systems, monitoring threats, and responding to security incidents. Your approach focuses on defense-in-depth and proactive security operations.",
                "offensive": "You thrive in offensive security, penetration testing, and thinking like an attacker. Your skills align with ethical hacking and red team operations.",
                "innovation": "You have a strong passion for security research, developing new tools, and pushing the boundaries of security technology. Innovation and R&D are your strengths.",
                "leadership": "You excel at leading security teams, making strategic decisions, and aligning security with business objectives. Management and strategy are your core competencies.",
                "grc": "You are well-suited for governance, risk management, and compliance roles. Your strengths lie in understanding frameworks, regulations, and ensuring organizational compliance."
            }
            reasoning.append(track_reasoning_map.get(track_key, "Your responses align with this track's characteristics."))

        return reasoning

    def _get_strengths_aligned(self, track_key: str, scores: Dict[str, float]) -> List[str]:
        """Get strengths that align with a track."""
        strengths_map = {
            "defender": [
                "Incident Response & Forensics",
                "Security Monitoring & Detection",
                "Threat Intelligence & Hunting",
                "Defense-in-Depth Architecture"
            ],
            "offensive": [
                "Penetration Testing & Ethical Hacking",
                "Vulnerability Assessment & Exploitation",
                "Red Team Operations",
                "Security Testing & Validation"
            ],
            "innovation": [
                "Security Research & Development",
                "Tool Development & Automation",
                "Emerging Technology Innovation",
                "Cryptography & Advanced Security"
            ],
            "leadership": [
                "Security Program Management",
                "Strategic Planning & Decision-Making",
                "Team Leadership & Coordination",
                "Business Alignment & Risk Management"
            ],
            "grc": [
                "Compliance Frameworks & Standards",
                "Risk Assessment & Management",
                "Security Governance",
                "Audit & Control Validation"
            ]
        }
        return strengths_map.get(track_key, [])

    def _get_optimal_path(self, track_key: str) -> str:
        """Get optimal learning path description for a track."""
        paths_map = {
            "defender": "Start with SOC fundamentals, progress through incident response, then advance to threat hunting and security architecture.",
            "offensive": "Begin with ethical hacking basics, master penetration testing, then specialize in red team operations and exploit development.",
            "innovation": "Start with security research fundamentals, develop tool-building skills, then advance to cutting-edge research and development.",
            "leadership": "Begin with security program management, develop leadership skills, then progress to strategic security leadership and CISO roles.",
            "grc": "Start with compliance frameworks, master risk management, then advance to security governance and executive risk leadership."
        }
        return paths_map.get(track_key, "Follow the recommended curriculum for this track.")

    def generate_och_blueprint(self, session: ProfilingSession, result: ProfilingResult) -> Dict[str, Any]:
        """
        Generate Personalized OCH Blueprint document.
        Includes track recommendation, difficulty level, suggested starting point, and learning strategy.
        """
        primary_track = result.primary_track
        difficulty_info = getattr(session, 'difficulty_verification', {})
        selected_difficulty = difficulty_info.get('selected_difficulty', 'intermediate')
        value_statement = self.extract_value_statement(session)
        
        blueprint = {
            "user_id": session.user_id,
            "session_id": session.id,
            "generated_at": datetime.utcnow().isoformat(),
            "track_recommendation": {
                "primary_track": {
                    "key": primary_track.key,
                    "name": primary_track.name,
                    "description": primary_track.description,
                    "score": result.recommendations[0].score if result.recommendations else 0
                },
                "secondary_track": {
                    "key": result.secondary_track.key,
                    "name": result.secondary_track.name
                } if result.secondary_track else None
            },
            "difficulty_level": {
                "selected": selected_difficulty,
                "verified": difficulty_info.get('is_realistic', True),
                "confidence": difficulty_info.get('confidence', 'medium'),
                "suggested": difficulty_info.get('suggested_difficulty', selected_difficulty)
            },
            "suggested_starting_point": self._get_starting_point(primary_track.key, selected_difficulty),
            "learning_strategy": {
                "optimal_path": result.recommendations[0].optimal_path if result.recommendations else "",
                "foundations": result.deep_insights.recommended_foundations if result.deep_insights else [],
                "strengths_to_leverage": result.deep_insights.primary_strengths if result.deep_insights else [],
                "growth_opportunities": result.deep_insights.growth_opportunities if result.deep_insights else []
            },
            "value_statement": value_statement,
            "personalized_insights": {
                "learning_preferences": result.deep_insights.learning_preferences if result.deep_insights else {},
                "personality_traits": result.deep_insights.personality_traits if result.deep_insights else {},
                "career_alignment": result.deep_insights.career_alignment if result.deep_insights else {}
            },
            "next_steps": [
                "Begin Tier 1 Foundations for your recommended track",
                "Complete your first mission aligned with your difficulty level",
                "Build your portfolio starting with your value statement",
                "Connect with a mentor in your track",
                "Join your track's community discussions"
            ]
        }
        
        return blueprint

    def _get_starting_point(self, track_key: str, difficulty: str) -> str:
        """Get suggested starting point based on track and difficulty."""
        starting_points = {
            "defender": {
                "novice": "SOC Fundamentals - Introduction to Security Operations",
                "beginner": "SIEM Basics - Log Analysis and Alert Triage",
                "intermediate": "Incident Response - Threat Detection and Containment",
                "advanced": "Threat Hunting - Advanced Detection Techniques",
                "elite": "Security Architecture - Designing Defense Systems"
            },
            "offensive": {
                "novice": "Ethical Hacking Basics - Introduction to Penetration Testing",
                "beginner": "Web Application Security - OWASP Top 10",
                "intermediate": "Network Penetration Testing - Advanced Techniques",
                "advanced": "Red Team Operations - Adversarial Simulations",
                "elite": "Exploit Development - Advanced Vulnerability Research"
            },
            "innovation": {
                "novice": "Security Research Fundamentals - Introduction to R&D",
                "beginner": "Programming for Security - Tool Development Basics",
                "intermediate": "Security Tool Development - Building Custom Solutions",
                "advanced": "Advanced Research - Cutting-Edge Security Technologies",
                "elite": "Security Innovation Leadership - Research Team Management"
            },
            "leadership": {
                "novice": "Security Program Management Basics - Introduction to Leadership",
                "beginner": "Risk Management Fundamentals - Understanding Business Risk",
                "intermediate": "Team Leadership - Managing Security Teams",
                "advanced": "Strategic Security Leadership - CISO Preparation",
                "elite": "Executive Security Leadership - Board-Level Strategy"
            },
            "grc": {
                "novice": "Compliance Fundamentals - Introduction to GRC",
                "beginner": "Risk Assessment Basics - Understanding Risk Management",
                "intermediate": "Security Governance - Framework Implementation",
                "advanced": "Advanced Compliance - Multi-Framework Management",
                "elite": "Executive GRC Leadership - Strategic Risk Management"
            }
        }
        return starting_points.get(track_key, {}).get(difficulty, "Begin with Tier 1 Foundations")

    def _generate_deep_insights(self, session: ProfilingSession, scores: Dict[str, float], 
                                recommendations: List[TrackRecommendation]) -> DeepInsights:
        """Generate deep insights about the user's profile."""
        primary_track = recommendations[0].track_key if recommendations else None
        secondary_track = recommendations[1].track_key if len(recommendations) > 1 else None

        # Analyze response patterns
        category_patterns = defaultdict(list)
        for response in session.responses:
            question = self.question_map.get(response.question_id)
            if question:
                category_patterns[question.category].append(response.selected_option)

        # Determine learning preferences
        learning_preferences = {
            "preferred_approach": self._analyze_learning_approach(category_patterns),
            "problem_solving_style": self._analyze_problem_solving(category_patterns),
            "work_style_preference": self._analyze_work_style(category_patterns)
        }

        # Generate primary strengths
        primary_strengths = recommendations[0].strengths_aligned[:4] if recommendations else []

        # Career alignment
        career_alignment = {
            "primary_track": primary_track,
            "secondary_track": secondary_track,
            "career_readiness_score": round(recommendations[0].score, 1) if recommendations else 0,
            "career_paths": recommendations[0].career_suggestions[:3] if recommendations else []
        }

        # Optimal learning path
        optimal_learning_path = self._generate_learning_path(primary_track)

        # Recommended foundations
        foundations_map = {
            "defender": ["Network Security Fundamentals", "SIEM & Log Analysis", "Incident Response Basics", "Threat Intelligence"],
            "offensive": ["Ethical Hacking Fundamentals", "Web Application Security", "Network Penetration Testing", "Exploit Development Basics"],
            "innovation": ["Security Research Methods", "Programming & Scripting", "Cryptography Fundamentals", "Security Tool Development"],
            "leadership": ["Security Program Management", "Risk Management Fundamentals", "Team Leadership", "Business Communication"],
            "grc": ["Compliance Frameworks (ISO 27001, NIST)", "Risk Assessment Methods", "Security Governance", "Audit & Assessment"]
        }
        recommended_foundations = foundations_map.get(primary_track, [])

        # Growth opportunities
        growth_opportunities = self._identify_growth_opportunities(scores, primary_track)

        # Personality traits
        personality_traits = {
            "security_mindset": self._analyze_security_mindset(category_patterns),
            "collaboration_style": self._analyze_collaboration(category_patterns),
            "risk_tolerance": self._analyze_risk_tolerance(category_patterns)
        }

        return DeepInsights(
            primary_strengths=primary_strengths,
            learning_preferences=learning_preferences,
            career_alignment=career_alignment,
            optimal_learning_path=optimal_learning_path,
            recommended_foundations=recommended_foundations,
            growth_opportunities=growth_opportunities,
            personality_traits=personality_traits
        )

    def _analyze_learning_approach(self, category_patterns: Dict[str, List[str]]) -> str:
        """Analyze preferred learning approach."""
        if "technical_exposure" in category_patterns:
            patterns = category_patterns["technical_exposure"]
            if len(patterns) > 0:
                return "hands-on" if len([p for p in patterns if p in ["A", "B"]]) > len(patterns) / 2 else "research-based"
        return "balanced"

    def _analyze_problem_solving(self, category_patterns: Dict[str, List[str]]) -> str:
        """Analyze problem-solving style."""
        if "cyber_aptitude" in category_patterns:
            patterns = category_patterns["cyber_aptitude"]
            if len(patterns) > 0:
                return "systematic" if len([p for p in patterns if p in ["A", "B"]]) > len(patterns) / 2 else "adaptive"
        return "balanced"

    def _analyze_work_style(self, category_patterns: Dict[str, List[str]]) -> str:
        """Analyze work style preference."""
        if "work_style" in category_patterns:
            patterns = category_patterns["work_style"]
            if len(patterns) > 0:
                return "collaborative" if len([p for p in patterns if p in ["B", "D", "E"]]) > len(patterns) / 2 else "independent"
        return "balanced"

    def _generate_learning_path(self, track_key: Optional[str]) -> List[str]:
        """Generate optimal learning path steps."""
        paths_map = {
            "defender": [
                "Foundation: Network Security & SIEM Basics",
                "Intermediate: Incident Response & Forensics",
                "Advanced: Threat Hunting & Security Architecture",
                "Expert: Security Operations Leadership"
            ],
            "offensive": [
                "Foundation: Ethical Hacking & Web Security",
                "Intermediate: Penetration Testing & Exploitation",
                "Advanced: Red Team Operations & Advanced Exploitation",
                "Expert: Security Research & Vulnerability Discovery"
            ],
            "innovation": [
                "Foundation: Security Research Methods & Programming",
                "Intermediate: Security Tool Development",
                "Advanced: Advanced Research & Innovation",
                "Expert: Security Research Leadership & Innovation"
            ],
            "leadership": [
                "Foundation: Security Program Management Basics",
                "Intermediate: Risk Management & Team Leadership",
                "Advanced: Strategic Security Leadership",
                "Expert: CISO & Executive Security Leadership"
            ],
            "grc": [
                "Foundation: Compliance Frameworks & Risk Assessment",
                "Intermediate: Security Governance & Audit",
                "Advanced: Risk Management Leadership",
                "Expert: Executive GRC Leadership"
            ]
        }
        return paths_map.get(track_key, ["Follow recommended curriculum progression"])

    def _identify_growth_opportunities(self, scores: Dict[str, float], primary_track: Optional[str]) -> List[str]:
        """Identify areas for growth."""
        opportunities = []
        sorted_tracks = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        
        if len(sorted_tracks) >= 2:
            primary_score = sorted_tracks[0][1]
            secondary_score = sorted_tracks[1][1]
            
            if primary_score - secondary_score < 15:
                opportunities.append("Consider exploring complementary tracks to broaden your skillset")
        
        growth_map = {
            "defender": ["Offensive security knowledge for better defense", "GRC understanding for compliance"],
            "offensive": ["Defense fundamentals for comprehensive security", "Innovation for tool development"],
            "innovation": ["Practical security operations experience", "Leadership skills for research teams"],
            "leadership": ["Deep technical expertise in your domain", "GRC knowledge for comprehensive leadership"],
            "grc": ["Technical security knowledge", "Leadership skills for governance teams"]
        }
        
        opportunities.extend(growth_map.get(primary_track, []))
        return opportunities[:4]

    def _analyze_security_mindset(self, category_patterns: Dict[str, List[str]]) -> str:
        """Analyze security mindset."""
        if "identity_value" in category_patterns:
            patterns = category_patterns["identity_value"]
            if len(patterns) > 0:
                return "proactive" if len([p for p in patterns if p in ["A", "B"]]) > len(patterns) / 2 else "strategic"
        return "balanced"

    def _analyze_collaboration(self, category_patterns: Dict[str, List[str]]) -> str:
        """Analyze collaboration style."""
        if "work_style" in category_patterns:
            patterns = category_patterns["work_style"]
            if len(patterns) > 0:
                return "team-oriented" if len([p for p in patterns if p in ["B", "D"]]) > len(patterns) / 2 else "independent"
        return "balanced"

    def _analyze_risk_tolerance(self, category_patterns: Dict[str, List[str]]) -> str:
        """Analyze risk tolerance."""
        if "work_style" in category_patterns:
            patterns = category_patterns["work_style"]
            if len(patterns) > 0:
                return "calculated" if len([p for p in patterns if p in ["A", "C"]]) > len(patterns) / 2 else "balanced"
        return "moderate"
    
    def _analyze_work_style_cluster(self, work_style_responses: List) -> str:
        """Analyze work style cluster from responses."""
        if not work_style_responses:
            return "balanced"
        
        # Count response patterns
        collaborative_count = 0
        independent_count = 0
        
        for response in work_style_responses:
            question = self.question_map.get(response.question_id)
            if question:
                selected_option = response.selected_option
                # Options B, D, E typically indicate collaborative preferences
                if selected_option in ['B', 'D', 'E']:
                    collaborative_count += 1
                elif selected_option in ['A', 'C']:
                    independent_count += 1
        
        total = len(work_style_responses)
        if total == 0:
            return "balanced"
        
        collaborative_ratio = collaborative_count / total
        if collaborative_ratio > 0.6:
            return "collaborative"
        elif collaborative_ratio < 0.4:
            return "independent"
        else:
            return "balanced"

    def complete_session(self, session: ProfilingSession) -> ProfilingResult:
        """
        Complete a profiling session and generate comprehensive results.
        """
        if len(session.responses) < MIN_QUESTIONS_FOR_ASSESSMENT_ENHANCED:
            raise ValueError(f"Insufficient responses for assessment. Need at least {MIN_QUESTIONS_FOR_ASSESSMENT_ENHANCED} responses.")

        # Calculate scores
        scores = self.calculate_scores(session)
        session.scores = scores

        # Generate recommendations with behavioral pattern analysis
        recommendations = self.generate_recommendations(scores, session)

        # Determine primary and secondary tracks
        primary_recommendation = recommendations[0]
        primary_track = OCH_TRACKS[primary_recommendation.track_key]
        secondary_track = OCH_TRACKS[recommendations[1].track_key] if len(recommendations) > 1 and recommendations[1].score >= 40 else None
        
        session.recommended_track = primary_recommendation.track_key
        session.completed_at = datetime.utcnow()
        
        # Store telemetry data in session metadata
        if not hasattr(session, 'telemetry'):
            session.telemetry = {}
        
        # Calculate technical exposure score
        tech_exposure_responses = [
            r for r in session.responses
            if self.question_map.get(r.question_id, {}).category == "technical_exposure"
        ]
        tech_score = 0
        for response in tech_exposure_responses:
            question = self.question_map.get(response.question_id)
            if question:
                for option in question.options:
                    if option.value == response.selected_option:
                        max_score = max(option.scores.values(), default=0)
                        tech_score += max_score
        session.telemetry['technical_exposure_score'] = tech_score
        
        # Extract work style cluster
        work_style_responses = [
            r for r in session.responses
            if self.question_map.get(r.question_id, {}).category == "work_style"
        ]
        work_style_cluster = self._analyze_work_style_cluster(work_style_responses)
        session.telemetry['work_style_cluster'] = work_style_cluster
        
        # Store scenario choices
        scenario_responses = [
            {
                'question_id': r.question_id,
                'selected_option': r.selected_option,
                'response_time_ms': r.response_time_ms
            }
            for r in session.responses
            if self.question_map.get(r.question_id, {}).category == "scenario_preference"
        ]
        session.telemetry['scenario_choices'] = scenario_responses
        
        # Store difficulty selection
        difficulty_responses = [
            r for r in session.responses
            if self.question_map.get(r.question_id, {}).category == "difficulty_selection"
        ]
        if difficulty_responses:
            session.telemetry['difficulty_selection'] = difficulty_responses[0].selected_option
        
        # Store track alignment percentages
        session.telemetry['track_alignment_percentages'] = scores
        
        # Store completion status
        session.telemetry['completion_status'] = 'completed'

        # Generate deep insights
        deep_insights = self._generate_deep_insights(session, scores, recommendations)

        # Generate assessment summary
        assessment_summary = self._generate_assessment_summary(recommendations, deep_insights)

        result = ProfilingResult(
            user_id=session.user_id,
            session_id=session.id,
            recommendations=recommendations,
            primary_track=primary_track,
            secondary_track=secondary_track,
            assessment_summary=assessment_summary,
            deep_insights=deep_insights,
            completed_at=session.completed_at
        )

        return result

    def _generate_assessment_summary(self, recommendations: List[TrackRecommendation], 
                                   deep_insights: DeepInsights) -> str:
        """Generate comprehensive assessment summary."""
        primary = recommendations[0]
        secondary = recommendations[1] if len(recommendations) > 1 else None

        summary = f"Based on comprehensive analysis across 7 profiling modules, you are optimally suited for the **{primary.track_name}** track "
        summary += f"with a {primary.score:.1f}% alignment score. "

        if secondary and secondary.score >= 50:
            summary += f"You also demonstrate strong potential in **{secondary.track_name}** ({secondary.score:.1f}% match), "
            summary += "suggesting a versatile skill profile. "

        summary += "This assessment evaluated your identity & values, technical aptitude, experience, "
        summary += "scenario preferences, work style, and difficulty readiness. "
        
        summary += f"Your primary strengths align with {', '.join(deep_insights.primary_strengths[:2])}."

        return summary

    def get_progress(self, session: ProfilingSession) -> ProfilingProgress:
        """Get current progress in a profiling session."""
        total_questions = len(self.questions)
        answered_questions = len(session.responses)
        current_question = answered_questions + 1

        if answered_questions >= total_questions:
            progress_percentage = 100.0
            estimated_time_remaining = 0
        else:
            progress_percentage = (answered_questions / total_questions) * 100
            # Estimate 2 minutes per question for comprehensive questions
            estimated_time_remaining = (total_questions - answered_questions) * 120

        return ProfilingProgress(
            session_id=session.id,
            current_question=min(current_question, total_questions),
            total_questions=total_questions,
            progress_percentage=round(progress_percentage, 1),
            estimated_time_remaining=estimated_time_remaining
        )


# Global service instance
enhanced_profiling_service = EnhancedProfilingService()
