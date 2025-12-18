with open(r'c:\Users\Andy\EasyCall\backend\test_result.txt', 'w') as f:
    f.write('Python works!\n')
    try:
        from xhtml2pdf import pisa
        f.write('xhtml2pdf imported OK\n')

        from io import BytesIO
        html = '<html><body><h1>Test</h1></body></html>'
        source = BytesIO(html.encode('utf-8'))

        with open(r'c:\Users\Andy\EasyCall\backend\test_output.pdf', 'wb') as pdf:
            result = pisa.CreatePDF(source, dest=pdf)
            f.write(f'CreatePDF err={result.err}\n')

    except Exception as e:
        f.write(f'Error: {e}\n')
