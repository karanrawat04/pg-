import React, { useState } from 'react';
import { SubscriptionPlan } from '../types';
import { EditPlanModal } from '../components/EditPlanModal';
import { Plus, Edit2, CheckCircle2, Shield, Users, Layers, Zap } from 'lucide-react';

interface PlansScreenProps {
  plans: SubscriptionPlan[];
  onRefresh: () => void;
}

export const PlansScreen: React.FC<PlansScreenProps> = ({ plans, onRefresh }) => {
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null | 'NEW'>(null);

  return (
    <div>
      {/* Top Action Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 28,
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f8fafc', margin: 0 }}>
            SaaS Subscription Tiers
          </h2>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: '4px 0 0' }}>
            Configure tier prices, property & bed allocations, and feature sets for PG operators
          </p>
        </div>

        <button
          onClick={() => setEditingPlan('NEW')}
          className="btn-primary"
        >
          <Plus size={16} />
          <span>Create New SaaS Tier</span>
        </button>
      </div>

      {/* Plans Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 24,
      }}>
        {plans.map((plan) => {
          const isEnterprise = plan.name.toLowerCase().includes('enterprise');
          const isGrowth = plan.name.toLowerCase().includes('growth');

          return (
            <div
              key={plan.id}
              className="glass-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                border: isGrowth ? '1px solid rgba(99, 102, 241, 0.4)' : undefined,
                background: isGrowth ? 'linear-gradient(180deg, rgba(99, 102, 241, 0.08) 0%, rgba(15, 23, 42, 0.7) 100%)' : undefined,
              }}
            >
              {/* Most Popular Badge for Growth */}
              {isGrowth && (
                <div style={{
                  position: 'absolute',
                  top: -12,
                  right: 20,
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  color: '#fff',
                  fontSize: 10.5,
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: 20,
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
                }}>
                  Top Seller
                </div>
              )}

              <div>
                {/* Plan Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                      {plan.name}
                    </h3>
                    <p style={{ fontSize: 12, color: '#94a3b8', margin: '3px 0 0' }}>
                      {plan.description || 'SaaS subscription package'}
                    </p>
                  </div>

                  <span className={`badge ${plan.isActive ? 'badge-active' : 'badge-suspended'}`}>
                    {plan.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Price Display */}
                <div style={{ margin: '20px 0 24px', paddingBottom: 20, borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: 32, fontWeight: 900, color: '#f8fafc', letterSpacing: '-1px' }}>
                      ₹{Number(plan.priceMonthly).toLocaleString('en-IN')}
                    </span>
                    <span style={{ fontSize: 13, color: '#94a3b8' }}>/ month</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                    Billed annually at ₹{Number(plan.priceYearly).toLocaleString('en-IN')}/yr
                  </div>
                </div>

                {/* Capacity Limits */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 12,
                  padding: '12px 14px',
                  marginBottom: 20,
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12.5,
                }}>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Property Cap: </span>
                    <strong style={{ color: '#f8fafc' }}>{plan.maxProperties >= 999 ? 'Unlimited' : `${plan.maxProperties} PG Buildings`}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Bed Quota: </span>
                    <strong style={{ color: '#f8fafc' }}>{plan.maxBeds >= 9999 ? 'Unlimited' : `${plan.maxBeds} Beds`}</strong>
                  </div>
                </div>

                {/* Features List */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>
                    Included Capabilities
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                    {(plan.features || []).map((feature, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#cbd5e1' }}>
                        <CheckCircle2 size={15} color="#10b981" style={{ flexShrink: 0 }} />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Card Controls */}
              <div style={{
                paddingTop: 16,
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                  <strong style={{ color: '#818cf8' }}>{plan._count?.subscriptions || 0}</strong> Subscribers
                </div>

                <button
                  onClick={() => setEditingPlan(plan)}
                  className="btn-secondary"
                  style={{ padding: '7px 14px', fontSize: 12 }}
                >
                  <Edit2 size={13} />
                  <span>Configure Tier</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Plan Modal */}
      {editingPlan && (
        <EditPlanModal
          plan={editingPlan === 'NEW' ? null : editingPlan}
          onClose={() => setEditingPlan(null)}
          onSuccess={onRefresh}
        />
      )}
    </div>
  );
};
