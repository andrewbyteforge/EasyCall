#!/usr/bin/env python
"""Test PDF generation capabilities."""

import sys

# Write output to file for visibility
output_file = open(r'c:\Users\Andy\EasyCall\backend\test_pdf_output.txt', 'w')

def log(msg):
    print(msg)
    output_file.write(msg + '\n')
    output_file.flush()

log("=" * 50)
log("PDF Library Test")
log("=" * 50)

# Test WeasyPrint
log("\n1. Testing WeasyPrint...")
try:
    from weasyprint import HTML
    HTML(string="<html><body>test</body></html>")
    log("   WeasyPrint: OK")
except ImportError as e:
    log(f"   WeasyPrint: NOT INSTALLED - {e}")
except OSError as e:
    log(f"   WeasyPrint: GTK MISSING - {e}")

# Test xhtml2pdf
log("\n2. Testing xhtml2pdf...")
try:
    from xhtml2pdf import pisa
    log("   xhtml2pdf: OK")
except ImportError as e:
    log(f"   xhtml2pdf: NOT INSTALLED - {e}")

# Test reportlab
log("\n3. Testing reportlab...")
try:
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
    log("   reportlab: OK")
except ImportError as e:
    log(f"   reportlab: NOT INSTALLED - {e}")

log("\n" + "=" * 50)
log("Recommendation:")

# Check what's available
weasyprint_ok = False
xhtml2pdf_ok = False
reportlab_ok = False

try:
    from weasyprint import HTML
    HTML(string="<html><body>test</body></html>")
    weasyprint_ok = True
except:
    pass

try:
    from xhtml2pdf import pisa
    xhtml2pdf_ok = True
except:
    pass

try:
    from reportlab.pdfgen import canvas
    reportlab_ok = True
except:
    pass

if weasyprint_ok:
    log("Use WeasyPrint (template engine)")
elif xhtml2pdf_ok:
    log("Use xhtml2pdf (template engine)")
elif reportlab_ok:
    log("Use ReportLab (classic engine)")
else:
    log("NO PDF LIBRARY AVAILABLE!")
    log("Install with: pip install xhtml2pdf")

log("=" * 50)
output_file.close()
