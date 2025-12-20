# =============================================================================
# FILE: backend/apps/dashboard/urls.py (COMPLETE UPDATED VERSION)
# =============================================================================
# Dashboard URL Configuration
# Routes for dashboard endpoints
# UPDATED: Added /upload-provider/ route
# =============================================================================

from django.urls import path
from . import views

app_name = 'dashboard'

urlpatterns = [
    # ========================================================================
    # TEMPLATE VIEWS
    # ========================================================================
    
    # Home/Landing page
    path('', views.home, name='home'),
    
    # Upload API Provider page (NEW - ADDED THIS)
    path('upload-provider/', views.upload_provider, name='upload_provider'),
    
    # Placeholder pages for features under development
    path('workflows/new/', lambda r: views.coming_soon(r, 'create_workflow'), name='create-workflow'),
    path('workflows/', lambda r: views.coming_soon(r, 'view_workflows'), name='view-workflows'),
    path('execution/logs/', lambda r: views.coming_soon(r, 'view_executions'), name='view-executions'),
    path('settings/', lambda r: views.coming_soon(r, 'manage_settings'), name='manage-settings'),
    path('integrations/specs/', lambda r: views.coming_soon(r, 'add_provider'), name='add-provider'),
    
    # ========================================================================
    # API ENDPOINTS
    # ========================================================================
    
    # Dashboard statistics
    path('api/stats/', views.dashboard_stats, name='stats'),
    
    # Quick action cards
    path('api/quick-actions/', views.quick_actions, name='quick-actions'),
    
    # Recent activity feed
    path('api/recent-activity/', views.recent_activity, name='recent-activity'),
]