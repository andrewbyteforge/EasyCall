"""
URL Configuration for EasyCall Backend
"""

from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

urlpatterns = [
    # Root - Dashboard landing page
    path('', include('apps.dashboard.urls')),
    
    # Admin
    path('admin/', admin.site.urls),
    
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    
    # API v1 endpoints
    path('api/v1/workflows/', include('apps.workflows.urls')),
    path('api/v1/execution/', include('apps.execution.urls')),
    path('api/v1/settings/', include('apps.settings_manager.urls')),
    path('api/v1/integrations/', include('apps.integrations.urls')),
    path('api/v1/dashboard/', include(('apps.dashboard.urls', 'dashboard-api'), namespace='dashboard-api')),
]