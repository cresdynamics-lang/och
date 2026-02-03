"""
Invoice PDF Generation Service
Creates professional PDF invoices for sponsor billing.
"""
import os
import uuid
from datetime import datetime, date
from decimal import Decimal
from django.conf import settings
from django.template.loader import render_to_string
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
# Import locally to avoid circular import
from ..models import Sponsor, SponsorCohortBilling, SponsorFinancialTransaction


class InvoiceService:
    """Service for generating professional PDF invoices"""

    @staticmethod
    def generate_invoice_pdf(sponsor: Sponsor, billing_record: SponsorCohortBilling) -> str:
        """
        Generate a professional PDF invoice for a billing record.
        Returns the URL of the generated PDF.
        """
        # Generate unique invoice number
        invoice_number = InvoiceService._generate_invoice_number(billing_record)

        # Prepare invoice data
        invoice_data = InvoiceService._prepare_invoice_data(sponsor, billing_record, invoice_number)

        # Generate HTML template
        html_content = InvoiceService._render_invoice_html(invoice_data)

        # Convert HTML to PDF (placeholder - in production use WeasyPrint or similar)
        pdf_content = InvoiceService._html_to_pdf(html_content)

        # Save PDF file
        filename = f"invoice_{invoice_number}.pdf"
        file_path = f"invoices/{sponsor.slug}/{filename}"

        # Ensure directory exists
        full_path = os.path.join(settings.MEDIA_ROOT, f"invoices/{sponsor.slug}")
        os.makedirs(full_path, exist_ok=True)

        # Save file
        file_full_path = os.path.join(settings.MEDIA_ROOT, file_path)
        with open(file_full_path, 'wb') as f:
            f.write(pdf_content)

        # Update billing record
        billing_record.invoice_generated = True
        billing_record.save(update_fields=['invoice_generated'])

        # Create financial transaction record
        SponsorFinancialTransaction.objects.create(
            sponsor=sponsor,
            cohort=billing_record.sponsor_cohort,
            transaction_type='platform_fee',
            description=f'Invoice {invoice_number}: {billing_record.billing_month.strftime("%B %Y")} billing',
            amount=billing_record.total_cost,
            period_start=billing_record.billing_month,
            period_end=billing_record.billing_month.replace(day=28),
            status='invoiced',
            invoice_url=f"{settings.MEDIA_URL}{file_path}"
        )

        return f"{settings.MEDIA_URL}{file_path}"

    @staticmethod
    def generate_consolidated_invoice_pdf(sponsor: Sponsor, billing_records: list[SponsorCohortBilling]) -> str:
        """
        Generate a consolidated PDF invoice for multiple billing records.
        """
        invoice_number = InvoiceService._generate_consolidated_invoice_number(billing_records[0])

        # Prepare consolidated invoice data
        invoice_data = InvoiceService._prepare_consolidated_invoice_data(sponsor, billing_records, invoice_number)

        # Generate HTML template
        html_content = InvoiceService._render_consolidated_invoice_html(invoice_data)

        # Convert HTML to PDF
        pdf_content = InvoiceService._html_to_pdf(html_content)

        # Save PDF file
        filename = f"consolidated_invoice_{invoice_number}.pdf"
        file_path = f"invoices/{sponsor.slug}/{filename}"

        # Ensure directory exists
        full_path = os.path.join(settings.MEDIA_ROOT, f"invoices/{sponsor.slug}")
        os.makedirs(full_path, exist_ok=True)

        # Save file
        file_full_path = os.path.join(settings.MEDIA_ROOT, file_path)
        with open(file_full_path, 'wb') as f:
            f.write(pdf_content)

        # Mark all billing records as invoiced
        for record in billing_records:
            record.invoice_generated = True
            record.save(update_fields=['invoice_generated'])

        return f"{settings.MEDIA_URL}{file_path}"

    @staticmethod
    def _generate_invoice_number(billing_record: SponsorCohortBilling) -> str:
        """Generate unique invoice number"""
        month_str = billing_record.billing_month.strftime('%Y%m')
        cohort_id = str(billing_record.sponsor_cohort.id)[:8]
        return f"INV-{month_str}-{cohort_id}"

    @staticmethod
    def _generate_consolidated_invoice_number(billing_record: SponsorCohortBilling) -> str:
        """Generate unique consolidated invoice number"""
        month_str = billing_record.billing_month.strftime('%Y%m')
        sponsor_id = str(billing_record.sponsor_cohort.sponsor.id)[:8]
        return f"CON-{month_str}-{sponsor_id}"

    @staticmethod
    def _prepare_invoice_data(sponsor: Sponsor, billing_record: SponsorCohortBilling, invoice_number: str) -> dict:
        """Prepare data for individual cohort invoice"""
        cohort = billing_record.sponsor_cohort

        return {
            'invoice_number': invoice_number,
            'invoice_date': date.today(),
            'due_date': date.today().replace(day=min(28, date.today().day)),  # 30 days from invoice date
            'billing_period': billing_record.billing_month.strftime('%B %Y'),

            # Company info
            'company_name': 'Ongóza Cyber Hub',
            'company_address': 'Nairobi, Kenya',
            'company_email': 'finance@ongozacyberhub.com',
            'company_phone': '+254 XXX XXX XXX',

            # Sponsor info
            'sponsor_name': sponsor.name,
            'sponsor_contact': sponsor.contact_email,
            'sponsor_address': getattr(sponsor, 'billing_address', 'N/A'),

            # Cohort info
            'cohort_name': cohort.name,
            'track_name': cohort.track_slug.title(),
            'students_active': billing_record.students_active,

            # Billing details
            'line_items': [
                {
                    'description': f'Platform Access ({billing_record.students_active} students)',
                    'quantity': billing_record.students_active,
                    'unit_price': 20000,
                    'amount': billing_record.platform_cost
                },
                {
                    'description': 'Mentor Sessions',
                    'quantity': billing_record.mentor_sessions or 0,
                    'unit_price': 7000,
                    'amount': billing_record.mentor_cost
                },
                {
                    'description': 'Lab Usage',
                    'quantity': billing_record.lab_usage_hours or 0,
                    'unit_price': 200,
                    'amount': billing_record.lab_cost
                },
                {
                    'description': 'Scholarship Support',
                    'quantity': 1,
                    'unit_price': billing_record.scholarship_cost,
                    'amount': billing_record.scholarship_cost
                }
            ],

            'subtotal': billing_record.total_cost,
            'revenue_share_credit': billing_record.revenue_share_kes,
            'total_due': billing_record.net_amount,

            # Payment info
            'payment_terms': 'Net 30 days',
            'payment_methods': [
                'Bank Transfer',
                'M-Pesa',
                'Card Payment (coming soon)'
            ],

            # Bank details (placeholder)
            'bank_details': {
                'bank_name': 'KCB Bank Kenya',
                'account_name': 'Ongóza Cyber Hub Ltd',
                'account_number': '1234567890',
                'swift_code': 'KCBLKENX',
                'branch': 'Westlands, Nairobi'
            }
        }

    @staticmethod
    def _prepare_consolidated_invoice_data(sponsor: Sponsor, billing_records: list[SponsorCohortBilling], invoice_number: str) -> dict:
        """Prepare data for consolidated invoice"""
        total_amount = sum(record.net_amount for record in billing_records)

        return {
            'invoice_number': invoice_number,
            'invoice_date': date.today(),
            'due_date': date.today().replace(day=min(28, date.today().day)),
            'billing_period': f"{billing_records[0].billing_month.strftime('%B %Y')} (Consolidated)",

            # Company info
            'company_name': 'Ongóza Cyber Hub',
            'company_address': 'Nairobi, Kenya',
            'company_email': 'finance@ongozacyberhub.com',
            'company_phone': '+254 XXX XXX XXX',

            # Sponsor info
            'sponsor_name': sponsor.name,
            'sponsor_contact': sponsor.contact_email,

            # Cohort breakdown
            'cohorts': [
                {
                    'name': record.sponsor_cohort.name,
                    'billing_month': record.billing_month.strftime('%B %Y'),
                    'students': record.students_active,
                    'amount': record.net_amount
                }
                for record in billing_records
            ],

            'total_due': total_amount,

            # Payment info
            'payment_terms': 'Net 30 days',
            'payment_methods': [
                'Bank Transfer',
                'M-Pesa',
                'Card Payment (coming soon)'
            ]
        }

    @staticmethod
    def _render_invoice_html(invoice_data: dict) -> str:
        """Render invoice HTML template"""
        template_path = 'sponsors/invoice_template.html'

        # For now, return a simple HTML string
        # In production, use Django templates
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Invoice {invoice_data['invoice_number']}</title>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                    color: #333;
                }}
                .header {{
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 40px;
                    border-bottom: 2px solid #f0f0f0;
                    padding-bottom: 20px;
                }}
                .company-info h1 {{
                    color: #C89C15;
                    margin: 0;
                }}
                .invoice-details {{
                    text-align: right;
                }}
                .billing-info {{
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 30px;
                }}
                table {{
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                }}
                th, td {{
                    padding: 10px;
                    text-align: left;
                    border-bottom: 1px solid #ddd;
                }}
                th {{
                    background-color: #f8f8f8;
                    font-weight: bold;
                }}
                .total {{
                    text-align: right;
                    font-size: 18px;
                    font-weight: bold;
                    margin-top: 20px;
                }}
                .payment-info {{
                    background-color: #f8f8f8;
                    padding: 20px;
                    margin-top: 30px;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <div class="company-info">
                    <h1>{invoice_data['company_name']}</h1>
                    <p>{invoice_data['company_address']}</p>
                    <p>Email: {invoice_data['company_email']}</p>
                    <p>Phone: {invoice_data['company_phone']}</p>
                </div>
                <div class="invoice-details">
                    <h2>INVOICE</h2>
                    <p><strong>Invoice #:</strong> {invoice_data['invoice_number']}</p>
                    <p><strong>Date:</strong> {invoice_data['invoice_date']}</p>
                    <p><strong>Due Date:</strong> {invoice_data['due_date']}</p>
                </div>
            </div>

            <div class="billing-info">
                <div>
                    <h3>Bill To:</h3>
                    <p><strong>{invoice_data['sponsor_name']}</strong></p>
                    <p>{invoice_data.get('sponsor_address', 'N/A')}</p>
                    <p>Email: {invoice_data['sponsor_contact']}</p>
                </div>
                <div>
                    <h3>Cohort:</h3>
                    <p><strong>{invoice_data['cohort_name']}</strong></p>
                    <p>{invoice_data['track_name']} Track</p>
                    <p>{invoice_data['students_active']} Active Students</p>
                    <p>Billing Period: {invoice_data['billing_period']}</p>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {"".join(f'''
                    <tr>
                        <td>{item['description']}</td>
                        <td>{item['quantity']}</td>
                        <td>KES {item['unit_price']:,}</td>
                        <td>KES {item['amount']:,}</td>
                    </tr>
                    ''' for item in invoice_data['line_items'])}
                </tbody>
            </table>

            <div class="total">
                <p>Subtotal: KES {invoice_data['subtotal']:,}</p>
                {f"<p>Revenue Share Credit: -KES {invoice_data['revenue_share_credit']:,}</p>" if invoice_data['revenue_share_credit'] > 0 else ""}
                <p>Total Due: KES {invoice_data['total_due']:,}</p>
            </div>

            <div class="payment-info">
                <h3>Payment Information</h3>
                <p><strong>Payment Terms:</strong> {invoice_data['payment_terms']}</p>
                <p><strong>Payment Methods:</strong> {', '.join(invoice_data['payment_methods'])}</p>

                <h4>Bank Transfer Details:</h4>
                <p><strong>Bank:</strong> {invoice_data['bank_details']['bank_name']}</p>
                <p><strong>Account Name:</strong> {invoice_data['bank_details']['account_name']}</p>
                <p><strong>Account Number:</strong> {invoice_data['bank_details']['account_number']}</p>
                <p><strong>Swift Code:</strong> {invoice_data['bank_details']['swift_code']}</p>
                <p><strong>Branch:</strong> {invoice_data['bank_details']['branch']}</p>
            </div>

            <div style="margin-top: 40px; text-align: center; color: #666; font-size: 12px;">
                <p>Thank you for your business with Ongóza Cyber Hub!</p>
                <p>This invoice was generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            </div>
        </body>
        </html>
        """

        return html

    @staticmethod
    def _render_consolidated_invoice_html(invoice_data: dict) -> str:
        """Render consolidated invoice HTML template"""
        cohorts_html = "".join(f'''
        <tr>
            <td>{cohort['name']}</td>
            <td>{cohort['billing_month']}</td>
            <td>{cohort['students']}</td>
            <td>KES {cohort['amount']:,}</td>
        </tr>
        ''' for cohort in invoice_data['cohorts'])

        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Consolidated Invoice {invoice_data['invoice_number']}</title>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                    color: #333;
                }}
                .header {{
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 40px;
                    border-bottom: 2px solid #f0f0f0;
                    padding-bottom: 20px;
                }}
                .company-info h1 {{
                    color: #C89C15;
                    margin: 0;
                }}
                .invoice-details {{
                    text-align: right;
                }}
                table {{
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                }}
                th, td {{
                    padding: 10px;
                    text-align: left;
                    border-bottom: 1px solid #ddd;
                }}
                th {{
                    background-color: #f8f8f8;
                    font-weight: bold;
                }}
                .total {{
                    text-align: right;
                    font-size: 18px;
                    font-weight: bold;
                    margin-top: 20px;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <div class="company-info">
                    <h1>{invoice_data['company_name']}</h1>
                    <p>{invoice_data['company_address']}</p>
                    <p>Email: {invoice_data['company_email']}</p>
                </div>
                <div class="invoice-details">
                    <h2>CONSOLIDATED INVOICE</h2>
                    <p><strong>Invoice #:</strong> {invoice_data['invoice_number']}</p>
                    <p><strong>Date:</strong> {invoice_data['invoice_date']}</p>
                    <p><strong>Due Date:</strong> {invoice_data['due_date']}</p>
                </div>
            </div>

            <div style="margin-bottom: 30px;">
                <h3>Bill To:</h3>
                <p><strong>{invoice_data['sponsor_name']}</strong></p>
                <p>Email: {invoice_data['sponsor_contact']}</p>
                <p>Billing Period: {invoice_data['billing_period']}</p>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Cohort</th>
                        <th>Billing Month</th>
                        <th>Students</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {cohorts_html}
                </tbody>
            </table>

            <div class="total">
                <p>Total Due: KES {invoice_data['total_due']:,}</p>
            </div>

            <div style="margin-top: 40px; text-align: center; color: #666; font-size: 12px;">
                <p>Thank you for your partnership with Ongóza Cyber Hub!</p>
                <p>This consolidated invoice was generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            </div>
        </body>
        </html>
        """

        return html

    @staticmethod
    def _html_to_pdf(html_content: str) -> bytes:
        """
        Convert HTML to PDF.
        In production, use WeasyPrint or similar library.
        For now, return the HTML as bytes (placeholder).
        """
        # TODO: Implement actual HTML to PDF conversion
        # Example with WeasyPrint:
        # from weasyprint import HTML
        # pdf_bytes = HTML(string=html_content).write_pdf()
        # return pdf_bytes

        # Placeholder: return HTML as bytes
        return html_content.encode('utf-8')
