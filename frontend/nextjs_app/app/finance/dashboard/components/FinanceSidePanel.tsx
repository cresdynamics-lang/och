import React from 'react';
import { Card } from "@/components/ui/Card";
import { CardContent } from "@/components/ui/card-enhanced";

interface PanelProps {
  id: string;
  title: string;
  metrics?: string[];
  buttons?: string[];
  action: string;
  isActive?: boolean;
  onClick?: () => void;
}

export const FinanceSidePanel = ({ title, isActive = false, onClick }: PanelProps) => {
  // Extract just the main title (remove emoji and keep only the text)
  const displayTitle = title.replace(/^[^\w]+/, '').trim();

  // Adjust font size for longer titles
  const isLongTitle = displayTitle.length > 8;
  const fontSize = isLongTitle ? 'text-xs' : 'text-sm';

  return (
    <Card
      className={`group/finance h-14 w-full transition-all duration-300 border-0 cursor-pointer
      bg-gradient-to-r from-slate-800/60 to-slate-900/80 backdrop-blur-xl
      hover:from-cyan-500/10 hover:to-blue-500/10 hover:shadow-lg hover:shadow-cyan-500/20
      hover:border-cyan-500/50 border-cyan-400/20 hover:scale-[1.02]
      ${isActive ? 'from-cyan-500/15 to-blue-500/15 border-cyan-500/60 shadow-lg shadow-cyan-500/20' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-3 flex items-center justify-center min-h-[3rem]">
        <h3 className={`${fontSize} font-semibold text-center bg-gradient-to-r from-white to-cyan-300 bg-clip-text text-transparent tracking-tight leading-tight break-words`}>
          {displayTitle}
        </h3>
      </CardContent>
    </Card>
  );
};
