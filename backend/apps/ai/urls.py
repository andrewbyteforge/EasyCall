# =============================================================================
# FILE: backend/apps/ai/urls.py
# =============================================================================
# URL configuration for AI workflow generation API.
# =============================================================================

from django.urls import path
from . import views

app_name = 'ai'

urlpatterns = [
    path('generate-workflow/', views.generate_workflow, name='generate-workflow'),
]
