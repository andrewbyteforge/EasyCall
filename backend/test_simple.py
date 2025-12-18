"""Simple xhtml2pdf test without Django."""
import os

output_dir = r'c:\Users\Andy\EasyCall\backend\outputs'
log_path = os.path.join(output_dir, 'test_log.txt')
pdf_path = os.path.join(output_dir, 'test_simple.pdf')

with open(log_path, 'w') as log:
    log.write("Starting test...\n")

    try:
        from xhtml2pdf import pisa
        log.write("xhtml2pdf imported OK\n")
    except ImportError as e:
        log.write(f"IMPORT ERROR: {e}\n")
        raise

    html = """<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body><h1>Test PDF</h1><p>Hello World!</p></body>
</html>"""

    try:
        from io import BytesIO
        source = BytesIO(html.encode('utf-8'))

        with open(pdf_path, 'wb') as pdf_file:
            result = pisa.CreatePDF(source, dest=pdf_file)
            log.write(f"CreatePDF returned, err={result.err}\n")

        if os.path.exists(pdf_path):
            log.write(f"PDF created: {os.path.getsize(pdf_path)} bytes\n")
        else:
            log.write("PDF file not created!\n")

    except Exception as e:
        log.write(f"ERROR: {e}\n")
        import traceback
        log.write(traceback.format_exc())

    log.write("Done.\n")
