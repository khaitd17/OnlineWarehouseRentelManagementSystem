import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import equipmentService from '../services/equipmentService';
import { getMyWarehouses } from '../services/warehouseService';

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
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentEquipment, setCurrentEquipment] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    location: '',
    description: '',
    specifications: '',
    iotDeviceId: ''
  });

  useEffect(() => {
    getMyWarehouses().then(data => {
      setWarehouses(data || []);
      if (!warehouseIdParam && data?.length > 0) {
        setSelectedWarehouseId(String(data[0].warehouseId));
      }
    }).catch(err => console.error('Failed to fetch warehouses', err));
  }, [warehouseIdParam]);

  const fetchEquipments = useCallback(async () => {
    if (!selectedWarehouseId) return;
    setLoading(true);
    try {
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
      await equipmentService.addEquipment({ ...formData, warehouseId: parseInt(selectedWarehouseId) });
      setShowAddModal(false);
      setFormData({ name: '', type: '', location: '', description: '', specifications: '', iotDeviceId: '' });
      fetchEquipments();
    } catch (err) {
      alert('Thêm thiết bị thất bại: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await equipmentService.updateEquipment(currentEquipment.equipmentId, formData);
      setShowEditModal(false);
      fetchEquipments();
    } catch (err) {
      alert('Cập nhật thất bại: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleStatusUpdate = async (id, currentStatus) => {
    const nextStatus = {
      'ACTIVE': 'MAINTENANCE',
      'MAINTENANCE': 'BROKEN',
      'BROKEN': 'INACTIVE',
      'INACTIVE': 'ACTIVE'
    }[currentStatus] || 'ACTIVE';

    try {
      await equipmentService.updateStatus(id, nextStatus);
      fetchEquipments();
    } catch (err) {
      alert('Cập nhật trạng thái thất bại');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa thiết bị này?')) return;
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

  const filteredEquipments = equipments.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (e.type && e.type.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'ALL' || e.type === filterType;
    return matchesSearch && matchesType;
  });

  const equipmentTypes = [...new Set(equipments.map(e => e.type).filter(Boolean))];

  return (
    <div style={{ padding: '24px', backgroundColor: COLORS.bg, minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: COLORS.text, margin: 0 }}>Quản lý thiết bị</h1>
          <p style={{ color: COLORS.textLight, fontSize: '14px', marginTop: '4px' }}>
            Theo dõi và điều khiển các thiết bị trong kho của bạn
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
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
            placeholder="Tìm kiếm theo tên hoặc loại thiết bị..." 
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
          <option value="ALL">Tất cả loại</option>
          {equipmentTypes.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
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
                    <span style={{ fontSize: '12px', color: COLORS.textLight }}>{device.type || 'Thiết bị'}</span>
                  </div>
                </div>
                <div 
                  onClick={() => handleStatusUpdate(device.equipmentId, device.status)}
                  style={{ 
                    cursor: 'pointer', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                    backgroundColor: getStatusColor(device.status).bg, color: getStatusColor(device.status).text
                  }}
                >
                  {device.status}
                </div>
              </div>

              {/* Device Info */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: COLORS.textLight, marginBottom: '6px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>location_on</span>
                  {device.location || 'Chưa xác định'}
                </div>
                {device.description && (
                  <p style={{ fontSize: '13px', color: COLORS.textLight, margin: '8px 0', lineHeight: 1.5 }}>
                    {device.description}
                  </p>
                )}
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
                    onClick={() => {
                      setCurrentEquipment(device);
                      setFormData({
                        name: device.name,
                        type: device.type || '',
                        location: device.location || '',
                        description: device.description || '',
                        specifications: device.specifications || '',
                        iotDeviceId: device.iotDeviceId || ''
                      });
                      setShowEditModal(true);
                    }}
                    style={{ background: 'none', border: 'none', color: COLORS.primary, cursor: 'pointer', padding: '4px' }}
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
            backgroundColor: '#fff', borderRadius: '24px', width: '100%', maxWidth: '600px',
            padding: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
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
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: COLORS.textLight, marginBottom: '6px' }}>LOẠI THIẾT BỊ</label>
                <input type="text" list="type-list" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} placeholder="Vd: Camera, Forklift..." style={inputStyle} />
                <datalist id="type-list">
                  <option value="Camera" />
                  <option value="Forklift" />
                  <option value="Sensor" />
                  <option value="Gate" />
                  <option value="Lighting" />
                </datalist>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: COLORS.textLight, marginBottom: '6px' }}>VỊ TRÍ</label>
                <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="Vd: Khu A, Cổng chính..." style={inputStyle} />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: COLORS.textLight, marginBottom: '6px' }}>IOT DEVICE ID (Nếu có)</label>
                <input type="text" value={formData.iotDeviceId} onChange={e => setFormData({...formData, iotDeviceId: e.target.value})} placeholder="Nhập ID định danh của thiết bị thông minh" style={inputStyle} />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: COLORS.textLight, marginBottom: '6px' }}>MÔ TẢ NGẮN / GHI CHÚ</label>
                <textarea rows="2" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={inputStyle} />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: COLORS.textLight, marginBottom: '6px' }}>CẤU HÌNH CHI TIẾT (JSON / Text)</label>
                <textarea rows="3" value={formData.specifications} onChange={e => setFormData({...formData, specifications: e.target.value})} placeholder="Vd: { 'resolution': '4K', 'zoom': '10x' }" style={inputStyle} />
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
    </div>
  );
};

const inputStyle = {
  width: '100%', padding: '12px', borderRadius: '12px', border: `1px solid ${COLORS.border}`, outline: 'none', fontSize: '14px'
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
  switch (status) {
    case 'ACTIVE': return { bg: '#ecfdf5', text: '#10b981' };
    case 'INACTIVE': return { bg: '#f1f5f9', text: '#64748b' };
    case 'MAINTENANCE': return { bg: '#fffbeb', text: '#d97706' };
    case 'BROKEN': return { bg: '#fef2f2', text: '#ef4444' };
    default: return { bg: '#f1f5f9', text: '#64748b' };
  }
};

const getControlActions = (type) => {
  const t = (type || '').toLowerCase();
  if (t.includes('camera')) return [
    { label: 'Chụp ảnh', cmd: 'CAPTURE', icon: 'photo_camera' },
    { label: 'Xây động', cmd: 'ROTATE', icon: 'sync' }
  ];
  if (t.includes('gate')) return [
    { label: 'Mở khóa', cmd: 'UNLOCK', icon: 'lock_open' },
    { label: 'Khóa', cmd: 'LOCK', icon: 'lock' }
  ];
  if (t.includes('light')) return [
    { label: 'Bật', cmd: 'ON', icon: 'power' },
    { label: 'Tắt', cmd: 'OFF', icon: 'power_off' }
  ];
  return [
    { label: 'Reset', cmd: 'RESET', icon: 'restart_alt' },
    { label: 'Test', cmd: 'PING', icon: 'network_check' }
  ];
};

export default EquipmentManagement;
