"""
Dashboard URL Configuration
Routes for dashboard endpoints.
"""

from django.urls import path
from . import views

app_name = 'dashboard'

urlpatterns = [
    # Template views
    path('', views.home, name='home'),
    path('workflows/new/', lambda r: views.coming_soon(r, 'create_workflow'), name='create-workflow'),
    path('workflows/', lambda r: views.coming_soon(r, 'view_workflows'), name='view-workflows'),
    path('execution/logs/', lambda r: views.coming_soon(r, 'view_executions'), name='view-executions'),
    path('settings/', lambda r: views.coming_soon(r, 'manage_settings'), name='manage-settings'),
    path('integrations/specs/', lambda r: views.coming_soon(r, 'add_provider'), name='add-provider'),
    
    # API endpoints
    path('api/stats/', views.dashboard_stats, name='stats'),
    path('api/quick-actions/', views.quick_actions, name='quick-actions'),
    path('api/recent-activity/', views.recent_activity, name='recent-activity'),
]