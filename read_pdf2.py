import fitz
doc = fitz.open('manual_dashboard_admin_maiz_pro.pdf')
for i in range(min(8, doc.page_count)):
    print(f'=== PAGE {i+1} ===')
    print(doc[i].get_text())
