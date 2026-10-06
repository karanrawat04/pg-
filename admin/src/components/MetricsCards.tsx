import React from 'react';
import { PlatformMetrics } from '../types';
import { TrendingUp, Users, Building, BedDouble, IndianRupee, Layers, CheckCircle } from 'lucide-react';

interface MetricsCardsProps {
  metrics: PlatformMetrics;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({ metrics }) => {
  const cards = [
    {
      title: 'Monthly SaaS MRR',
      value: `₹${metrics.mrr.toLocaleString('en-IN')}`,
      subtitle: `${metrics.activeSubscriptionsCount} Active Subscriptions`,
      icon: TrendingUp,
      color: '#6366f1',
      bgGlow: 'rgba(99, 102, 241, 0.15)',
    },
    {
      title: 'PG Owners Registered',
      value: metrics.totalOwners,
      subtitle: `${metrics.totalProperties} Active Buildings`,
      icon: Users,
      color: '#06b6d4',
      bgGlow: 'rgba(6, 182, 212, 0.15)',
    },
    {
      title: 'Platform Bed Capacity',
      value: metrics.totalBeds,
      subtitle: `${metrics.occupiedBeds} Occupied (${metrics.occupancyRate}%)`,
      icon: BedDouble,
      color: '#10b981',
      bgGlow: 'rgba(16, 185, 129, 0.15)',
    },
    {
      title: 'Platform Rent GMV',
      value: `₹${metrics.totalGmv.toLocaleString('en-IN')}`,
      subtitle: `₹${metrics.totalCollectedGmv.toLocaleString('en-IN')} Collected`,
      icon: IndianRupee,
      color: '#f59e0b',
      bgGlow: 'rgba(245, 158, 11, 0.15)',
    },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: 20,
      marginBottom: 32,
    }}>
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="glass-card"
            style={{
              padding: '22px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Background Glow */}
            <div style={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 90,
              height: 90,
              borderRadius: '50%',
              background: card.bgGlow,
              filter: 'blur(30px)',
              pointerEvents: 'none',
            }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>
                {card.title}
              </span>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: card.bgGlow,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Icon size={19} color={card.color} />
              </div>
            </div>

            <div style={{ fontSize: 28, fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.5px' }}>
              {card.value}
            </div>

            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span>{card.subtitle}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
