import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../../services/axiosClient';
import InteractiveGridMap from '../../components/warehouse/InteractiveGridMap';

export default function WarehouseGridManager() {
    const { reqId } = useParams();
    const navigate = useNavigate();
    const [request, setRequest] = useState(null);
    const [warehouse, setWarehouse] = useState(null);
    const [gridLocations, setGridLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);
    const [outboundWarnings, setOutboundWarnings] = useState([]);
    const [renterFilter, setRenterFilter] = useState('');
    
    const [modal, setModal] = useState({ show: false, x: 0, y: 0, items: [] });
    const [actionLoading, setActionLoading] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (msg, err = false) => {
        setToast({ msg, err });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Get Request details
            const reqRes = await axiosClient.get(`/InventoryRequests/${reqId}`);
            const reqData = reqRes.data;
            setRequest(reqData);

            // Get Warehouse (for boundary points)
            const whRes = await axiosClient.get(`/Warehouse/${reqData.warehouseId}`);
            setWarehouse(whRes.data.data || whRes.data);

            // Get Grid Locations
            const gridRes = await axiosClient.get(`/warehouses/${reqData.warehouseId}/grid-locations`);
            setGridLocations(gridRes.data);

            // Determine Outbound Warnings
            if (reqData.type === 'OUTBOUND') {
                const warnings = (reqData.items || []).map(i => ({
                    assetId: i.assetId,
                    itemName: i.itemName,
                    quantityToRemove: i.quantity
                }));
                setOutboundWarnings(warnings);
            }
        } catch (err) {
            console.error(err);
            showToast('Lỗi khi tải dữ liệu bản đồ', true);
        } finally {
            setLoading(false);
        }
    }, [reqId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCellClick = (x, y, items) => {
        setModal({ show: true, x, y, items });
    };

    const handleAssign = async (qty) => {
        if (!selectedItem || qty <= 0) return;
        setActionLoading(true);
        try {
            await axiosClient.post(`/warehouses/${warehouse.warehouseId}/grid-locations/assign`, [{
                gridX: modal.x,
                gridY: modal.y,
                assetId: selectedItem.assetId,
                itemName: selectedItem.itemName,
                renterId: request.renterId,
                quantity: qty
            }]);
            showToast('Đã xếp hàng vào vị trí');
            setModal({ show: false, x:0, y:0, items:[] });
            fetchData();
        } catch (err) {
            showToast('Lỗi khi xếp hàng', true);
        } finally {
            setActionLoading(false);
        }
    };

    const handleRemove = async (item, qty) => {
        if (qty <= 0) return;
        setActionLoading(true);
        try {
            await axiosClient.post(`/warehouses/${warehouse.warehouseId}/grid-locations/remove`, [{
                gridX: modal.x,
                gridY: modal.y,
                assetId: item.assetId,
                itemName: item.itemName,
                quantity: qty
            }]);
            showToast('Đã gỡ hàng khỏi bản đồ');
            setModal({ show: false, x:0, y:0, items:[] });
            fetchData();
        } catch (err) {
            showToast('Lỗi khi gỡ hàng', true);
        } finally {
            setActionLoading(false);
        }
    };

    const handleMove = async (item, toX, toY, qty) => {
        if (qty <= 0) return;
        setActionLoading(true);
        try {
            await axiosClient.post(`/warehouses/${warehouse.warehouseId}/grid-locations/move`, {
                fromX: modal.x,
                fromY: modal.y,
                toX: Number(toX),
                toY: Number(toY),
                assetId: item.assetId,
                itemName: item.itemName,
                quantity: qty
            });
            showToast('Đã di chuyển hàng');
            setModal({ show: false, x:0, y:0, items:[] });
            fetchData();
        } catch (err) {
            showToast('Lỗi khi di chuyển hàng', true);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return <div style={{ padding: 40, textAlign: 'center' }}>Đang tải bản đồ...</div>;
    }

    if (!request || !warehouse) {
        return <div style={{ padding: 40, textAlign: 'center' }}>Không tìm thấy thông tin</div>;
    }

    const renters = Array.from(new Set(gridLocations.filter(g => g.renterName).map(g => g.renterName)));
    const filteredGridLocations = renterFilter 
        ? gridLocations.filter(g => g.renterName === renterFilter)
        : gridLocations;

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', fontFamily: 'Inter,sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <button onClick={() => navigate(-1)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}>
                        ← Quay lại
                    </button>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>
                            Quản lý vị trí trên bản đồ - {request.type === 'INBOUND' ? 'Nhập kho' : 'Xuất kho'} #{request.invReqId}
                        </h2>
                        <p style={{ margin: '2px 0 0', fontSize: '0.875rem', color: '#64748b' }}>
                            Kho: {warehouse.name} | Khách thuê: {request.renterName}
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Lọc theo khách thuê:</span>
                    <select 
                        value={renterFilter} 
                        onChange={e => setRenterFilter(e.target.value)}
                        style={{ padding: '8px', borderRadius: 8, border: '1px solid #cbd5e1', outline: 'none' }}
                    >
                        <option value="">Tất cả</option>
                        {renters.map(r => (
                            <option key={r} value={r}>{r}</option>
                        ))}
                    </select>
                </div>
            </div>

            {toast && (
                <div style={{ padding: '12px 20px', borderRadius: 8, background: toast.err ? '#fee2e2' : '#dcfce7', color: toast.err ? '#dc2626' : '#16a34a', marginBottom: 16, border: `1px solid ${toast.err ? '#fecaca' : '#bbf7d0'}` }}>
                    {toast.msg}
                </div>
            )}

            <div style={{ display: 'flex', gap: 20 }}>
                {/* Sidebar */}
                <div style={{ width: 300, flexShrink: 0, background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 16 }}>
                    <h3 style={{ fontSize: '1rem', margin: '0 0 16px', color: '#1e293b' }}>
                        Danh sách hàng hóa {request.type === 'INBOUND' ? 'cần cất' : 'cần xuất'}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {(request.items || []).map(item => {
                            const isSelected = selectedItem?.itemId === item.itemId;
                            return (
                                <div key={item.itemId} 
                                     onClick={() => request.type === 'INBOUND' ? setSelectedItem(item) : null}
                                     style={{ 
                                        padding: 12, borderRadius: 10, 
                                        border: `1.5px solid ${isSelected ? '#3b82f6' : '#e2e8f0'}`,
                                        background: isSelected ? '#eff6ff' : '#f8fafc',
                                        cursor: request.type === 'INBOUND' ? 'pointer' : 'default'
                                     }}>
                                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>{item.itemName}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>
                                        Tổng YC: {item.quantity} {item.unit}
                                    </div>
                                    {request.type === 'OUTBOUND' && (
                                        <div style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600, marginTop: 4 }}>
                                            ⚠️ Hãy chọn ô lưới có hàng này để gỡ
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Map Area */}
                <div style={{ flex: 1, background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 20 }}>
                    <InteractiveGridMap 
                        boundaryPoints={warehouse.boundaryPoints}
                        totalArea={warehouse.totalArea}
                        gridLocations={filteredGridLocations}
                        onCellClick={handleCellClick}
                        outboundWarnings={outboundWarnings}
                        selectedItem={selectedItem}
                    />
                </div>
            </div>

            {/* Modal for Cell Actions */}
            {modal.show && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', width: 400, borderRadius: 16, padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Ô lưới: [{modal.x}, {modal.y}]</h3>
                            <button onClick={() => setModal({ show: false, x:0, y:0, items:[] })} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
                        </div>

                        {/* Nếu đang Inbound và có chọn hàng */}
                        {request.type === 'INBOUND' && selectedItem && (
                            <div style={{ background: '#eff6ff', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                                <div style={{ fontSize: '0.85rem', color: '#3b82f6', fontWeight: 600, marginBottom: 8 }}>Cất hàng: {selectedItem.itemName}</div>
                                <form onSubmit={e => { e.preventDefault(); handleAssign(Number(e.target.qty.value)); }} style={{ display: 'flex', gap: 8 }}>
                                    <input name="qty" type="number" min="1" defaultValue="1" style={{ width: 80, padding: 6, borderRadius: 6, border: '1px solid #cbd5e1' }} />
                                    <button type="submit" disabled={actionLoading} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }}>Lưu</button>
                                </form>
                            </div>
                        )}

                        {/* List items in cell */}
                        <div style={{ fontWeight: 600, marginBottom: 8 }}>Hàng hóa đang có:</div>
                        {modal.items.length === 0 ? (
                            <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic' }}>Ô trống</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {modal.items.map((item, idx) => {
                                    const isWarning = outboundWarnings.some(w => (w.assetId && w.assetId === item.assetId) || (!w.assetId && w.itemName === item.itemName));
                                    return (
                                        <div key={idx} style={{ border: `1px solid ${isWarning ? '#fecaca' : '#e2e8f0'}`, background: isWarning ? '#fef2f2' : '#f8fafc', padding: 10, borderRadius: 8 }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: isWarning ? '#dc2626' : '#1e293b' }}>
                                                {item.itemName}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>SL: {item.quantity} | Thuê bởi: {item.renterName || '—'}</div>
                                            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                                                {request.type === 'OUTBOUND' && isWarning && (
                                                    <button onClick={() => {
                                                        const qty = prompt(`Nhập số lượng gỡ khỏi bản đồ (Tối đa ${item.quantity}):`, item.quantity);
                                                        if (qty) handleRemove(item, Number(qty));
                                                    }} style={{ flex: 1, padding: 4, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, fontSize: '0.75rem', cursor: 'pointer' }}>Gỡ (Xuất kho)</button>
                                                )}
                                                <button onClick={() => {
                                                    const coords = prompt(`Di chuyển ${item.itemName} sang ô mới (Nhập dạng X,Y):`);
                                                    if (coords) {
                                                        const [tx, ty] = coords.split(',');
                                                        const qty = prompt(`Số lượng muốn di chuyển (Tối đa ${item.quantity}):`, item.quantity);
                                                        if (tx && ty && qty) handleMove(item, tx.trim(), ty.trim(), Number(qty));
                                                    }
                                                }} style={{ flex: 1, padding: 4, background: '#fff', color: '#3b82f6', border: '1px solid #3b82f6', borderRadius: 4, fontSize: '0.75rem', cursor: 'pointer' }}>Di chuyển</button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
