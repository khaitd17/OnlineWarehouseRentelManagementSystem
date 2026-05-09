import React, { useState, useEffect } from 'react';
import axiosClient from '../../services/axiosClient';
import InteractiveGridMap from './InteractiveGridMap';

export default function ItemLocationModal({ item, onClose }) {
    const [warehouse, setWarehouse] = useState(null);
    const [gridLocations, setGridLocations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!item?.warehouseId) return;

        const fetchData = async () => {
            try {
                // Fetch warehouse details for boundary points
                const whRes = await axiosClient.get(`/Warehouse/${item.warehouseId}`);
                setWarehouse(whRes.data.data || whRes.data);

                // Fetch grid locations for this warehouse
                // We pass renterId to potentially limit, but we can also just fetch all and filter by assetName
                const gridRes = await axiosClient.get(`/warehouses/${item.warehouseId}/grid-locations`);
                const parsedGridLocations = gridRes.data.map(loc => {
                    let coords = [];
                    try {
                        coords = typeof loc.coordinates === 'string' ? JSON.parse(loc.coordinates) : loc.coordinates;
                    } catch { }
                    return { ...loc, coordinates: coords || [] };
                });
                
                // Filter down ONLY to the selected item's locations
                const itemLocations = parsedGridLocations.filter(g => g.itemName === item.assetName);
                setGridLocations(itemLocations);

            } catch (err) {
                console.error("Failed to fetch location data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [item]);

    if (!item) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ background: '#fff', width: '100%', maxWidth: 1200, height: '85vh', borderRadius: 20, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                {/* Modal Header */}
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#0f172a' }}>Tra cứu vị trí: {item.assetName}</h2>
                        <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                            Sơ đồ kho: {warehouse?.name || warehouse?.warehouseName || item.warehouseName || 'Không rõ'}
                        </p>
                    </div>
                    <button onClick={onClose} style={{ border: 'none', background: '#e2e8f0', color: '#475569', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold' }}>✕</button>
                </div>
                
                <div style={{ flex: 1, padding: 20, overflow: 'auto', background: '#f8fafc', display: 'flex', justifyContent: 'center' }}>
                    {loading ? (
                        <div style={{ alignSelf: 'center', color: '#64748b', fontSize: '1.1rem' }}>Đang tải bản đồ...</div>
                    ) : !warehouse ? (
                        <div style={{ alignSelf: 'center', color: '#ef4444' }}>Không thể tải thông tin kho</div>
                    ) : gridLocations.length === 0 ? (
                        <div style={{ alignSelf: 'center', color: '#64748b', textAlign: 'center' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: '#cbd5e1' }}>grid_off</span>
                            <div style={{ marginTop: 10 }}>Mặt hàng này hiện chưa được xếp lên lưới bản đồ.</div>
                        </div>
                    ) : (
                        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 20, minWidth: '100%', display: 'flex', justifyContent: 'center' }}>
                            <InteractiveGridMap 
                                boundaryPoints={warehouse.boundaryPoints}
                                totalArea={warehouse.totalArea}
                                gridLocations={gridLocations}
                                selectedItem={null}
                                outboundWarnings={[]}
                                pendingAssignments={[]}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
