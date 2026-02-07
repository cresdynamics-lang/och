#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Extract billing module pages from SMP Technical Specs."""
import PyPDF2
import sys
import io

# Set UTF-8 encoding for output
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

pdf_path = '../../OCH SMP  Technical Specifications Document.pdf'

try:
    with open(pdf_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)

        # Extract pages 90-92 (billing module)
        for page_num in [89, 90, 91, 97, 102]:  # 0-indexed
            if page_num < len(reader.pages):
                text = reader.pages[page_num].extract_text()
                print(f'\n{"=" * 80}')
                print(f'PAGE {page_num + 1}')
                print("=" * 80)
                print(text)

except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
