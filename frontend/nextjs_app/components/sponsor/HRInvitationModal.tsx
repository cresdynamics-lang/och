'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  X,
  UserPlus,
  Mail,
  Plus,
  Trash2,
  Send,
  CheckCircle,
  AlertCircle,
  Users
} from 'lucide-react';
import { useSponsorActions } from '@/hooks/useSponsorDashboard';

interface HRInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  sponsorName?: string;
}

interface EmailRecipient {
  email: string;
  name?: string;
  role?: string;
}

export default function HRInvitationModal({
  isOpen,
  onClose,
  sponsorName = 'Your Organization'
}: HRInvitationModalProps) {
  const { inviteHR } = useSponsorActions('mtn'); // TODO: Pass orgId dynamically

  const [recipients, setRecipients] = useState<EmailRecipient[]>([
    { email: '', name: '', role: '' }
  ]);
  const [message, setMessage] = useState(
    `Dear HR Team,\n\nI'm sharing access to our cybersecurity training sponsorship dashboard. This will give you real-time insights into our talent development pipeline and placement outcomes.\n\nYou can access the dashboard at: https://ongozacyberhub.com/sponsor/mtn/dashboard\n\nBest regards,\n[Your Name]`
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  const addRecipient = () => {
    setRecipients([...recipients, { email: '', name: '', role: '' }]);
  };

  const removeRecipient = (index: number) => {
    if (recipients.length > 1) {
      setRecipients(recipients.filter((_, i) => i !== index));
    }
  };

  const updateRecipient = (index: number, field: keyof EmailRecipient, value: string) => {
    const updated = recipients.map((recipient, i) =>
      i === index ? { ...recipient, [field]: value } : recipient
    );
    setRecipients(updated);
  };

  const handleSubmit = async () => {
    const validEmails = recipients.filter(r => r.email.trim() && isValidEmail(r.email));

    if (validEmails.length === 0) {
      setSubmitResult({
        success: false,
        message: 'Please add at least one valid email address.'
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      await inviteHR(
        validEmails.map(r => r.email),
        message
      );

      setSubmitResult({
        success: true,
        message: `Invitations sent successfully to ${validEmails.length} HR team member${validEmails.length > 1 ? 's' : ''}!`
      });

      // Reset form after successful submission
      setTimeout(() => {
        setRecipients([{ email: '', name: '', role: '' }]);
        setSubmitResult(null);
        onClose();
      }, 2000);

    } catch (error) {
      setSubmitResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to send invitations. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validRecipientCount = recipients.filter(r => r.email.trim() && isValidEmail(r.email)).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-400" />
              Invite HR Team
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-slate-400">
            Share dashboard access with your HR team at {sponsorName}
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Recipients Section */}
          <Card className="bg-slate-800/50 border-slate-600">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                HR Team Members
              </CardTitle>
              <p className="text-sm text-slate-400">
                Add email addresses of team members who should have dashboard access
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {recipients.map((recipient, index) => (
                <div key={index} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Email Address *
                    </label>
                    <Input
                      type="email"
                      placeholder="hr.manager@company.com"
                      value={recipient.email}
                      onChange={(e) => updateRecipient(index, 'email', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                    />
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Name (Optional)
                    </label>
                    <Input
                      placeholder="John Doe"
                      value={recipient.name}
                      onChange={(e) => updateRecipient(index, 'name', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                    />
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Role (Optional)
                    </label>
                    <Input
                      placeholder="Talent Acquisition Manager"
                      value={recipient.role}
                      onChange={(e) => updateRecipient(index, 'role', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                    />
                  </div>

                  {recipients.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeRecipient(index)}
                      className="border-red-600 text-red-400 hover:bg-red-500/10 mb-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}

              <Button
                onClick={addRecipient}
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Another Recipient
              </Button>

              {validRecipientCount > 0 && (
                <div className="flex items-center gap-2 text-sm text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span>{validRecipientCount} valid email{validRecipientCount > 1 ? 's' : ''} ready to invite</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Message Section */}
          <Card className="bg-slate-800/50 border-slate-600">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Mail className="w-4 h-4 text-green-400" />
                Invitation Message
              </CardTitle>
              <p className="text-sm text-slate-400">
                Customize the message that will be sent with the invitation
              </p>
            </CardHeader>
            <CardContent>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 resize-none"
                placeholder="Enter your invitation message..."
              />
              <div className="mt-2 text-xs text-slate-400">
                This message will be included in the email invitation sent to your HR team.
              </div>
            </CardContent>
          </Card>

          {/* Access Information */}
          <Card className="bg-blue-500/10 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <UserPlus className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-medium mb-1">Dashboard Access</h4>
                  <p className="text-sm text-slate-400 mb-2">
                    Invited team members will receive login credentials and access to view:
                  </p>
                  <ul className="text-sm text-slate-400 space-y-1">
                    <li>• Real-time cohort performance metrics</li>
                    <li>• Student readiness and placement data</li>
                    <li>• ROI analysis and investment tracking</li>
                    <li>• Employer partnership insights</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Result */}
          {submitResult && (
            <Card className={`border ${submitResult.success ? 'border-green-500/20 bg-green-500/10' : 'border-red-500/20 bg-red-500/10'}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  {submitResult.success ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  )}
                  <span className={`text-sm ${submitResult.success ? 'text-green-400' : 'text-red-400'}`}>
                    {submitResult.message}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <Button onClick={onClose} variant="outline">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || validRecipientCount === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Invitations ({validRecipientCount})
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
