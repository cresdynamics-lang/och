import React, { useState } from 'react';
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CardContent, CardHeader } from "@/components/ui/card-enhanced";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { X, Plus, Trash2 } from 'lucide-react';

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (invoiceData: any) => void;
}

export const InvoiceModal = ({ isOpen, onClose, onSubmit }: InvoiceModalProps) => {
  const [client, setClient] = useState('');
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: 'Cybersecurity Training', quantity: 1, rate: 50000, amount: 50000 }
  ]);

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.amount, 0);
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    if (field === 'quantity' || field === 'rate') {
      updatedItems[index].amount = updatedItems[index].quantity * updatedItems[index].rate;
    }

    setItems(updatedItems);
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, rate: 0, amount: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    if (!client.trim()) {
      alert('Please enter a client name');
      return;
    }

    const invoiceData = {
      client: client.trim(),
      dueDate,
      items: items.filter(item => item.description.trim() && item.amount > 0),
      total: calculateTotal()
    };

    await onSubmit(invoiceData);
    onClose();
    // Reset form
    setClient('');
    setDueDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setItems([{ description: 'Cybersecurity Training', quantity: 1, rate: 50000, amount: 50000 }]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900/95 border-slate-700/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="text-xl font-bold text-white">Create New Invoice</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Client Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client" className="text-sm font-medium text-slate-300">Client Name</Label>
              <Input
                id="client"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="Enter client name"
                className="bg-slate-800/50 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate" className="text-sm font-medium text-slate-300">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-slate-800/50 border-slate-600 text-white"
              />
            </div>
          </div>

          {/* Invoice Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-slate-300">Invoice Items</Label>
              <Button variant="outline" size="sm" onClick={addItem} className="text-cyan-400 border-cyan-400/50 hover:bg-cyan-400/10">
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 p-3 bg-slate-800/30 rounded-lg">
                  <div className="col-span-4">
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      className="bg-slate-800/50 border-slate-600 text-white text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                      className="bg-slate-800/50 border-slate-600 text-white text-sm"
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      placeholder="Rate"
                      value={item.rate}
                      onChange={(e) => updateItem(index, 'rate', parseInt(e.target.value) || 0)}
                      className="bg-slate-800/50 border-slate-600 text-white text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={item.amount}
                      readOnly
                      className="bg-slate-800/50 border-slate-600 text-white text-sm"
                    />
                  </div>
                  <div className="col-span-1 flex items-center">
                    {items.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-400/10 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-end pt-4 border-t border-slate-700/50">
            <div className="text-right">
              <div className="text-sm text-slate-400">Total Amount</div>
              <div className="text-2xl font-bold text-cyan-400">
                KES {calculateTotal().toLocaleString()}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800/50">
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white">
              Create Invoice
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
