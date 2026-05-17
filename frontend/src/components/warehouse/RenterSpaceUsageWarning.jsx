import React, { useState, useEffect } from 'react';
import axiosClient from '../../services/axiosClient';

export default function RenterSpaceUsageWarning({ warehouseId, renterId }) {
    const [usage, setUsage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;
        
        const fetchUsage = async () => {
            if (!warehouseId || !renterId) return;
            
            setLoading(true);
            setError(null);
            
            try {
                const res = await axiosClient.get(`/warehouses/${warehouseId}/renters/${renterId}/space-usage`);
                if (mounted) {
                    setUsage(res.data);
                }
            } catch (err) {
                console.error("Failed to fetch renter space usage", err);
                if (mounted) {
                    setError('Không thể tải thông tin diện tích');
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        fetchUsage();

        return () => { mounted = false; };
    }, [warehouseId, renterId]);

    if (!warehouseId || !renterId) return null;

    if (loading) {
        return (
            <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid #cbd5e1', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
                Đang tải thông tin diện tích...
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: '12px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca', fontSize: '0.85rem', color: '#ef4444' }}>
                ⚠️ {error}
            </div>
        );
    }

    if (!usage) return null;

    const percentage = usage.contractedArea > 0 ? (usage.occupiedArea / usage.contractedArea) * 100 : 0;
    
    // Determine status color
    let statusColor = '#22c55e'; // Green - Normal
    let bgColor = '#f0fdf4';
    let borderColor = '#bbf7d0';
    let icon = '✅';
    
    if (percentage > 100) {
        statusColor = '#ef4444'; // Red - Exceeded
        bgColor = '#fef2f2';
        borderColor = '#fecaca';
        icon = '❌';
    } else if (percentage >= 80) {
        statusColor = '#f59e0b'; // Amber - Warning
        bgColor = '#fffbeb';
        borderColor = '#fde68a';
        icon = '⚠️';
    } else if (usage.contractedArea === 0) {
        statusColor = '#64748b'; // Gray - No contract area found
        bgColor = '#f8fafc';
        borderColor = '#e2e8f0';
        icon = 'ℹ️';
    }

    return (
        <div style={{ 
            padding: '12px 16px', 
            background: bgColor, 
            borderRadius: '10px', 
            border: `1px solid ${borderColor}`,
            marginBottom: '16px',
            fontFamily: 'Inter, sans-serif'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{icon}</span> Thông tin diện tích
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: statusColor, background: '#fff', padding: '2px 8px', borderRadius: '12px', border: `1px solid ${borderColor}` }}>
                    {percentage.toFixed(1)}%
                </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#475569', marginBottom: '4px' }}>
                <span>Hợp đồng:</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{usage.contractedArea} m²</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#475569', marginBottom: '10px' }}>
                <span>Đã xếp hàng:</span>
                <span style={{ fontWeight: 600, color: statusColor }}>{usage.occupiedArea} m² <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#64748b' }}>({usage.occupiedCells} ô)</span></span>
            </div>
            
            {/* Progress Bar */}
            <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ 
                    width: `${Math.min(percentage, 100)}%`, 
                    height: '100%', 
                    background: statusColor,
                    transition: 'width 0.5s ease-out'
                }} />
            </div>
            
            {percentage > 100 && (
                <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#ef4444', fontStyle: 'italic' }}>
                    Vượt quá diện tích trong hợp đồng!
                </div>
            )}
        </div>
    );
}
