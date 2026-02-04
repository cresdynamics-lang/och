# Sponsor/Employer Dashboard API Implementation

## Overview

This implementation provides comprehensive APIs for sponsor/employer dashboard operations based on the OCH SMP Technical Specifications. The APIs enable sponsors and employers to manage their sponsored students, handle billing, track progress, and maintain compliance with privacy requirements.

## 🔑 Identity & Organization APIs (`/api/v1/auth`)

### Endpoints Implemented

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup/` | Create sponsor/employer admin accounts |
| POST | `/auth/orgs/` | Create sponsor/employer organization entity |
| POST | `/auth/orgs/{id}/members/` | Add sponsor admins or staff to the org |
| POST | `/auth/users/{id}/roles/` | Assign sponsor roles scoped to org/cohort |
| GET | `/auth/me/` | Retrieve profile, roles, and consent scopes |
| POST | `/auth/consents/` | Update consent scopes (e.g., employer view of candidate) |

### Key Features

- **Sponsor Account Creation**: Complete signup flow with organization setup
- **Role-Based Access Control**: Assign specific roles scoped to organizations or cohorts
- **Consent Management**: Handle privacy consent scopes for employer access
- **Profile Management**: Comprehensive user profile with roles and permissions

## 📚 Program & Cohort Management APIs (`/api/v1/programs`)

### Endpoints Implemented

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/programs/cohorts/` | Create sponsored cohorts |
| POST | `/programs/cohorts/{id}/enrollments/` | Enroll sponsored students |
| GET | `/programs/cohorts/{id}/enrollments/list/` | List sponsored students in a cohort |
| GET | `/programs/cohorts/{id}/reports/` | View seat utilization, completion rates, and payments |

### Key Features

- **Cohort Creation**: Create and configure sponsored training cohorts
- **Student Enrollment**: Bulk enrollment of sponsored students
- **Progress Tracking**: Monitor student progress and completion rates
- **Comprehensive Reporting**: Detailed analytics on cohort performance

## 💳 Billing & Finance APIs (`/api/v1/billing`)

### Endpoints Implemented

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/billing/catalog/` | View pricing models for seats/programs |
| POST | `/billing/checkout/sessions/` | Pay for sponsored seats |
| GET | `/billing/invoices/` | Retrieve invoices linked to sponsor org |
| GET | `/billing/entitlements/` | Check seat entitlements for sponsored students |

### Pricing Model

- **Per Seat Monthly**: 20,000 KES per active student per month
- **Mentor Sessions**: 7,000 KES per session
- **Lab Usage**: 200 KES per hour
- **Revenue Share**: 3% of first year salary from successful placements

### Key Features

- **Transparent Pricing**: Clear pricing catalog with all fee structures
- **Payment Processing**: Secure checkout sessions for seat purchases
- **Invoice Management**: Comprehensive invoice tracking and history
- **Entitlement Tracking**: Real-time seat utilization monitoring

## 📢 Notifications & Automation APIs (`/api/v1/notifications`)

### Endpoints Implemented

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/notifications/send/` | Send sponsor/employer messages to students |

### Key Features

- **Targeted Messaging**: Send messages to specific cohorts or individual students
- **Bulk Communication**: Efficient communication with all sponsored students
- **Message Tracking**: Track delivery and engagement metrics

## 🔒 Consent & Privacy APIs (`/api/v1/privacy`)

### Endpoints Implemented

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/privacy/consents/my/` | View sponsor-related consents granted by students |
| POST | `/privacy/check/` | Real-time consent check (e.g., employer viewing candidate profile) |

### Consent Scopes

- **employer_share**: Allows employer to view candidate profile
- **public_portfolio**: Allows public sharing of student portfolio
- **placement_tracking**: Enables tracking of placement outcomes

### Key Features

- **Privacy Compliance**: Full GDPR/privacy law compliance
- **Granular Consent**: Fine-grained consent management per student
- **Real-time Checks**: Instant consent verification for data access

## 📊 Analytics & Reporting APIs (`/api/v1/analytics`)

### Endpoints Implemented

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/analytics/metrics/{key}/` | Sponsor dashboards (seat utilization, completion) |
| GET | `/analytics/dashboards/{id}/pdf/` | Export sponsor-specific analytics reports |

### Available Metrics

- **seat_utilization**: Track seat usage and capacity
- **completion_rates**: Monitor student completion statistics
- **placement_metrics**: Analyze hiring and placement outcomes
- **roi_analysis**: Calculate return on investment

### Key Features

- **Real-time Analytics**: Live dashboard metrics
- **Export Capabilities**: PDF report generation
- **ROI Tracking**: Comprehensive return on investment analysis

## 🏗️ Implementation Architecture

### Models

The implementation uses the existing sponsor models:

- **Sponsor**: Organization entity
- **SponsorCohort**: Training cohorts
- **SponsorStudentCohort**: Student enrollments
- **SponsorAnalytics**: Cached analytics data
- **SponsorFinancialTransaction**: Financial records
- **SponsorCohortBilling**: Monthly billing records

### Permissions

- **IsSponsorUser**: Basic sponsor access
- **IsSponsorAdmin**: Administrative sponsor access
- **check_sponsor_access**: Verify sponsor organization membership

### Services

- **SponsorDashboardService**: Dashboard data aggregation
- **SponsorCohortsService**: Cohort management
- **FinanceDataService**: Financial calculations
- **PaymentService**: Payment processing

## 🚀 Getting Started

### 1. Run Migrations

```bash
python manage.py makemigrations sponsors
python manage.py migrate
```

### 2. Create Test Data

```bash
python manage.py shell
from sponsors.models import Sponsor
sponsor = Sponsor.objects.create(
    slug='test-sponsor',
    name='Test Sponsor Organization',
    sponsor_type='corporate',
    contact_email='test@sponsor.com'
)
```

### 3. Test the APIs

```bash
python test_sponsor_apis.py
```

### 4. Access Swagger Documentation

Visit: `http://localhost:8000/api/schema/swagger-ui/`

## 🔧 Configuration

### Environment Variables

```env
# Billing Configuration
SPONSOR_SEAT_PRICE_KES=20000
MENTOR_SESSION_PRICE_KES=7000
LAB_USAGE_PRICE_KES=200
REVENUE_SHARE_PERCENTAGE=3.0

# Payment Gateway
PAYMENT_GATEWAY_URL=https://api.payment-provider.com
PAYMENT_GATEWAY_API_KEY=your_api_key

# Notification Service
NOTIFICATION_SERVICE_URL=https://api.notification-service.com
NOTIFICATION_API_KEY=your_notification_key
```

### Django Settings

```python
# Add to INSTALLED_APPS
INSTALLED_APPS = [
    # ... other apps
    'sponsors',
    'organizations',
    'users',
]

# Add to REST_FRAMEWORK
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
}
```

## 🧪 Testing

### Unit Tests

```bash
python manage.py test sponsors.tests
```

### API Integration Tests

```bash
python test_sponsor_apis.py http://localhost:8000/api/v1
```

### Load Testing

```bash
# Install locust
pip install locust

# Run load tests
locust -f load_test_sponsors.py --host=http://localhost:8000
```

## 📈 Monitoring & Analytics

### Key Metrics to Monitor

- **API Response Times**: Track endpoint performance
- **Error Rates**: Monitor 4xx/5xx responses
- **Seat Utilization**: Track capacity usage
- **Revenue Metrics**: Monitor financial performance
- **Student Engagement**: Track completion rates

### Logging

```python
import logging

logger = logging.getLogger('sponsors.api')
logger.info(f'Sponsor {sponsor.name} created cohort {cohort.name}')
```

## 🔒 Security Considerations

### Authentication

- JWT token-based authentication
- Role-based access control (RBAC)
- Organization-scoped permissions

### Data Privacy

- Consent-based data access
- GDPR compliance
- Data anonymization for analytics

### API Security

- Rate limiting
- Input validation
- SQL injection prevention
- XSS protection

## 🚀 Deployment

### Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Static files collected
- [ ] SSL certificates installed
- [ ] Monitoring configured
- [ ] Backup strategy implemented

### Docker Deployment

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
RUN python manage.py collectstatic --noinput

EXPOSE 8000
CMD ["gunicorn", "core.wsgi:application", "--bind", "0.0.0.0:8000"]
```

## 📞 Support

For technical support or questions about the sponsor/employer API implementation:

1. Check the API documentation at `/api/schema/swagger-ui/`
2. Review the test cases in `test_sponsor_apis.py`
3. Examine the implementation in `sponsors/views_api.py`
4. Contact the development team

## 🔄 Future Enhancements

### Planned Features

- **Real-time Notifications**: WebSocket-based live updates
- **Advanced Analytics**: Machine learning-powered insights
- **Mobile API**: Optimized endpoints for mobile apps
- **Webhook Integration**: Event-driven integrations
- **Multi-currency Support**: Support for USD, EUR, etc.

### API Versioning

The current implementation is v1. Future versions will maintain backward compatibility:

- `/api/v1/` - Current stable version
- `/api/v2/` - Future enhanced version
- `/api/beta/` - Experimental features

---

This implementation provides a solid foundation for sponsor/employer dashboard operations while maintaining flexibility for future enhancements and integrations.