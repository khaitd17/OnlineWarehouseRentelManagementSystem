import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import axiosClient from '../../services/axiosClient';
import authService from '../../services/authService';
import InteractiveGridMap from '../../components/warehouse/InteractiveGridMap';

export default function WarehouseGridMapPage() {
    const [warehouseId, setWarehouseId] = useState(null);
    const [warehouses, setWarehouses] = useState([]);
    const [warehouse, setWarehouse] = useState(null);
    const [gridLocations, setGridLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [renterFilter, setRenterFilter] = useState('');
    
    const editMode = true;
    const [inventoryStatus, setInventoryStatus] = useState([]);
    
    // Assignment Modal State
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [pendingAssignments, setPendingAssignments] = useState([]); // array of {x, y}
    const [globalQuantity, setGlobalQuantity] = useState(1);

    // Cell Actions Modal State
    const [modal, setModal] = useState({ show: false, x: 0, y: 0, items: [] });
    const [modalInputValues, setModalInputValues] = useState({});

    const [actionLoading, setActionLoading] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (msg, err = false) => {
        setToast({ msg, err });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        let mounted = true;
        const initContext = async () => {
            try {
                let ctx = await authService.refreshWarehouseContext();
                if (!ctx) ctx = authService.getWarehouseContext();
                
                if (!mounted) return;
                
                const whs = ctx?.warehouses || [];
                setWarehouses(whs);
                if (whs.length > 0) {
                    setWarehouseId(whs[0].warehouseId || whs[0].id);
                } else {
                    setLoading(false);
                }
            } catch (err) {
                console.error(err);
                if (mounted) setLoading(false);
            }
        };

        initContext();
        return () => { mounted = false; };
    }, []);

    const fetchData = useCallback(async () => {
        if (!warehouseId) return;
        setLoading(true);
        try {
            const whRes = await axiosClient.get(`/Warehouse/${warehouseId}`);
            setWarehouse(whRes.data.data || whRes.data);

            const gridRes = await axiosClient.get(`/warehouses/${warehouseId}/grid-locations`);
            const parsedGridLocations = gridRes.data.map(loc => {
                let coords = [];
                try {
                    coords = typeof loc.coordinates === 'string' ? JSON.parse(loc.coordinates) : loc.coordinates;
                } catch { }
                return { ...loc, coordinates: coords || [] };
            });
            setGridLocations(parsedGridLocations);

            if (editMode) {
                const statusRes = await axiosClient.get(`/warehouses/${warehouseId}/grid-locations/inventory-status`);
                setInventoryStatus(statusRes.data);
            }
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.message || err.message || 'Lỗi không xác định';
            showToast(`Lỗi khi tải dữ liệu: ${msg}`, true);
        } finally {
            setLoading(false);
        }
    }, [warehouseId, editMode]);

    useEffect(() => {
        fetchData();
        setSelectedItem(null);
        setPendingAssignments([]);
        setShowAssignmentModal(false);
    }, [fetchData]);

    const handleMainMapClick = (x, y) => {
        const itemsInCell = gridLocations.filter(g => g.coordinates.some(c => c.x === x && c.y === y));
        if (itemsInCell.length > 0) {
            setModal({ show: true, x, y, items: itemsInCell });
            
            const initialInputs = {};
            itemsInCell.forEach(it => {
                initialInputs[it.assetId + '_' + it.itemName] = it.quantity;
            });
            setModalInputValues(initialInputs);
        }
    };

    const handleAssignmentMapClick = (x, y) => {
        setPendingAssignments(prev => {
            const existingIndex = prev.findIndex(p => p.x === x && p.y === y);
            if (existingIndex >= 0) {
                // remove if already selected
                return prev.filter(p => p.x !== x || p.y !== y);
            }
            return [...prev, { x, y }];
        });
    };

    const handleConfirmAssignments = async () => {
        if (!selectedItem || pendingAssignments.length === 0) return;
        
        if (globalQuantity <= 0) {
            showToast('Tổng số lượng phân bổ phải lớn hơn 0', true);
            return;
        }
        if (globalQuantity > selectedItem.unassignedQuantity) {
            showToast('Tổng số lượng phân bổ vượt quá số lượng hàng chờ xếp', true);
            return;
        }

        setActionLoading(true);
        try {
            // Phân bổ gộp (Batch Auto-distribution)
            const payload = {
                coordinates: pendingAssignments.map(p => ({ x: p.x, y: p.y })),
                assetId: selectedItem.assetId,
                itemName: selectedItem.itemName,
                renterId: selectedItem.renterId,
                quantity: globalQuantity
            };

            await axiosClient.post(`/warehouses/${warehouseId}/grid-locations/assign`, payload);
            
            showToast('Đã phân bổ hàng lên các ô lưới');
            setShowAssignmentModal(false);
            setSelectedItem(null);
            setPendingAssignments([]);
            setGlobalQuantity(1);
            fetchData();
        } catch (err) {
            showToast('Lỗi khi phân bổ hàng', true);
        } finally {
            setActionLoading(false);
        }
    };

    const handleModalInputChange = (assetId, itemName, val) => {
        const key = assetId + '_' + itemName;
        setModalInputValues(prev => ({ ...prev, [key]: Number(val) }));
    };

    const handleRemoveOrUnassign = async (item, actionType) => {
        if (!item) return;
        const key = item.assetId + '_' + item.itemName;
        const qty = modalInputValues[key];

        if (!qty || qty <= 0 || qty > item.quantity) {
            showToast('Số lượng không hợp lệ', true);
            return;
        }

        setActionLoading(true);
        try {
            await axiosClient.post(`/warehouses/${warehouseId}/grid-locations/remove`, {
                id: item.id,
                quantityToRemove: qty
            });
            showToast(actionType === 'REMOVE' ? 'Đã loại bỏ hàng thừa' : 'Đã gỡ hàng khỏi lưới');
            
            setModal({ show: false, x:0, y:0, items:[] });
            fetchData();
        } catch (err) {
            showToast('Lỗi thao tác', true);
        } finally {
            setActionLoading(false);
        }
    };

    // Auto-calculate pending assignment distribution for display - no longer dividing!
    const distributedAssignments = useMemo(() => {
        if (!pendingAssignments || pendingAssignments.length === 0) return [];
        return pendingAssignments.map(p => ({
            ...p,
            quantity: globalQuantity // We don't divide anymore, but we need InteractiveGridMap to know it's pending.
        }));
    }, [pendingAssignments, globalQuantity]);

    if (loading && !warehouse) {
        return <div style={{ padding: 40, textAlign: 'center' }}>Đang tải bản đồ...</div>;
    }

    if (warehouses.length === 0) {
        return <div style={{ padding: 40, textAlign: 'center' }}>Bạn không có quyền truy cập kho nào</div>;
    }

    const rentersFromGrid = gridLocations.filter(g => g?.renterName).map(g => g.renterName);
    const rentersFromInventory = inventoryStatus.filter(s => s?.renterName).map(s => s.renterName);
    const allRenters = Array.from(new Set([...rentersFromGrid, ...rentersFromInventory]));

    const filteredGridLocations = renterFilter 
        ? gridLocations.filter(g => g.renterName === renterFilter)
        : gridLocations;

    const unassignedItems = inventoryStatus.filter(s => s.unassignedQuantity > 0);
    const excessWarnings = inventoryStatus.filter(s => s.excessQuantity > 0);

    return (
        <div style={{ maxWidth: 1600, margin: '0 auto', fontFamily: 'Inter,sans-serif' }}>
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', margin: '0 0 4px' }}>Xếp hàng</h1>
                    <p style={{ color: '#64748b', fontSize: '0.87rem', margin: 0 }}>
                        Xem vị trí hàng hóa và quản lý các ô lưu trữ. Chọn hàng từ danh sách bên phải để bật Modal phân bổ.
                    </p>
                </div>
            </div>

            {toast && (
                <div style={{ padding: '12px 20px', borderRadius: 8, background: toast.err ? '#fee2e2' : '#dcfce7', color: toast.err ? '#dc2626' : '#16a34a', marginBottom: 16, border: `1px solid ${toast.err ? '#fecaca' : '#bbf7d0'}` }}>
                    {toast.msg}
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
                {warehouses.length > 1 ? (
                    <div>
                        <select value={warehouseId ?? ''} onChange={e => setWarehouseId(Number(e.target.value))}
                            style={{ padding: '8px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: '0.87rem', fontFamily: 'Inter,sans-serif', background: '#f8fafc', cursor: 'pointer', outline: 'none' }}>
                            {warehouses.map(w => <option key={w.warehouseId} value={w.warehouseId}>{w.warehouseName}</option>)}
                        </select>
                    </div>
                ) : (
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>
                        Kho: {warehouse ? warehouse.name : warehouses[0]?.warehouseName || 'Không xác định'}
                    </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Lọc theo khách thuê:</span>
                    <select 
                        value={renterFilter} 
                        onChange={e => setRenterFilter(e.target.value)}
                        style={{ padding: '8px', borderRadius: 8, border: '1px solid #cbd5e1', outline: 'none' }}
                        disabled={!warehouse}
                    >
                        <option value="">Tất cả</option>
                        {allRenters.map(r => (
                            <option key={r} value={r}>{r}</option>
                        ))}
                    </select>
                </div>
            </div>

            {!warehouse ? (
                <div style={{ padding: 60, textAlign: 'center', background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', color: '#64748b' }}>
                    Không tìm thấy thông tin kho. Có thể kho này đã bị xóa hoặc bạn không còn quyền truy cập.
                </div>
            ) : (
                <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                    {/* Main Map Area */}
                    <div style={{ flex: 4, background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 20, minHeight: 750, overflow: 'auto' }}>
                        <InteractiveGridMap 
                            boundaryPoints={warehouse.boundaryPoints}
                            gatePosition={warehouse.gatePosition}
                            totalArea={warehouse.totalArea}
                            gridLocations={filteredGridLocations}
                            onCellClick={handleMainMapClick}
                            selectedItem={null}
                            outboundWarnings={excessWarnings}
                            pendingAssignments={[]}
                        />
                    </div>

                    {/* Right Panel (Item List only) */}
                    <div style={{ width: 280, minWidth: 280, background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 20, maxHeight: 800, overflowY: 'auto' }}>
                        <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', color: '#0f172a' }}>Hàng chờ sắp xếp</h3>
                        
                        {excessWarnings.length > 0 && (
                            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                                <div style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.85rem', marginBottom: 4 }}>⚠️ Hàng thừa trên bản đồ</div>
                                <div style={{ fontSize: '0.8rem', color: '#991b1b' }}>Có {excessWarnings.length} mặt hàng đang hiển thị trên bản đồ nhưng thực tế đã xuất kho. Hãy click vào ô lưới tương ứng để loại bỏ.</div>
                            </div>
                        )}

                        {unassignedItems.length === 0 ? (
                            <div style={{ color: '#64748b', fontSize: '0.9rem', fontStyle: 'italic', textAlign: 'center', padding: 20 }}>
                                Tất cả hàng hóa đã được phân bổ lên lưới.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {unassignedItems.map((item, idx) => (
                                    <div key={idx} 
                                            onClick={() => { 
                                                setSelectedItem(item); 
                                                setPendingAssignments([]); 
                                                setGlobalQuantity(item.unassignedQuantity); // default to max
                                                setShowAssignmentModal(true);
                                            }}
                                            style={{ 
                                            padding: '10px 12px', borderRadius: 8, 
                                            border: `1.5px solid #e2e8f0`,
                                            background: '#f8fafc',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.borderColor = '#3b82f6'}
                                            onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                                        >
                                        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.85rem' }}>{item.itemName}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>
                                            Chờ xếp: <strong style={{ color: '#3b82f6' }}>{item.unassignedQuantity}</strong> {item.unit}
                                        </div>
                                        {item.renterName && (
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>Khách thuê: {item.renterName}</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* FULLSCREEN ASSIGNMENT MODAL */}
            {showAssignmentModal && selectedItem && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <div style={{ background: '#fff', width: '100%', maxWidth: 1400, height: '90vh', borderRadius: 20, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                        {/* Modal Header */}
                        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#0f172a' }}>Phân bổ vị trí: {selectedItem.itemName}</h2>
                                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>* Lưu ý: Mỗi ô lưới có kích thước thực tế là 50cm x 50cm.</p>
                            </div>
                            <button onClick={() => setShowAssignmentModal(false)} style={{ border: 'none', background: '#e2e8f0', color: '#475569', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold' }}>✕</button>
                        </div>
                        
                        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                            {/* Left Side: Map */}
                            <div style={{ flex: 3, padding: 20, overflow: 'auto', borderRight: '1px solid #e2e8f0', background: '#fff' }}>
                                <InteractiveGridMap 
                                    boundaryPoints={warehouse.boundaryPoints}
                                    gatePosition={warehouse.gatePosition}
                                    totalArea={warehouse.totalArea}
                                    gridLocations={filteredGridLocations.filter(g => !selectedItem?.renterName || g.renterName === selectedItem.renterName)}
                                    onCellClick={handleAssignmentMapClick}
                                    selectedItem={selectedItem}
                                    outboundWarnings={excessWarnings}
                                    pendingAssignments={distributedAssignments}
                                />
                            </div>
                            
                            {/* Right Side: Assignment Form */}
                            <div style={{ width: 320, padding: 24, overflowY: 'auto', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ padding: 16, background: '#eff6ff', borderRadius: 12, marginBottom: 20, border: '1px solid #bfdbfe' }}>
                                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e3a8a', marginBottom: 6 }}>
                                        Mặt hàng: {selectedItem.itemName}
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: '#2563eb' }}>
                                        Cần phân bổ: <strong>{selectedItem.unassignedQuantity}</strong> {selectedItem.unit}
                                    </div>
                                </div>

                                <div style={{ marginBottom: 20 }}>
                                    <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', marginBottom: 8 }}>
                                        Tổng số lượng cần gán:
                                    </label>
                                    <input 
                                        type="number" 
                                        min={1} 
                                        max={selectedItem.unassignedQuantity}
                                        value={globalQuantity} 
                                        onChange={(e) => setGlobalQuantity(parseInt(e.target.value) || 0)}
                                        style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', outline: 'none', fontSize: '1rem', fontWeight: 600, boxSizing: 'border-box' }}
                                    />
                                    {globalQuantity > selectedItem.unassignedQuantity && (
                                        <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: 4 }}>Vượt quá số lượng cho phép</div>
                                    )}
                                </div>

                                <div style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 12, color: '#0f172a', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>Các ô đã chọn:</span>
                                    <span style={{ color: '#3b82f6', background: '#dbeafe', padding: '2px 8px', borderRadius: 12, fontSize: '0.8rem' }}>{pendingAssignments.length} ô</span>
                                </div>

                                {pendingAssignments.length === 0 ? (
                                    <div style={{ color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic', padding: 30, textAlign: 'center', background: '#fff', borderRadius: 12, border: '1px dashed #cbd5e1' }}>
                                        Chưa chọn ô nào.<br/>Vui lòng click vào bản đồ bên trái.
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                                        {pendingAssignments.map((p, idx) => (
                                            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', padding: '10px 16px', borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#334155' }}>
                                                    Ô [{p.x}, {p.y}]
                                                </div>
                                                <button 
                                                    onClick={() => setPendingAssignments(prev => prev.filter((_, i) => i !== idx))}
                                                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4, fontSize: '1.1rem', display: 'flex', alignItems: 'center' }}
                                                    title="Xóa ô này"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div style={{ marginTop: 24, paddingTop: 20, borderTop: '2px solid #e2e8f0' }}>
                                    <button 
                                        onClick={handleConfirmAssignments}
                                        disabled={pendingAssignments.length === 0 || globalQuantity <= 0 || globalQuantity > selectedItem.unassignedQuantity || actionLoading}
                                        style={{ 
                                            width: '100%', padding: '16px', background: (pendingAssignments.length === 0 || globalQuantity <= 0 || globalQuantity > selectedItem.unassignedQuantity) ? '#94a3b8' : '#3b82f6', 
                                            color: '#fff', border: 'none', borderRadius: 12, fontSize: '1.05rem', fontWeight: 700, cursor: (pendingAssignments.length === 0 || globalQuantity <= 0 || globalQuantity > selectedItem.unassignedQuantity) ? 'not-allowed' : 'pointer',
                                            transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)'
                                        }}>
                                        {actionLoading ? 'Đang xử lý...' : 'Xác nhận phân bổ'}
                                    </button>
                                    {pendingAssignments.length > 0 && (
                                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 12, textAlign: 'center' }}>
                                            Hàng hóa sẽ chiếm dụng {pendingAssignments.length} ô trên bản đồ.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Cell Actions Modal (Unassign/Remove) */}
            {modal.show && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
                    <div style={{ background: '#fff', width: 450, borderRadius: 16, padding: 24, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>Ô lưới: [{modal.x}, {modal.y}]</h3>
                            <button onClick={() => setModal({ show: false, x:0, y:0, items:[] })} style={{ border: 'none', background: '#f1f5f9', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontSize: '1rem', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                        </div>

                        <div style={{ fontWeight: 600, marginBottom: 12, color: '#334155' }}>Hàng hóa đang có tại ô này:</div>
                        
                        {modal.items.length === 0 ? (
                            <div style={{ color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic', textAlign: 'center', padding: 20, background: '#f8fafc', borderRadius: 8 }}>Ô trống</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {modal.items.map((item, idx) => {
                                    const excessStatus = excessWarnings.find(e => (e.assetId === item.assetId && e.itemName === item.itemName));
                                    const isExcess = excessStatus && excessStatus.excessQuantity > 0;
                                    const inputKey = item.assetId + '_' + item.itemName;
                                    const currentInputVal = modalInputValues[inputKey] || 0;

                                    return (
                                        <div key={idx} style={{ border: `1px solid ${isExcess ? '#fecaca' : '#e2e8f0'}`, background: isExcess ? '#fef2f2' : '#fff', padding: 16, borderRadius: 12, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: isExcess ? '#dc2626' : '#1e293b' }}>
                                                        {item.itemName} {isExcess && <span style={{fontSize: '0.75rem', background: '#fee2e2', color: '#ef4444', padding: '2px 6px', borderRadius: 4, marginLeft: 6}}>Thừa</span>}
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>Tổng SL trong ô: <strong>{item.quantity}</strong></div>
                                                </div>
                                            </div>
                                            
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: isExcess ? '#fee2e2' : '#f8fafc', padding: '10px 12px', borderRadius: 8 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                                                    <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 500 }}>Chọn SL:</span>
                                                    <input 
                                                        type="number" 
                                                        min={1} 
                                                        max={item.quantity}
                                                        value={currentInputVal}
                                                        onChange={e => handleModalInputChange(item.assetId, item.itemName, e.target.value)}
                                                        style={{ width: 60, padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', outline: 'none', textAlign: 'center', fontWeight: 600 }}
                                                    />
                                                </div>
                                                
                                                {isExcess ? (
                                                    <button onClick={() => handleRemoveOrUnassign(item, 'REMOVE')} disabled={actionLoading || currentInputVal < 1 || currentInputVal > item.quantity}
                                                        style={{ padding: '8px 12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600, opacity: (actionLoading || currentInputVal < 1 || currentInputVal > item.quantity) ? 0.6 : 1 }}>
                                                        Loại bỏ
                                                    </button>
                                                ) : (
                                                    <button onClick={() => handleRemoveOrUnassign(item, 'UNASSIGN')} disabled={actionLoading || currentInputVal < 1 || currentInputVal > item.quantity}
                                                        style={{ padding: '8px 12px', background: '#fff', color: '#3b82f6', border: '1.5px solid #3b82f6', borderRadius: 6, fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600, opacity: (actionLoading || currentInputVal < 1 || currentInputVal > item.quantity) ? 0.6 : 1 }}>
                                                        Gỡ ra List
                                                    </button>
                                                )}
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
