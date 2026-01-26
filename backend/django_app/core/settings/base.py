"""
Django settings for core project - Base configuration.
"""
import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Load environment variables from .env file
# Priority: 1) Project root, 2) backend/django_app (legacy), 3) backend (legacy)
# NOTE: In Docker, environment variables are already set - don't override them
PROJECT_ROOT = BASE_DIR.parent.parent  # /home/caleb/kiptoo/och/ongozaCyberHub

# Check if running in Docker (don't override env vars if they're already set properly)
IN_DOCKER = os.environ.get('DB_HOST') not in ['localhost', '127.0.0.1', None]

# Try loading from project root first (primary location)
root_env = PROJECT_ROOT / '.env'
if root_env.exists() and not IN_DOCKER:
    load_dotenv(root_env, override=True)
    print(f"✅ Loaded .env from project root: {root_env}")
elif not IN_DOCKER:
    # Fallback to legacy locations for backward compatibility
    env_path = BASE_DIR / '.env'
    if env_path.exists():
        load_dotenv(env_path, override=True)
        print(f"⚠️ Loaded .env from legacy location: {env_path}")
    else:
        parent_env = BASE_DIR.parent / '.env'
        if parent_env.exists():
            load_dotenv(parent_env, override=True)
            print(f"⚠️ Loaded .env from legacy location: {parent_env}")
else:
    print(f"🐳 Running in Docker - using container environment variables")

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'django-insecure-change-me-in-production')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0']

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.postgres',
    
    # Third-party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'drf_spectacular',
    'corsheaders',
    
    # Local apps (order matters - users before organizations)
    'users',
    'organizations',
    'progress',
    'student_dashboard',
    'mentorship',
    'profiler',
    'foundations',
    'coaching',
    'curriculum',
    'recipes',
    'missions',
    'dashboard',
    'subscriptions',
    'mentorship_coordination',
    'programs',
    'sponsor_dashboard',
    'director_dashboard',
    'talentscope',
    'marketplace',
    'community',
    'api',
    'shared_schemas',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME', 'ongozacyberhub'),
        'USER': os.environ.get('DB_USER', 'postgres'),
        'PASSWORD': os.environ.get('DB_PASSWORD', ''),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '5432'),
        'OPTIONS': {
            'options': '-c search_path=public'
        },
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Media files (User uploads)
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# File upload settings
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB
DATA_UPLOAD_MAX_NUMBER_FIELDS = 1000

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Custom User Model
AUTH_USER_MODEL = 'users.User'

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

# JWT Settings
# Use JWT_SECRET_KEY from environment, fallback to SECRET_KEY for backward compatibility
JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', SECRET_KEY)
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')

# Log JWT configuration on startup (for debugging)
if JWT_SECRET_KEY != SECRET_KEY:
    print(f"✅ Using JWT_SECRET_KEY from environment (length: {len(JWT_SECRET_KEY)})")
else:
    print(f"⚠️ JWT_SECRET_KEY not set, using SECRET_KEY (length: {len(SECRET_KEY)})")

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'SIGNING_KEY': JWT_SECRET_KEY,  # Use dedicated JWT secret key (rest_framework_simplejwt will use this)
    'ALGORITHM': JWT_ALGORITHM,
    'VERIFYING_KEY': None,  # Use SIGNING_KEY for verification too
}

# CORS Settings
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

CORS_ALLOW_CREDENTIALS = True

# Redis Configuration
# Use Redis service name in Docker, localhost for local development
REDIS_HOST = os.environ.get('REDIS_HOST', 'localhost')
REDIS_PORT = os.environ.get('REDIS_PORT', '6379')
REDIS_PASSWORD = os.environ.get('REDIS_PASSWORD', None)

# Cache Configuration (using Redis if available, fallback to dummy cache)
# Use environment variable to control cache backend
USE_REDIS_CACHE = os.environ.get('USE_REDIS_CACHE', 'false').lower() == 'true'

if USE_REDIS_CACHE:
    try:
        from django_redis.cache import RedisCache
        CACHES = {
            "default": {
                "BACKEND": "django_redis.cache.RedisCache",
                "LOCATION": f"redis://{REDIS_HOST}:{REDIS_PORT}/1",
                "OPTIONS": {
                    "CLIENT_CLASS": "django_redis.client.DefaultClient",
                },
                "KEY_PREFIX": "och",
                "TIMEOUT": 300,  # 5 minutes default timeout
            }
        }
    except (ImportError, ModuleNotFoundError):
        # Fallback to dummy cache if django_redis is not available
        print("⚠️ django_redis not available, using dummy cache backend")
        CACHES = {
            "default": {
                "BACKEND": "django.core.cache.backends.dummy.DummyCache",
            }
        }
else:
    # Use dummy cache for local development (no Redis required)
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.dummy.DummyCache",
        }
    }

# Celery Configuration (if using Celery)
CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL', f'redis://{REDIS_HOST}:{REDIS_PORT}/0')
CELERY_RESULT_BACKEND = os.environ.get('CELERY_RESULT_BACKEND', f'redis://{REDIS_HOST}:{REDIS_PORT}/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE

# Celery Beat Schedule (periodic tasks)
try:
    from director_dashboard.celery_config import DIRECTOR_DASHBOARD_BEAT_SCHEDULE
    CELERY_BEAT_SCHEDULE = {
        **DIRECTOR_DASHBOARD_BEAT_SCHEDULE,
    }
except ImportError:
    CELERY_BEAT_SCHEDULE = {}

# Monitoring & Metrics
ENABLE_METRICS = os.environ.get('ENABLE_METRICS', 'False').lower() == 'true'

# Frontend URL for email links and redirects
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

# Resend settings for email activation and password reset
RESEND_API_KEY= os.environ.get('RESEND_API_KEY')
RESEND_FROM_EMAIL = os.environ.get('RESEND_FROM_EMAIL', 'onboarding@resend.dev')
RESEND_FROM_NAME = os.environ.get('RESEND_FROM_NAME', 'Ongoza CyberHub')

DEFAULT_FROM_EMAIL = f"{RESEND_FROM_NAME} <{RESEND_FROM_EMAIL}>"

# Standard SMTP Config
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.resend.com'
EMAIL_PORT = 465
EMAIL_USE_SSL = True
EMAIL_USE_TLS = False 
EMAIL_HOST_USER = 'resend'
EMAIL_HOST_PASSWORD = RESEND_API_KEY

# Token expiry settings
ACTIVATION_TOKEN_EXPIRY = int(os.environ.get('ACTIVATION_TOKEN_EXPIRY', 24))
PASSWORD_RESET_TOKEN_EXPIRY = int(os.environ.get('PASSWORD_RESET_TOKEN_EXPIRY', 1))

# drf-spectacular (Swagger/OpenAPI) Settings
SPECTACULAR_SETTINGS = {
    'TITLE': 'OCH Cyber Talent Engine API',
    'DESCRIPTION': '''
    Comprehensive API for the OCH Cyber Talent Engine platform.
    
    This API provides endpoints for:
    - User authentication and management
    - Program, Track, and Cohort management
    - Mentorship coordination
    - Student dashboards and progress tracking
    - Missions and portfolio management
    - Director dashboards and analytics
    
    **Authentication**: Use JWT Bearer tokens. Obtain tokens via `/api/v1/auth/login` or `/api/v1/auth/login/`
    ''',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'SCHEMA_PATH_PREFIX': '/api/v1/',
    'COMPONENT_SPLIT_REQUEST': True,
    'COMPONENT_NO_READ_ONLY_REQUIRED': True,
    'TAGS': [
        {'name': 'Authentication', 'description': 'User authentication and JWT token management'},
        {'name': 'Users', 'description': 'User management and profiles'},
        {'name': 'Programs', 'description': 'Program, Track, and Cohort management'},
        {'name': 'Director Dashboard', 'description': 'Director dashboard and analytics'},
        {'name': 'Mentorship', 'description': 'Mentorship coordination and sessions'},
        {'name': 'Missions', 'description': 'Mission submissions and approvals'},
        {'name': 'Coaching', 'description': 'Coaching and habit tracking'},
        {'name': 'Portfolio', 'description': 'Portfolio management'},
        {'name': 'Organizations', 'description': 'Organization management'},
        {'name': 'Progress', 'description': 'Progress tracking'},
        {'name': 'Subscriptions', 'description': 'Subscription and billing'},
    ],
    'SECURITY': [
        {
            'type': 'http',
            'scheme': 'bearer',
            'bearerFormat': 'JWT',
        }
    ],
    'SWAGGER_UI_SETTINGS': {
        'deepLinking': True,
        'displayOperationId': False,
        'defaultModelsExpandDepth': 1,
        'defaultModelExpandDepth': 1,
        'displayRequestDuration': True,
        'docExpansion': 'list',
        'filter': True,
        'showExtensions': True,
        'showCommonExtensions': True,
        'tryItOutEnabled': True,
    },
    'REDOC_UI_SETTINGS': {
        'hideDownloadButton': False,
        'hideHostname': False,
        'hideLoading': False,
        'nativeScrollbars': False,
        'requiredPropsFirst': True,
        'scrollYOffset': 0,
        'showExtensions': True,
        'sortPropsAlphabetically': True,
        'theme': {
            'colors': {
                'primary': {
                    'main': '#FF6B35',  # OCH Orange
                }
            }
        },
    },
}
