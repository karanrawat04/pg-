import React, { useState, useEffect } from 'react';
import { adminApi } from './api/client';
import { AdminUser, PlatformMetrics, Organization, SubscriptionPlan } from './types';
import { AdminLoginScreen } from './screens/AdminLoginScreen';
import { AdminSidebar } from './components/AdminSidebar';
import { AdminNavbar } from './components/AdminNavbar';
import { DashboardOverviewScreen } from './screens/DashboardOverviewScreen';
import { OrganizationsScreen } from './screens/OrganizationsScreen';
import { PlansScreen } from './screens/PlansScreen';
import { PlatformPaymentSettingsScreen } from './screens/PlatformPaymentSettingsScreen';

export function App() {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(adminApi.getCurrentUser());
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'organizations' | 'plans' | 'payments'>('dashboard');

  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async (silent = false) => {
    if (!currentUser) return;
    if (!silent) setLoading(true);
    else setIsRefreshing(true);

    try {
      const [m, o, p] = await Promise.all([
        adminApi.getMetrics(),
        adminApi.getOrganizations(),
        adminApi.getPlans(),
      ]);
      setMetrics(m);
      setOrganizations(o);
      setPlans(p);
    } catch (err: any) {
      console.error('Failed to load admin dashboard data:', err);
      if (err.message && err.message.toLowerCase().includes('token')) {
        adminApi.logout();
        setCurrentUser(null);
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  const handleLogout = () => {
    adminApi.logout();
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <AdminLoginScreen onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  const getPageInfo = () => {
    switch (currentTab) {
      case 'dashboard':
        return {
          title: 'Platform Overview & Revenue',
          subtitle: 'Live multi-PG ecosystem performance and subscription metrics',
        };
      case 'organizations':
        return {
          title: 'PG Owners & Fleet Directory',
          subtitle: 'Manage client accounts, capacities, plans, and access status',
        };
      case 'plans':
        return {
          title: 'SaaS Subscription Plans',
          subtitle: 'Configure pricing models, feature tiers, and bed limits',
        };
      case 'payments':
        return {
          title: 'Platform Payment Gateways',
          subtitle: 'Configure Razorpay and Direct UPI settings for SaaS subscriptions',
        };
    }
  };

  const { title, subtitle } = getPageInfo();

  return (
    <div className="admin-layout">
      {/* Fixed Desktop Sidebar */}
      <AdminSidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        adminUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Administrative Content Area */}
      <div className="admin-main">
        <AdminNavbar
          title={title}
          subtitle={subtitle}
          onRefresh={() => loadData(true)}
          isRefreshing={isRefreshing}
        />

        <main className="admin-content">
          {loading && !metrics ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: '#94a3b8' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', marginBottom: 8 }}>
                Loading PG Flow Platform Control Center...
              </div>
              <p style={{ fontSize: 13, color: '#64748b' }}>
                Fetching real-time multi-tenant database records
              </p>
            </div>
          ) : (
            <>
              {currentTab === 'dashboard' && (
                <DashboardOverviewScreen
                  metrics={metrics}
                  organizations={organizations}
                  onNavigateTab={(tab) => setCurrentTab(tab)}
                />
              )}

              {currentTab === 'organizations' && (
                <OrganizationsScreen
                  organizations={organizations}
                  plans={plans}
                  onRefresh={() => loadData(true)}
                />
              )}

              {currentTab === 'plans' && (
                <PlansScreen
                  plans={plans}
                  onRefresh={() => loadData(true)}
                />
              )}

              {currentTab === 'payments' && (
                <PlatformPaymentSettingsScreen />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
