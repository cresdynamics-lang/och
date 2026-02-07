"""
LLM Service for recipe generation and processing.
"""
import json
import uuid
import os
from typing import Dict, Any
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


def generate_recipe_with_llm(track_code: str, level: str, skill_code: str, goal_description: str) -> Dict[str, Any]:
    """
    Generate a recipe using LLM (OpenAI GPT) based on the provided parameters.
    """
    # Get API key from settings or environment
    api_key = getattr(settings, 'CHAT_GPT_API_KEY', None) or os.environ.get('CHAT_GPT_API_KEY')
    
    if not api_key or api_key == 'your-openai-api-key':
        logger.warning("No valid OpenAI API key configured, returning mock recipe")
        return _generate_mock_recipe(track_code, level, skill_code, goal_description)
    
    try:
        from openai import OpenAI
        
        client = OpenAI(api_key=api_key)
        
        # Construct the prompt
        prompt = f"""Generate a detailed cybersecurity training recipe for OCH Cyber Talent Engine.

PARAMETERS:
- Track Code: {track_code}
- Difficulty Level: {level}
- Skill Code: {skill_code}
- Goal: {goal_description}

OUTPUT REQUIREMENTS:
Generate a JSON object (NOT an array) with this EXACT structure:
{{
  "title": "Clear, specific recipe title",
  "slug": "{track_code}-{skill_code}-{level}".lower().replace('_', '-'),
  "description": "Detailed 2-3 sentence description of what the learner will accomplish",
  "expected_duration_minutes": 15-45 (realistic estimate),
  "prerequisites": ["List", "specific", "prerequisites"],
  "tools_and_environment": ["List", "required", "tools", "and", "environment"],
  "inputs": ["What", "the", "learner", "needs", "to", "start"],
  "steps": [
    {{
      "step_number": 1,
      "instruction": "Clear, actionable instruction with specific commands if applicable",
      "expected_outcome": "What should happen when this step succeeds",
      "evidence_hint": "How to verify/prove completion"
    }}
  ],
  "validation_checks": ["Final", "validation", "steps", "to", "confirm", "completion"]
}}

IMPORTANT:
- Make it specific to {skill_code} in the {track_code} track
- Include actual commands/code where appropriate
- Steps should be clear and actionable
- Validation should be concrete and measurable
- Focus on hands-on cybersecurity skills
- Use industry-standard tools and practices
- Ensure {level} difficulty is appropriate"""

        # Call OpenAI API
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert cybersecurity training content creator for OCH Cyber Talent Engine. Generate precise, hands-on learning recipes that teach specific skills through practical exercises. Always output valid JSON."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=2000
        )
        
        # Parse the response
        content = response.choices[0].message.content.strip()
        
        # Remove markdown code fences if present
        if content.startswith('```json'):
            content = content[7:]
        if content.startswith('```'):
            content = content[3:]
        if content.endswith('```'):
            content = content[:-3]
        content = content.strip()
        
        recipe_data = json.loads(content)
        
        logger.info(f"Successfully generated recipe for {track_code}/{skill_code}/{level}")
        return recipe_data
        
    except ImportError:
        logger.error("OpenAI package not installed. Install with: pip install openai")
        return _generate_mock_recipe(track_code, level, skill_code, goal_description)
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse LLM response as JSON: {e}")
        return _generate_mock_recipe(track_code, level, skill_code, goal_description)
    except Exception as e:
        logger.error(f"Error generating recipe with LLM: {str(e)}")
        return _generate_mock_recipe(track_code, level, skill_code, goal_description)


def _generate_mock_recipe(track_code: str, level: str, skill_code: str, goal_description: str) -> Dict[str, Any]:
    """Generate a mock recipe when LLM is not available."""
    recipe_slug = f"{track_code}-{skill_code}-{level}-{str(uuid.uuid4())[:8]}".lower().replace('_', '-')

    return {
        'title': f"{skill_code.replace('_', ' ').title()} - {level.title()} Level",
        'slug': recipe_slug,
        'description': f"Learn {skill_code} skills through hands-on practice. {goal_description}",
        'expected_duration_minutes': 20,
        'prerequisites': ['Basic command line familiarity', 'Understanding of basic cybersecurity concepts'],
        'tools_and_environment': ['Linux terminal', 'Text editor', 'Internet connection'],
        'inputs': ['Access to a Linux system or VM'],
        'steps': [
            {
                'step_number': 1,
                'instruction': f'Set up your environment for {skill_code} practice',
                'expected_outcome': 'Environment is configured and ready',
                'evidence_hint': 'Screenshot of terminal showing installed tools'
            },
            {
                'step_number': 2,
                'instruction': f'Execute the main {skill_code} task',
                'expected_outcome': 'Task completed successfully',
                'evidence_hint': 'Terminal output showing success message'
            },
            {
                'step_number': 3,
                'instruction': 'Verify your results and document findings',
                'expected_outcome': 'Results verified and documented',
                'evidence_hint': 'Screenshot or log file of results'
            }
        ],
        'validation_checks': [
            f'Verify that {skill_code} was implemented correctly',
            'Check for any errors in the output',
            'Confirm all steps were completed',
            'Review documentation for completeness'
        ]
    }


def normalize_recipe_content(raw_content: str, track_code: str, level: str, skill_code: str) -> Dict[str, Any]:
    """
    Normalize raw content into structured recipe format using LLM.
    """
    # Placeholder implementation
    # In production, this would process the raw content with LLM

    return {
        'title': f"Normalized {skill_code} Recipe",
        'slug': f"{track_code}-{skill_code}-{level}".lower(),
        'description': f"Processed recipe for {skill_code}",
        'expected_duration_minutes': 25,
        'prerequisites': ['Basic knowledge'],
        'tools_and_environment': ['Standard tools'],
        'inputs': ['Required inputs'],
        'steps': [
            {
                'step_number': 1,
                'instruction': 'Process the content',
                'expected_outcome': 'Content normalized',
                'evidence_hint': 'Structured output'
            }
        ],
        'validation_checks': ['Verify correctness']
    }


def validate_recipe_commands(recipe_data: Dict[str, Any]) -> bool:
    """
    Validate that recipe commands are syntactically correct and safe.
    """
    # Placeholder validation
    # In production, this would check command syntax and security

    steps = recipe_data.get('steps', [])
    if not steps:
        return False

    # Basic validation - ensure all required fields are present
    for step in steps:
        if not all(key in step for key in ['step_number', 'instruction', 'expected_outcome']):
            return False

    return True

