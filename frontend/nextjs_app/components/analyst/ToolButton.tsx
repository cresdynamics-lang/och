'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LucideIcon } from 'lucide-react';

interface Tool {
  id: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  action?: string;
  status?: string;
  shortcut: string;
  url?: string;
  onClick?: () => void;
}

interface ToolButtonProps {
  tool: Tool;
}

export const ToolButton: React.FC<ToolButtonProps> = ({ tool }) => {
  const handleClick = () => {
    if (tool.onClick) {
      tool.onClick();
    } else if (tool.url) {
      window.open(tool.url, '_blank');
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'LIVE':
        return 'bg-och-cyber-mint/20 text-och-cyber-mint border-och-cyber-mint/30';
      case 'READY':
        return 'bg-och-defender-blue/20 text-och-defender-blue border-och-defender-blue/30';
      case 'BUSY':
        return 'bg-och-sahara-gold/20 text-och-sahara-gold border-och-sahara-gold/30';
      default:
        return 'bg-och-steel-grey/20 text-och-steel-grey border-och-steel-grey/30';
    }
  };

  return (
    <Button
      variant="ghost"
      className="w-full h-16 p-3 justify-start hover:bg-och-defender-blue/20 hover:border-och-defender-blue/50 border border-och-steel-grey/50 rounded-xl group transition-all duration-200"
      onClick={handleClick}
    >
      <div className="flex items-center w-full">
        {/* Icon */}
        <div className="w-10 h-10 bg-gradient-to-br from-och-defender-blue/20 to-och-cyber-mint/20 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-200">
          <tool.icon className="w-5 h-5 text-och-defender-blue" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm leading-tight truncate text-white">
            {tool.title}
          </div>
          <div className="text-xs text-och-steel-grey leading-tight truncate">
            {tool.subtitle}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-end ml-2 min-w-[60px]">
          {tool.status && (
            <Badge
              className={`text-xs h-5 mb-1 border ${getStatusColor(tool.status)}`}
            >
              {tool.status}
            </Badge>
          )}

          <div className="flex items-center gap-1">
            {tool.action && (
              <span className="font-bold text-och-defender-blue text-sm">
                {tool.action}
              </span>
            )}
            <span className="text-xs text-och-steel-grey font-mono">
              {tool.shortcut}
            </span>
          </div>
        </div>
      </div>
    </Button>
  );
};
