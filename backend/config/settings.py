# =============================================================================
# FILE: easycall/backend/config/settings.py
# =============================================================================
# Comprehensive Django configuration for the Blockchain Intelligence
# Workflow Builder application.
#
# This module contains all Django settings organized into logical sections.
# Settings are loaded from environment variables where appropriate for
# security and portability.
# =============================================================================
"""
Django settings for the EasyCall project.
"""

# =============================================================================
# IMPORTS
# =============================================================================

import os
from pathlib import Path

from dotenv import load_dotenv

# =============================================================================
# PATH CONFIGURATION
# =============================================================================

# Build paths inside the project using pathlib
# BASE_DIR is the backend directory (contains manage.py)
BASE_DIR: Path = Path(__file__).resolve().parent.parent

# Load environment variables from .env file
load_dotenv(BASE_DIR / ".env")

# =============================================================================
# SECURITY SETTINGS
# =============================================================================

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY: str = os.getenv(
    "SECRET_KEY",
    "django-insecure-development-key-change-in-production"
)

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes")

# Allowed hosts configuration
ALLOWED_HOSTS: list[str] = [
    host.strip()
    for host in os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
    if host.strip()
]

# Encryption key for API credentials storage
ENCRYPTION_KEY: str = os.getenv("ENCRYPTION_KEY", "")

# =============================================================================
# APPLICATION DEFINITION
# =============================================================================

INSTALLED_APPS: list[str] = [
    # Django built-in apps
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    'apps.dashboard',

    # Third-party apps
    "rest_framework",
    "corsheaders",
    "channels",
    "drf_spectacular",

    # Project apps
    "apps.core.apps.CoreConfig",
    "apps.workflows.apps.WorkflowsConfig",
    "apps.execution.apps.ExecutionConfig",
    "apps.nodes.apps.NodesConfig",
    "apps.integrations.apps.IntegrationsConfig",
    "apps.settings_manager.apps.SettingsManagerConfig",
    "apps.providers.apps.ProvidersConfig",
]

# =============================================================================
# MIDDLEWARE CONFIGURATION
# =============================================================================

MIDDLEWARE: list[str] = [
    # Security middleware (should be first)
    "django.middleware.security.SecurityMiddleware",

    # CORS headers (must be before CommonMiddleware)
    "corsheaders.middleware.CorsMiddleware",

    # Django built-in middleware
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

# =============================================================================
# URL CONFIGURATION
# =============================================================================

ROOT_URLCONF: str = "config.urls"

# =============================================================================
# TEMPLATE CONFIGURATION
# =============================================================================

TEMPLATES: list[dict] = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# =============================================================================
# WSGI / ASGI CONFIGURATION
# =============================================================================

WSGI_APPLICATION: str = "config.wsgi.application"
ASGI_APPLICATION: str = "config.asgi.application"

# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================

# SQLite database for portability (travels with the project)
DATABASES: dict = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
        # SQLite optimizations for better performance
        "OPTIONS": {
            "timeout": 20,
        },
    }
}

# Default primary key field type
DEFAULT_AUTO_FIELD: str = "django.db.models.BigAutoField"

# =============================================================================
# PASSWORD VALIDATION
# =============================================================================

AUTH_PASSWORD_VALIDATORS: list[dict] = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

# =============================================================================
# INTERNATIONALIZATION
# =============================================================================

LANGUAGE_CODE: str = "en-us"
TIME_ZONE: str = "UTC"
USE_I18N: bool = True
USE_TZ: bool = True

# =============================================================================
# STATIC FILES CONFIGURATION
# =============================================================================

# URL prefix for static files
STATIC_URL: str = "static/"

# Directory for collected static files (production)
STATIC_ROOT: Path = BASE_DIR / "staticfiles"

# Additional directories for static files
STATICFILES_DIRS: list[Path] = [
    BASE_DIR / "static",
]

# =============================================================================
# MEDIA FILES CONFIGURATION
# =============================================================================

# URL prefix for media files (uploads)
MEDIA_URL: str = "media/"

# Directory for uploaded files
MEDIA_ROOT: Path = BASE_DIR / "media"

# =============================================================================
# DJANGO REST FRAMEWORK CONFIGURATION
# =============================================================================

REST_FRAMEWORK: dict = {
    # Default permission classes
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.AllowAny",
    ],

    # Default authentication classes (none for single-user app)
    "DEFAULT_AUTHENTICATION_CLASSES": [],

    # Pagination
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 50,

    # Schema generation
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",

    # Exception handling
    "EXCEPTION_HANDLER": "apps.core.exceptions.custom_exception_handler",

    # Date/time formats
    "DATETIME_FORMAT": "%Y-%m-%dT%H:%M:%S.%fZ",
    "DATE_FORMAT": "%Y-%m-%d",
    "TIME_FORMAT": "%H:%M:%S",

    # Throttling (disabled for local use)
    "DEFAULT_THROTTLE_CLASSES": [],
    "DEFAULT_THROTTLE_RATES": {},
}

# =============================================================================
# CORS CONFIGURATION
# =============================================================================

# Allow requests from frontend development server
CORS_ALLOWED_ORIGINS: list[str] = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ALLOWED_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if origin.strip()
]

# Allow credentials (cookies, etc.)
CORS_ALLOW_CREDENTIALS: bool = True

# Allow all headers (needed for Content-Type etc.)
CORS_ALLOW_HEADERS: list[str] = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]

# Allow all common HTTP methods
CORS_ALLOW_METHODS: list[str] = [
    "DELETE",
    "GET",
    "OPTIONS",
    "PATCH",
    "POST",
    "PUT",
]

# =============================================================================
# CHANNELS (WEBSOCKET) CONFIGURATION
# =============================================================================

# Channel layer configuration
# Using in-memory for development (Redis recommended for production)
CHANNEL_LAYERS: dict = {
    "default": {
        "BACKEND": "channels.layers.InMemoryChannelLayer",
    },
}

# =============================================================================
# DRF SPECTACULAR (API DOCUMENTATION) CONFIGURATION
# =============================================================================

SPECTACULAR_SETTINGS: dict = {
    "TITLE": "EasyCall API",
    "DESCRIPTION": "Blockchain Intelligence Workflow Builder API",
    "VERSION": "0.1.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "COMPONENT_SPLIT_REQUEST": True,
}

# =============================================================================
# LOGGING CONFIGURATION
# =============================================================================

# Log directory
LOGS_DIR: Path = BASE_DIR / "logs"
LOGS_DIR.mkdir(exist_ok=True)

# Log level from environment
LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

LOGGING: dict = {
    "version": 1,
    "disable_existing_loggers": False,

    "formatters": {
        "verbose": {
            "format": "[{asctime}] {levelname} {name} {module}:{lineno} - {message}",
            "style": "{",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
        "simple": {
            "format": "[{asctime}] {levelname} - {message}",
            "style": "{",
            "datefmt": "%H:%M:%S",
        },
    },

    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "simple",
            "level": "DEBUG",
        },
        "file": {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": LOGS_DIR / "easycall.log",
            "maxBytes": 10 * 1024 * 1024,  # 10 MB
            "backupCount": 5,
            "formatter": "verbose",
            "level": "INFO",
        },
        "error_file": {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": LOGS_DIR / "errors.log",
            "maxBytes": 10 * 1024 * 1024,  # 10 MB
            "backupCount": 5,
            "formatter": "verbose",
            "level": "ERROR",
        },
    },

    "loggers": {
        # Root logger
        "": {
            "handlers": ["console", "file"],
            "level": LOG_LEVEL,
        },

        # Django logger
        "django": {
            "handlers": ["console", "file"],
            "level": "INFO",
            "propagate": False,
        },

        # Django request logger
        "django.request": {
            "handlers": ["console", "error_file"],
            "level": "WARNING",
            "propagate": False,
        },

        # Application loggers
        "apps": {
            "handlers": ["console", "file"],
            "level": "DEBUG" if DEBUG else "INFO",
            "propagate": False,
        },
    },
}

# =============================================================================
# APPLICATION-SPECIFIC SETTINGS
# =============================================================================

# Batch processing settings
BATCH_SIZE_LIMIT: int = int(os.getenv("BATCH_SIZE_LIMIT", "10000"))

# Execution settings
EXECUTION_TIMEOUT: int = int(os.getenv("EXECUTION_TIMEOUT", "3600"))

# Rate limiting defaults (requests per minute)
RATE_LIMITS: dict = {
    "chainalysis": int(os.getenv("CHAINALYSIS_RATE_LIMIT", "60")),
    "trm": int(os.getenv("TRM_RATE_LIMIT", "60")),
}

# =============================================================================
# EXTERNAL API CONFIGURATION
# =============================================================================

# Chainalysis Reactor API settings
# NOTE: IAPI = Investigations API (https://iapi.chainalysis.com)
CHAINALYSIS_CONFIG: dict = {
    "api_key": os.getenv("CHAINALYSIS_API_KEY", ""),
    "api_url": os.getenv("CHAINALYSIS_API_URL", "https://iapi.chainalysis.com"),
    "timeout": 30,
    "retry_attempts": 3,
    "retry_delay": 1,
}

# TRM Labs API settings
TRM_CONFIG: dict = {
    "api_key": os.getenv("TRM_API_KEY", ""),
    "api_secret": os.getenv("TRM_API_SECRET", ""),
    "api_url": os.getenv("TRM_API_URL", "https://api.trmlabs.com"),
    "timeout": 30,
    "retry_attempts": 3,
    "retry_delay": 1,
}