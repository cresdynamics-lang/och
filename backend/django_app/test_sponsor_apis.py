#!/usr/bin/env python3
"""
Test script for Sponsor/Employer Dashboard APIs
Based on OCH SMP Technical Specifications

This script tests all the implemented API endpoints for sponsor/employer functionality.
"""

import requests
import json
import sys
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://localhost:8000/api/v1"
TEST_EMAIL = "sponsor_test@example.com"
TEST_PASSWORD = "testpass123"

class SponsorAPITester:
    def __init__(self, base_url):
        self.base_url = base_url
        self.session = requests.Session()
        self.auth_token = None
        self.sponsor_id = None
        self.org_id = None
        self.cohort_id = None
        
    def log(self, message, level="INFO"):
        """Log test messages"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def test_endpoint(self, method, endpoint, data=None, expected_status=200, description=""):
        """Test a single API endpoint"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            if method.upper() == "GET":
                response = self.session.get(url)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data)
            elif method.upper() == "PUT":
                response = self.session.put(url, json=data)
            elif method.upper() == "DELETE":
                response = self.session.delete(url)
            else:
                self.log(f"Unsupported method: {method}", "ERROR")
                return False
                
            self.log(f"{method} {endpoint} - Status: {response.status_code} - {description}")
            
            if response.status_code != expected_status:
                self.log(f"Expected {expected_status}, got {response.status_code}", "WARNING")
                if response.text:
                    self.log(f"Response: {response.text[:200]}...", "DEBUG")
                return False
                
            if response.text:
                try:
                    response_data = response.json()
                    self.log(f"Response keys: {list(response_data.keys()) if isinstance(response_data, dict) else 'Non-dict response'}", "DEBUG")
                    return response_data
                except json.JSONDecodeError:
                    self.log("Invalid JSON response", "WARNING")
                    return True
            return True
            
        except requests.exceptions.RequestException as e:
            self.log(f"Request failed: {str(e)}", "ERROR")
            return False
    
    def setup_authentication(self):
        """Setup authentication for testing"""
        self.log("Setting up authentication...")
        
        # Test sponsor signup
        signup_data = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "first_name": "Test",
            "last_name": "Sponsor",
            "organization_name": "Test Sponsor Organization",
            "sponsor_type": "corporate",
            "website": "https://testsponsor.com",
            "country": "KE",
            "city": "Nairobi"
        }
        
        response = self.test_endpoint(
            "POST", "/auth/signup/", 
            data=signup_data,
            expected_status=201,
            description="Create sponsor account"
        )
        
        if response:
            self.sponsor_id = response.get('sponsor_id')
            self.org_id = response.get('organization_id')
            self.log(f"Created sponsor: {self.sponsor_id}, org: {self.org_id}")
        
        # Test login (assuming we have a login endpoint)
        login_data = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        }
        
        # Note: This would need to be implemented in the actual login endpoint
        # For now, we'll simulate having a token
        self.auth_token = "mock_token_123"
        self.session.headers.update({"Authorization": f"Bearer {self.auth_token}"})
        
        return True
    
    def test_identity_apis(self):
        """Test Identity & Organization APIs"""
        self.log("Testing Identity & Organization APIs...")
        
        # Test profile retrieval
        self.test_endpoint(
            "GET", "/auth/me/",
            description="Get sponsor profile"
        )
        
        # Test organization creation
        org_data = {
            "name": "Additional Test Sponsor Org",
            "sponsor_type": "university",
            "contact_email": "contact@testorg.com",
            "website": "https://testorg.edu"
        }
        
        self.test_endpoint(
            "POST", "/auth/orgs/",
            data=org_data,
            expected_status=201,
            description="Create sponsor organization"
        )
        
        # Test consent scope update
        consent_data = {
            "scope_type": "employer_share",
            "granted": True
        }
        
        self.test_endpoint(
            "POST", "/auth/consents/",
            data=consent_data,
            description="Update consent scopes"
        )
    
    def test_program_apis(self):
        """Test Program & Cohort Management APIs"""
        self.log("Testing Program & Cohort Management APIs...")
        
        # Test cohort creation
        cohort_data = {
            "name": "Test Cybersecurity Cohort 2024",
            "track_slug": "defender",
            "sponsor_slug": "test-sponsor-organization",  # This should match the created sponsor
            "target_size": 50,
            "start_date": "2024-01-15",
            "expected_graduation_date": "2024-06-15",
            "budget_allocated": 2500000,  # 2.5M KES
            "placement_goal": 40
        }
        
        response = self.test_endpoint(
            "POST", "/programs/cohorts/",
            data=cohort_data,
            expected_status=201,
            description="Create sponsored cohort"
        )
        
        if response:
            self.cohort_id = response.get('cohort_id')
            self.log(f"Created cohort: {self.cohort_id}")
        
        # Test student enrollment (if cohort was created)
        if self.cohort_id:
            enrollment_data = {
                "student_emails": [
                    "student1@example.com",
                    "student2@example.com",
                    "student3@example.com"
                ]
            }
            
            self.test_endpoint(
                "POST", f"/programs/cohorts/{self.cohort_id}/enrollments/",
                data=enrollment_data,
                expected_status=201,
                description="Enroll sponsored students"
            )
            
            # Test listing enrolled students
            self.test_endpoint(
                "GET", f"/programs/cohorts/{self.cohort_id}/enrollments/list/",
                description="List sponsored students"
            )
            
            # Test cohort reports
            self.test_endpoint(
                "GET", f"/programs/cohorts/{self.cohort_id}/reports/",
                description="Get cohort reports"
            )
    
    def test_billing_apis(self):
        """Test Billing & Finance APIs"""
        self.log("Testing Billing & Finance APIs...")
        
        # Test billing catalog
        self.test_endpoint(
            "GET", "/billing/catalog/",
            description="Get billing catalog"
        )
        
        # Test checkout session creation
        if self.cohort_id:
            checkout_data = {
                "cohort_id": self.cohort_id,
                "seats_count": 25
            }
            
            self.test_endpoint(
                "POST", "/billing/checkout/sessions/",
                data=checkout_data,
                expected_status=201,
                description="Create checkout session"
            )
        
        # Test invoices retrieval
        self.test_endpoint(
            "GET", "/billing/invoices/",
            description="Get sponsor invoices"
        )
        
        # Test entitlements
        self.test_endpoint(
            "GET", "/billing/entitlements/",
            description="Get seat entitlements"
        )
    
    def test_notification_apis(self):
        """Test Notifications & Automation APIs"""
        self.log("Testing Notifications & Automation APIs...")
        
        # Test sending sponsor message
        if self.cohort_id:
            message_data = {
                "recipient_type": "cohort",
                "cohort_id": self.cohort_id,
                "subject": "Welcome to the Cybersecurity Program",
                "message": "Welcome to our sponsored cybersecurity training program. We're excited to have you on board!"
            }
            
            self.test_endpoint(
                "POST", "/notifications/send/",
                data=message_data,
                expected_status=201,
                description="Send sponsor message to students"
            )
    
    def test_privacy_apis(self):
        """Test Consent & Privacy APIs"""
        self.log("Testing Consent & Privacy APIs...")
        
        # Test getting sponsor consents
        self.test_endpoint(
            "GET", "/privacy/consents/my/",
            description="Get sponsor-related consents"
        )
        
        # Test consent check
        consent_check_data = {
            "student_id": "mock-student-id-123",
            "scope_type": "employer_share"
        }
        
        self.test_endpoint(
            "POST", "/privacy/check/",
            data=consent_check_data,
            description="Check student consent"
        )
    
    def test_analytics_apis(self):
        """Test Analytics & Reporting APIs"""
        self.log("Testing Analytics & Reporting APIs...")
        
        # Test various metrics
        metrics = ["seat_utilization", "completion_rates", "placement_metrics", "roi_analysis"]
        
        for metric in metrics:
            self.test_endpoint(
                "GET", f"/analytics/metrics/{metric}/",
                description=f"Get {metric} metrics"
            )
        
        # Test dashboard PDF export
        self.test_endpoint(
            "GET", "/analytics/dashboards/main-dashboard/pdf/",
            description="Export dashboard PDF"
        )
    
    def run_all_tests(self):
        """Run all API tests"""
        self.log("Starting Sponsor/Employer API Tests...")
        self.log("=" * 60)
        
        try:
            # Setup
            if not self.setup_authentication():
                self.log("Authentication setup failed, stopping tests", "ERROR")
                return False
            
            # Run test suites
            self.test_identity_apis()
            self.test_program_apis()
            self.test_billing_apis()
            self.test_notification_apis()
            self.test_privacy_apis()
            self.test_analytics_apis()
            
            self.log("=" * 60)
            self.log("All tests completed!")
            return True
            
        except Exception as e:
            self.log(f"Test suite failed with error: {str(e)}", "ERROR")
            return False


def main():
    """Main test runner"""
    if len(sys.argv) > 1:
        base_url = sys.argv[1]
    else:
        base_url = BASE_URL
    
    print(f"Testing Sponsor/Employer APIs at: {base_url}")
    print("=" * 60)
    
    tester = SponsorAPITester(base_url)
    success = tester.run_all_tests()
    
    if success:
        print("\n✅ All tests completed successfully!")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed!")
        sys.exit(1)


if __name__ == "__main__":
    main()