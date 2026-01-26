import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface MarketplaceProfileProps {
  profile: any; // TODO: Define proper type
  username: string;
}

export function MarketplaceProfile({ profile, username }: MarketplaceProfileProps) {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold">{username}'s Portfolio</h2>
          <p className="text-gray-600 mt-2">Portfolio marketplace profile coming soon...</p>
        </div>

        {profile && (
          <div className="space-y-2">
            <Badge variant="outline">Portfolio Profile</Badge>
            <p className="text-sm text-gray-500">
              This student's portfolio and achievements will be showcased here.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
