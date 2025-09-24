import { type HealthcareReport } from '../types/healthcare-report.types';

// PDF generation service using jsPDF (would need to install jspdf)
export class PDFExportService {
  // Generate PDF report
  static async generatePDF(report: HealthcareReport): Promise<Blob> {
    // This is a placeholder implementation
    // In a real implementation, you would use jsPDF or similar library
    
    const htmlContent = this.generateHTMLReport(report);
    
    // Convert HTML to PDF (placeholder)
    // In real implementation:
    // const pdf = new jsPDF();
    // pdf.html(htmlContent);
    // return pdf.output('blob');
    
    // For now, return HTML as blob
    return new Blob([htmlContent], { type: 'text/html' });
  }

  // Generate HTML version of the report
  static generateHTMLReport(report: HealthcareReport): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${report.reportTitle}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .report-title {
            font-size: 24px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 10px;
        }
        .report-meta {
            color: #6b7280;
            font-size: 14px;
        }
        .section {
            margin-bottom: 30px;
            padding: 20px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
        }
        .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 15px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 5px;
        }
        .metric-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        .metric-item {
            padding: 10px;
            background: #f9fafb;
            border-radius: 6px;
        }
        .metric-label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .metric-value {
            font-size: 20px;
            font-weight: bold;
            color: #1f2937;
        }
        .trend-improving { color: #10b981; }
        .trend-stable { color: #3b82f6; }
        .trend-declining { color: #ef4444; }
        .trend-insufficient { color: #6b7280; }
        .symptom-list {
            list-style: none;
            padding: 0;
        }
        .symptom-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #f3f4f6;
        }
        .correlation-item {
            padding: 10px;
            margin: 5px 0;
            background: #f8fafc;
            border-left: 4px solid #3b82f6;
            border-radius: 4px;
        }
        .disclaimer {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 15px;
            margin-top: 30px;
        }
        .disclaimer-title {
            font-weight: bold;
            color: #92400e;
            margin-bottom: 10px;
        }
        .disclaimer-text {
            font-size: 12px;
            color: #78350f;
            line-height: 1.4;
        }
        @media print {
            body { margin: 0; padding: 15px; }
            .section { break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="report-title">${report.reportTitle}</div>
        <div class="report-meta">
            Patient ID: ${report.patientId} | 
            Period: ${new Date(report.startDate).toLocaleDateString()} - ${new Date(report.endDate).toLocaleDateString()} |
            Generated: ${report.generatedAt.toLocaleDateString()}
        </div>
    </div>

    <div class="section">
        <div class="section-title">Executive Summary</div>
        <p>${report.executiveSummary}</p>
    </div>

    <div class="section">
        <div class="section-title">Health Metrics Overview</div>
        <div class="metric-grid">
            ${report.healthMetrics.averageFatigueLevel ? `
            <div class="metric-item">
                <div class="metric-label">Average Fatigue Level</div>
                <div class="metric-value">${report.healthMetrics.averageFatigueLevel}/10</div>
            </div>
            ` : ''}
            ${report.healthMetrics.averageEnergyLevel ? `
            <div class="metric-item">
                <div class="metric-label">Average Energy Level</div>
                <div class="metric-value">${report.healthMetrics.averageEnergyLevel}/10</div>
            </div>
            ` : ''}
            ${report.healthMetrics.averageSleepQuality ? `
            <div class="metric-item">
                <div class="metric-label">Average Sleep Quality</div>
                <div class="metric-value">${report.healthMetrics.averageSleepQuality}/10</div>
            </div>
            ` : ''}
            <div class="metric-item">
                <div class="metric-label">Good Days</div>
                <div class="metric-value">${report.healthMetrics.goodDays}</div>
            </div>
            <div class="metric-item">
                <div class="metric-label">Difficult Days</div>
                <div class="metric-value">${report.healthMetrics.difficultDays}</div>
            </div>
            <div class="metric-item">
                <div class="metric-label">Fatigue Trend</div>
                <div class="metric-value trend-${report.healthMetrics.fatigueTrend}">
                    ${report.healthMetrics.fatigueTrend.replace('_', ' ').toUpperCase()}
                </div>
            </div>
        </div>
    </div>

    ${report.symptomAnalysis.topSymptoms.length > 0 ? `
    <div class="section">
        <div class="section-title">Top Symptoms</div>
        <ul class="symptom-list">
            ${report.symptomAnalysis.topSymptoms.map(symptom => `
            <li class="symptom-item">
                <span>${symptom.symptomType}</span>
                <span>${symptom.frequency}% of days (avg: ${symptom.averageSeverity}/10)</span>
            </li>
            `).join('')}
        </ul>
    </div>
    ` : ''}

    ${report.symptomAnalysis.symptomCorrelations.length > 0 ? `
    <div class="section">
        <div class="section-title">Symptom Correlations</div>
        ${report.symptomAnalysis.symptomCorrelations.slice(0, 5).map(corr => `
        <div class="correlation-item">
            <strong>${corr.symptom1} ↔ ${corr.symptom2}</strong><br>
            Correlation: ${corr.correlation.toFixed(2)} (${corr.significance} significance, n=${corr.sampleSize})
        </div>
        `).join('')}
    </div>
    ` : ''}

    <div class="section">
        <div class="section-title">Activity Patterns</div>
        <div class="metric-grid">
            <div class="metric-item">
                <div class="metric-label">Movement Sessions</div>
                <div class="metric-value">${report.activityPatterns.movementSessions.totalSessions}</div>
            </div>
            <div class="metric-item">
                <div class="metric-label">Session Completion Rate</div>
                <div class="metric-value">${report.activityPatterns.movementSessions.completionRate}%</div>
            </div>
            <div class="metric-item">
                <div class="metric-label">Daily Anchor Completion</div>
                <div class="metric-value">${report.healthMetrics.dailyAnchorCompletionRate}%</div>
            </div>
            ${report.activityPatterns.sleepPatterns.averageSleepDuration ? `
            <div class="metric-item">
                <div class="metric-label">Average Sleep Duration</div>
                <div class="metric-value">${report.activityPatterns.sleepPatterns.averageSleepDuration}h</div>
            </div>
            ` : ''}
        </div>
    </div>

    <div class="section">
        <div class="section-title">Clinical Observations</div>
        
        ${report.clinicalObservations.keyFindings.length > 0 ? `
        <h4>Key Findings:</h4>
        <ul>
            ${report.clinicalObservations.keyFindings.map(finding => `<li>${finding}</li>`).join('')}
        </ul>
        ` : ''}

        ${report.clinicalObservations.positiveIndicators.length > 0 ? `
        <h4>Positive Indicators:</h4>
        <ul>
            ${report.clinicalObservations.positiveIndicators.map(indicator => `<li>${indicator}</li>`).join('')}
        </ul>
        ` : ''}

        ${report.clinicalObservations.recommendationsForProvider.length > 0 ? `
        <h4>Recommendations for Healthcare Provider:</h4>
        <ul>
            ${report.clinicalObservations.recommendationsForProvider.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
        ` : ''}

        <div class="metric-grid">
            <div class="metric-item">
                <div class="metric-label">Data Quality Score</div>
                <div class="metric-value">${report.dataQualityScore}/100</div>
            </div>
            <div class="metric-item">
                <div class="metric-label">Report Reliability</div>
                <div class="metric-value">${report.clinicalObservations.reportReliability.toUpperCase()}</div>
            </div>
        </div>
    </div>

    <div class="disclaimer">
        <div class="disclaimer-title">Important Disclaimers</div>
        ${report.disclaimers.map(disclaimer => `
        <div class="disclaimer-text">• ${disclaimer}</div>
        `).join('')}
    </div>
</body>
</html>
    `;
  }

  // Generate CSV export
  static generateCSV(report: HealthcareReport): string {
    const csvRows = [];
    
    // Header
    csvRows.push('Report Type,Healthcare Provider Report');
    csvRows.push(`Patient ID,${report.patientId}`);
    csvRows.push(`Period,${report.startDate} to ${report.endDate}`);
    csvRows.push(`Generated,${report.generatedAt.toISOString()}`);
    csvRows.push('');

    // Health Metrics
    csvRows.push('Health Metrics');
    csvRows.push('Metric,Value,Unit');
    if (report.healthMetrics.averageFatigueLevel) {
      csvRows.push(`Average Fatigue Level,${report.healthMetrics.averageFatigueLevel},/10`);
    }
    if (report.healthMetrics.averageEnergyLevel) {
      csvRows.push(`Average Energy Level,${report.healthMetrics.averageEnergyLevel},/10`);
    }
    if (report.healthMetrics.averageSleepQuality) {
      csvRows.push(`Average Sleep Quality,${report.healthMetrics.averageSleepQuality},/10`);
    }
    csvRows.push(`Good Days,${report.healthMetrics.goodDays},count`);
    csvRows.push(`Difficult Days,${report.healthMetrics.difficultDays},count`);
    csvRows.push(`Fatigue Trend,${report.healthMetrics.fatigueTrend},direction`);
    csvRows.push('');

    // Top Symptoms
    if (report.symptomAnalysis.topSymptoms.length > 0) {
      csvRows.push('Top Symptoms');
      csvRows.push('Symptom,Frequency (%),Average Severity (/10),Trend');
      report.symptomAnalysis.topSymptoms.forEach(symptom => {
        csvRows.push(`${symptom.symptomType},${symptom.frequency},${symptom.averageSeverity},${symptom.trendDirection}`);
      });
      csvRows.push('');
    }

    // Symptom Correlations
    if (report.symptomAnalysis.symptomCorrelations.length > 0) {
      csvRows.push('Symptom Correlations');
      csvRows.push('Symptom 1,Symptom 2,Correlation,Significance,Sample Size');
      report.symptomAnalysis.symptomCorrelations.forEach(corr => {
        csvRows.push(`${corr.symptom1},${corr.symptom2},${corr.correlation},${corr.significance},${corr.sampleSize}`);
      });
      csvRows.push('');
    }

    return csvRows.join('\n');
  }

  // Generate JSON export
  static generateJSON(report: HealthcareReport, includeRawData: boolean = false): string {
    const exportData = {
      reportMetadata: {
        id: report.id,
        patientId: report.patientId,
        reportType: report.reportType,
        period: {
          start: report.startDate,
          end: report.endDate,
        },
        generatedAt: report.generatedAt,
        dataQualityScore: report.dataQualityScore,
      },
      executiveSummary: report.executiveSummary,
      healthMetrics: report.healthMetrics,
      symptomAnalysis: report.symptomAnalysis,
      activityPatterns: report.activityPatterns,
      clinicalObservations: report.clinicalObservations,
      disclaimers: report.disclaimers,
    };

    return JSON.stringify(exportData, null, 2);
  }
}