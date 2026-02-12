"""
GPT-powered profiler analysis service.
Uses OpenAI to analyze user responses and recommend tracks from database.
Generates personalized descriptions, reasoning, and Future-You personas.
"""
import os
import logging
import json
from typing import Dict, List, Any, Optional
from openai import OpenAI

logger = logging.getLogger(__name__)

class GPTProfilerService:
    def __init__(self):
        self.api_key = os.getenv('CHAT_GPT_API_KEY') or os.getenv('OPENAI_API_KEY')
        self.client = None
        if self.api_key:
            self.client = OpenAI(api_key=self.api_key)
            logger.info("GPT Profiler Service initialized with OpenAI")
    
    def analyze_and_recommend(
        self, 
        responses: List[Dict[str, Any]], 
        available_tracks: List[Dict[str, Any]],
        user_reflection: Dict[str, str] = None
    ) -> Dict[str, Any]:
        """
        Use GPT to analyze responses and recommend best track from database.
        
        Args:
            responses: List of user responses with questions and answers
            available_tracks: List of tracks from database
            user_reflection: Optional reflection responses
            
        Returns:
            {
                "recommended_track": track_key,
                "reasoning": "Why this track...",
                "confidence": 0.95,
                "alternative_tracks": [...],
                "personalized_message": "Based on your responses..."
            }
        """
        if not self.api_key:
            logger.warning("No OpenAI API key found, using fallback")
            return self._fallback_recommendation(available_tracks)
        
        if not self.client:
            logger.warning("OpenAI client not initialized")
            return self._fallback_recommendation(available_tracks)

        try:
            # Build prompt
            prompt = self._build_analysis_prompt(responses, available_tracks, user_reflection)

            # Call GPT using modern client
            response = self.client.chat.completions.create(
                model=os.getenv("AI_COACH_MODEL", "gpt-4o-mini"),
                messages=[
                    {"role": "system", "content": "You are an expert cybersecurity career advisor analyzing profiling responses to recommend the best career track."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=800
            )

            result = response.choices[0].message.content

            # Parse GPT response
            return self._parse_gpt_response(result, available_tracks)

        except Exception as e:
            logger.error(f"GPT analysis failed: {e}")
            return self._fallback_recommendation(available_tracks)
    
    def _build_analysis_prompt(
        self, 
        responses: List[Dict], 
        tracks: List[Dict],
        reflection: Dict = None
    ) -> str:
        """Build prompt for GPT analysis."""
        
        # Format responses
        responses_text = "\n".join([
            f"Q: {r.get('question', 'N/A')}\nA: {r.get('answer', 'N/A')}"
            for r in responses[:20]  # Limit to avoid token limits
        ])
        
        # Format tracks
        tracks_text = "\n".join([
            f"- {t['key']}: {t['name']}\n  Description: {t.get('description', 'N/A')}"
            for t in tracks
        ])
        
        # Add reflection if available
        reflection_text = ""
        if reflection:
            reflection_text = f"\n\nUser Reflection:\nWhy Cybersecurity: {reflection.get('why_cyber', 'N/A')}\nGoals: {reflection.get('what_achieve', 'N/A')}"
        
        prompt = f"""Analyze these profiling responses and recommend the BEST cybersecurity track from the available options.

USER RESPONSES:
{responses_text}
{reflection_text}

AVAILABLE TRACKS:
{tracks_text}

Based on the responses, recommend:
1. The BEST track (use exact track key from list above)
2. Why this track fits (2-3 sentences)
3. Confidence level (0-1)
4. 1-2 alternative tracks
5. A personalized welcome message (2-3 sentences)

Format your response as:
TRACK: [track_key]
REASONING: [why this track]
CONFIDENCE: [0.0-1.0]
ALTERNATIVES: [track_key1, track_key2]
MESSAGE: [personalized message]"""
        
        return prompt
    
    def _parse_gpt_response(self, gpt_text: str, tracks: List[Dict]) -> Dict[str, Any]:
        """Parse GPT response into structured format."""
        lines = gpt_text.strip().split('\n')
        result = {
            "recommended_track": None,
            "reasoning": "",
            "confidence": 0.8,
            "alternative_tracks": [],
            "personalized_message": ""
        }
        
        for line in lines:
            if line.startswith('TRACK:'):
                track_key = line.replace('TRACK:', '').strip()
                result["recommended_track"] = track_key
            elif line.startswith('REASONING:'):
                result["reasoning"] = line.replace('REASONING:', '').strip()
            elif line.startswith('CONFIDENCE:'):
                try:
                    result["confidence"] = float(line.replace('CONFIDENCE:', '').strip())
                except:
                    result["confidence"] = 0.8
            elif line.startswith('ALTERNATIVES:'):
                alts = line.replace('ALTERNATIVES:', '').strip()
                result["alternative_tracks"] = [a.strip() for a in alts.split(',')]
            elif line.startswith('MESSAGE:'):
                result["personalized_message"] = line.replace('MESSAGE:', '').strip()
        
        # Validate track exists
        track_keys = [t['key'] for t in tracks]
        if result["recommended_track"] not in track_keys:
            result["recommended_track"] = track_keys[0] if track_keys else None
        
        return result
    
    def generate_personalized_descriptions(
        self,
        responses: List[Dict[str, Any]],
        tracks: List[Dict[str, Any]],
        scores: Dict[str, float]
    ) -> Dict[str, str]:
        """
        Generate personalized track descriptions based on user responses.
        Returns a dict mapping track_key -> personalized_description
        """
        if not self.client:
            return {t['key']: t.get('description', '') for t in tracks}

        try:
            # Build condensed user profile
            profile_summary = self._summarize_responses(responses)

            # Build prompt for personalized descriptions
            tracks_list = "\n".join([f"- {t['key']}: {t['name']}" for t in tracks])
            scores_list = "\n".join([f"- {k}: {v:.1f}%" for k, v in sorted(scores.items(), key=lambda x: x[1], reverse=True)])

            prompt = f"""Based on this user's profiling assessment, write personalized descriptions for each cybersecurity track explaining how the track aligns with THEIR specific interests and responses.

USER PROFILE SUMMARY:
{profile_summary}

TRACK ALIGNMENT SCORES:
{scores_list}

TRACKS:
{tracks_list}

For EACH track, write a 2-3 sentence personalized description that:
1. Connects to specific aspects of their responses
2. Explains why this track could be a good fit (or not)
3. Highlights relevant strengths or growth opportunities

Format as JSON:
{{
  "track_key": "Personalized description here...",
  ...
}}"""

            response = self.client.chat.completions.create(
                model=os.getenv("AI_COACH_MODEL", "gpt-4o-mini"),
                messages=[
                    {"role": "system", "content": "You are a cybersecurity career advisor. Write personalized, encouraging track descriptions."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.8,
                max_tokens=1000
            )

            result = response.choices[0].message.content

            # Parse JSON response
            try:
                descriptions = json.loads(result)
                return descriptions
            except json.JSONDecodeError:
                # Fallback parsing
                logger.warning("Failed to parse GPT JSON, using defaults")
                return {t['key']: t.get('description', '') for t in tracks}

        except Exception as e:
            logger.error(f"Failed to generate personalized descriptions: {e}")
            return {t['key']: t.get('description', '') for t in tracks}

    def _summarize_responses(self, responses: List[Dict]) -> str:
        """Create a concise summary of user responses."""
        summary_points = []

        # Extract key response patterns
        for r in responses[:15]:  # Limit to first 15
            q = r.get('question', '')
            a = r.get('answer', '')
            if q and a:
                summary_points.append(f"• {q[:60]}... → {a[:40]}")

        return "\n".join(summary_points)

    def generate_future_you_persona(
        self,
        responses: List[Dict[str, Any]],
        recommended_track: str,
        track_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate enhanced Future-You persona with AI.
        Returns persona with name, archetype, skills, vision, etc.
        """
        if not self.client:
            return self._fallback_persona(recommended_track)

        try:
            profile_summary = self._summarize_responses(responses)

            prompt = f"""Based on this user's profiling responses and recommended track, create an inspiring "Future-You" persona representing their cybersecurity career potential.

USER RESPONSES SUMMARY:
{profile_summary}

RECOMMENDED TRACK: {recommended_track}
TRACK INFO: {track_info.get('name', '')} - {track_info.get('description', '')}

Create a Future-You persona with:
1. A creative persona name (e.g., "Cyber Sentinel", "Threat Hunter", "Security Architect")
2. An archetype (Defender, Hunter, Analyst, Architect, Leader, Innovator)
3. 5-7 specific technical skills they'll master
4. 3-4 key strengths based on their responses
5. A career vision statement (2-3 sentences)
6. Confidence level (0.8-1.0)

Format as JSON:
{{
  "name": "Persona Name",
  "archetype": "Archetype",
  "projected_skills": ["skill1", "skill2", ...],
  "strengths": ["strength1", "strength2", ...],
  "career_vision": "Vision statement...",
  "confidence": 0.95,
  "track": "{recommended_track}"
}}"""

            response = self.client.chat.completions.create(
                model=os.getenv("AI_COACH_MODEL", "gpt-4o-mini"),
                messages=[
                    {"role": "system", "content": "You are an inspiring cybersecurity career coach. Create motivational, realistic Future-You personas."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.9,
                max_tokens=600
            )

            result = response.choices[0].message.content

            try:
                persona = json.loads(result)
                return persona
            except json.JSONDecodeError:
                logger.warning("Failed to parse persona JSON")
                return self._fallback_persona(recommended_track)

        except Exception as e:
            logger.error(f"Failed to generate Future-You persona: {e}")
            return self._fallback_persona(recommended_track)

    def _fallback_persona(self, track: str) -> Dict[str, Any]:
        """Fallback persona when AI is unavailable."""
        personas = {
            "defensive-security": {"name": "Cyber Sentinel", "archetype": "Defender"},
            "offensive-security": {"name": "Threat Hunter", "archetype": "Hunter"},
            "grc": {"name": "Compliance Guardian", "archetype": "Analyst"},
            "innovation": {"name": "Security Innovator", "archetype": "Innovator"},
            "leadership": {"name": "Security Leader", "archetype": "Leader"}
        }

        default = personas.get(track, {"name": "Cyber Professional", "archetype": "Defender"})
        return {
            **default,
            "projected_skills": ["SIEM", "Incident Response", "Threat Analysis", "Security Operations"],
            "strengths": ["Analytical thinking", "Problem solving", "Attention to detail"],
            "career_vision": "You'll protect organizations from cyber threats and build a rewarding security career.",
            "confidence": 0.75,
            "track": track
        }

    def _fallback_recommendation(self, tracks: List[Dict]) -> Dict[str, Any]:
        """Fallback when GPT is unavailable."""
        return {
            "recommended_track": tracks[0]['key'] if tracks else None,
            "reasoning": "Based on your responses, this track aligns with your profile.",
            "confidence": 0.7,
            "alternative_tracks": [t['key'] for t in tracks[1:3]] if len(tracks) > 1 else [],
            "personalized_message": "Welcome to your cybersecurity journey! This track will help you develop the skills you need."
        }

gpt_profiler_service = GPTProfilerService()
