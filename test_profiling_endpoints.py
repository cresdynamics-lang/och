"""
Test script for OCH Profiling API Endpoints
Tests both Django and FastAPI profiling endpoints with student credentials
"""
import requests
import json
from datetime import datetime

# Configuration
DJANGO_BASE_URL = "http://localhost:8000"
FASTAPI_BASE_URL = "http://localhost:8001"
STUDENT_EMAIL = "student@example.com"
STUDENT_PASSWORD = "student123"

# Color codes for output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    END = '\033[0m'
    BOLD = '\033[1m'

def print_section(title):
    """Print a formatted section header"""
    print(f"\n{Colors.BOLD}{Colors.CYAN}{'='*80}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.CYAN}{title.center(80)}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.CYAN}{'='*80}{Colors.END}\n")

def print_success(message):
    """Print success message"""
    print(f"{Colors.GREEN}[PASS] {message}{Colors.END}")

def print_error(message):
    """Print error message"""
    print(f"{Colors.RED}[FAIL] {message}{Colors.END}")

def print_warning(message):
    """Print warning message"""
    print(f"{Colors.YELLOW}[WARN] {message}{Colors.END}")

def print_info(message):
    """Print info message"""
    print(f"{Colors.BLUE}[INFO] {message}{Colors.END}")

def print_json(data, max_depth=3):
    """Print JSON data in a readable format"""
    print(json.dumps(data, indent=2)[:1000])  # Limit output size

# Step 1: Login to Django to get auth token
def login_student():
    """Login as student and get authentication token"""
    print_section("STEP 1: Authentication - Login to Django")
    
    try:
        response = requests.post(
            f"{DJANGO_BASE_URL}/api/v1/auth/login",
            json={
                "email": STUDENT_EMAIL,
                "password": STUDENT_PASSWORD
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            token = data.get('access_token') or data.get('token')
            user_data = data.get('user', {})
            
            print_success(f"Login successful!")
            print_info(f"User: {user_data.get('email')}")
            print_info(f"User ID: {user_data.get('id')}")
            print_info(f"Profiling Complete: {user_data.get('profiling_complete')}")
            print_info(f"Token: {token[:50]}...")
            
            return token, user_data
        else:
            print_error(f"Login failed: {response.status_code}")
            print_error(f"Response: {response.text}")
            return None, None
            
    except Exception as e:
        print_error(f"Login error: {str(e)}")
        return None, None

# Step 2: Test Django profiling status
def test_django_profiling_status(token):
    """Test Django profiling status endpoint"""
    print_section("STEP 2: Django - Check Profiling Status")
    
    try:
        response = requests.get(
            f"{DJANGO_BASE_URL}/api/v1/profiler/status",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success("Django profiling status retrieved")
            print_json(data)
            return data
        else:
            print_error(f"Failed: {response.status_code}")
            print_error(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return None

# Step 3: Test FastAPI profiling status
def test_fastapi_profiling_status(token):
    """Test FastAPI profiling status endpoint"""
    print_section("STEP 3: FastAPI - Check Profiling Status")
    
    try:
        response = requests.get(
            f"{FASTAPI_BASE_URL}/api/v1/profiling/status",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success("FastAPI profiling status retrieved")
            print_json(data)
            return data
        else:
            print_error(f"Failed: {response.status_code}")
            print_error(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return None

# Step 4: Test getting profiling questions
def test_get_questions(token):
    """Test getting profiling questions"""
    print_section("STEP 4: FastAPI - Get Profiling Questions")
    
    try:
        response = requests.get(
            f"{FASTAPI_BASE_URL}/api/v1/profiling/questions",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        
        if response.status_code == 200:
            questions = response.json()
            print_success(f"Retrieved {len(questions)} profiling questions")
            
            # Show first 3 questions
            for i, q in enumerate(questions[:3]):
                print_info(f"\nQuestion {i+1}:")
                print(f"  ID: {q.get('id')}")
                print(f"  Text: {q.get('question_text', '')[:100]}...")
                print(f"  Type: {q.get('question_type')}")
                print(f"  Options: {len(q.get('options', []))}")
            
            if len(questions) > 3:
                print_info(f"... and {len(questions) - 3} more questions")
            
            return questions
        else:
            print_error(f"Failed: {response.status_code}")
            print_error(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return None

# Step 5: Test getting enhanced questions
def test_get_enhanced_questions(token):
    """Test getting enhanced profiling questions by module"""
    print_section("STEP 5: FastAPI - Get Enhanced Profiling Questions")
    
    try:
        response = requests.get(
            f"{FASTAPI_BASE_URL}/api/v1/profiling/enhanced/questions",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            questions = data.get('questions', {})
            
            print_success(f"Retrieved enhanced questions")
            print_info(f"Total questions: {data.get('total_questions', 0)}")
            print_info(f"Modules: {len(questions)}")
            
            # Show module breakdown
            for module_name, module_questions in questions.items():
                print_info(f"\n  {module_name}: {len(module_questions)} questions")
                if module_questions:
                    first_q = module_questions[0]
                    print(f"    Example: {first_q.get('question_text', '')[:80]}...")
            
            return data
        else:
            print_error(f"Failed: {response.status_code}")
            print_error(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return None

# Step 6: Test getting available tracks
def test_get_tracks(token):
    """Test getting available career tracks"""
    print_section("STEP 6: FastAPI - Get Available Career Tracks")
    
    try:
        response = requests.get(
            f"{FASTAPI_BASE_URL}/api/v1/profiling/tracks",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            tracks = data.get('tracks', {})
            
            print_success(f"Retrieved {len(tracks)} career tracks")
            
            # Show track details
            for track_key, track_info in tracks.items():
                print_info(f"\n  {track_key}:")
                print(f"    Name: {track_info.get('name')}")
                print(f"    Description: {track_info.get('description', '')[:80]}...")
                
            return tracks
        else:
            print_error(f"Failed: {response.status_code}")
            print_error(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return None

# Step 7: Test starting a new profiling session
def test_start_session(token):
    """Test starting a new profiling session"""
    print_section("STEP 7: FastAPI - Start New Profiling Session")
    
    print_warning("This will create a new profiling session. Proceed? (y/n)")
    # Auto-proceed for testing
    print_info("Auto-proceeding...")
    
    try:
        response = requests.post(
            f"{FASTAPI_BASE_URL}/api/v1/profiling/session/start",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            session_id = data.get('session_id')
            
            print_success(f"Session started successfully!")
            print_info(f"Session ID: {session_id}")
            print_info(f"Status: {data.get('status')}")
            print_json(data.get('progress', {}))
            
            return session_id, data
        else:
            print_error(f"Failed: {response.status_code}")
            print_error(f"Response: {response.text}")
            return None, None
            
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return None, None

# Summary
def print_test_summary(results):
    """Print test summary"""
    print_section("TEST SUMMARY")
    
    total = len(results)
    passed = sum(1 for r in results.values() if r)
    failed = total - passed
    
    print(f"Total Tests: {total}")
    print_success(f"Passed: {passed}")
    if failed > 0:
        print_error(f"Failed: {failed}")
    else:
        print_success("All tests passed!")
    
    print("\nDetailed Results:")
    for test_name, result in results.items():
        status = "[PASS]" if result else "[FAIL]"
        color = Colors.GREEN if result else Colors.RED
        print(f"  {color}{status}{Colors.END} - {test_name}")

# Main execution
def main():
    print(f"\n{Colors.BOLD}{Colors.BLUE}")
    print("=" * 80)
    print("OCH PROFILING API ENDPOINT TEST SUITE".center(80))
    print(f"Testing at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}".center(80))
    print("=" * 80)
    print(Colors.END)
    
    results = {}
    
    # Step 1: Login
    token, user_data = login_student()
    results['Login'] = token is not None
    
    if not token:
        print_error("\n❌ Cannot proceed without authentication token")
        print_test_summary(results)
        return
    
    # Step 2-7: Test endpoints
    results['Django Profiling Status'] = test_django_profiling_status(token) is not None
    results['FastAPI Profiling Status'] = test_fastapi_profiling_status(token) is not None
    results['Get Questions'] = test_get_questions(token) is not None
    results['Get Enhanced Questions'] = test_get_enhanced_questions(token) is not None
    results['Get Tracks'] = test_get_tracks(token) is not None
    
    session_id, session_data = test_start_session(token)
    results['Start Session'] = session_id is not None
    
    # Summary
    print_test_summary(results)
    
    # Save results to file
    output_file = "profiling_test_results.json"
    with open(output_file, 'w') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'results': results,
            'user': user_data,
            'session_id': session_id
        }, f, indent=2)
    
    print_info(f"\nResults saved to: {output_file}")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print_warning("\n\nTest interrupted by user")
    except Exception as e:
        print_error(f"\n\nUnexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
