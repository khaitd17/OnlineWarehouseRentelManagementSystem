import React, { useState, useEffect } from 'react';
import axiosClient from '../../services/axiosClient';

export default function RenterSpaceUsageWarning({ warehouseId, renterId }) {
    const [usage, setUsage] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let mounted = true;
        if (!warehouseId || !renterId) return;
        setLoading(true);
        axiosClient.get(`/warehouses/${warehouseId}/grid-locations/renters/${renterId}/space-usage`)
            .then(res => { if (mounted) setUsage(res.data); })
            .catch(() => {})
            .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, [warehouseId, renterId]);

    if (!warehouseId || !renterId || loading || !usage) return null;

    const pct = usage.contractedArea > 0
        ? (usage.occupiedArea / usage.contractedArea) * 100 : 0;
    const remaining = Math.max(0, usage.contractedArea - usage.occupiedArea);

    let color, bg, border;
    if (pct > 100)      { color = '#dc2626'; bg = '#fef2f2'; border = '#fecaca'; }
    else if (pct >= 80) { color = '#d97706'; bg = '#fffbeb'; border = '#fde68a'; }
    else if (pct < 20)  { color = '#2563eb'; bg = '#eff6ff'; border = '#bfdbfe'; }
    else                { color = '#16a34a'; bg = '#f0fdf4'; border = '#bbf7d0'; }

    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '4px 12px', borderRadius: 20,
            background: bg, border: `1px solid ${border}`,
            fontSize: '0.78rem', fontWeight: 700, color,
            fontFamily: 'Inter, sans-serif',
        }}>
            {pct > 100
                ? `Vượt: ${(usage.occupiedArea - usage.contractedArea).toFixed(1)} m²`
                : `Còn trống: ${remaining.toFixed(1)} m²`}
        </span>
    );
}
