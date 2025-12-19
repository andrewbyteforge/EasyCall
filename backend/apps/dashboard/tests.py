"""
Dashboard Tests
Unit tests for dashboard endpoints.
"""

from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.workflows.models import Workflow
from apps.integrations.models import OpenAPISpec
from apps.execution.models import ExecutionLog


class DashboardStatsTests(TestCase):
    """Test dashboard statistics endpoint."""
    
    def setUp(self):
        """Set up test client and sample data."""
        self.client = APIClient()
        self.stats_url = reverse('dashboard:stats')
        
        # Create sample workflows
        Workflow.objects.create(
            name="Test Workflow 1",
            description="Test",
            is_active=True
        )
        Workflow.objects.create(
            name="Test Workflow 2",
            description="Test",
            is_active=False
        )
    
    def test_get_stats(self):
        """Test retrieving dashboard statistics."""
        response = self.client.get(self.stats_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('workflows', response.data)
        self.assertIn('providers', response.data)
        self.assertIn('executions', response.data)
        self.assertEqual(response.data['workflows']['total'], 2)


class QuickActionsTests(TestCase):
    """Test quick actions endpoint."""
    
    def setUp(self):
        """Set up test client."""
        self.client = APIClient()
        self.actions_url = reverse('dashboard:quick-actions')
    
    def test_get_quick_actions(self):
        """Test retrieving quick actions."""
        response = self.client.get(self.actions_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('actions', response.data)
        self.assertGreater(len(response.data['actions']), 0)
        
        # Check first action has required fields
        first_action = response.data['actions'][0]
        self.assertIn('id', first_action)
        self.assertIn('label', first_action)
        self.assertIn('route', first_action)