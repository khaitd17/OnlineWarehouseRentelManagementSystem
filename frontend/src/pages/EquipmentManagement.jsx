import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import equipmentService from '../services/equipmentService';
import { getMyWarehouses } from '../services/warehouseService';
import axiosClient from '../services/axiosClient';

const COLORS = {
  primary: '#00b2d6',
  secondary: '#6366f1',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  bg: '#f8fafc',
  surface: '#ffffff',
  text: '#1e293b',
  textLight: '#64748b',
  border: '#e2e8f0',
};

const EquipmentManagement = () => {
  const [searchParams] = useSearchParams();
  const warehouseIdParam = searchParams.get('warehouseId');

  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(warehouseIdParam || '');
  const [rentalAreas, setRentalAreas] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  
  const [currentEquipment, setCurrentEquipment] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    serialNumber: '',
    location: '',
    rentalAreaId: '',
    description: '',
    specifications: '',
    note: '',
    maintenanceCycleDays: '',
    iotDeviceId: ''
  });

  const [statusData, setStatusData] = useState({
    status: 'AVAILABLE',
    note: ''
  });

  useEffect(() => {
    getMyWarehouses().then(data => {
      setWarehouses(data || []);
      if (!warehouseIdParam && data?.length > 0) {
        setSelectedWarehouseId(String(data[0].warehouseId));
      }
    }).catch(err => console.error('Failed to fetch warehouses', err));
  }, [warehouseIdParam]);

  useEffect(() => {
    if (!selectedWarehouseId) return;
    // Fetch rental areas for the selected warehouse
    axiosClient.get(`/RentalAreas/warehouse/${selectedWarehouseId}`)
      .then(res => {
        setRentalAreas(res.data || []);
      })
      .catch(err => console.error('Failed to fetch rental areas', err));
  }, [selectedWarehouseId]);

  const fetchEquipments = useCallback(async () => {
    if (!selectedWarehouseId) return;
    setLoading(true);
    try {
      // Sync trạng thái thiết bị chung theo hợp đồng active trước
      await axiosClient.post(`/Equipments/sync-shared/${selectedWarehouseId}`).catch(() => {});
      const data = await equipmentService.getEquipmentsByWarehouse(selectedWarehouseId);
      setEquipments(data);
    } catch (err) {
      console.error('Failed to fetch equipments', err);
    } finally {
      setLoading(false);
    }
  }, [selectedWarehouseId]);

  useEffect(() => {
    fetchEquipments();
  }, [fetchEquipments]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { 
        ...formData, 
        warehouseId: parseInt(selectedWarehouseId),
        rentalAreaId: formData.rentalAreaId ? parseInt(formData.rentalAreaId) : null,
        maintenanceCycleDays: formData.maintenanceCycleDays ? parseInt(formData.maintenanceCycleDays) : null
      };
      await equipmentService.addEquipment(payload);
      setShowAddModal(false);
      resetFormData();
      fetchEquipments();
    } catch (err) {
      alert('Thêm thiết bị thất bại: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { 
        ...formData, 
        rentalAreaId: formData.rentalAreaId ? parseInt(formData.rentalAreaId) : null,
        maintenanceCycleDays: formData.maintenanceCycleDays ? parseInt(formData.maintenanceCycleDays) : null
      };
      await equipmentService.updateEquipment(currentEquipment.equipmentId, payload);
      setShowEditModal(false);
      fetchEquipments();
    } catch (err) {
      alert('Cập nhật thất bại: ' + (err.response?.data?.message || err.message));
    }
  };

  const submitStatusUpdate = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.patch(`/Equipments/${currentEquipment.equipmentId}/status`, { 
        equipmentId: currentEquipment.equipmentId, 
        status: statusData.status,
        note: statusData.note
      });
      setShowStatusModal(false);
      fetchEquipments();
    } catch (err) {
      alert('Cập nhật trạng thái thất bại: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa thiết bị này? Không thể xóa nếu thiết bị đang IN_USE hoặc có lịch sử hoạt động quan trọng.')) return;
    try {
      await equipmentService.deleteEquipment(id);
      fetchEquipments();
    } catch (err) {
      alert('Xóa thất bại: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleControl = async (id, command) => {
    try {
      const res = await equipmentService.controlEquipment(id, command);
      alert(res.message);
    } catch (err) {
      alert('Điều khiển thất bại: ' + (err.response?.data?.message || err.message));
    }
  };

  const resetFormData = () => {
    setFormData({ 
      name: '', type: '', serialNumber: '', location: '', rentalAreaId: '', 
      description: '', specifications: '', note: '', maintenanceCycleDays: '', iotDeviceId: '' 
    });
  };

  const filteredEquipments = equipments.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (e.type && e.type.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (e.serialNumber && e.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'ALL' || e.type === filterType;
    return matchesSearch && matchesType;
  });

  const equipmentTypes = [...new Set(equipments.map(e => e.type).filter(Boolean))];

  return (
    <div style={{ padding: '24px', backgroundColor: COLORS.bg, minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: COLORS.text, margin: 0 }}>Quản lý thiết bị vòng đời</h1>
          <p style={{ color: COLORS.textLight, fontSize: '14px', marginTop: '4px' }}>
            Theo dõi phân bổ, bảo trì và trạng thái hoạt động của thiết bị
          </p>
        </div>
        <button 
          onClick={() => { resetFormData(); setShowAddModal(true); }}
          style={{ 
            backgroundColor: COLORS.primary, color: '#fff', border: 'none', 
            padding: '10px 20px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,178,214,0.3)'
          }}
        >
          <span className="material-symbols-outlined">add</span>
          Thêm thiết bị
        </button>
      </div>

      {/* Controls Bar */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '10px', color: COLORS.textLight }}>search</span>
          <input 
            type="text" 
            placeholder="Tìm theo tên, loại hoặc Serial Number..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%', padding: '10px 10px 10px 40px', borderRadius: '10px', border: `1px solid ${COLORS.border}`,
              outline: 'none', fontSize: '14px'
            }}
          />
        </div>
        
        <select 
          value={selectedWarehouseId}
          onChange={(e) => setSelectedWarehouseId(e.target.value)}
          style={{ padding: '10px 16px', borderRadius: '10px', border: `1px solid ${COLORS.border}`, outline: 'none', background: '#fff' }}
        >
          {warehouses.map(w => (
            <option key={w.warehouseId} value={w.warehouseId}>{w.name}</option>
          ))}
        </select>

        <select 
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{ padding: '10px 16px', borderRadius: '10px', border: `1px solid ${COLORS.border}`, outline: 'none', background: '#fff' }}
        >
          <option value="ALL">Tất cả danh mục</option>
          {equipmentTypes.map(t => {
            const labelMap = { 'Camera': 'Camera giám sát', 'Forklift': 'Xe nâng', 'Sensor': 'Cảm biến', 'Gate': 'Cổng & Cửa cuốn', 'Lighting': 'Đèn chiếu sáng', 'HVAC': 'Điều hòa (HVAC)', 'FireAlarm': 'Báo cháy', 'Other': 'Khác' };
            return <option key={t} value={t}>{labelMap[t] || t}</option>;
          })}
        </select>
      </div>

      {/* Equipment Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: COLORS.textLight }}>Đang tải thiết bị...</div>
      ) : filteredEquipments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '100px', backgroundColor: '#fff', borderRadius: '20px', border: `1px dashed ${COLORS.border}` }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: COLORS.border }}>inventory_2</span>
          <p style={{ marginTop: '16px', color: COLORS.textLight }}>Không tìm thấy thiết bị nào</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
          {filteredEquipments.map(device => (
            <div key={device.equipmentId} style={{ 
              backgroundColor: COLORS.surface, borderRadius: '20px', padding: '24px', border: `1px solid ${COLORS.border}`,
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)', transition: 'transform 0.2s', position: 'relative'
            }}>
              {/* Device Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ 
                    width: '48px', height: '48px', borderRadius: '14px', backgroundColor: `${COLORS.primary}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.primary
                  }}>
                    <span className="material-symbols-outlined">
                      {getIconForType(device.type)}
                    </span>
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>{device.name}</h3>
                    <div style={{ fontSize: '12px', color: COLORS.textLight, marginTop: '2px' }}>
                      SN: {device.serialNumber ? <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{device.serialNumber}</span> : '---'}
                    </div>
                  </div>
                </div>
                <div 
                  onClick={() => {
                    setCurrentEquipment(device);
                    setStatusData({ status: device.status || 'AVAILABLE', note: '' });
                    setShowStatusModal(true);
                  }}
                  style={{ 
                    cursor: 'pointer', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                    backgroundColor: getStatusColor(device.status).bg, color: getStatusColor(device.status).text,
                    border: `1px solid ${getStatusColor(device.status).text}40`
                  }}
                  title="Nhấn để cập nhật trạng thái"
                >
                  {getStatusTextVI(device.status)} <span className="material-symbols-outlined" style={{ fontSize: '12px', verticalAlign: 'middle' }}>edit</span>
                </div>
              </div>

              {/* Device Details */}
              <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
                <div style={detailRowStyle}>
                  <span style={detailLabelStyle}>Vị trí:</span>
                  <span style={detailValueStyle} title={device.rentalAreaName}>{device.location || device.rentalAreaName || 'Chung (Toàn kho)'}</span>
                </div>
                <div style={detailRowStyle}>
                  <span style={detailLabelStyle}>Lịch bảo trì:</span>
                  <span style={detailValueStyle}>
                     {device.maintenanceCycleDays ? `${device.maintenanceCycleDays} ngày/lần` : 'Không định kỳ'}
                  </span>
                </div>
                {device.nextMaintenanceDate && (
                  <div style={detailRowStyle}>
                    <span style={detailLabelStyle}>Bảo trì tới:</span>
                    <span style={{...detailValueStyle, color: isDatePast(device.nextMaintenanceDate) ? COLORS.danger : COLORS.warning, fontWeight: 700}}>
                      {device.nextMaintenanceDate}
                    </span>
                  </div>
                )}
                <div style={detailRowStyle}>
                  <span style={detailLabelStyle}>Ghi chú:</span>
                  <span style={{...detailValueStyle, fontStyle: 'italic'}}>{device.note || 'Không có'}</span>
                </div>
              </div>

              {/* Remote Control Actions */}
              {device.iotDeviceId && (
                <div style={{ 
                  backgroundColor: '#f1f5f9', borderRadius: '12px', padding: '12px', marginBottom: '20px',
                  display: 'flex', gap: '8px', flexWrap: 'wrap'
                }}>
                  <div style={{ width: '100%', fontSize: '11px', fontWeight: 700, color: COLORS.textLight, marginBottom: '4px', textTransform: 'uppercase' }}>
                    Điều khiển từ xa (ID: {device.iotDeviceId})
                  </div>
                  {getControlActions(device.type).map(action => (
                    <button 
                      key={action.cmd}
                      onClick={() => handleControl(device.equipmentId, action.cmd)}
                      style={{ 
                        flex: 1, padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1',
                        backgroundColor: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{action.icon}</span>
                      {action.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Card Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: `1px solid ${COLORS.border}` }}>
                <div style={{ fontSize: '11px', color: COLORS.textLight }}>
                  Cập nhật: {device.lastUpdated ? new Date(device.lastUpdated).toLocaleString() : '---'}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    disabled={device.status === 'IN_USE'}
                    onClick={() => {
                      if (device.status === 'IN_USE') {
                        alert("Không thể sửa thiết bị đang IN_USE");
                        return;
                      }
                      setCurrentEquipment(device);
                      setFormData({
                        name: device.name,
                        type: device.type || '',
                        serialNumber: device.serialNumber || '',
                        location: device.location || '',
                        rentalAreaId: device.rentalAreaId || '',
                        description: device.description || '',
                        specifications: device.specifications || '',
                        note: device.note || '',
                        maintenanceCycleDays: device.maintenanceCycleDays || '',
                        iotDeviceId: device.iotDeviceId || ''
                      });
                      setShowEditModal(true);
                    }}
                    title={device.status === 'IN_USE' ? "Thiết bị đang cho thuê, không thể sửa" : "Sửa thông tin"}
                    style={{ background: 'none', border: 'none', color: device.status === 'IN_USE' ? '#ccc' : COLORS.primary, cursor: device.status === 'IN_USE' ? 'not-allowed' : 'pointer', padding: '4px' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>edit</span>
                  </button>
                  <button 
                    onClick={() => handleDelete(device.equipmentId)}
                    style={{ background: 'none', border: 'none', color: COLORS.danger, cursor: 'pointer', padding: '4px' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal - Add/Edit */}
      {(showAddModal || showEditModal) && (
        <div style={{ 
          position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{ 
            backgroundColor: '#fff', borderRadius: '24px', width: '100%', maxWidth: '750px',
            maxHeight: '90vh', overflowY: 'auto', padding: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>{showAddModal ? 'Thêm thiết bị mới' : 'Chỉnh sửa thiết bị'}</h2>
              <button 
                onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.textLight }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={showAddModal ? handleAddSubmit : handleEditSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: COLORS.textLight, marginBottom: '6px' }}>TÊN THIẾT BỊ *</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Vd: Xe nâng #01, Camera 4K..." style={inputStyle} />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: COLORS.textLight, marginBottom: '6px' }}>DANH MỤC THIẾT BỊ</label>
                <select required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} style={inputStyle}>
                  <option value="" disabled>-- Chọn danh mục thiết bị --</option>
                  <option value="Camera">Camera giám sát</option>
                  <option value="Forklift">Xe nâng (Forklift)</option>
                  <option value="Sensor">Cảm biến mạng IoT</option>
                  <option value="Gate">Cổng & Cửa cuốn</option>
                  <option value="Lighting">Đèn chiếu sáng (Lighting)</option>
                  <option value="HVAC">Điều hòa / Thông gió (HVAC)</option>
                  <option value="FireAlarm">Hệ thống báo cháy</option>
                  <option value="Other">Loại thông thường khác</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: COLORS.textLight, marginBottom: '6px' }}>MÃ SERI (Serial Number)</label>
                <input type="text" value={formData.serialNumber} onChange={e => setFormData({...formData, serialNumber: e.target.value})} placeholder="Vd: SN-2023-XXXX" style={inputStyle} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: COLORS.textLight, marginBottom: '6px' }}>PHÂN BỔ CHO KHU VỰC</label>
                <select value={formData.rentalAreaId} onChange={e => setFormData({...formData, rentalAreaId: e.target.value})} style={inputStyle}>
                  <option value="">-- Dùng chung toàn kho --</option>
                  {rentalAreas.map(area => (
                    <option key={area.id} value={area.id}>{area.name} ({area.size} m2)</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: COLORS.textLight, marginBottom: '6px' }}>VỊ TRÍ CỤ THỂ</label>
                <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="Vd: Góc Tây Bắc, Cổng số 2..." style={inputStyle} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: COLORS.textLight, marginBottom: '6px' }}>CHU KỲ BẢO TRÌ (NGÀY)</label>
                <input type="number" min="1" value={formData.maintenanceCycleDays} onChange={e => setFormData({...formData, maintenanceCycleDays: e.target.value})} placeholder="Vd: 30, 90, 180" style={inputStyle} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: COLORS.textLight, marginBottom: '6px' }}>IOT DEVICE ID</label>
                <input type="text" value={formData.iotDeviceId} onChange={e => setFormData({...formData, iotDeviceId: e.target.value})} placeholder="Mã ID đồng bộ thiết bị IoT" style={inputStyle} />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: COLORS.textLight, marginBottom: '6px' }}>GHI CHÚ HIỆN TẠI</label>
                <textarea rows="2" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} placeholder="Tình trạng, lưu ý khi di chuyển..." style={inputStyle} />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: COLORS.textLight, marginBottom: '6px' }}>MÔ TẢ CHI TIẾT</label>
                <textarea rows="2" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={inputStyle} />
              </div>

              <div style={{ gridColumn: 'span 2', display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => { setShowAddModal(false); setShowEditModal(false); }} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: `1px solid ${COLORS.border}`, background: '#fff', fontWeight: 700, cursor: 'pointer' }}>Hủy</button>
                <button type="submit" style={{ flex: 2, padding: '14px', borderRadius: '12px', border: 'none', background: COLORS.primary, color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                  {showAddModal ? 'Tạo thiết bị' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Change Status */}
      {showStatusModal && currentEquipment && (
        <div style={{ 
          position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{ 
            backgroundColor: '#fff', borderRadius: '24px', width: '100%', maxWidth: '450px',
            padding: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 800 }}>Cập nhật trạng thái sự cố / bảo trì</h2>
            <div style={{ marginBottom: '16px', fontSize: '14px', color: COLORS.textLight }}>
              Thiết bị: <strong style={{color: COLORS.text}}>{currentEquipment.name}</strong> 
              <br/>
              Trạng thái Cũ: <strong style={{color: getStatusColor(currentEquipment.status).text}}>{getStatusTextVI(currentEquipment.status)}</strong>
            </div>

            <form onSubmit={submitStatusUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: COLORS.textLight, marginBottom: '6px' }}>CHỌN TRẠNG THÁI MỚI</label>
                <select value={statusData.status} onChange={e => setStatusData({...statusData, status: e.target.value})} style={inputStyle}>
                  <option value="AVAILABLE">AVAILABLE - Sẵn sàng hoạt động</option>
                  <option value="MAINTENANCE">MAINTENANCE - Đang bảo trì / Sửa chữa</option>
                  <option value="BROKEN">BROKEN - Gắn mác Hư hỏng cấp thiết</option>
                   <option value="RETIRED">RETIRED - Ngừng sử dụng vĩnh viễn</option>
                  {/* IN_USE is usually managed by Contract logic, but can be forced if needed */}
                  <option value="IN_USE">IN_USE - Đang được cho thuê (Force)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: COLORS.textLight, marginBottom: '6px' }}>LÝ DO / GHI CHÚ</label>
                <textarea required rows="3" value={statusData.note} onChange={e => setStatusData({...statusData, note: e.target.value})} placeholder="Ghi chú nguyên nhân chuyển trạng thái..." style={inputStyle} />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowStatusModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: `1px solid ${COLORS.border}`, background: '#fff', fontWeight: 700, cursor: 'pointer' }}>Hủy</button>
                <button type="submit" style={{ flex: 2, padding: '12px', borderRadius: '10px', border: 'none', background: COLORS.secondary, color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Cập nhật ngay</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const inputStyle = {
  width: '100%', padding: '12px', borderRadius: '12px', border: `1px solid ${COLORS.border}`, outline: 'none', fontSize: '14px'
};

const detailRowStyle = { display: 'flex', justifyContent: 'space-between', marginBottom: '6px' };
const detailLabelStyle = { fontSize: '12px', color: COLORS.textLight, fontWeight: 500 };
const detailValueStyle = { fontSize: '13px', fontWeight: 600, color: COLORS.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' };

const isDatePast = (dateStr) => {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
};

const getIconForType = (type) => {
  const t = (type || '').toLowerCase();
  if (t.includes('camera')) return 'videocam';
  if (t.includes('forklift') || t.includes('xe nâng')) return 'forklift';
  if (t.includes('sensor') || t.includes('cảm biến')) return 'sensors';
  if (t.includes('gate') || t.includes('cổng')) return 'door_front';
  if (t.includes('light') || t.includes('đèn')) return 'lightbulb';
  return 'settings_input_component';
};

const getStatusColor = (status) => {
  switch (status?.toUpperCase()) {
    case 'AVAILABLE': return { bg: '#ecfdf5', text: '#10b981' };
    case 'IN_USE': return { bg: '#e0e7ff', text: '#4f46e5' };
    case 'MAINTENANCE': return { bg: '#fffbeb', text: '#d97706' };
    case 'BROKEN': return { bg: '#fef2f2', text: '#ef4444' };
    case 'RETIRED': return { bg: '#f1f5f9', text: '#475569' };
    default: return { bg: '#f1f5f9', text: '#64748b' };
  }
};

const getStatusTextVI = (status) => {
  switch (status?.toUpperCase()) {
    case 'AVAILABLE': return 'SẴN SÀNG';
    case 'IN_USE': return 'ĐANG CHO THUÊ';
    case 'MAINTENANCE': return 'ĐANG BẢO TRÌ';
    case 'BROKEN': return 'HƯ HỎNG';
    case 'RETIRED': return 'NGỪNG DÙNG';
    default: return status || 'CHƯA RÕ';
  }
};

const getControlActions = (type) => {
  const t = (type || '').toLowerCase();
  if (t.includes('camera')) return [
    { label: 'Chụp ảnh', cmd: 'CAPTURE', icon: 'photo_camera' },
    { label: 'Xoay', cmd: 'ROTATE', icon: 'sync' }
  ];
  if (t.includes('gate')) return [
    { label: 'Mở', cmd: 'UNLOCK', icon: 'lock_open' },
    { label: 'Khóa', cmd: 'LOCK', icon: 'lock' }
  ];
  if (t.includes('light')) return [
    { label: 'Bật', cmd: 'ON', icon: 'power' },
    { label: 'Tắt', cmd: 'OFF', icon: 'power_off' }
  ];
  return [
    { label: 'Reset', cmd: 'RESET', icon: 'restart_alt' },
    { label: 'Ping', cmd: 'PING', icon: 'network_check' }
  ];
};

export default EquipmentManagement;
