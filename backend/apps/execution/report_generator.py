# =============================================================================
# FILE: backend/apps/execution/report_generator.py
# =============================================================================
# Template-based PDF report generator using Django templates and WeasyPrint.
# Provides flexible HTML/CSS styling for blockchain intelligence reports.
# =============================================================================

import os
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from django.template import Template, Context
from django.template.loader import render_to_string
from django.conf import settings

# Try to import WeasyPrint, fall back to xhtml2pdf if not available
import logging
logger = logging.getLogger(__name__)

PDF_ENGINE = None
HTML = None
CSS = None
pisa = None

try:
    from weasyprint import HTML as _HTML, CSS as _CSS
    # Test if WeasyPrint can actually work (requires GTK on Windows)
    # This will fail at runtime if GTK libraries are missing
    _HTML(string="<html><body>test</body></html>")
    HTML = _HTML
    CSS = _CSS
    PDF_ENGINE = 'weasyprint'
    logger.info("PDF Engine: WeasyPrint available")
except (ImportError, OSError) as e:
    # WeasyPrint not available or GTK libraries missing
    logger.info(f"WeasyPrint not available: {e}")
    PDF_ENGINE = None

if PDF_ENGINE != 'weasyprint':
    try:
        from xhtml2pdf import pisa as _pisa
        pisa = _pisa
        PDF_ENGINE = 'xhtml2pdf'
        logger.info("PDF Engine: xhtml2pdf available")
    except ImportError as e:
        logger.info(f"xhtml2pdf not available: {e}")
        PDF_ENGINE = None

if PDF_ENGINE is None:
    logger.warning("No PDF engine available! Reports will be HTML only.")


class ReportGenerator:
    """
    Generates PDF reports from workflow execution data using Django templates.
    Supports multiple data sources (Chainalysis, TRM Labs) and adapts layout
    based on the data structure.
    """

    # Mapping of node types to section templates
    NODE_TYPE_SECTIONS = {
        'chainalysis_cluster_info': 'cluster_info',
        'chainalysis_cluster_balance': 'cluster_balance',
        'chainalysis_cluster_counterparties': 'counterparties',
        'chainalysis_transaction_details': 'transaction_details',
        'chainalysis_exposure_category': 'exposure',
        'chainalysis_exposure_service': 'exposure',
        'trm_address_attribution': 'trm_attribution',
        'trm_total_exposure': 'trm_exposure',
        'trm_address_summary': 'key_value',
        'trm_address_transfers': 'table',
        'trm_network_intelligence': 'trm_exposure',
    }

    # Human-readable titles for node types
    NODE_TYPE_TITLES = {
        'chainalysis_cluster_info': 'Cluster Attribution',
        'chainalysis_cluster_balance': 'Balance Summary',
        'chainalysis_cluster_counterparties': 'Counterparty Analysis',
        'chainalysis_transaction_details': 'Transaction Details',
        'chainalysis_exposure_category': 'Category Exposure',
        'chainalysis_exposure_service': 'Service Exposure',
        'trm_address_attribution': 'Address Attribution',
        'trm_total_exposure': 'Risk Exposure Analysis',
        'trm_address_summary': 'Address Summary',
        'trm_address_transfers': 'Transfer History',
        'trm_network_intelligence': 'Network Intelligence',
    }

    def __init__(self, workflow_name: str = "Untitled Workflow"):
        self.workflow_name = workflow_name
        self.sections: List[Dict[str, Any]] = []
        self.data_sources: List[str] = []
        self.total_addresses = 0
        self.total_transactions = 0

    def add_section(
        self,
        node_type: str,
        data: Dict[str, Any],
        title: Optional[str] = None,
        columns: Optional[List[Dict]] = None
    ):
        """
        Add a section to the report based on node type and data.

        Args:
            node_type: The workflow node type (e.g., 'chainalysis_cluster_info')
            data: The data returned from the node execution
            title: Optional custom title override
            columns: Optional column definitions for table sections
        """
        section_type = self.NODE_TYPE_SECTIONS.get(node_type, 'generic_data')
        section_title = title or self.NODE_TYPE_TITLES.get(node_type, node_type.replace('_', ' ').title())

        section = {
            'type': section_type,
            'title': section_title,
            'data': data,
            'node_type': node_type,
        }

        if columns:
            section['columns'] = columns

        self.sections.append(section)

        # Track data sources
        if 'chainalysis' in node_type and 'Chainalysis' not in self.data_sources:
            self.data_sources.append('Chainalysis Reactor')
        elif 'trm' in node_type and 'TRM Labs' not in self.data_sources:
            self.data_sources.append('TRM Labs')

        # Track counts
        if 'address' in data:
            self.total_addresses += 1
        if 'addresses' in data and isinstance(data['addresses'], list):
            self.total_addresses += len(data['addresses'])
        if 'tx_hash' in data or 'transaction' in data:
            self.total_transactions += 1
        if 'tx_hashes' in data and isinstance(data['tx_hashes'], list):
            self.total_transactions += len(data['tx_hashes'])

    def add_raw_data_section(
        self,
        title: str,
        data: Any,
        section_type: str = 'generic_data'
    ):
        """
        Add a section with raw data (not from a specific node type).
        """
        self.sections.append({
            'type': section_type,
            'title': title,
            'data': data,
        })

    def build_context(self, **kwargs) -> Dict[str, Any]:
        """
        Build the template context for rendering.
        """
        report_id = kwargs.get('report_id', str(uuid.uuid4())[:8].upper())

        context = {
            'report_title': kwargs.get('report_title', 'Blockchain Intelligence Report'),
            'report_subtitle': kwargs.get('report_subtitle',
                'Comprehensive analysis of blockchain addresses and transactions'),
            'workflow_name': self.workflow_name,
            'generated_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'report_id': report_id,
            'classification': kwargs.get('classification', 'CONFIDENTIAL'),
            'data_sources': self.data_sources or ['N/A'],
            'total_addresses': self.total_addresses or None,
            'total_transactions': self.total_transactions or None,
            'sections': self.sections,
            'executive_summary': kwargs.get('executive_summary'),
            'summary_stats': kwargs.get('summary_stats'),
        }

        return context

    def render_html(self, use_simple_template: bool = False, **kwargs) -> str:
        """
        Render the report as HTML string.

        Args:
            use_simple_template: If True, use xhtml2pdf-compatible template
        """
        context = self.build_context(**kwargs)
        template_name = (
            'reports/base_report_xhtml2pdf.html' if use_simple_template
            else 'reports/base_report.html'
        )
        html = render_to_string(template_name, context)
        return html

    def generate_pdf(self, output_path: str, **kwargs) -> str:
        """
        Generate PDF file from the report.

        Args:
            output_path: Path where PDF should be saved
            **kwargs: Additional context parameters

        Returns:
            Path to the generated PDF file
        """
        logger.info(f"generate_pdf called. PDF_ENGINE={PDF_ENGINE}, pisa={pisa is not None}")

        # Try WeasyPrint first (supports advanced CSS)
        if PDF_ENGINE == 'weasyprint':
            try:
                logger.info("Attempting WeasyPrint...")
                html_content = self.render_html(use_simple_template=False, **kwargs)
                return self._generate_with_weasyprint(html_content, output_path)
            except OSError as e:
                logger.warning(f"WeasyPrint failed (GTK missing): {e}")
                pass

        # Try xhtml2pdf (use simple template without flexbox/grid)
        if PDF_ENGINE == 'xhtml2pdf' or pisa is not None:
            try:
                logger.info("Attempting xhtml2pdf...")
                html_content = self.render_html(use_simple_template=True, **kwargs)
                return self._generate_with_xhtml2pdf(html_content, output_path)
            except Exception as e:
                logger.error(f"xhtml2pdf failed: {e}", exc_info=True)
                pass

        # All PDF engines failed - raise exception so executor can fall back to ReportLab
        logger.error("All PDF engines failed (WeasyPrint requires GTK, xhtml2pdf failed)")
        raise RuntimeError("No PDF engine available - WeasyPrint requires GTK, xhtml2pdf failed")

    def _generate_with_weasyprint(self, html_content: str, output_path: str) -> str:
        """Generate PDF using WeasyPrint."""
        html = HTML(string=html_content)
        html.write_pdf(output_path)
        return output_path

    def _generate_with_xhtml2pdf(self, html_content: str, output_path: str) -> str:
        """Generate PDF using xhtml2pdf."""
        from io import BytesIO

        # xhtml2pdf works better with BytesIO source
        source = BytesIO(html_content.encode('utf-8'))

        with open(output_path, 'wb') as pdf_file:
            pisa_status = pisa.CreatePDF(
                source,
                dest=pdf_file,
                encoding='utf-8'
            )
            if pisa_status.err:
                raise Exception(f"PDF generation failed with {pisa_status.err} errors")
        return output_path

    def get_pdf_bytes(self, **kwargs) -> bytes:
        """
        Generate PDF and return as bytes (for streaming/download).
        """
        from io import BytesIO

        # Try WeasyPrint first
        if PDF_ENGINE == 'weasyprint' and HTML is not None:
            try:
                html_content = self.render_html(use_simple_template=False, **kwargs)
                html = HTML(string=html_content)
                return html.write_pdf()
            except OSError:
                pass

        # Try xhtml2pdf
        if pisa is not None:
            try:
                html_content = self.render_html(use_simple_template=True, **kwargs)
                buffer = BytesIO()
                pisa.CreatePDF(html_content, dest=buffer)
                return buffer.getvalue()
            except Exception:
                pass

        # Fallback: return HTML as bytes
        html_content = self.render_html(use_simple_template=False, **kwargs)
        return html_content.encode('utf-8')


def generate_report_from_execution(
    execution_results: Dict[str, Dict[str, Any]],
    workflow_name: str = "Untitled Workflow",
    output_path: Optional[str] = None,
    **kwargs
) -> str:
    """
    Convenience function to generate a report from workflow execution results.

    Args:
        execution_results: Dict mapping node_id to {node_type, outputs}
        workflow_name: Name of the workflow
        output_path: Optional output path for PDF
        **kwargs: Additional report options

    Returns:
        Path to generated report (PDF or HTML)
    """
    generator = ReportGenerator(workflow_name)

    # Process each node's results
    for node_id, result in execution_results.items():
        if not result or 'outputs' not in result:
            continue

        node_type = result.get('node_type', result.get('type', 'unknown'))
        outputs = result.get('outputs', {})

        # Skip empty outputs and non-query nodes
        if not outputs or node_type.startswith(('single_', 'batch_', 'credential_', 'output_', 'export_')):
            continue

        # Add section for this node's data
        generator.add_section(node_type, outputs)

    # Generate executive summary
    summary_parts = []
    if generator.total_addresses > 0:
        summary_parts.append(f"analyzed {generator.total_addresses} blockchain address(es)")
    if generator.total_transactions > 0:
        summary_parts.append(f"examined {generator.total_transactions} transaction(s)")
    if generator.data_sources:
        summary_parts.append(f"using data from {', '.join(generator.data_sources)}")

    if summary_parts:
        executive_summary = f"This report {' and '.join(summary_parts)}."
    else:
        executive_summary = "This report contains the results of the blockchain intelligence workflow execution."

    # Generate output path if not provided
    if not output_path:
        output_dir = os.path.join(settings.BASE_DIR, 'outputs')
        os.makedirs(output_dir, exist_ok=True)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        output_path = os.path.join(output_dir, f'report_{timestamp}.pdf')

    return generator.generate_pdf(
        output_path,
        executive_summary=executive_summary,
        **kwargs
    )
