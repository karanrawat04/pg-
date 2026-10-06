import React from 'react';
import { OwnerSubscriptionDetails } from '../../types';
import { Clock, Zap, Building2, BedDouble } from 'lucide-react';

interface CurrentPlanHeroCardProps {
  subDetails: OwnerSubscriptionDetails | null;
  onToggleRenew: () => void;
  isRenewMode: boolean;
}

export const CurrentPlanHeroCard: React.FC<CurrentPlanHeroCardProps> = ({
  subDetails,
  onToggleRenew,
  isRenewMode,
}) => {
  const currentPlan = subDetails?.plan;
  const isPastDue = subDetails?.isExpired || subDetails?.status === 'PAST_DUE';
  const isTrial = subDetails?.status === 'TRIAL';

  return (
    <div
      style={{
        flexShrink: 0, // Prevents flex container squashing
        background: isPastDue
          ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.18) 0%, rgba(15, 23, 42, 0.85) 100%)'
          : 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.12) 100%)',
        border: isPastDue ? '1px solid rgba(239, 68, 68, 0.45)' : '1px solid rgba(99, 102, 241, 0.4)',
        borderRadius: 20,
        padding: '18px 20px',
        position: 'relative',
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Top Row: Plan Name & Status Pill */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <span style={{
            fontSize: 10.5,
            fontWeight: 800,
            color: '#a5b4fc',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            display: 'block',
          }}>
            Current Active Plan
          </span>
          <h3 style={{ fontSize: 24, fontWeight: 900, color: '#f8fafc', margin: '4px 0 0', letterSpacing: '-0.3px' }}>
            {currentPlan?.name || 'Starter'} Tier
          </h3>
        </div>

        <span style={{
          fontSize: 11,
          fontWeight: 800,
          padding: '4px 12px',
          borderRadius: 20,
          background: isPastDue
            ? 'rgba(239, 68, 68, 0.25)'
            : isTrial
            ? 'rgba(59, 130, 246, 0.25)'
            : 'rgba(16, 185, 129, 0.25)',
          color: isPastDue ? '#fca5a5' : isTrial ? '#93c5fd' : '#6ee7b7',
          border: isPastDue
            ? '1px solid rgba(239, 68, 68, 0.4)'
            : isTrial
            ? '1px solid rgba(59, 130, 246, 0.4)'
            : '1px solid rgba(16, 185, 129, 0.4)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          {isPastDue ? 'EXPIRED' : isTrial ? 'FREE TRIAL' : 'ACTIVE'}
        </span>
      </div>

      {/* Middle Row: Countdown Timer & Quick Renew Button */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.35)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: 14,
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: isPastDue ? 'rgba(239, 68, 68, 0.25)' : 'rgba(99, 102, 241, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isPastDue ? '#f87171' : '#818cf8',
            flexShrink: 0,
          }}>
            <Clock size={17} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: isPastDue ? '#f87171' : '#f8fafc' }}>
              {isPastDue ? 'Subscription Overdue' : `${subDetails?.daysLeft ?? 0} Days Remaining`}
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
              Valid until {subDetails?.endDate ? new Date(subDetails.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleRenew}
          style={{
            background: isRenewMode ? 'rgba(255, 255, 255, 0.1)' : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            border: isRenewMode ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
            padding: '7px 14px',
            borderRadius: 10,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            boxShadow: isRenewMode ? 'none' : '0 3px 12px rgba(99, 102, 241, 0.4)',
            transition: 'all 0.15s ease',
          }}
        >
          <Zap size={13} />
          <span>{isRenewMode ? 'Close' : 'Renew'}</span>
        </button>
      </div>

      {/* Bottom Row: Quota Usage Progress Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {/* Buildings Quota */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: 12,
          padding: '10px 12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>
            <Building2 size={13} color="#818cf8" />
            <span>PG Buildings</span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#f8fafc' }}>
            {subDetails?.usage?.propertiesCount || 0} / {subDetails?.usage?.maxProperties || 1}
          </div>
          <div style={{
            height: 4,
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: 2,
            marginTop: 6,
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${Math.min(100, ((subDetails?.usage?.propertiesCount || 0) / (subDetails?.usage?.maxProperties || 1)) * 100)}%`,
              height: '100%',
              background: (subDetails?.usage?.propertiesCount || 0) >= (subDetails?.usage?.maxProperties || 1) ? '#f59e0b' : '#6366f1',
              borderRadius: 2,
            }} />
          </div>
        </div>

        {/* Beds Quota */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: 12,
          padding: '10px 12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>
            <BedDouble size={13} color="#10b981" />
            <span>Bed Capacity</span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#f8fafc' }}>
            {subDetails?.usage?.totalBeds || 0} / {subDetails?.usage?.maxBeds || 50}
          </div>
          <div style={{
            height: 4,
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: 2,
            marginTop: 6,
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${Math.min(100, ((subDetails?.usage?.totalBeds || 0) / (subDetails?.usage?.maxBeds || 50)) * 100)}%`,
              height: '100%',
              background: '#10b981',
              borderRadius: 2,
            }} />
          </div>
        </div>
      </div>
    </div>
  );
};
