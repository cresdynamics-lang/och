/**
 * Portfolio Exporter Component
 * PDF and JSON export functionality - EXACT SPEC
 */

'use client';

import { useState } from 'react';
import { X, Download, FileText, Code, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import type { PortfolioItem } from '@/lib/portfolio/types';

interface PortfolioExporterProps {
  items: PortfolioItem[];
  isOpen: boolean;
  onClose: () => void;
}

export function PortfolioExporter({ items, isOpen, onClose }: PortfolioExporterProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { user } = useAuth();
  const userId = user?.id?.toString();

  const exportToJSON = () => {
    setIsExporting(true);
    
    const exportData = {
      userId,
      exportedAt: new Date().toISOString(),
      items: items.map((item) => ({
        title: item.title,
        summary: item.summary,
        type: item.type,
        status: item.status,
        skillTags: item.skillTags,
        competencyScores: item.competencyScores,
        createdAt: item.createdAt,
        approvedAt: item.approvedAt,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setIsExporting(false);
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    
    try {
      // Use browser print API for PDF generation
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow popups to export PDF');
        setIsExporting(false);
        return;
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Portfolio Export - ${new Date().toLocaleDateString()}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; background: white; }
              h1 { color: #1e293b; margin-bottom: 30px; }
              .item { margin-bottom: 30px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; }
              .item-title { font-size: 20px; font-weight: bold; color: #0f172a; margin-bottom: 10px; }
              .item-meta { color: #64748b; font-size: 14px; margin-bottom: 10px; }
              .item-summary { color: #475569; margin: 15px 0; }
              .skills { display: flex; flex-wrap: wrap; gap: 8px; margin: 15px 0; }
              .skill { background: #f1f5f9; padding: 4px 12px; border-radius: 4px; font-size: 12px; }
              .score { color: #059669; font-weight: bold; }
            </style>
          </head>
          <body>
            <h1>Portfolio Export - ${new Date().toLocaleDateString()}</h1>
            ${items.map((item, idx) => `
              <div class="item">
                <div class="item-title">${idx + 1}. ${item.title}</div>
                <div class="item-meta">
                  Type: ${item.type} | Status: ${item.status} | Created: ${new Date(item.createdAt).toLocaleDateString()}
                </div>
                ${item.summary ? `<div class="item-summary">${item.summary}</div>` : ''}
                ${item.skillTags.length > 0 ? `
                  <div class="skills">
                    ${item.skillTags.map(tag => `<span class="skill">${tag}</span>`).join('')}
                  </div>
                ` : ''}
                ${Object.keys(item.competencyScores).length > 0 ? `
                  <div class="score">
                    Average Score: ${(Object.values(item.competencyScores).reduce((a, b) => a + b, 0) / Object.keys(item.competencyScores).length).toFixed(1)}/10
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      
      // Wait for content to load, then print
      setTimeout(() => {
        printWindow.print();
        setIsExporting(false);
        onClose();
      }, 500);
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('Failed to export PDF');
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <Card className="max-w-md w-full bg-slate-900 border-indigo-500/50" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-100">Export Portfolio</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="text-sm text-slate-400 mb-4">
              Export {items.length} portfolio {items.length === 1 ? 'item' : 'items'}
            </div>

            <Button
              variant="outline"
              size="lg"
              onClick={exportToJSON}
              disabled={isExporting || items.length === 0}
              className="w-full justify-start"
            >
              {isExporting ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Code className="w-5 h-5 mr-2" />
              )}
              Export as JSON
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onClick={exportToPDF}
              disabled={isExporting || items.length === 0}
              className="w-full justify-start"
            >
              {isExporting ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <FileText className="w-5 h-5 mr-2" />
              )}
              Export as PDF
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

