"""
Report Generation Service
Generates HTML and PDF reports
"""

from typing import List, Optional
from datetime import date, datetime
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_LEFT
import os


def _generate_excavation_recommendations(inspections) -> str:
    """Generate excavation recommendations based on high-risk defects"""
    # Filter high-risk defects and sort by severity
    high_risk_defects = [
        insp for insp in inspections 
        if insp.defect_found and insp.ml_label == 'high'
    ]
    
    # Sort by depth (param1) descending
    high_risk_defects.sort(key=lambda x: (x.param1 or 0), reverse=True)
    
    rows = ""
    for idx, insp in enumerate(high_risk_defects[:10], 1):  # Top 10
        priority = "🔴 Высокий" if idx <= 3 else "🟡 Средний" if idx <= 7 else "🟢 Низкий"
        
        # Get coordinates from object if available
        coords = "N/A"
        if hasattr(insp, 'object') and insp.object:
            coords = f"{insp.object.lat:.4f}, {insp.object.lon:.4f}"
        
        # Defect parameters
        params = f"Глубина: {insp.param1 or 0}mm, Длина: {insp.param2 or 0}mm, Ширина: {insp.param3 or 0}mm"
        
        # Justification
        justification = f"Критический дефект обнаружен методом {insp.method}. "
        if insp.quality_grade == 'недопустимо':
            justification += "Качество недопустимо."
        elif insp.param1 and insp.param1 > 10:
            justification += f"Глубина дефекта {insp.param1}mm превышает допустимую."
        else:
            justification += "Требуется немедленное вмешательство."
        
        rows += f"""
        <tr>
            <td style="font-weight: bold;">{priority}</td>
            <td>{insp.object_id}</td>
            <td>{coords}</td>
            <td style="font-size: 0.85em;">{params}</td>
            <td style="font-size: 0.85em;">{justification}</td>
        </tr>
        """
    
    if not rows:
        rows = '<tr><td colspan="5" style="text-align: center; color: #6b7280;">Нет дефектов с высоким уровнем риска</td></tr>'
    
    return rows




def generate_html_report(inspections, stats, date_from: Optional[date], date_to: Optional[date]) -> str:
    """Generate HTML report"""
    
    date_range = ""
    if date_from and date_to:
        date_range = f"<p><strong>Период:</strong> {date_from} - {date_to}</p>"
    elif date_from:
        date_range = f"<p><strong>С:</strong> {date_from}</p>"
    elif date_to:
        date_range = f"<p><strong>До:</strong> {date_to}</p>"
    
    # Build defects table
    defects_rows = ""
    for inspection in inspections[:100]:  # Limit to 100 for performance
        if inspection.defect_found:
            risk_color = {
                'normal': '#4ade80',
                'medium': '#fbbf24',
                'high': '#f87171'
            }.get(str(inspection.ml_label), '#9ca3af')
            
            defects_rows += f"""
            <tr>
                <td>{inspection.object_id}</td>
                <td>{inspection.method}</td>
                <td>{inspection.date}</td>
                <td>{inspection.defect_description or 'N/A'}</td>
                <td style="background-color: {risk_color}; color: white; font-weight: bold; text-align: center;">
                    {str(inspection.ml_label).upper() if inspection.ml_label else 'N/A'}
                </td>
            </tr>
            """
    
    html = f"""
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>IntegrityOS - Отчет</title>
        <style>
            body {{
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                margin: 40px;
                background: #f3f4f6;
            }}
            .container {{
                max-width: 1200px;
                margin: 0 auto;
                background: white;
                padding: 40px;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }}
            h1 {{
                color: #1f2937;
                border-bottom: 3px solid #3b82f6;
                padding-bottom: 10px;
            }}
            h2 {{
                color: #374151;
                margin-top: 30px;
            }}
            .stats-grid {{
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin: 20px 0;
            }}
            .stat-card {{
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px;
                border-radius: 8px;
                text-align: center;
            }}
            .stat-value {{
                font-size: 2em;
                font-weight: bold;
            }}
            .stat-label {{
                font-size: 0.9em;
                opacity: 0.9;
            }}
            table {{
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
            }}
            th, td {{
                padding: 12px;
                text-align: left;
                border-bottom: 1px solid #e5e7eb;
            }}
            th {{
                background-color: #3b82f6;
                color: white;
                font-weight: bold;
            }}
            tr:hover {{
                background-color: #f9fafb;
            }}
            .footer {{
                margin-top: 40px;
                text-align: center;
                color: #6b7280;
                font-size: 0.9em;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🛢️ IntegrityOS - Отчет по обследованиям</h1>
            {date_range}
            <p><strong>Дата создания:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M')}</p>
            
            <h2>📊 Общая статистика</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">{stats['total_objects']}</div>
                    <div class="stat-label">Объектов</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{stats['total_inspections']}</div>
                    <div class="stat-label">Обследований</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{stats['total_defects']}</div>
                    <div class="stat-label">Дефектов</div>
                </div>
            </div>
            
            <h2>🔍 Дефекты по методам контроля</h2>
            <table>
                <thead>
                    <tr>
                        <th>Метод</th>
                        <th>Количество</th>
                    </tr>
                </thead>
                <tbody>
                    {''.join([f'<tr><td>{method}</td><td>{count}</td></tr>' for method, count in stats['defects_by_method'].items()])}
                </tbody>
            </table>
            
            <h2>⚠️ Распределение по уровням риска</h2>
            <table>
                <thead>
                    <tr>
                        <th>Уровень риска</th>
                        <th>Количество</th>
                    </tr>
                </thead>
                <tbody>
                    {''.join([f'<tr><td>{risk}</td><td>{count}</td></tr>' for risk, count in stats['defects_by_risk'].items()])}
                </tbody>
            </table>
            
            <h2>📋 Список дефектов</h2>
            <table>
                <thead>
                    <tr>
                        <th>ID Объекта</th>
                        <th>Метод</th>
                        <th>Дата</th>
                        <th>Описание</th>
                        <th>Риск</th>
                    </tr>
                </thead>
                <tbody>
                    {defects_rows}
                </tbody>
            </table>
            
            <h2>🚧 Рекомендации по раскопкам</h2>
            <p style="color: #6b7280; margin-bottom: 20px;">
                На основе анализа дефектов с высоким уровнем риска рекомендуется провести раскопки на следующих участках:
            </p>
            <table>
                <thead>
                    <tr>
                        <th>Приоритет</th>
                        <th>ID Объекта</th>
                        <th>Координаты</th>
                        <th>Параметры дефекта</th>
                        <th>Обоснование</th>
                    </tr>
                </thead>
                <tbody>
                    {_generate_excavation_recommendations(inspections)}
                </tbody>
            </table>
            
            <div class="footer">
                <p>Создано с помощью IntegrityOS v1.0</p>
                <p>© 2024 IntegrityOS. Все данные являются синтетическими.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return html


def generate_pdf_report(inspections, stats, date_from: Optional[date], date_to: Optional[date]) -> str:
    """Generate PDF report"""
    
    # Create reports directory if it doesn't exist
    os.makedirs("reports", exist_ok=True)
    filename = f"reports/integrityos_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    
    doc = SimpleDocTemplate(filename, pagesize=A4)
    story = []
    styles = getSampleStyleSheet()
    
    # Title
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1f2937'),
        spaceAfter=30,
        alignment=TA_CENTER
    )
    story.append(Paragraph("IntegrityOS - Отчет по обследованиям", title_style))
    story.append(Spacer(1, 12))
    
    # Date range
    if date_from or date_to:
        date_text = f"Период: {date_from or 'начало'} - {date_to or 'настоящее время'}"
        story.append(Paragraph(date_text, styles['Normal']))
    
    story.append(Paragraph(f"Дата создания: {datetime.now().strftime('%Y-%m-%d %H:%M')}", styles['Normal']))
    story.append(Spacer(1, 20))
    
    # Statistics
    story.append(Paragraph("Общая статистика", styles['Heading2']))
    stats_data = [
        ['Показатель', 'Значение'],
        ['Всего объектов', str(stats['total_objects'])],
        ['Всего обследований', str(stats['total_inspections'])],
        ['Всего дефектов', str(stats['total_defects'])]
    ]
    
    stats_table = Table(stats_data, colWidths=[3*inch, 2*inch])
    stats_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    story.append(stats_table)
    story.append(Spacer(1, 20))
    
    # Top risks
    if stats['top_risks']:
        story.append(Paragraph("Топ-5 критичных объектов", styles['Heading2']))
        risks_data = [['Объект', 'Описание', 'Риск']]
        for risk in stats['top_risks'][:5]:
            risks_data.append([
                risk['object_name'][:30],
                risk['description'][:40] if risk['description'] else 'N/A',
                str(risk['risk_level']).upper()
            ])
        
        risks_table = Table(risks_data, colWidths=[2*inch, 2.5*inch, 1*inch])
        risks_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#ef4444')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(risks_table)
    
    # Build PDF
    doc.build(story)
    return filename
