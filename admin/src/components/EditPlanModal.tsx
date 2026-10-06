import React, { useState } from 'react';
import { SubscriptionPlan } from '../types';
import { adminApi } from '../api/client';
import { X, CheckCircle, Plus, Trash2 } from 'lucide-react';

interface EditPlanModalProps {
  plan?: SubscriptionPlan | null; // null for Create New Plan
  onClose: () => void;
  onSuccess: () => void;
}

export const EditPlanModal: React.FC<EditPlanModalProps> = ({
  plan,
  onClose,
  onSuccess,
}) => {
  const isEditing = !!plan;
  const [name, setName] = useState(plan?.name || '');
  const [description, setDescription] = useState(plan?.description || '');
  const [priceMonthly, setPriceMonthly] = useState(plan ? Number(plan.priceMonthly) : 1999);
  const [priceYearly, setPriceYearly] = useState(plan ? Number(plan.priceYearly) : 19999);
  const [maxProperties, setMaxProperties] = useState(plan?.maxProperties || 2);
  const [maxBeds, setMaxBeds] = useState(plan?.maxBeds || 100);
  const [featuresText, setFeaturesText] = useState((plan?.features || []).join('\n'));
  const [isActive, setIsActive] = useState(plan ? plan.isActive : true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Plan name is required.');
      return;
    }

    const features = featuresText
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);

    setLoading(true);
    setError(null);

    try {
      if (isEditing && plan) {
        await adminApi.updatePlan(plan.id, {
          name,
          description,
          priceMonthly,
          priceYearly,
          maxProperties,
          maxBeds,
          features,
          isActive,
        });
      } else {
        await adminApi.createPlan({
          name,
          description,
          priceMonthly,
          priceYearly,
          maxProperties,
          maxBeds,
          features,
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save subscription plan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 580 }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#f8fafc', margin: 0 }}>
              {isEditing ? `Edit Plan: ${plan?.name}` : 'Create New SaaS Tier'}
            </h3>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '3px 0 0' }}>
              Define pricing limits and feature availability
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: 10,
              padding: '10px 14px',
              color: '#fb7185',
              fontSize: 12.5,
            }}>
              {error}
            </div>
          )}

          {/* Plan Name & Active Toggle */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                Plan Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Pro Growth"
                required
                className="custom-input"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                Status
              </label>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 12,
                padding: '10px 12px',
                cursor: 'pointer',
                fontSize: 12.5,
                color: isActive ? '#34d399' : '#94a3b8',
              }}>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <span>{isActive ? 'Active' : 'Archived'}</span>
              </label>
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Multi-building coliving chains"
              className="custom-input"
            />
          </div>

          {/* Monthly & Yearly Pricing */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                Monthly Price (₹ INR)
              </label>
              <input
                type="number"
                min="0"
                value={priceMonthly}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setPriceMonthly(val);
                  setPriceYearly(val * 10); // Standard 2-months-free default
                }}
                required
                className="custom-input"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                Yearly Price (₹ INR)
              </label>
              <input
                type="number"
                min="0"
                value={priceYearly}
                onChange={(e) => setPriceYearly(Number(e.target.value))}
                required
                className="custom-input"
              />
            </div>
          </div>

          {/* Max Properties & Max Beds */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                Max Properties
              </label>
              <input
                type="number"
                min="1"
                value={maxProperties}
                onChange={(e) => setMaxProperties(parseInt(e.target.value, 10))}
                required
                className="custom-input"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                Max Beds Quota
              </label>
              <input
                type="number"
                min="1"
                value={maxBeds}
                onChange={(e) => setMaxBeds(parseInt(e.target.value, 10))}
                required
                className="custom-input"
              />
            </div>
          </div>

          {/* Features list (one per line) */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
              Features (one line per bullet)
            </label>
            <textarea
              rows={4}
              value={featuresText}
              onChange={(e) => setFeaturesText(e.target.value)}
              placeholder="Bed Matrix & Inventory&#10;Email OTP Auth&#10;WhatsApp Reminders&#10;Zero Fee UPI QR"
              className="custom-input"
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Saving Plan...' : isEditing ? 'Save Changes' : 'Create Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
