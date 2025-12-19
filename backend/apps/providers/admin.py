# =============================================================================
# FILE: easycall/backend/apps/providers/admin.py
# =============================================================================
# Django admin configuration for provider models.
# =============================================================================
"""
Admin configuration for the providers application.
"""

# =============================================================================
# IMPORTS
# =============================================================================

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe

from apps.providers.models import Provider, APIEndpoint, GeneratedNode

# =============================================================================
# PROVIDER ADMIN
# =============================================================================


@admin.register(Provider)
class ProviderAdmin(admin.ModelAdmin):
    """
    Admin interface for Provider model.
    
    Allows administrators to manage API providers including:
    - Viewing provider list with status badges
    - Editing provider configuration
    - Uploading OpenAPI specifications
    - Managing provider lifecycle (activate/deprecate/deactivate)
    """
    
    # -------------------------------------------------------------------------
    # List Display
    # -------------------------------------------------------------------------
    
    list_display = [
        "name",
        "slug",
        "version",
        "status_badge",
        "endpoint_count_display",
        "node_count_display",
        "auth_type",
        "rate_limit_per_minute",
        "created_at",
    ]
    
    list_filter = [
        "status",
        "auth_type",
        "supports_batch",
        "created_at",
    ]
    
    search_fields = [
        "name",
        "slug",
        "description",
        "version",
    ]
    
    readonly_fields = [
        "uuid",
        "created_at",
        "updated_at",
        "spec_parsed_at",
        "endpoint_count_display",
        "node_count_display",
    ]
    
    # -------------------------------------------------------------------------
    # Fieldsets
    # -------------------------------------------------------------------------
    
    fieldsets = (
        ("Basic Information", {
            "fields": (
                "name",
                "slug",
                "description",
                "version",
            )
        }),
        ("API Configuration", {
            "fields": (
                "base_url",
                "auth_type",
                "documentation_url",
            )
        }),
        ("OpenAPI Specification", {
            "fields": (
                "spec_file_path",
                "spec_format",
                "spec_parsed_at",
            )
        }),
        ("Rate Limiting & Performance", {
            "fields": (
                "rate_limit_per_minute",
                "timeout_seconds",
            )
        }),
        ("Capabilities", {
            "fields": (
                "supports_batch",
            )
        }),
        ("Status & Lifecycle", {
            "fields": (
                "status",
            )
        }),
        ("Visual", {
            "fields": (
                "icon_path",
            ),
            "classes": ("collapse",)
        }),
        ("Metadata", {
            "fields": (
                "metadata",
            ),
            "classes": ("collapse",)
        }),
        ("System Information", {
            "fields": (
                "uuid",
                "created_at",
                "updated_at",
                "endpoint_count_display",
                "node_count_display",
            ),
            "classes": ("collapse",)
        }),
    )
    
    # -------------------------------------------------------------------------
    # Ordering
    # -------------------------------------------------------------------------
    
    ordering = ["-created_at"]
    
    # -------------------------------------------------------------------------
    # Actions
    # -------------------------------------------------------------------------
    
    actions = [
        "activate_providers",
        "deprecate_providers",
        "deactivate_providers",
    ]
    
    @admin.action(description="Activate selected providers")
    def activate_providers(self, request, queryset):
        """Activate selected providers."""
        count = 0
        for provider in queryset:
            provider.activate()
            count += 1
        self.message_user(request, f"Activated {count} provider(s).")
    
    @admin.action(description="Deprecate selected providers")
    def deprecate_providers(self, request, queryset):
        """Deprecate selected providers."""
        count = 0
        for provider in queryset:
            provider.deprecate()
            count += 1
        self.message_user(request, f"Deprecated {count} provider(s).")
    
    @admin.action(description="Deactivate selected providers")
    def deactivate_providers(self, request, queryset):
        """Deactivate selected providers."""
        count = 0
        for provider in queryset:
            provider.deactivate()
            count += 1
        self.message_user(request, f"Deactivated {count} provider(s).")
    
    # -------------------------------------------------------------------------
    # Custom Display Methods
    # -------------------------------------------------------------------------
    
    @admin.display(description="Status", ordering="status")
    def status_badge(self, obj):
        """Display status with color-coded badge."""
        colors = {
            "active": "success",
            "deprecated": "warning",
            "inactive": "error",
        }
        color = colors.get(obj.status, "default")
        
        badge_colors = {
            "success": "#4caf50",
            "warning": "#ff9800",
            "error": "#f44336",
            "default": "#9e9e9e",
        }
        
        bg_color = badge_colors.get(color)
        
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; '
            'border-radius: 3px; font-weight: bold;">{}</span>',
            bg_color,
            obj.get_status_display()
        )
    
    @admin.display(description="Endpoints")
    def endpoint_count_display(self, obj):
        """Display count of endpoints with link."""
        count = obj.endpoint_count
        if count > 0:
            url = reverse("admin:providers_apiendpoint_changelist")
            return format_html(
                '<a href="{}?provider__id__exact={}">{} endpoint{}</a>',
                url,
                obj.pk,
                count,
                "s" if count != 1 else ""
            )
        return "0 endpoints"
    
    @admin.display(description="Generated Nodes")
    def node_count_display(self, obj):
        """Display count of generated nodes with link."""
        count = obj.node_count
        if count > 0:
            url = reverse("admin:providers_generatednode_changelist")
            return format_html(
                '<a href="{}?provider__id__exact={}">{} node{}</a>',
                url,
                obj.pk,
                count,
                "s" if count != 1 else ""
            )
        return "0 nodes"


# =============================================================================
# API ENDPOINT ADMIN
# =============================================================================


@admin.register(APIEndpoint)
class APIEndpointAdmin(admin.ModelAdmin):
    """
    Admin interface for APIEndpoint model.
    
    Allows viewing and editing API endpoints parsed from OpenAPI specs.
    """
    
    # -------------------------------------------------------------------------
    # List Display
    # -------------------------------------------------------------------------
    
    list_display = [
        "method_badge",
        "path",
        "provider",
        "operation_id",
        "summary",
        "requires_auth",
        "rate_limit_override",
    ]
    
    list_filter = [
        "method",
        "provider",
        "requires_auth",
        "created_at",
    ]
    
    search_fields = [
        "path",
        "operation_id",
        "summary",
        "description",
    ]
    
    readonly_fields = [
        "uuid",
        "created_at",
        "updated_at",
        "full_url_display",
    ]
    
    # -------------------------------------------------------------------------
    # Fieldsets
    # -------------------------------------------------------------------------
    
    fieldsets = (
        ("Endpoint Identity", {
            "fields": (
                "provider",
                "path",
                "method",
                "operation_id",
            )
        }),
        ("Documentation", {
            "fields": (
                "summary",
                "description",
                "tags",
            )
        }),
        ("API Specification", {
            "fields": (
                "parameters",
                "request_body",
                "response_schema",
            )
        }),
        ("Configuration", {
            "fields": (
                "requires_auth",
                "rate_limit_override",
            )
        }),
        ("System Information", {
            "fields": (
                "uuid",
                "created_at",
                "updated_at",
                "full_url_display",
            ),
            "classes": ("collapse",)
        }),
    )
    
    # -------------------------------------------------------------------------
    # Ordering
    # -------------------------------------------------------------------------
    
    ordering = ["provider", "path", "method"]
    
    # -------------------------------------------------------------------------
    # Custom Display Methods
    # -------------------------------------------------------------------------
    
    @admin.display(description="Method", ordering="method")
    def method_badge(self, obj):
        """Display HTTP method with color-coded badge."""
        colors = {
            "GET": "#2196f3",      # Blue
            "POST": "#4caf50",     # Green
            "PUT": "#ff9800",      # Orange
            "PATCH": "#9c27b0",    # Purple
            "DELETE": "#f44336",   # Red
        }
        
        bg_color = colors.get(obj.method, "#9e9e9e")
        
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 3px; font-weight: bold; font-family: monospace;">{}</span>',
            bg_color,
            obj.method
        )
    
    @admin.display(description="Full URL")
    def full_url_display(self, obj):
        """Display full endpoint URL."""
        return format_html(
            '<code style="background: #f5f5f5; padding: 5px; display: block;">{}</code>',
            obj.full_url
        )


# =============================================================================
# GENERATED NODE ADMIN
# =============================================================================


@admin.register(GeneratedNode)
class GeneratedNodeAdmin(admin.ModelAdmin):
    """
    Admin interface for GeneratedNode model.
    
    Allows viewing and editing auto-generated workflow nodes.
    """
    
    # -------------------------------------------------------------------------
    # List Display
    # -------------------------------------------------------------------------
    
    list_display = [
        "node_icon",
        "display_name",
        "node_type",
        "category",
        "provider",
        "pin_counts",
        "created_at",
    ]
    
    list_filter = [
        "category",
        "provider",
        "created_at",
    ]
    
    search_fields = [
        "node_type",
        "display_name",
        "description",
    ]
    
    readonly_fields = [
        "uuid",
        "created_at",
        "updated_at",
        "pin_counts_display",
    ]
    
    # -------------------------------------------------------------------------
    # Fieldsets
    # -------------------------------------------------------------------------
    
    fieldsets = (
        ("Node Identity", {
            "fields": (
                "provider",
                "endpoint",
                "node_type",
                "category",
                "display_name",
                "description",
            )
        }),
        ("Visual Configuration", {
            "fields": (
                "icon",
                "color",
            )
        }),
        ("Pin Configuration", {
            "fields": (
                "input_pins",
                "output_pins",
                "configuration_fields",
            )
        }),
        ("Validation", {
            "fields": (
                "validation_rules",
            )
        }),
        ("Metadata", {
            "fields": (
                "metadata",
            ),
            "classes": ("collapse",)
        }),
        ("System Information", {
            "fields": (
                "uuid",
                "created_at",
                "updated_at",
                "pin_counts_display",
            ),
            "classes": ("collapse",)
        }),
    )
    
    # -------------------------------------------------------------------------
    # Ordering
    # -------------------------------------------------------------------------
    
    ordering = ["category", "display_name"]
    
    # -------------------------------------------------------------------------
    # Custom Display Methods
    # -------------------------------------------------------------------------
    
    @admin.display(description="Icon")
    def node_icon(self, obj):
        """Display node icon."""
        return format_html(
            '<span style="font-size: 24px;">{}</span>',
            obj.icon
        )
    
    @admin.display(description="Pins")
    def pin_counts(self, obj):
        """Display pin counts."""
        return f"↓{obj.input_pin_count} ↑{obj.output_pin_count}"
    
    @admin.display(description="Pin Details")
    def pin_counts_display(self, obj):
        """Display detailed pin counts."""
        return format_html(
            '<div><strong>Input Pins:</strong> {}</div>'
            '<div><strong>Output Pins:</strong> {}</div>'
            '<div><strong>Total:</strong> {}</div>',
            obj.input_pin_count,
            obj.output_pin_count,
            obj.input_pin_count + obj.output_pin_count
        )