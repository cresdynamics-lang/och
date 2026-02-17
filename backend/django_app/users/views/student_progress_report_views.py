"""
Backend view for generating student progress reports.
"""
import logging
from django.contrib.auth import get_user_model
from django.conf import settings
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from users.permissions import IsAdminOrDirector
import json
from datetime import datetime

logger = logging.getLogger(__name__)
User = get_user_model()


class StudentProgressReportView(APIView):
    """
    Generate comprehensive progress report for a student.
    POST /api/v1/admin/students/{user_id}/progress-report/
    Body: { "format": "pdf" }
    """
    permission_classes = [IsAuthenticated, IsAdminOrDirector]

    def post(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        format_type = request.data.get('format', 'pdf')
        
        # Collect comprehensive progress data
        report_data = {
            'student': {
                'id': str(user.id),
                'name': f"{user.first_name} {user.last_name}".strip() or user.email,
                'email': user.email,
                'joined_at': user.date_joined.isoformat() if user.date_joined else None,
            },
            'enrollments': [],
            'curriculum_progress': {},
            'missions': {},
            'coaching': {},
            'subscription': {},
            'generated_at': datetime.now().isoformat(),
        }

        # Get enrollments
        from programs.models import Enrollment
        enrollments = Enrollment.objects.filter(user=user, status__in=['active', 'completed']).select_related('cohort', 'cohort__track')
        for enrollment in enrollments:
            report_data['enrollments'].append({
                'cohort_name': enrollment.cohort.name if enrollment.cohort else None,
                'track_name': enrollment.cohort.track.name if enrollment.cohort and enrollment.cohort.track else None,
                'status': enrollment.status,
                'enrollment_type': enrollment.enrollment_type,
                'seat_type': enrollment.seat_type,
                'joined_at': enrollment.joined_at.isoformat() if enrollment.joined_at else None,
            })

        # Get curriculum progress
        try:
            from curriculum.models import UserTrackProgress
            track_progress = UserTrackProgress.objects.filter(user=user)
            report_data['curriculum_progress'] = {
                'tracks_enrolled': track_progress.count(),
                'tracks_completed': track_progress.filter(completed_at__isnull=False).count(),
                'total_points': sum(p.total_points for p in track_progress),
                'total_time_minutes': sum(p.total_time_spent_minutes for p in track_progress),
            }
        except Exception as e:
            logger.warning(f"Could not fetch curriculum progress: {e}")

        # Get missions progress
        try:
            from curriculum.models import UserMissionProgress
            mission_progress = UserMissionProgress.objects.filter(user=user)
            report_data['missions'] = {
                'total_missions': mission_progress.count(),
                'completed_missions': mission_progress.filter(status='completed').count(),
                'in_progress_missions': mission_progress.filter(status='in_progress').count(),
            }
        except Exception as e:
            logger.warning(f"Could not fetch mission progress: {e}")

        # Get subscription info
        try:
            from subscriptions.models import UserSubscription
            subscription = UserSubscription.objects.filter(user=user, status='active').select_related('plan').first()
            if subscription:
                report_data['subscription'] = {
                    'plan_name': subscription.plan.name if subscription.plan else None,
                    'tier': subscription.plan.tier if subscription.plan else None,
                    'status': subscription.status,
                }
        except Exception as e:
            logger.warning(f"Could not fetch subscription: {e}")

        if format_type == 'pdf':
            # Generate PDF report
            try:
                # Try to import reportlab
                try:
                    from reportlab.lib.pagesizes import letter, A4
                    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
                    from reportlab.lib.units import inch
                    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
                    from reportlab.lib import colors
                    REPORTLAB_AVAILABLE = True
                except ImportError:
                    REPORTLAB_AVAILABLE = False
                
                if not REPORTLAB_AVAILABLE:
                    # Fallback: Return JSON data
                    return Response({
                        'error': 'PDF generation requires reportlab package. Install with: pip install reportlab',
                        'data': report_data,
                    }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
                
                from io import BytesIO

                buffer = BytesIO()
                doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=0.5*inch, bottomMargin=0.5*inch)
                story = []
                styles = getSampleStyleSheet()

                # Title
                title_style = ParagraphStyle(
                    'CustomTitle',
                    parent=styles['Heading1'],
                    fontSize=24,
                    textColor=colors.HexColor('#1E3A8A'),
                    spaceAfter=30,
                )
                story.append(Paragraph("Ongoza CyberHub", title_style))
                story.append(Paragraph("Student Progress Report", styles['Heading2']))
                story.append(Spacer(1, 0.2*inch))

                # Student Info
                story.append(Paragraph("<b>Student Information</b>", styles['Heading3']))
                student_info = [
                    ['Name:', report_data['student']['name']],
                    ['Email:', report_data['student']['email']],
                    ['Joined:', report_data['student']['joined_at'][:10] if report_data['student']['joined_at'] else 'N/A'],
                ]
                student_table = Table(student_info, colWidths=[2*inch, 4*inch])
                student_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#1E293B')),
                    ('TEXTCOLOR', (0, 0), (0, -1), colors.white),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, -1), 10),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
                    ('BACKGROUND', (1, 0), (1, -1), colors.HexColor('#0F172A')),
                    ('TEXTCOLOR', (1, 0), (1, -1), colors.white),
                ]))
                story.append(student_table)
                story.append(Spacer(1, 0.3*inch))

                # Enrollments
                if report_data['enrollments']:
                    story.append(Paragraph("<b>Enrollments</b>", styles['Heading3']))
                    enrollment_data = [['Cohort', 'Track', 'Status', 'Type', 'Joined']]
                    for enr in report_data['enrollments']:
                        enrollment_data.append([
                            enr['cohort_name'] or 'N/A',
                            enr['track_name'] or 'N/A',
                            enr['status'],
                            enr['enrollment_type'],
                            enr['joined_at'][:10] if enr['joined_at'] else 'N/A',
                        ])
                    enrollment_table = Table(enrollment_data, colWidths=[1.5*inch, 1.5*inch, 1*inch, 1*inch, 1*inch])
                    enrollment_table.setStyle(TableStyle([
                        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E3A8A')),
                        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                        ('FONTSIZE', (0, 0), (-1, -1), 9),
                        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#0F172A')),
                        ('TEXTCOLOR', (0, 1), (-1, -1), colors.white),
                        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#334155')),
                    ]))
                    story.append(enrollment_table)
                    story.append(Spacer(1, 0.3*inch))

                # Curriculum Progress
                if report_data['curriculum_progress']:
                    story.append(Paragraph("<b>Curriculum Progress</b>", styles['Heading3']))
                    progress_data = [
                        ['Tracks Enrolled:', str(report_data['curriculum_progress'].get('tracks_enrolled', 0))],
                        ['Tracks Completed:', str(report_data['curriculum_progress'].get('tracks_completed', 0))],
                        ['Total Points:', str(report_data['curriculum_progress'].get('total_points', 0))],
                        ['Total Time Spent:', f"{report_data['curriculum_progress'].get('total_time_minutes', 0)} minutes"],
                    ]
                    progress_table = Table(progress_data, colWidths=[2*inch, 4*inch])
                    progress_table.setStyle(TableStyle([
                        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#1E293B')),
                        ('TEXTCOLOR', (0, 0), (0, -1), colors.white),
                        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                        ('FONTSIZE', (0, 0), (-1, -1), 10),
                        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
                        ('BACKGROUND', (1, 0), (1, -1), colors.HexColor('#0F172A')),
                        ('TEXTCOLOR', (1, 0), (1, -1), colors.white),
                    ]))
                    story.append(progress_table)
                    story.append(Spacer(1, 0.3*inch))

                # Missions
                if report_data['missions']:
                    story.append(Paragraph("<b>Missions</b>", styles['Heading3']))
                    missions_data = [
                        ['Total Missions:', str(report_data['missions'].get('total_missions', 0))],
                        ['Completed:', str(report_data['missions'].get('completed_missions', 0))],
                        ['In Progress:', str(report_data['missions'].get('in_progress_missions', 0))],
                    ]
                    missions_table = Table(missions_data, colWidths=[2*inch, 4*inch])
                    missions_table.setStyle(TableStyle([
                        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#1E293B')),
                        ('TEXTCOLOR', (0, 0), (0, -1), colors.white),
                        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                        ('FONTSIZE', (0, 0), (-1, -1), 10),
                        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
                        ('BACKGROUND', (1, 0), (1, -1), colors.HexColor('#0F172A')),
                        ('TEXTCOLOR', (1, 0), (1, -1), colors.white),
                    ]))
                    story.append(missions_table)
                    story.append(Spacer(1, 0.3*inch))

                # Subscription
                if report_data['subscription']:
                    story.append(Paragraph("<b>Subscription</b>", styles['Heading3']))
                    sub_data = [
                        ['Plan:', report_data['subscription'].get('plan_name', 'N/A')],
                        ['Tier:', report_data['subscription'].get('tier', 'N/A')],
                        ['Status:', report_data['subscription'].get('status', 'N/A')],
                    ]
                    sub_table = Table(sub_data, colWidths=[2*inch, 4*inch])
                    sub_table.setStyle(TableStyle([
                        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#1E293B')),
                        ('TEXTCOLOR', (0, 0), (0, -1), colors.white),
                        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                        ('FONTSIZE', (0, 0), (-1, -1), 10),
                        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
                        ('BACKGROUND', (1, 0), (1, -1), colors.HexColor('#0F172A')),
                        ('TEXTCOLOR', (1, 0), (1, -1), colors.white),
                    ]))
                    story.append(sub_table)

                # Footer
                story.append(Spacer(1, 0.5*inch))
                story.append(Paragraph(f"Generated on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}", styles['Normal']))
                story.append(Paragraph("Ongoza CyberHub - Mission-Driven Education", styles['Normal']))

                doc.build(story)
                buffer.seek(0)

                # Return PDF response
                response = HttpResponse(buffer.read(), content_type='application/pdf')
                filename = f"student_progress_report_{user.email}_{datetime.now().strftime('%Y%m%d')}.pdf"
                response['Content-Disposition'] = f'attachment; filename="{filename}"'
                
                return response

            except Exception as e:
                logger.error(f"Error generating PDF report: {str(e)}")
                import traceback
                logger.error(traceback.format_exc())
                return Response({
                    'error': f'Failed to generate PDF: {str(e)}',
                    'data': report_data,
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            # Return JSON data
            return Response(report_data, status=status.HTTP_200_OK)
