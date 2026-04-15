import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import equipmentService from '../services/equipmentService';
import equipmentIncidentService from '../services/equipmentIncidentService';
import { getMyWarehouses } from '../services/warehouseService';
import axiosClient from '../services/axiosClient';
import authService from '../services/authService';

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
  const [currentUser] = useState(authService.getCurrentUser());
  const [userRole, setUserRole] = useState(null);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(warehouseIdParam || '');
  const [rentalAreas, setRentalAreas] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  useEffect(() => {
    if (!selectedWarehouseId || !currentUser) return;
    const ctx = authService.getWarehouseContext();
    const wh = (ctx.warehouses || []).find(w => String(w.warehouseId) === String(selectedWarehouseId));
    setUserRole(wh ? wh.role : (ctx.systemRole || currentUser.role || 'USER').toUpperCase());
  }, [selectedWarehouseId, currentUser]);

  const canManage = userRole === 'OWNER' || userRole === 'OPERATOR' || userRole === 'MANAGER' || userRole === 'ADMIN';
  const canReport = userRole === 'STAFF' || userRole === 'OPERATOR' || userRole === 'RENTER' || userRole === 'OWNER' || userRole === 'MANAGER' || userRole === 'ADMIN';

  const [activeTab, setActiveTab] = useState('EQUIPMENT'); // EQUIPMENT or INCIDENTS

  // Incident state
  const [incidents, setIncidents] = useState([]);
  const [incidentLoading, setIncidentLoading] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [reportData, setReportData] = useState({
    title: '',
    description: '',
    severity: 'MEDIUM',
    attachments: [],
    selectedFiles: [] // Temporary local files
  });

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
    // 1. Get warehouses from context (Staff/Manager/Operator/Renter)
    const ctx = authService.getWarehouseContext();
    const ctxWarehouses = (ctx?.warehouses || []).map(w => ({
      warehouseId: w.warehouseId,
      name: w.name,
      role: w.role
    }));

    // 2. Fetch owner's warehouses and merge
    getMyWarehouses().then(data => {
      const combined = [...(data || [])];
      ctxWarehouses.forEach(cw => {
        if (!combined.some(w => w.warehouseId === cw.warehouseId)) {
          combined.push(cw);
        }
      });
      setWarehouses(combined);
      if (!warehouseIdParam && combined.length > 0) {
        setSelectedWarehouseId(String(combined[0].warehouseId));
      } else if (warehouseIdParam) {
        setSelectedWarehouseId(warehouseIdParam);
      }
    }).catch(err => {
      console.error('Failed to fetch warehouses', err);
      // Fallback: at least show context-based warehouses
      if (ctxWarehouses.length > 0) {
        setWarehouses(ctxWarehouses);
        if (!warehouseIdParam) setSelectedWarehouseId(String(ctxWarehouses[0].warehouseId));
      }
    });
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
      await axiosClient.post(`/Equipments/sync-shared/${selectedWarehouseId}`).catch(() => { });
      const data = await equipmentService.getEquipmentsByWarehouse(selectedWarehouseId);
      setEquipments(data);
    } catch (err) {
      console.error('Failed to fetch equipments', err);
    } finally {
      setLoading(false);
    }
  }, [selectedWarehouseId]);

  const fetchIncidents = useCallback(async () => {
    if (!selectedWarehouseId) return;
    setIncidentLoading(true);
    try {
      const data = await equipmentIncidentService.getIncidentsByWarehouse(selectedWarehouseId);
      setIncidents(data);
    } catch (err) {
      console.error('Failed to fetch incidents', err);
    } finally {
      setIncidentLoading(false);
    }
  }, [selectedWarehouseId]);

  useEffect(() => {
    fetchEquipments();
    fetchIncidents();
  }, [fetchEquipments, fetchIncidents]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    // Frontend validation
    if (!formData.name?.trim()) { alert('Tên thiết bị không được để trống'); return; }
    if (formData.name.trim().length > 100) { alert('Tên thiết bị không được vượt quá 100 ký tự'); return; }
    if (formData.maintenanceCycleDays && (parseInt(formData.maintenanceCycleDays) < 1 || parseInt(formData.maintenanceCycleDays) > 3650)) {
      alert('Chu kỳ bảo trì phải từ 1 đến 3650 ngày'); return;
    }
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
      alert('Thêm thiết bị thất bại: ' + (err.response?.data?.message || err.response?.data?.errors?.[0] || err.message));
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    // Frontend validation
    if (!formData.name?.trim()) { alert('Tên thiết bị không được để trống'); return; }
    if (formData.name.trim().length > 100) { alert('Tên thiết bị không được vượt quá 100 ký tự'); return; }
    if (formData.maintenanceCycleDays && (parseInt(formData.maintenanceCycleDays) < 1 || parseInt(formData.maintenanceCycleDays) > 3650)) {
      alert('Chu kỳ bảo trì phải từ 1 đến 3650 ngày'); return;
    }
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
      alert('Cập nhật thất bại: ' + (err.response?.data?.message || err.response?.data?.errors?.[0] || err.message));
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

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsUploading(true);
      let finalAttachments = [];
      if (reportData.selectedFiles && reportData.selectedFiles.length > 0) {
        finalAttachments = await equipmentIncidentService.uploadAttachments(reportData.selectedFiles);
      }

      await equipmentIncidentService.reportIncident({
        ...reportData,
        attachments: finalAttachments,
        equipmentId: currentEquipment.equipmentId
      });
      setShowReportModal(false);
      setReportData({ title: '', description: '', severity: 'MEDIUM', attachments: [], selectedFiles: [] });
      fetchIncidents();
      alert('Đã gửi báo cáo sự cố thành công.');
    } catch (err) {
      alert('Gửi báo cáo thất bại: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenIncidentModal = async (incident) => {
    try {
      setIncidentLoading(true);
      const detail = await equipmentIncidentService.getIncidentById(incident.id);
      setSelectedIncident(detail);
      setShowIncidentModal(true);
    } catch (err) {
      alert('Không thể tải chi tiết sự cố.');
    } finally {
      setIncidentLoading(false);
    }
  };

  const handleUpdateIncidentStatus = async (status, equipStatus) => {
    try {
      await equipmentIncidentService.updateStatus(selectedIncident.id, status, equipStatus);
      // Refresh details
      const detail = await equipmentIncidentService.getIncidentById(selectedIncident.id);
      setSelectedIncident(detail);
      fetchIncidents();
      fetchEquipments();
      alert('Cập nhật trạng thái thành công.');
    } catch (err) {
      alert('Cập nhật thất bại: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await equipmentIncidentService.addComment(selectedIncident.id, newComment);
      setNewComment('');
      // Refresh details
      const detail = await equipmentIncidentService.getIncidentById(selectedIncident.id);
      setSelectedIncident(detail);
    } catch (err) {
      alert('Gửi phản hồi thất bại.');
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
        {canManage && (
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
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: `1px solid ${COLORS.border}` }}>
        <button
          onClick={() => setActiveTab('EQUIPMENT')}
          style={{
            padding: '12px 24px', background: 'none', border: 'none',
            borderBottom: activeTab === 'EQUIPMENT' ? `3px solid ${COLORS.primary}` : '3px solid transparent',
            color: activeTab === 'EQUIPMENT' ? COLORS.primary : COLORS.textLight,
            fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          Danh sách thiết bị
        </button>
        <button
          onClick={() => setActiveTab('INCIDENTS')}
          style={{
            padding: '12px 24px', background: 'none', border: 'none',
            borderBottom: activeTab === 'INCIDENTS' ? `3px solid ${COLORS.primary}` : '3px solid transparent',
            color: activeTab === 'INCIDENTS' ? COLORS.primary : COLORS.textLight,
            fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}
        >
          Sự cố báo cáo
          {incidents.filter(i => i.status === 'OPEN').length > 0 && (
            <span style={{ backgroundColor: COLORS.danger, color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '10px' }}>
              {incidents.filter(i => i.status === 'OPEN').length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'EQUIPMENT' ? (
        <>
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
                        if (!canManage) return;
                        setCurrentEquipment(device);
                        setStatusData({ status: device.status || 'AVAILABLE', note: '' });
                        setShowStatusModal(true);
                      }}
                      style={{
                        cursor: canManage ? 'pointer' : 'default', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                        backgroundColor: getStatusColor(device.status).bg, color: getStatusColor(device.status).text,
                        border: `1px solid ${getStatusColor(device.status).text}40`
                      }}
                      title={canManage ? "Nhấn để cập nhật trạng thái" : ""}
                    >
                      {getStatusTextVI(device.status)} {canManage && <span className="material-symbols-outlined" style={{ fontSize: '12px', verticalAlign: 'middle' }}>edit</span>}
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
                        <span style={{ ...detailValueStyle, color: isDatePast(device.nextMaintenanceDate) ? COLORS.danger : COLORS.warning, fontWeight: 700 }}>
                          {device.nextMaintenanceDate}
                        </span>
                      </div>
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
                    {canReport && (
                      <button
                        onClick={() => {
                          setCurrentEquipment(device);
                          setShowReportModal(true);
                        }}
                        style={{
                          background: 'none', border: `1px solid ${COLORS.danger}50`, color: COLORS.danger,
                          fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>report_problem</span>
                        Báo sự cố
                      </button>
                    )}
                    {canManage && (
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
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* INCIDENTS TAB CONTENT */
        <div style={{ backgroundColor: '#fff', borderRadius: '20px', border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Các sự cố được báo cáo trong kho</h2>
            <div style={{ fontSize: '12px', color: COLORS.textLight }}>
              {incidents.length} báo cáo sự cố
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f8fafc' }}>
              <tr>
                <th style={thStyle}>THIẾT BỊ</th>
                <th style={thStyle}>TIÊU ĐỀ SỰ CỐ</th>
                <th style={thStyle}>MỨC ĐỘ</th>
                <th style={thStyle}>TRẠNG THÁI</th>
                <th style={thStyle}>NGƯỜI BÁO</th>
                <th style={thStyle}>THỜI GIAN</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {incidentLoading ? (
                <tr><td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: COLORS.textLight }}>Đang tải danh sách sự cố...</td></tr>
              ) : incidents.length === 0 ? (
                <tr><td colSpan="7" style={{ padding: '80px', textAlign: 'center', color: COLORS.textLight }}>Chưa có sự cố nào được báo cáo</td></tr>
              ) : (
                incidents.map(inc => (
                  <tr key={inc.id} style={{ borderBottom: `1px solid ${COLORS.border}`, transition: 'background-color 0.2s' }}>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 700 }}>{inc.equipmentName}</div>
                    </td>
                    <td style={tdStyle}>{inc.title}</td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800,
                        backgroundColor: getSeverityColor(inc.severity).bg, color: getSeverityColor(inc.severity).text
                      }}>
                        {inc.severity}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800,
                        backgroundColor: getIncidentStatusColor(inc.status).bg, color: getIncidentStatusColor(inc.status).text
                      }}>
                        {inc.status}
                      </span>
                    </td>
                    <td style={tdStyle}>{inc.reportedBy}</td>
                    <td style={tdStyle}>{new Date(inc.createdAt).toLocaleString()}</td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => handleOpenIncidentModal(inc)}
                        style={{ background: COLORS.primary, color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '12px' }}
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
                <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Vd: Xe nâng #01, Camera 4K..." style={inputStyle} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: COLORS.textLight, marginBottom: '6px' }}>DANH MỤC THIẾT BỊ</label>
                <select required value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} style={inputStyle}>
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
                <input type="text" value={formData.serialNumber} onChange={e => setFormData({ ...formData, serialNumber: e.target.value })} placeholder="Vd: SN-2023-XXXX" style={inputStyle} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: COLORS.textLight, marginBottom: '6px' }}>PHÂN BỔ CHO KHU VỰC</label>
                <select value={formData.rentalAreaId} onChange={e => setFormData({ ...formData, rentalAreaId: e.target.value })} style={inputStyle}>
                  <option value="">-- Dùng chung toàn kho --</option>
                  {rentalAreas.map(area => (
                    <option key={area.id} value={area.id}>{area.name} ({area.size} m2)</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: COLORS.textLight, marginBottom: '6px' }}>VỊ TRÍ CỤ THỂ</label>
                <input type="text" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="Vd: Góc Tây Bắc, Cổng số 2..." style={inputStyle} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: COLORS.textLight, marginBottom: '6px' }}>CHU KỲ BẢO TRÌ (NGÀY)</label>
                <input type="number" min="1" value={formData.maintenanceCycleDays} onChange={e => setFormData({ ...formData, maintenanceCycleDays: e.target.value })} placeholder="Vd: 30, 90, 180" style={inputStyle} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: COLORS.textLight, marginBottom: '6px' }}>IOT DEVICE ID</label>
                <input type="text" value={formData.iotDeviceId} onChange={e => setFormData({ ...formData, iotDeviceId: e.target.value })} placeholder="Mã ID đồng bộ thiết bị IoT" style={inputStyle} />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: COLORS.textLight, marginBottom: '6px' }}>GHI CHÚ HIỆN TẠI</label>
                <textarea rows="2" value={formData.note} onChange={e => setFormData({ ...formData, note: e.target.value })} placeholder="Tình trạng, lưu ý khi di chuyển..." style={inputStyle} />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: COLORS.textLight, marginBottom: '6px' }}>MÔ TẢ CHI TIẾT</label>
                <textarea rows="2" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} style={inputStyle} />
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
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#fff', borderRadius: '24px', width: '100%', maxWidth: '450px',
            padding: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 800 }}>Cập nhật trạng thái thiết bị</h2>
            <div style={{ marginBottom: '16px', fontSize: '14px', color: COLORS.textLight }}>
              Thiết bị: <strong style={{ color: COLORS.text }}>{currentEquipment.name}</strong>
              <br />
              Trạng thái Cũ: <strong style={{ color: getStatusColor(currentEquipment.status).text }}>{getStatusTextVI(currentEquipment.status)}</strong>
            </div>

            <form onSubmit={submitStatusUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: COLORS.textLight, marginBottom: '6px' }}>CHỌN TRẠNG THÁI MỚI</label>
                <select value={statusData.status} onChange={e => setStatusData({ ...statusData, status: e.target.value })} style={inputStyle}>
                  <option value="AVAILABLE">SẴN SÀNG - AVAILABLE</option>
                  <option value="MAINTENANCE">BẢO TRÌ - MAINTENANCE</option>
                  <option value="BROKEN">HỎNG - BROKEN</option>
                  <option value="RETIRED">NGƯNG DÙNG - RETIRED</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: COLORS.textLight, marginBottom: '6px' }}>LÝ DO / GHI CHÚ</label>
                <textarea required rows="3" value={statusData.note} onChange={e => setStatusData({ ...statusData, note: e.target.value })} placeholder="Ghi chú nguyên nhân chuyển trạng thái..." style={inputStyle} />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowStatusModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: `1px solid ${COLORS.border}`, background: '#fff', fontWeight: 700, cursor: 'pointer' }}>Hủy</button>
                <button type="submit" style={{ flex: 2, padding: '12px', borderRadius: '10px', border: 'none', background: COLORS.secondary, color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Cập nhật</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Report Incident */}
      {showReportModal && currentEquipment && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#fff', borderRadius: '24px', width: '100%', maxWidth: '500px',
            padding: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 800 }}>Báo cáo sự cố thiết bị</h2>
            <p style={{ color: COLORS.textLight, fontSize: '13px', marginBottom: '20px' }}>Thiết bị: <strong>{currentEquipment.name}</strong></p>

            <form onSubmit={handleReportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>TIÊU ĐỀ SỰ CỐ *</label>
                <input required type="text" placeholder="Vd: Không khởi động được, Mất kết nối..."
                  value={reportData.title} onChange={e => setReportData({ ...reportData, title: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>MỨC ĐỘ NGHIÊM TRỌNG</label>
                <select value={reportData.severity} onChange={e => setReportData({ ...reportData, severity: e.target.value })} style={inputStyle}>
                  <option value="LOW">THẤP (Có thể dùng tạm)</option>
                  <option value="MEDIUM">TRUNG BÌNH (Cần kiểm tra)</option>
                  <option value="HIGH">CAO (Hỏng nặng/Nguy hiểm)</option>
                  <option value="CRITICAL">KHẨN CẤP (Dừng hoạt động ngay)</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>MÔ TẢ CHI TIẾT *</label>
                <textarea required rows="4" placeholder="Mô tả hiện trạng và nguyên nhân (nếu biết)..."
                  value={reportData.description} onChange={e => setReportData({ ...reportData, description: e.target.value })} style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>HÌNH ẢNH / VIDEO MINH HỌA</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  {reportData.selectedFiles.map((file, idx) => (
                    <div key={idx} style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '8px', border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
                      {file.type.startsWith('image/') ? (
                        <img src={URL.createObjectURL(file)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="preview" />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' }}>
                          <span className="material-symbols-outlined" style={{ color: COLORS.primary }}>movie</span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setReportData(prev => ({ ...prev, selectedFiles: prev.selectedFiles.filter((_, i) => i !== idx) }))}
                        style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(239, 68, 68, 0.8)', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>close</span>
                      </button>
                    </div>
                  ))}
                  {reportData.selectedFiles.length < 5 && (
                    <label style={{
                      width: '60px', height: '60px', borderRadius: '8px', border: `2px dashed ${COLORS.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: COLORS.textLight
                    }}>
                      <span className="material-symbols-outlined">add_a_photo</span>
                      <input
                        type="file" multiple accept="image/*,video/*" hidden
                        onChange={e => {
                          const files = Array.from(e.target.files);
                          setReportData(prev => ({ ...prev, selectedFiles: [...prev.selectedFiles, ...files].slice(0, 5) }));
                        }}
                      />
                    </label>
                  )}
                </div>
                <p style={{ fontSize: '11px', color: COLORS.textLight, margin: 0 }}>Tối đa 5 tệp (Ảnh/Video). Mỗi tệp tối đa 50MB.</p>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowReportModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: `1px solid ${COLORS.border}`, background: '#fff', fontWeight: 700, cursor: 'pointer' }}>Hủy</button>
                <button
                  type="submit"
                  disabled={isUploading}
                  style={{
                    flex: 2, padding: '12px', borderRadius: '10px', border: 'none',
                    background: isUploading ? COLORS.textLight : COLORS.danger, color: '#fff',
                    fontWeight: 700, cursor: isUploading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isUploading ? 'Đanh tải tệp...' : 'Gửi báo cáo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Incident Detail & Management */}
      {showIncidentModal && selectedIncident && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#fff', borderRadius: '24px', width: '100%', maxWidth: '850px',
            maxHeight: '90vh', display: 'grid', gridTemplateColumns: '1fr 300px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
          }}>
            {/* Left side: Chat & History */}
            <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: COLORS.textLight, fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Báo cáo sự cố #{selectedIncident.id}</div>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>{selectedIncident.title}</h2>
                </div>
                <button onClick={() => setShowIncidentModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.textLight }}><span className="material-symbols-outlined">close</span></button>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}>Mô tả từ {selectedIncident.reportedBy}:</div>
                <div style={{ fontSize: '14px', color: COLORS.text, lineHeight: 1.6 }}>{selectedIncident.description}</div>
                {selectedIncident.attachments && selectedIncident.attachments.length > 0 && (
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
                    {selectedIncident.attachments.map((att, idx) => {
                      const fullUrl = att.url.startsWith('http') ? att.url : `http://localhost:5276${att.url}`;
                      return (
                        <div key={idx} style={{ borderRadius: '8px', overflow: 'hidden', border: `1px solid ${COLORS.border}`, backgroundColor: '#fff' }}>
                          {att.fileType.toUpperCase() === 'IMAGE' ? (
                            <a href={fullUrl} target="_blank" rel="noreferrer">
                              <img src={fullUrl} style={{ width: '120px', height: '80px', objectFit: 'cover' }} alt="att" />
                            </a>
                          ) : (
                            <a href={fullUrl} target="_blank" rel="noreferrer" style={{ width: '120px', height: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: COLORS.text }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>play_circle</span>
                              <span style={{ fontSize: '10px', fontWeight: 700 }}>XEM VIDEO</span>
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={{ flex: 1, borderTop: `1px solid ${COLORS.border}`, paddingTop: '20px', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px' }}>Trao đổi & Xử lý</h3>

                <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {(!selectedIncident.comments || selectedIncident.comments.length === 0) ? (
                    <div style={{ textAlign: 'center', padding: '20px', border: `1px dashed ${COLORS.border}`, borderRadius: '12px' }}>
                      <p style={{ color: COLORS.textLight, fontSize: '13px' }}>Chưa có tin nhắn nào trong luồng xử lý này.</p>
                    </div>
                  ) : (
                    selectedIncident.comments.map(c => (
                      <div key={c.id} style={{
                        padding: '12px', borderRadius: '12px',
                        backgroundColor: c.userFullName.includes('Manager') ? `${COLORS.primary}10` : '#f1f5f9',
                        alignSelf: c.userFullName.includes('Manager') ? 'flex-end' : 'flex-start',
                        maxWidth: '80%'
                      }}>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: COLORS.textLight, marginBottom: '4px' }}>
                          {c.userFullName} • {new Date(c.createdAt).toLocaleString()}
                        </div>
                        <div style={{ fontSize: '13px', lineHeight: 1.5 }}>{c.comment}</div>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleAddComment}>
                  <textarea
                    value={newComment} onChange={e => setNewComment(e.target.value)}
                    placeholder="Viết phản hồi hoặc hướng dẫn xử lý..."
                    style={{ ...inputStyle, marginBottom: '12px' }} rows="3"
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" style={{ background: COLORS.primary, color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>Gửi phản hồi</button>
                  </div>
                </form>
              </div>
            </div>

            {/* Right side: Management Actions */}
            <div style={{ backgroundColor: '#f8fafc', padding: '32px', borderLeft: `1px solid ${COLORS.border}`, display: canManage ? 'block' : 'none' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: COLORS.text, marginBottom: '20px', textTransform: 'uppercase' }}>CẬP NHẬT TRẠNG THÁI</h3>
              <div>
                <label style={labelStyle}>THIẾT BỊ</label>
                <div style={{ fontWeight: 700 }}>{selectedIncident.equipmentName}</div>
              </div>

              <div>
                <label style={labelStyle}>MỨC ĐỘ</label>
                <div style={{
                  color: getSeverityColor(selectedIncident.severity).text, fontWeight: 800, fontSize: '14px'
                }}>{selectedIncident.severity}</div>
              </div>

              <div>
                <label style={labelStyle}>TRẠNG THÁI HIỆN TẠI</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{
                    width: '10px', height: '10px', borderRadius: '50%',
                    backgroundColor: getIncidentStatusColor(selectedIncident.status).text
                  }}></span>
                  <span style={{ fontWeight: 700 }}>{selectedIncident.status}</span>
                </div>
              </div>

              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={labelStyle}>CẬP NHẬT TIẾN ĐỘ</label>
                {selectedIncident.status === 'OPEN' && (
                  <button
                    onClick={() => handleUpdateIncidentStatus('IN_PROGRESS', 'MAINTENANCE')}
                    style={actionButtonStyle}
                  >
                    Tiếp nhận & Sửa chữa
                  </button>
                )}
                {(selectedIncident.status === 'OPEN' || selectedIncident.status === 'IN_PROGRESS') && (
                  <button
                    onClick={() => handleUpdateIncidentStatus('RESOLVED', 'AVAILABLE')}
                    style={{ ...actionButtonStyle, background: COLORS.success }}
                  >
                    Đã khắc phục xong
                  </button>
                )}
                {selectedIncident.status === 'RESOLVED' && (
                  <button
                    onClick={() => handleUpdateIncidentStatus('CLOSED', null)}
                    style={{ ...actionButtonStyle, background: COLORS.textLight }}
                  >
                    Đóng báo cáo
                  </button>
                )}
                {selectedIncident.status !== 'CLOSED' && (
                  <button
                    onClick={() => handleUpdateIncidentStatus('IN_PROGRESS', 'BROKEN')}
                    style={{ ...actionButtonStyle, background: COLORS.danger }}
                  >
                    Đánh dấu Hỏng nặng
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const labelStyle = { display: 'block', fontSize: '11px', fontWeight: 800, color: COLORS.textLight, marginBottom: '6px', textTransform: 'uppercase' };
const actionButtonStyle = {
  width: '100%', padding: '12px', border: 'none', borderRadius: '10px',
  background: COLORS.secondary, color: '#fff', fontWeight: 700, cursor: 'pointer',
  fontSize: '13px'
};

const thStyle = { textAlign: 'left', padding: '16px', fontSize: '11px', fontWeight: 800, color: COLORS.textLight, textTransform: 'uppercase' };
const tdStyle = { padding: '16px', fontSize: '14px' };

const getSeverityColor = (sev) => {
  switch (sev) {
    case 'LOW': return { bg: '#e0f2fe', text: '#0369a1' };
    case 'MEDIUM': return { bg: '#fef3c7', text: '#d97706' };
    case 'HIGH': return { bg: '#fee2e2', text: '#dc2626' };
    case 'CRITICAL': return { bg: '#450a0a', text: '#fff' };
    default: return { bg: '#f1f5f9', text: '#475569' };
  }
};

const getIncidentStatusColor = (status) => {
  switch (status) {
    case 'OPEN': return { bg: '#ecfdf5', text: '#10b981' };
    case 'IN_PROGRESS': return { bg: '#eff6ff', text: '#3b82f6' };
    case 'RESOLVED': return { bg: '#f0fdf4', text: '#16a34a' };
    case 'CLOSED': return { bg: '#f8fafc', text: '#64748b' };
    default: return { bg: '#f1f5f9', text: '#475569' };
  }
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
