import React from 'react';
import { Building2, ShieldCheck, Calendar, IndianRupee } from 'lucide-react';
import { Invoice } from '../../types';

interface RentBreakdownCardProps {
  invoice: Invoice;
  payData?: any;
}

export const RentBreakdownCard: React.FC<RentBreakdownCardProps> = ({ invoice, payData }) => {
  const amountToPay = payData?.amount ?? (Number(invoice.totalDue) - Number(invoice.amountPaid));
  const lateFine = Number(invoice.lateFine || 0);
  const rentAmount = Number(invoice.rentAmount || invoice.totalDue);

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 16,
        padding: '16px',
        marginBottom: 16,
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#818cf8',
            }}
          >
            <Building2 size={16} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#f8fafc' }}>
              {payData?.ownerName || invoice.stay?.bed?.room?.property?.name || 'PG Accommodation'}
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>
              Room {payData?.roomNumber || invoice.stay?.bed?.room?.roomNumber || '—'} • Bed {payData?.bedNumber || invoice.stay?.bed?.bedNumber || '—'}
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 8,
            padding: '4px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 10.5,
            fontWeight: 700,
            color: '#34d399',
          }}
        >
          <ShieldCheck size={12} /> 0% Fee UPI
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: '#94a3b8', marginBottom: 4 }}>
          <span>Billing Month:</span>
          <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{invoice.billingMonth}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: '#94a3b8', marginBottom: 4 }}>
          <span>Invoice Number:</span>
          <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{invoice.invoiceNumber}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: '#94a3b8', marginBottom: 4 }}>
          <span>Monthly Base Rent:</span>
          <span style={{ color: '#e2e8f0', fontWeight: 600 }}>₹{rentAmount.toLocaleString()}</span>
        </div>
        {lateFine > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: '#f87171', marginBottom: 4 }}>
            <span>Late Fine:</span>
            <span style={{ fontWeight: 600 }}>+₹{lateFine.toLocaleString()}</span>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 8,
            paddingTop: 8,
            borderTop: '1px dashed rgba(255, 255, 255, 0.1)',
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 800, color: '#f8fafc' }}>Total Payable:</span>
          <span style={{ fontSize: 20, fontWeight: 900, color: '#38bdf8' }}>
            ₹{amountToPay.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};
