/**
 * Public Student Profile / Portfolio Page
 * EXACT SPEC: och.africa/student/<handle>
 * Immersive employer-facing view of a student's verified outcomes
 */

'use client';

import { useParams, useRouter } from 'next/navigation';
import { MarketplaceProfile } from '@/components/ui/portfolio/MarketplaceProfile';
import { useQuery } from '@tanstack/react-query';
import { apiGateway } from '@/services/apiGateway';
import { Briefcase, ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function PublicStudentProfile() {
  const { handle } = useParams();
  const router = useRouter();

  // Fetch the public profile by handle
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['public-profile', handle],
    queryFn: async () => {
      // In a real implementation, this would be a public endpoint
      // For now, we'll try to fetch from marketplace API
      try {
        return await apiGateway.get(`/marketplace/profiles/${handle}`);
      } catch (err) {
        console.error('Profile fetch failed:', err);
        throw err;
      }
    },
    enabled: !!handle,
    retry: false
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-och-midnight flex flex-col items-center justify-center p-12">
        <div className="w-16 h-16 rounded-2xl border-4 border-och-gold/20 border-t-och-gold animate-spin mb-6" />
        <p className="text-och-steel font-black uppercase tracking-widest text-xs animate-pulse">Decrypting Identity...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-och-midnight flex items-center justify-center p-6">
        <Card className="p-12 bg-och-midnight/60 border border-och-steel/10 rounded-[3rem] text-center max-w-md shadow-2xl">
          <ShieldAlert className="w-16 h-16 text-och-defender mx-auto mb-6 opacity-50" />
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-3">Identity Redacted</h2>
          <p className="text-och-steel font-medium italic mb-8 leading-relaxed">
            "The requested profile @{handle} is either private or does not exist in the OCH repository."
          </p>
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="w-full h-12 rounded-xl border-och-steel/20 text-och-steel font-black uppercase tracking-widest hover:border-white transition-all"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Safety
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-och-midnight">
      {/* Public Header for unauthenticated viewers */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-och-midnight/80 backdrop-blur-md border-b border-white/5 px-6 py-4 flex justify-between items-center">
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-och-gold/10 border border-och-gold/20 flex items-center justify-center">
               <Briefcase className="w-4 h-4 text-och-gold" />
            </div>
            <span className="text-[10px] font-black text-white uppercase tracking-widest">OCH Professional Marketplace</span>
         </div>
         <Button 
           variant="defender" 
           size="sm" 
           className="h-9 px-6 rounded-lg text-[9px] font-black uppercase tracking-widest bg-och-gold text-black"
           onClick={() => router.push('/signup')}
         >
           Join the Ecosystem
         </Button>
      </div>

      <div className="pt-20">
        <MarketplaceProfile profile={profile} username={handle as string} />
      </div>
    </div>
  );
}

