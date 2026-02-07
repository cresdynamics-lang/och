'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { X, AlertTriangle, Trash2 } from 'lucide-react';

interface DeleteAccountModalProps {
  userId: string;
  onClose: () => void;
  onDelete: () => Promise<void>;
}

export const DeleteAccountModal = ({ userId, onClose, onDelete }: DeleteAccountModalProps) => {
  const [confirmation, setConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirmation !== 'DELETE') {
      alert('Please type DELETE to confirm');
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete();
    } catch (error) {
      alert('Failed to delete account');
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-och-midnight-black border border-red-500/30 rounded-lg p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <h3 className="text-xl font-bold text-red-400">Delete Account</h3>
          </div>
          <button
            onClick={onClose}
            className="text-och-steel-grey hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="text-sm text-red-300 mb-2">
              ⚠️ This action cannot be undone
            </div>
            <div className="text-xs text-och-steel-grey space-y-1">
              <div>• All your data will be permanently deleted</div>
              <div>• Your portfolio and progress will be lost</div>
              <div>• You will be logged out immediately</div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Type <span className="font-mono text-red-400">DELETE</span> to confirm
            </label>
            <input
              type="text"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="DELETE"
              className="w-full px-4 py-2 bg-och-midnight-black border border-red-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              aria-label="Confirmation input"
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              onClick={handleDelete}
              disabled={isDeleting || confirmation !== 'DELETE'}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isDeleting ? 'Deleting...' : 'Delete Account'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

