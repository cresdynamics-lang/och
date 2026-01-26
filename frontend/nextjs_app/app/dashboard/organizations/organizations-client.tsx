/**
 * Organizations Client Component
 * Handles client-side mutations and real-time updates
 */

'use client';

import { useState } from 'react';
import { useOrganizations } from '@/hooks/useOrganizations';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { CreateOrganizationRequest } from '@/services/types';

export default function OrganizationsClient() {
  const { organizations, isLoading, error, createOrganization } = useOrganizations();
  const [isCreating, setIsCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<CreateOrganizationRequest>({
    name: '',
    slug: '',
    org_type: 'sponsor',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      await createOrganization(formData);
      setShowForm(false);
      setFormData({ name: '', slug: '', org_type: 'sponsor', description: '' });
    } catch (err) {
      // Error handled by hook
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-och-midnight p-6">
        <div className="text-och-steel">Loading organizations...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-och-midnight p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-och-mint">Organizations</h1>
            <p className="text-och-steel">Manage organizations and members</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} variant="mint">
            {showForm ? 'Cancel' : 'Create Organization'}
          </Button>
        </div>

        {error && (
          <Card className="mb-6 border-och-orange">
            <div className="text-och-orange">{error}</div>
          </Card>
        )}

        {showForm && (
          <Card className="mb-6">
            <h2 className="text-2xl font-bold mb-4 text-white">Create Organization</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-och-steel mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-och-midnight border border-och-steel rounded text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-och-steel mb-2">Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-4 py-2 bg-och-midnight border border-och-steel rounded text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-och-steel mb-2">Type</label>
                <select
                  value={formData.org_type}
                  onChange={(e) => setFormData({ ...formData, org_type: e.target.value as any })}
                  className="w-full px-4 py-2 bg-och-midnight border border-och-steel rounded text-white"
                >
                  <option value="sponsor">Sponsor</option>
                  <option value="employer">Employer</option>
                  <option value="partner">Partner</option>
                </select>
              </div>
              <div>
                <label className="block text-och-steel mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-och-midnight border border-och-steel rounded text-white"
                  rows={3}
                />
              </div>
              <Button type="submit" variant="mint" disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Create'}
              </Button>
            </form>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map((org) => (
            <Card key={org.id} gradient="defender">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold text-white">{org.name}</h3>
                <Badge variant={org.org_type === 'sponsor' ? 'mint' : org.org_type === 'employer' ? 'defender' : 'gold'}>
                  {org.org_type}
                </Badge>
              </div>
              {org.description && (
                <p className="text-och-steel text-sm mb-3">{org.description}</p>
              )}
              <div className="flex justify-between text-sm text-och-steel">
                <span>Members: {org.member_count || 0}</span>
                <span className={org.status === 'active' ? 'text-och-mint' : 'text-och-orange'}>
                  {org.status}
                </span>
              </div>
            </Card>
          ))}
        </div>

        {organizations.length === 0 && !isLoading && (
          <Card className="text-center py-12">
            <p className="text-och-steel">No organizations found. Create one to get started.</p>
          </Card>
        )}
      </div>
    </div>
  );
}

