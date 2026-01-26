"""
Enhanced AI Profiling service for OCH track assessment.
Maps users to 5 specific cybersecurity tracks: defender, offensive, innovation, leadership, grc
"""
import uuid
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime
from collections import defaultdict

from schemas.profiling import (
    ProfilingSession, ProfilingResponse, TrackRecommendation,
    ProfilingResult, ProfilingProgress, DeepInsights, TrackInfo
)
from schemas.profiling_tracks import OCH_TRACKS
from schemas.profiling_questions import (
    ALL_PROFILING_QUESTIONS, CATEGORY_WEIGHTS,
    MIN_QUESTIONS_FOR_ASSESSMENT
)


class ProfilingService:
    """
    Enhanced service for handling AI-based profiling and track recommendations.
    Uses weighted scoring and deep insights to map users to 5 cybersecurity tracks.
    """

    def __init__(self):
        self.questions = ALL_PROFILING_QUESTIONS
        self.question_map = {q.id: q for q in self.questions}

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

    def get_question(self, question_id: str) -> Optional[Dict]:
        """Get a question by ID."""
        question = self.question_map.get(question_id)
        if not question:
            return None

        return {
            "id": question.id,
            "question": question.question,
            "category": question.category,
            "options": [
                {"value": opt.value, "text": opt.text}
                for opt in question.options
            ]
        }

    def get_all_questions(self) -> List[Dict]:
        """Get all profiling questions in order."""
        return [self.get_question(q.id) for q in self.questions]

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

    def calculate_scores(self, session: ProfilingSession) -> Dict[str, float]:
        """
        Calculate track scores based on user responses with weighted categories.

        Args:
            session: Profiling session with responses

        Returns:
            Dictionary mapping track keys to normalized scores (0-100)
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

            # Apply category weight
            weight = CATEGORY_WEIGHTS.get(question.category, 1.0)
            category_counts[question.category] += 1

            # Add weighted scores
            for track, score in selected_option_data.scores.items():
                scores[track] += score * weight

        # Enhanced normalization: scale to 0-100 range
        max_possible_score = sum(
            max(opt.scores.values(), default=0) * CATEGORY_WEIGHTS.get(cat, 1.0)
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

    def generate_recommendations(self, scores: Dict[str, float]) -> List[TrackRecommendation]:
        """
        Generate track recommendations with strengths and optimal paths.

        Args:
            scores: Dictionary of track scores

        Returns:
            List of track recommendations
        """
        recommendations = []

        sorted_tracks = sorted(scores.items(), key=lambda x: x[1], reverse=True)

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

            reasoning = self._generate_reasoning(track_key, score, i + 1, scores)
            strengths_aligned = self._get_strengths_aligned(track_key, scores)
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

    def _generate_reasoning(self, track_key: str, score: float, rank: int, all_scores: Dict[str, float]) -> List[str]:
        """Generate reasoning text for a track recommendation."""
        track_info = OCH_TRACKS[track_key]
        reasoning = []

        if rank == 1:
            reasoning.append(f"Your responses show a strong alignment with the {track_info.name} track ({score:.1f}% match).")
        elif rank == 2:
            reasoning.append(f"You demonstrate solid potential in the {track_info.name} track ({score:.1f}% match).")
        else:
            reasoning.append(f"You show some alignment with {track_info.name} characteristics ({score:.1f}% match).")

        # Track-specific reasoning for the 5 cybersecurity tracks
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
        """Get strengths that align with a track based on scoring patterns."""
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

    def _generate_deep_insights(self, session: ProfilingSession, scores: Dict[str, float], recommendations: List[TrackRecommendation]) -> DeepInsights:
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
        """Analyze preferred learning approach from responses."""
        if "technical_aptitude" in category_patterns:
            patterns = category_patterns["technical_aptitude"]
            if len(patterns) > 0:
                # Simple heuristic based on response patterns
                return "hands-on" if len([p for p in patterns if p in ["A", "B"]]) > len(patterns) / 2 else "research-based"
        return "balanced"

    def _analyze_problem_solving(self, category_patterns: Dict[str, List[str]]) -> str:
        """Analyze problem-solving style."""
        if "problem_solving" in category_patterns:
            patterns = category_patterns["problem_solving"]
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
        """Identify areas for growth based on score patterns."""
        opportunities = []
        sorted_tracks = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        
        # If there's a significant gap between primary and secondary
        if len(sorted_tracks) >= 2:
            primary_score = sorted_tracks[0][1]
            secondary_score = sorted_tracks[1][1]
            
            if primary_score - secondary_score < 15:
                opportunities.append("Consider exploring complementary tracks to broaden your skillset")
        
        # Track-specific growth areas
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
        """Analyze security mindset from cybersecurity_mindset questions."""
        if "cybersecurity_mindset" in category_patterns:
            patterns = category_patterns["cybersecurity_mindset"]
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

    def complete_session(self, session: ProfilingSession) -> ProfilingResult:
        """
        Complete a profiling session and generate comprehensive results with deep insights.

        Args:
            session: Profiling session to complete

        Returns:
            ProfilingResult: Complete assessment results with deep insights
        """
        if len(session.responses) < MIN_QUESTIONS_FOR_ASSESSMENT:
            raise ValueError(f"Insufficient responses for assessment. Need at least {MIN_QUESTIONS_FOR_ASSESSMENT} responses.")

        # Calculate scores
        scores = self.calculate_scores(session)
        session.scores = scores

        # Generate recommendations
        recommendations = self.generate_recommendations(scores)

        # Determine primary and secondary tracks
        primary_recommendation = recommendations[0]
        primary_track = OCH_TRACKS[primary_recommendation.track_key]
        secondary_track = OCH_TRACKS[recommendations[1].track_key] if len(recommendations) > 1 and recommendations[1].score >= 40 else None
        
        session.recommended_track = primary_recommendation.track_key
        session.completed_at = datetime.utcnow()

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

    def _generate_assessment_summary(self, recommendations: List[TrackRecommendation], deep_insights: DeepInsights) -> str:
        """Generate a comprehensive assessment summary."""
        primary = recommendations[0]
        secondary = recommendations[1] if len(recommendations) > 1 else None

        summary = f"Based on comprehensive analysis of your responses, you are optimally suited for the **{primary.track_name}** track "
        summary += f"with a {primary.score:.1f}% alignment score. "

        if secondary and secondary.score >= 50:
            summary += f"You also demonstrate strong potential in **{secondary.track_name}** ({secondary.score:.1f}% match), "
            summary += "suggesting a versatile skill profile. "

        summary += "This assessment evaluated your technical aptitude, problem-solving approach, "
        summary += "scenario preferences, work style, and cybersecurity mindset across {len(ALL_PROFILING_QUESTIONS)} dimensions. "
        
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
            # Estimate 2.5 minutes per question for deeper questions
            estimated_time_remaining = (total_questions - answered_questions) * 150

        return ProfilingProgress(
            session_id=session.id,
            current_question=min(current_question, total_questions),
            total_questions=total_questions,
            progress_percentage=round(progress_percentage, 1),
            estimated_time_remaining=estimated_time_remaining
        )


# Global service instance
profiling_service = ProfilingService()
