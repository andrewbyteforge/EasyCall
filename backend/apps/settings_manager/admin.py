# =============================================================================
# FILE: easycall/backend/apps/settings_manager/admin.py
# =============================================================================
# Django admin configuration for settings models.
# =============================================================================
"""
Admin configuration for the settings manager application.
"""

# =============================================================================
# IMPORTS
# =============================================================================

from django.contrib import admin
from django.utils.html import format_html

from apps.settings_manager.models import GlobalSettings, APICredential

# =============================================================================
# GLOBAL SETTINGS ADMIN
# =============================================================================


@admin.register(GlobalSettings)
class GlobalSettingsAdmin(admin.ModelAdmin):
    """
    Admin interface for GlobalSettings model.
    
    This is a singleton model - only one instance should exist.
    """
    
    list_display = [
        "uuid",
        "batch_size_limit",
        "execution_timeout",
        "chainalysis_rate_limit",
        "trm_rate_limit",
        "enable_detailed_logging",
        "enable_websocket_logs",
        "updated_at",
    ]
    
    fieldsets = (
        ("Batch Processing", {
            "fields": ("batch_size_limit",)
        }),
        ("Execution", {
            "fields": ("execution_timeout",)
        }),
        ("Rate Limiting", {
            "fields": ("chainalysis_rate_limit", "trm_rate_limit")
        }),
        ("Defaults", {
            "fields": ("default_blockchain",)
        }),
        ("Features", {
            "fields": ("enable_detailed_logging", "enable_websocket_logs")
        }),
        ("Metadata", {
            "fields": ("uuid", "created_at", "updated_at", "is_active"),
            "classes": ("collapse",)
        }),
    )
    
    readonly_fields = ["uuid", "created_at", "updated_at"]
    
    def has_add_permission(self, request):
        """Prevent adding new settings (singleton)."""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """Prevent deleting settings."""
        return False


# =============================================================================
# API CREDENTIAL ADMIN
# =============================================================================


@admin.register(APICredential)
class APICredentialAdmin(admin.ModelAdmin):
    """
    Admin interface for APICredential model.
    
    API keys are encrypted and never displayed in admin.
    """
    
    list_display = [
        "provider_badge",
        "label",
        "default_badge",
        "verified_badge",
        "has_api_key",
        "has_api_secret",
        "last_used_at",
        "is_active",
    ]
    
    list_filter = [
        "provider",
        "is_default",
        "is_verified",
        "is_active",
    ]
    
    search_fields = [
        "label",
        "provider",
    ]
    
    fieldsets = (
        ("Provider Information", {
            "fields": ("provider", "label")
        }),
        ("API Configuration", {
            "fields": ("api_url",),
            "description": "API keys are encrypted and cannot be viewed. To update, delete and recreate the credential."
        }),
        ("Status", {
            "fields": ("is_default", "is_verified", "is_active")
        }),
        ("Usage", {
            "fields": ("last_used_at", "last_verified_at"),
            "classes": ("collapse",)
        }),
        ("Metadata", {
            "fields": ("uuid", "created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )
    
    readonly_fields = [
        "uuid",
        "is_verified",
        "last_used_at",
        "last_verified_at",
        "created_at",
        "updated_at",
    ]
    
    # -------------------------------------------------------------------------
    # Custom Display Methods
    # -------------------------------------------------------------------------
    
    @admin.display(description="Provider")
    def provider_badge(self, obj):
        """Display provider with color badge."""
        colors = {
            "chainalysis": "#4a148c",
            "trm_labs": "#00897b",
        }
        color = colors.get(obj.provider, "#666666")
        
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 3px; font-weight: bold;">{}</span>',
            color,
            obj.get_provider_display()
        )
    
    @admin.display(description="Default", boolean=True)
    def default_badge(self, obj):
        """Display default status."""
        return obj.is_default
    
    @admin.display(description="Verified", boolean=True)
    def verified_badge(self, obj):
        """Display verified status."""
        return obj.is_verified
    
    @admin.display(description="Has Key", boolean=True)
    def has_api_key(self, obj):
        """Check if credential has API key."""
        return bool(obj.api_key_encrypted)
    
    @admin.display(description="Has Secret", boolean=True)
    def has_api_secret(self, obj):
        """Check if credential has API secret."""
        return bool(obj.api_secret_encrypted)
    
    # -------------------------------------------------------------------------
    # Custom Actions
    # -------------------------------------------------------------------------
    
    actions = ["mark_as_default", "mark_as_verified", "mark_as_unverified"]
    
    @admin.action(description="Set as default for provider")
    def mark_as_default(self, request, queryset):
        """Set selected credentials as default."""
        for credential in queryset:
            credential.set_as_default()
        self.message_user(
            request,
            f"{queryset.count()} credential(s) set as default"
        )
    
    @admin.action(description="Mark as verified")
    def mark_as_verified(self, request, queryset):
        """Mark selected credentials as verified."""
        queryset.update(is_verified=True)
        self.message_user(
            request,
            f"{queryset.count()} credential(s) marked as verified"
        )
    
    @admin.action(description="Mark as unverified")
    def mark_as_unverified(self, request, queryset):
        """Mark selected credentials as unverified."""
        queryset.update(is_verified=False)
        self.message_user(
            request,
            f"{queryset.count()} credential(s) marked as unverified"
        )