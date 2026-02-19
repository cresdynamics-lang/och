import React, { useState } from 'react';
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CardContent } from "@/components/ui/card-enhanced";
import { ChevronDown, Download, FileText, Mail, FilePlus, TrendingUp, RefreshCw, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { InvoiceModal } from './InvoiceModal';

interface ActionsDropdownProps {
  isActive?: boolean;
  userId: string;
}

export const ActionsDropdown = ({ isActive, userId }: ActionsDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const showSuccessMessage = (message: string) => {
    toast.success(message, {
      duration: 3000,
      style: {
        background: '#1A1A1E',
        color: '#33FFC1',
        border: '1px solid #33FFC1',
      },
      iconTheme: {
        primary: '#33FFC1',
        secondary: '#1A1A1E',
      },
    });
  };

  const showErrorMessage = (message: string) => {
    toast.error(message, {
      duration: 3000,
      style: {
        background: '#1A1A1E',
        color: '#FF6B6B',
        border: '1px solid #FF6B6B',
      },
      iconTheme: {
        primary: '#FF6B6B',
        secondary: '#1A1A1E',
      },
    });
  };

  // API call functions
  const exportCSV = async () => {
    try {
      const response = await fetch('/api/finance/finance-user/actions/export-csv');
      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `och-finance-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      throw new Error('CSV export failed');
    }
  };

  const exportPDF = async () => {
    try {
      const response = await fetch('/api/finance/finance-user/actions/export-pdf');
      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `och-finance-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      throw new Error('PDF export failed');
    }
  };

  const sendReminders = async () => {
    try {
      const response = await fetch('/api/finance/finance-user/actions/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      if (!response.ok) throw new Error('Reminders failed');

      const result = await response.json();
      return result;
    } catch (error) {
      throw new Error('Payment reminders failed');
    }
  };

  const createInvoice = async (invoiceData: any) => {
    try {
      const response = await fetch('/api/finance/finance-user/actions/new-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData)
      });

      if (!response.ok) throw new Error('Invoice creation failed');

      const result = await response.json();
      return result;
    } catch (error) {
      throw new Error('Invoice creation failed');
    }
  };

  const generatePLStatement = async () => {
    try {
      const response = await fetch('/api/finance/finance-user/actions/pl-statement');
      if (!response.ok) throw new Error('P&L generation failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `och-pl-statement-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      throw new Error('P&L statement generation failed');
    }
  };

  const reconcileAccounts = async () => {
    try {
      const response = await fetch('/api/finance/finance-user/actions/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      if (!response.ok) throw new Error('Reconciliation failed');

      const result = await response.json();
      return result;
    } catch (error) {
      throw new Error('Bank reconciliation failed');
    }
  };

  const handleInvoiceSubmit = async (invoiceData: any) => {
    try {
      const result = await createInvoice(invoiceData);
      setCompletedActions(prev => new Set([...Array.from(prev), 'new-invoice']));
      showSuccessMessage(`Invoice ${result.invoice.id} created successfully for ${invoiceData.client}!`);
    } catch (error) {
      showErrorMessage('Invoice creation failed. Please try again.');
    }
  };

  const actions = [
    {
      id: 'csv-export',
      icon: Download,
      label: 'QuickBooks CSV',
      description: 'Export accounting data',
      onClick: async () => {
        try {
          await exportCSV();
          setCompletedActions(prev => new Set([...Array.from(prev), 'csv-export']));
          showSuccessMessage('CSV export completed successfully!');
        } catch (error) {
          showErrorMessage('CSV export failed. Please try again.');
        }
      }
    },
    {
      id: 'pdf-report',
      icon: FileText,
      label: 'ROI Report',
      description: 'Generate PDF report',
      onClick: async () => {
        try {
          await exportPDF();
          setCompletedActions(prev => new Set([...Array.from(prev), 'pdf-report']));
          showSuccessMessage('PDF report downloaded successfully!');
        } catch (error) {
          showErrorMessage('PDF report failed. Please try again.');
        }
      }
    },
    {
      id: 'reminders',
      icon: Mail,
      label: 'Payment Reminders',
      description: 'Send due notices',
      onClick: async () => {
        try {
          const result = await sendReminders();
          setCompletedActions(prev => new Set([...Array.from(prev), 'reminders']));
          showSuccessMessage(`${result.count} payment reminders sent successfully!`);
        } catch (error) {
          showErrorMessage('Payment reminders failed. Please try again.');
        }
      }
    },
    {
      id: 'new-invoice',
      icon: FilePlus,
      label: 'New Invoice',
      description: 'Create invoice',
      onClick: () => {
        setShowInvoiceModal(true);
      }
    },
    {
      id: 'pl-statement',
      icon: TrendingUp,
      label: 'P&L Statement',
      description: 'Profit & Loss',
      onClick: async () => {
        try {
          await generatePLStatement();
          setCompletedActions(prev => new Set([...Array.from(prev), 'pl-statement']));
          showSuccessMessage('P&L statement downloaded successfully!');
        } catch (error) {
          showErrorMessage('P&L statement failed. Please try again.');
        }
      }
    },
    {
      id: 'reconcile',
      icon: RefreshCw,
      label: 'Reconcile',
      description: 'Bank reconciliation',
      onClick: async () => {
        try {
          const result = await reconcileAccounts();
          setCompletedActions(prev => new Set([...Array.from(prev), 'reconcile']));
          showSuccessMessage(`Bank reconciliation completed! ${result.reconciliation.transactionsReconciled} transactions reconciled.`);
        } catch (error) {
          showErrorMessage('Bank reconciliation failed. Please try again.');
        }
      }
    }
  ];

  return (
    <>
      <div className="relative">
        <Card
        className={`group/finance h-14 w-full transition-all duration-300 border-0 cursor-pointer
        bg-gradient-to-r from-slate-800/60 to-slate-900/80 backdrop-blur-xl
        hover:from-cyan-500/10 hover:to-blue-500/10 hover:shadow-lg hover:shadow-cyan-500/20
        hover:border-cyan-500/50 border-cyan-400/20 hover:scale-[1.02]
        ${isActive ? 'from-cyan-500/15 to-blue-500/15 border-cyan-500/60 shadow-lg shadow-cyan-500/20' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <CardContent className="p-4 flex items-center justify-center gap-2 min-h-[3rem]">
          <h3 className="text-sm font-semibold text-center bg-gradient-to-r from-white to-cyan-300 bg-clip-text text-transparent tracking-tight">
            Actions
          </h3>
          <ChevronDown className={`w-4 h-4 text-cyan-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </CardContent>
      </Card>

      {isOpen && (
        <Card className="absolute top-full mt-2 w-80 z-50 bg-slate-900/95 border-slate-700/50 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="space-y-2">
              {actions.map((action) => {
                const Icon = action.icon;
                const isCompleted = completedActions.has(action.id);

                return (
                  <Button
                    key={action.id}
                    variant="ghost"
                    className={`w-full h-auto p-3 justify-start transition-all ${
                      isCompleted
                        ? 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border-l-4 border-green-500/50'
                        : 'hover:bg-cyan-500/20 hover:text-cyan-300 border-l-4 border-transparent hover:border-cyan-400'
                    }`}
                    onClick={() => {
                      action.onClick();
                      // Don't close dropdown immediately for better UX
                    }}
                  >
                    <div className="flex items-start gap-3 w-full">
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Icon className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="text-left flex-1">
                        <div className="font-semibold text-sm flex items-center gap-2">
                          {action.label}
                          {isCompleted && (
                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                              Done
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400">{action.description}</div>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
      </div>

      <InvoiceModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        onSubmit={handleInvoiceSubmit}
      />
    </>
  );
};
