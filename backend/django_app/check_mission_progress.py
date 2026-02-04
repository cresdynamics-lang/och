#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from missions.models_mxp import MissionProgress
from missions.models import Mission
from users.models import User

def check_mission_progress():
    """Check if mission progress is being saved correctly"""
    
    user = User.objects.get(email='bob@student.com')
    mission_id = 'd198c657-2762-4a90-a64c-43571534eae1'
    
    try:
        progress = MissionProgress.objects.get(user=user, mission_id=mission_id)
        mission = Mission.objects.get(id=mission_id)
        
        print(f"Mission: {mission.code} - {mission.title}")
        print(f"Progress Status: {progress.status}")
        print(f"Current Subtask: {progress.current_subtask}")
        print(f"Subtasks Progress: {progress.subtasks_progress}")
        print(f"Total Subtasks: {len(mission.subtasks)}")
        
        # Check completion status
        completed_count = sum(
            1 for key, val in progress.subtasks_progress.items()
            if isinstance(val, dict) and val.get('completed', False)
        )
        
        print(f"Completed Subtasks: {completed_count}/{len(mission.subtasks)}")
        
        if completed_count == len(mission.subtasks):
            print('+ All subtasks completed - ready for submission')
        else:
            print(f'- {len(mission.subtasks) - completed_count} subtasks remaining')
            
    except MissionProgress.DoesNotExist:
        print('X No progress found for this mission')
    except Mission.DoesNotExist:
        print('X Mission not found')

if __name__ == '__main__':
    check_mission_progress()