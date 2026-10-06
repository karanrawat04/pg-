import React, { useState, useEffect } from 'react';
import { Property, AuthUser } from './types';
import { api } from './api/client';
import { HeaderSwitcher } from './components/HeaderSwitcher';
import { OwnerDashboard } from './screens/OwnerDashboard';
import { TenantPortal } from './screens/TenantPortal';
import { MobileLoginScreen } from './screens/MobileLoginScreen';
import { AddPropertyModal } from './components/AddPropertyModal';
import { EditPropertyModal } from './components/EditPropertyModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { OwnerPaymentSettingsModal } from './components/payment/OwnerPaymentSettingsModal';
import { ShieldAlert, LogOut } from 'lucide-react';

export function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(api.getCurrentUser());
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedPropertyForEdit, setSelectedPropertyForEdit] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isPaymentSettingsOpen, setIsPaymentSettingsOpen] = useState(false);

  // Active role is strictly driven by the authenticated user's account role
  const activeRole: 'OWNER' | 'TENANT' = currentUser?.role === 'TENANT' ? 'TENANT' : 'OWNER';

  const loadProperties = async (selectNewId?: string) => {
    try {
      const data = await api.getProperties(currentUser?.organizationId || undefined);
      if (data && data.length > 0) {
        setProperties(data);

        // If tenant, prioritize matching property from their active stay
        const tenantStayPropertyId = currentUser?.tenantProfile?.stays?.[0]?.bed?.room?.property?.id;

        if (selectNewId) {
          const newlyAdded = data.find((p: Property) => p.id === selectNewId);
          if (newlyAdded) setSelectedProperty(newlyAdded);
          else setSelectedProperty(data[0]);
        } else if (tenantStayPropertyId) {
          const matched = data.find((p: Property) => p.id === tenantStayPropertyId);
          setSelectedProperty(matched || data[0]);
        } else if (!selectedProperty || !data.some((p: Property) => p.id === selectedProperty.id)) {
          setSelectedProperty(data[0]);
        }
      } else {
        setProperties([]);
        setSelectedProperty(null);
      }
    } catch (err) {
      console.error('Failed to load properties:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadProperties();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    setProperties([]);
    setSelectedProperty(null);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#070a14',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#818cf8',
        fontFamily: 'sans-serif',
        gap: 12,
      }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 16,
          background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 800,
          fontSize: 22,
          boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
        }}>
          ⚡
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>
          PG Flow Mobile
        </div>
        <div style={{ fontSize: 12, color: '#64748b' }}>
          Initializing Session...
        </div>
      </div>
    );
  }

  // Not logged in: Show Email OTP Login Screen
  if (!currentUser) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#050810',
        display: 'flex',
        justifyContent: 'center',
      }}>
        <div className="mobile-app-shell">
          <MobileLoginScreen
            onLoginSuccess={(user) => {
              setCurrentUser(user);
            }}
          />
        </div>
      </div>
    );
  }

  // If Owner is Suspended by Admin
  if (currentUser.role === 'OWNER' && currentUser.organization?.status === 'SUSPENDED') {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#050810',
        display: 'flex',
        justifyContent: 'center',
      }}>
        <div className="mobile-app-shell" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '30px 24px', textAlign: 'center' }}>
          <div style={{
            width: 60,
            height: 60,
            borderRadius: 20,
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            color: '#fb7185',
          }}>
            <ShieldAlert size={32} />
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f8fafc', marginBottom: 8 }}>
            PG Account Suspended
          </h2>

          <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, marginBottom: 24 }}>
            Your PG operator subscription has been temporarily suspended by the platform administrator.
            Please reach out to support@pgflow.com to settle outstanding dues or reactivate your account.
          </p>

          <button
            onClick={handleLogout}
            className="btn-secondary"
            style={{ justifyContent: 'center', padding: '12px' }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#050810',
      display: 'flex',
      justifyContent: 'center',
    }}>
      {/* Native-Feel Mobile Shell */}
      <div className="mobile-app-shell">
        {/* Mobile Header with Building Switcher & Authenticated Profile Badge */}
        <HeaderSwitcher
          properties={properties}
          selectedProperty={selectedProperty}
          onSelectProperty={(prop) => setSelectedProperty(prop)}
          activeRole={activeRole}
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenAddProperty={() => setIsAddPropertyOpen(true)}
          onEditProperty={(prop) => setSelectedPropertyForEdit(prop)}
          onOpenSubscription={() => setIsSubscriptionModalOpen(true)}
          onOpenPaymentSettings={() => setIsPaymentSettingsOpen(true)}
        />

        {/* Main Content Viewport */}
        {selectedProperty ? (
          <main style={{ flex: 1 }}>
            {activeRole === 'OWNER' ? (
              <OwnerDashboard
                property={selectedProperty}
                onRefreshProperties={() => loadProperties(selectedProperty.id)}
                onOpenAddProperty={() => setIsAddPropertyOpen(true)}
                onOpenSubscription={() => setIsSubscriptionModalOpen(true)}
                onOpenPaymentSettings={() => setIsPaymentSettingsOpen(true)}
                onEditProperty={(prop) => setSelectedPropertyForEdit(prop)}
              />
            ) : (
              <TenantPortal property={selectedProperty} />
            )}
          </main>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
            <p style={{ fontSize: 15, color: '#f8fafc', fontWeight: 700 }}>No PG Buildings Found</p>
            <p style={{ fontSize: 13, marginBottom: 20 }}>
              {activeRole === 'OWNER' ? 'Tap below to create your first PG building.' : 'No active stay registered yet.'}
            </p>
            {activeRole === 'OWNER' && (
              <button
                onClick={() => setIsAddPropertyOpen(true)}
                className="btn-primary"
              >
                + Add Building
              </button>
            )}
          </div>
        )}

        {/* Global Add Property Modal (Owner Only) */}
        {activeRole === 'OWNER' && (
          <AddPropertyModal
            isOpen={isAddPropertyOpen}
            onClose={() => setIsAddPropertyOpen(false)}
            onSuccess={(newProp) => loadProperties(newProp.id)}
          />
        )}

        {/* Global Edit Property Modal (Owner Only) */}
        {activeRole === 'OWNER' && selectedPropertyForEdit && (
          <EditPropertyModal
            isOpen={!!selectedPropertyForEdit}
            onClose={() => setSelectedPropertyForEdit(null)}
            property={selectedPropertyForEdit}
            onSuccess={() => loadProperties(selectedPropertyForEdit.id)}
            onDeleted={async () => {
              setSelectedPropertyForEdit(null);
              const data = await api.getProperties(currentUser?.organizationId || undefined);
              setProperties(data || []);
              if (data && data.length > 0) setSelectedProperty(data[0]);
              else setSelectedProperty(null);
            }}
          />
        )}

        {/* Global SaaS Subscription & Plan Modal (Owner Only) */}
        {activeRole === 'OWNER' && (
          <SubscriptionModal
            isOpen={isSubscriptionModalOpen}
            onClose={() => setIsSubscriptionModalOpen(false)}
            onSubscriptionUpdated={() => loadProperties(selectedProperty?.id)}
          />
        )}

        {/* Global Tenant Payment Gateway & UPI Settings Modal (Owner Only) */}
        {activeRole === 'OWNER' && (
          <OwnerPaymentSettingsModal
            isOpen={isPaymentSettingsOpen}
            onClose={() => setIsPaymentSettingsOpen(false)}
          />
        )}
      </div>
    </div>
  );
}

export default App;
