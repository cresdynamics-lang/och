/**
 * Frontend Status Section Component
 * Displays frontend application status, version, and system information
 */

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Monitor, CheckCircle, XCircle, Clock, Globe, Server, Cpu, HardDrive } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface ServiceStatus {
  name: string;
  url: string;
  status: 'checking' | 'online' | 'offline';
  responseTime?: number;
}

export function FrontendStatusSection() {
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'Django API', url: 'http://localhost:8000/api/v1/health/', status: 'checking' },
    { name: 'FastAPI', url: 'http://localhost:8001/health', status: 'checking' },
    { name: 'Frontend', url: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000', status: 'online' },
  ]);

  const [currentTime, setCurrentTime] = useState<string>('');

  // Initialize with 'N/A' to prevent hydration mismatch
  const [frontendInfo, setFrontendInfo] = useState({
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    buildTime: new Date().toISOString(),
    userAgent: 'N/A',
    screenResolution: 'N/A',
    viewport: 'N/A',
  });

  useEffect(() => {
    // Set current time on client side only (prevents hydration mismatch)
    setCurrentTime(new Date().toLocaleTimeString());
    
    // Update frontend info on client side only (prevents hydration mismatch)
    if (typeof window !== 'undefined') {
      setFrontendInfo({
        version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        buildTime: new Date().toISOString(),
        userAgent: navigator.userAgent,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
      });

      // Update viewport on resize
      const handleResize = () => {
        setFrontendInfo(prev => ({
          ...prev,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
        }));
      };

      window.addEventListener('resize', handleResize);
      
      // Update time every second
      const timeInterval = setInterval(() => {
        setCurrentTime(new Date().toLocaleTimeString());
      }, 1000);

      // Check service statuses
      const checkServices = async () => {
      const initialServices: ServiceStatus[] = [
        { name: 'Django API', url: 'http://localhost:8000/api/v1/health/', status: 'checking' },
        { name: 'FastAPI', url: 'http://localhost:8001/health', status: 'checking' },
        { name: 'Frontend', url: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000', status: 'online' },
      ];

      const updatedServices = await Promise.all(
        initialServices.map(async (service) => {
          if (service.name === 'Frontend') {
            return { ...service, status: 'online' as const };
          }

          try {
            const startTime = performance.now();
            const response = await fetch(service.url, {
              method: 'GET',
              mode: 'cors',
              cache: 'no-cache',
            });
            const endTime = performance.now();
            const responseTime = Math.round(endTime - startTime);

            if (response.ok) {
              return { ...service, status: 'online' as const, responseTime };
            } else {
              return { ...service, status: 'offline' as const };
            }
          } catch (error) {
            return { ...service, status: 'offline' as const };
          }
        })
      );

        setServices(updatedServices);
      };

      checkServices();
      // Refresh every 30 seconds
      const interval = setInterval(checkServices, 30000);

      return () => {
        clearInterval(interval);
        clearInterval(timeInterval);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []);

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'offline':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'checking':
        return <Clock className="w-5 h-5 text-yellow-400 animate-spin" />;
    }
  };

  const getStatusBadge = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'online':
        return <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400">Online</Badge>;
      case 'offline':
        return <Badge variant="outline" className="bg-red-500/20 text-red-400">Offline</Badge>;
      case 'checking':
        return <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400">Checking...</Badge>;
    }
  };

  const onlineCount = services.filter(s => s.status === 'online').length;
  const totalServices = services.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ position: 'relative', zIndex: 10, color: '#ffffff' }}
    >
      <Card className="glass-card glass-card-hover">
        <div className="p-8" style={{ color: '#ffffff', zIndex: 10, position: 'relative' }}>
          <div className="flex items-center gap-3 mb-6" style={{ color: '#ffffff' }}>
            <Monitor className="w-8 h-8 text-indigo-400" style={{ color: '#818cf8', display: 'block' }} />
            <div>
              <h2 className="text-2xl font-bold text-slate-100" style={{ color: '#ffffff', display: 'block' }}>
                Frontend Status
              </h2>
              <p className="text-xs text-slate-500 mt-1" style={{ color: '#ffffff', display: 'block' }}>
                Real-time application and service status
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Overall Status */}
            <div className="bg-gradient-to-r from-indigo-500/10 to-emerald-500/10 border border-indigo-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-indigo-300 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  System Status
                </h3>
                <Badge variant="outline" className="bg-indigo-500/20 text-indigo-400">
                  {onlineCount}/{totalServices} Services Online
                </Badge>
              </div>
              <div className="text-xs text-slate-400">
                All systems operational{currentTime ? ` • Last checked: ${currentTime}` : ''}
              </div>
            </div>

            {/* Service Status List */}
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                <Server className="w-4 h-4" />
                Service Status
              </h3>
              <div className="space-y-3">
                {services.map((service, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-slate-900/70 border border-slate-800/70 rounded-lg"
                    style={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      borderColor: 'rgba(30, 41, 59, 0.9)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(service.status)}
                      <div>
                        <div className="text-sm font-medium text-slate-100" style={{ color: '#ffffff' }}>
                          {service.name}
                        </div>
                        <div className="text-xs text-slate-500" style={{ color: '#94a3b8' }}>
                          {service.url}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {service.responseTime && (
                        <span className="text-xs text-slate-400" style={{ color: '#94a3b8' }}>
                          {service.responseTime}ms
                        </span>
                      )}
                      {getStatusBadge(service.status)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Frontend Information */}
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                <Cpu className="w-4 h-4" />
                Frontend Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-900/70 border border-slate-800/70 rounded-lg" style={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(30, 41, 59, 0.9)' }}>
                  <div className="text-xs text-slate-500 mb-1" style={{ color: '#94a3b8' }}>Version</div>
                  <div className="text-sm font-medium text-slate-100" style={{ color: '#ffffff' }}>
                    {frontendInfo.version}
                  </div>
                </div>
                <div className="p-3 bg-slate-900/70 border border-slate-800/70 rounded-lg" style={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(30, 41, 59, 0.9)' }}>
                  <div className="text-xs text-slate-500 mb-1" style={{ color: '#94a3b8' }}>Environment</div>
                  <div className="text-sm font-medium text-slate-100" style={{ color: '#ffffff' }}>
                    <Badge variant="outline" className="bg-indigo-500/20 text-indigo-400 text-xs">
                      {frontendInfo.environment}
                    </Badge>
                  </div>
                </div>
                <div className="p-3 bg-slate-900/70 border border-slate-800/70 rounded-lg" style={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(30, 41, 59, 0.9)' }}>
                  <div className="text-xs text-slate-500 mb-1" style={{ color: '#94a3b8' }}>Screen Resolution</div>
                  <div className="text-sm font-medium text-slate-100" style={{ color: '#ffffff' }}>
                    {frontendInfo.screenResolution}
                  </div>
                </div>
                <div className="p-3 bg-slate-900/70 border border-slate-800/70 rounded-lg" style={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(30, 41, 59, 0.9)' }}>
                  <div className="text-xs text-slate-500 mb-1" style={{ color: '#94a3b8' }}>Viewport</div>
                  <div className="text-sm font-medium text-slate-100" style={{ color: '#ffffff' }}>
                    {frontendInfo.viewport}
                  </div>
                </div>
              </div>
            </div>

            {/* Browser Information */}
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                <HardDrive className="w-4 h-4" />
                Browser Information
              </h3>
              <div className="p-3 bg-slate-900/70 border border-slate-800/70 rounded-lg" style={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(30, 41, 59, 0.9)' }}>
                <div className="text-xs text-slate-500 mb-2" style={{ color: '#94a3b8' }}>User Agent</div>
                <div className="text-xs font-mono text-slate-400 break-all" style={{ color: '#cbd5e1' }}>
                  {frontendInfo.userAgent}
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            {typeof window !== 'undefined' && 'performance' in window && (
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-3">Performance</h3>
                <div className="p-3 bg-slate-900/70 border border-slate-800/70 rounded-lg" style={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(30, 41, 59, 0.9)' }}>
                  <div className="text-xs text-slate-500 mb-2" style={{ color: '#94a3b8' }}>
                    Memory Usage: {'memory' in performance
                      ? `${Math.round((performance as any).memory.usedJSHeapSize / 1048576)}MB / ${Math.round((performance as any).memory.totalJSHeapSize / 1048576)}MB`
                      : 'N/A'}
                  </div>
                  <div className="text-xs text-slate-500" style={{ color: '#94a3b8' }}>
                    Navigation Timing: {performance.timing 
                      ? `${Math.round(performance.timing.loadEventEnd - performance.timing.navigationStart)}ms`
                      : 'N/A'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

