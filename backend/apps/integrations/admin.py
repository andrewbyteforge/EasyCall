# =============================================================================
# FILE: backend/apps/integrations/admin.py
# =============================================================================
# Django admin configuration for integrations app.
# =============================================================================
"""
Admin configuration for API integrations.
"""

# =============================================================================
# IMPORTS
# =============================================================================

import logging
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html
from django.utils.safestring import mark_safe

from apps.integrations.models import OpenAPISpec

# =============================================================================
# LOGGER
# =============================================================================

logger = logging.getLogger(__name__)


# =============================================================================
# OPENAPI SPEC ADMIN
# =============================================================================

@admin.register(OpenAPISpec)
class OpenAPISpecAdmin(admin.ModelAdmin):
    """
    Admin interface for OpenAPI specifications.
    
    Features:
    - Upload and parse specs
    - View parsed endpoints
    - Generate nodes from specs
    - Filter by provider and parse status
    """
    
    list_display = [
        "name",
        "provider_display",
        "version",
        "endpoint_count_display",
        "parse_status_display",
        "created_at",
        "actions_display",
    ]
    
    list_filter = [
        "provider",
        "is_parsed",
        "is_active",
        "created_at",
    ]
    
    search_fields = [
        "name",
        "version",
        "description",
    ]
    
    readonly_fields = [
        "uuid",
        "is_parsed",
        "parse_error",
        "parsed_data_display",
        "created_at",
        "updated_at",
    ]
    
    fieldsets = (
        ("Basic Information", {
            "fields": (
                "uuid",
                "provider",
                "name",
                "description",
                "version",
            )
        }),
        ("Specification File", {
            "fields": (
                "spec_file",
            )
        }),
        ("Parsing Status", {
            "fields": (
                "is_parsed",
                "parse_error",
                "parsed_data_display",
            )
        }),
        ("Metadata", {
            "fields": (
                "created_at",
                "updated_at",
                "is_active",
            ),
            "classes": ("collapse",),
        }),
    )
    
    # =========================================================================
    # DISPLAY METHODS
    # =========================================================================
    
    def provider_display(self, obj):
        """Display provider with color coding."""
        colors = {
            "chainalysis": "#00897b",
            "trm_labs": "#1976d2",
            "custom": "#666666",
        }
        color = colors.get(obj.provider, "#666666")
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            obj.get_provider_display()
        )
    provider_display.short_description = "Provider"
    
    def endpoint_count_display(self, obj):
        """Display endpoint count."""
        count = obj.get_endpoint_count()
        if count > 0:
            return format_html(
                '<span style="color: green; font-weight: bold;">{}</span>',
                count
            )
        return format_html('<span style="color: gray;">0</span>')
    endpoint_count_display.short_description = "Endpoints"
    
    def parse_status_display(self, obj):
        """Display parse status with icon."""
        if obj.is_parsed:
            return format_html(
                '<span style="color: green;">✓ Parsed</span>'
            )
        elif obj.parse_error:
            return format_html(
                '<span style="color: red;">✗ Failed</span>'
            )
        else:
            return format_html(
                '<span style="color: orange;">⊙ Pending</span>'
            )
    parse_status_display.short_description = "Status"
    
    @admin.display(description="Actions")
    def actions_display(self, obj):
        """Display action buttons."""
        if not obj.pk:
            return "-"
        
        buttons = []
        
        # Parse button (if not parsed or has errors)
        if not obj.is_parsed or obj.parse_error:
            # Use API endpoint with JavaScript
            buttons.append(
                f'<button onclick="parseSpec(\'{obj.uuid}\')" '
                f'class="button" '
                f'style="background: #417690; color: white; padding: 3px 10px; '
                f'border: none; cursor: pointer; border-radius: 3px;">Parse</button>'
            )
        
        # Generate nodes button (if parsed)
        if obj.is_parsed:
            buttons.append(
                f'<button onclick="generateNodes(\'{obj.uuid}\')" '
                f'class="button" '
                f'style="background: #28a745; color: white; padding: 3px 10px; '
                f'border: none; cursor: pointer; border-radius: 3px;">Generate Nodes</button>'
            )
        
        # View Details button (always show)
        detail_url = reverse("admin:integrations_openapispec_change", args=[obj.pk])
        buttons.append(
            f'<a href="{detail_url}" class="button" '
            f'style="background: #6c757d; color: white; padding: 3px 10px; '
            f'text-decoration: none; border-radius: 3px;">View</a>'
        )
        
        # Add JavaScript functions (only once, using a flag)
        script = """
        <script>
        if (typeof parseSpec === 'undefined') {
            function parseSpec(uuid) {
                if (confirm('Parse this OpenAPI specification?')) {
                    fetch(`/api/v1/integrations/specs/${uuid}/parse/`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            alert('✓ Parsed successfully: ' + data.message);
                            location.reload();
                        } else {
                            alert('✗ Parse failed: ' + data.message);
                        }
                    })
                    .catch(error => {
                        alert('✗ Error: ' + error);
                    });
                }
            }
            
            function generateNodes(uuid) {
                if (confirm('Generate nodes from this specification?')) {
                    fetch(`/api/v1/integrations/specs/${uuid}/generate/`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            alert('✓ Generated ' + data.nodes.length + ' nodes successfully!');
                            location.reload();
                        } else {
                            alert('✗ Generation failed: ' + data.message);
                        }
                    })
                    .catch(error => {
                        alert('✗ Error: ' + error);
                    });
                }
            }
        }
        </script>
        """
        
        return format_html(
            '{}<div style="white-space: nowrap;">{}</div>',
            mark_safe(script),
            mark_safe(" ".join(buttons))
        )
    
    
    
    def parsed_data_display(self, obj):
        """Display parsed data in readable format."""
        if not obj.is_parsed or not obj.parsed_data:
            return "No parsed data available"
        
        api_info = obj.parsed_data.get("api_info", {})
        endpoints = obj.parsed_data.get("endpoints", [])
        
        html = f"""
        <div style="font-family: monospace; background: #f5f5f5; padding: 10px; border-radius: 5px;">
            <strong>API: {api_info.get('title', 'N/A')}</strong><br>
            <strong>Version: {api_info.get('version', 'N/A')}</strong><br>
            <strong>Endpoints: {len(endpoints)}</strong><br><br>
        """
        
        if endpoints:
            html += "<strong>Endpoint List:</strong><br>"
            for endpoint in endpoints[:10]:  # Show first 10
                html += f"• {endpoint.get('method', 'N/A')} {endpoint.get('path', 'N/A')}<br>"
            
            if len(endpoints) > 10:
                html += f"<em>... and {len(endpoints) - 10} more</em><br>"
        
        html += "</div>"
        return mark_safe(html)
    parsed_data_display.short_description = "Parsed Data"
    
    # =========================================================================
    # CUSTOM ACTIONS
    # =========================================================================
    
    actions = ["parse_selected_specs", "generate_nodes_for_selected"]
    
    def parse_selected_specs(self, request, queryset):
        """Parse selected specifications."""
        from apps.integrations.openapi_parser import OpenAPIParser, OpenAPIParseError
        
        success_count = 0
        error_count = 0
        
        parser = OpenAPIParser()
        
        for spec in queryset:
            try:
                parsed_data = parser.parse_file(spec.spec_file.path)
                spec.mark_as_parsed(parsed_data)
                success_count += 1
            except OpenAPIParseError as e:
                spec.mark_parse_failed(str(e))
                error_count += 1
            except Exception as e:
                spec.mark_parse_failed(f"Unexpected error: {str(e)}")
                error_count += 1
        
        self.message_user(
            request,
            f"Successfully parsed {success_count} specs. {error_count} failed."
        )
    parse_selected_specs.short_description = "Parse selected specifications"
    
    def generate_nodes_for_selected(self, request, queryset):
        """Generate nodes for selected specs."""
        from apps.integrations.node_generator import NodeGenerator
        
        total_nodes = 0
        error_count = 0
        
        generator = NodeGenerator()
        
        for spec in queryset:
            if not spec.is_parsed:
                error_count += 1
                continue
            
            try:
                endpoints = spec.parsed_data.get("endpoints", [])
                nodes = generator.generate_nodes(
                    endpoints=endpoints,
                    provider=spec.provider,
                    category="query"
                )
                total_nodes += len(nodes)
            except Exception as e:
                logger.error(f"Failed to generate nodes for {spec.uuid}: {e}")
                error_count += 1
        
        self.message_user(
            request,
            f"Generated {total_nodes} node definitions. {error_count} specs skipped."
        )
    generate_nodes_for_selected.short_description = "Generate nodes for selected specs"