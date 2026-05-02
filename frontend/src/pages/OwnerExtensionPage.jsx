import React, { useState, useEffect, useCallback } from 'react';
import {
  Layout, Row, Col, Typography, Button, Input, Select,
  Card, Spin, Empty, message, Space, Badge, Tabs, Modal,
  Form, InputNumber, Tag, Descriptions
} from 'antd';
import contractExtensionService from '../services/contractExtensionService';

const { Title, Text, Paragraph } = Typography;
const { Content } = Layout;
const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;

/* ── Inline styles ── */
const S = {
  page: { minHeight: '100vh', background: '#f0f2f5' },
  content: { padding: 24 },
  /* Header */
  header: {
    marginBottom: 24, background: '#fff', padding: '28px 32px',
    borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.06)',
    borderLeft: '4px solid #1677ff',
  },
  headerTitle: { margin: 0, color: '#0f172a', fontWeight: 700, fontSize: 22 },
  headerSub: { fontSize: 14, color: '#64748b', marginTop: 4 },
  statCard: {
    textAlign: 'center', minWidth: 90, borderRadius: 10,
    border: '1px solid #f0f0f0', padding: '10px 16px',
  },
  statLabel: { fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 2 },
  /* Main panel */
  panel: { background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,.06)' },
  toolbar: { padding: '20px 24px 0' },
  searchInput: { borderRadius: 8 },
  refreshBtn: { fontWeight: 500, borderRadius: 8 },
  tabBar: { padding: '0 24px', margin: 0 },
  tabContent: { padding: '8px 24px 24px' },
  /* Extension card */
  card: {
    marginBottom: 20, borderRadius: 10,
    border: '1px solid #e8e8e8', overflow: 'hidden',
    transition: 'box-shadow .2s',
  },
  cardHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '18px 24px', borderBottom: '1px solid #f0f0f0', background: '#fafbfc',
  },
  contractNum: { fontSize: 17, fontWeight: 700, color: '#1677ff', letterSpacing: '.3px' },
  contractLabel: { fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
  durationTag: {
    margin: 0, padding: '5px 14px', fontSize: 13, fontWeight: 600,
    borderRadius: 6, background: '#e6f4ff', color: '#1677ff', border: '1px solid #91caff',
  },
  cardBody: { padding: 24 },
  infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  infoBlock: { background: '#f8fafc', borderRadius: 8, padding: 16 },
  infoRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '8px 0', borderBottom: '1px solid #eef1f6',
  },
  infoRowLast: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '8px 0',
  },
  infoLabel: { color: '#64748b', fontWeight: 600, fontSize: 13 },
  infoValue: { color: '#1e293b', fontSize: 13 },
  infoHighlight: { color: '#059669', fontWeight: 700, fontSize: 14 },
  infoBold: { color: '#0f172a', fontWeight: 700, fontSize: 15 },
  reasonBox: {
    marginTop: 20, padding: 16, background: '#fffbeb',
    borderLeft: '4px solid #fbbf24', borderRadius: 6,
  },
  reasonLabel: { display: 'block', marginBottom: 4, color: '#b45309', fontWeight: 700, fontSize: 13 },
  reasonText: { margin: 0, color: '#78350f', fontSize: 13 },
  cardFooter: {
    marginTop: 20, paddingTop: 16, borderTop: '1px solid #f0f0f0',
    display: 'flex', justifyContent: 'flex-end', gap: 12,
  },
  detailBtn: { fontWeight: 500, borderRadius: 8 },
  reviewBtn: { fontWeight: 600, borderRadius: 8 },
};

const OwnerExtensionPage = () => {
  const [pendingExtensions, setPendingExtensions] = useState([]);
  const [pendingSignatureExtensions, setPendingSignatureExtensions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('pending');

  const [selectedExtension, setSelectedExtension] = useState(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [form] = Form.useForm();
  const watchedNewMonthlyPayment = Form.useWatch('newMonthlyPayment', form);
  const selectedDurationMonths = selectedExtension?.durationMonths || 0;
  const extensionTotalAmount = (Number(watchedNewMonthlyPayment) || 0) * selectedDurationMonths;

  /* ── Data loading ── */
  const loadData = useCallback(async (refresh = false) => {
    try {
      refresh ? setRefreshing(true) : setLoading(true);
      const [p, s] = await Promise.all([
        contractExtensionService.getPendingExtensions(),
        contractExtensionService.getPendingSignatureExtensions(),
      ]);
      setPendingExtensions(p);
      setPendingSignatureExtensions(s);
    } catch { message.error('Không thể tải dữ liệu.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filterExtensions = (list) => {
    if (!searchTerm) return list;
    const q = searchTerm.toLowerCase();
    return list.filter(e =>
      e.originalContract?.contractNumber?.toLowerCase().includes(q) ||
      e.requester?.fullName?.toLowerCase().includes(q) ||
      e.originalContract?.warehouseName?.toLowerCase().includes(q)
    );
  };

  /* ── Actions ── */
  const handleApprove = async (ext, data) => {
    try {
      setActionLoading(true);
      await contractExtensionService.approveExtension(ext.extensionId, data);
      message.success('Đã phê duyệt yêu cầu gia hạn');
      loadData(true); setReviewModalVisible(false);
    } catch (e) { message.error('Lỗi: ' + (e.response?.data?.message || 'Có lỗi xảy ra')); }
    finally { setActionLoading(false); }
  };

  const handleReject = async (ext, reason) => {
    try {
      setActionLoading(true);
      await contractExtensionService.rejectExtension(ext.extensionId, { reason });
      message.success('Đã từ chối yêu cầu gia hạn');
      loadData(true); setReviewModalVisible(false);
    } catch (e) { message.error('Lỗi: ' + (e.response?.data?.message || 'Có lỗi xảy ra')); }
    finally { setActionLoading(false); }
  };

  const showReviewModal = (ext) => {
    setSelectedExtension(ext);
    form.setFieldsValue({
      status: 'APPROVED',
      newMonthlyPayment: ext.proposedMonthlyPayment ?? ext.originalContract?.monthlyPayment,
      notes: '',
    });
    setReviewModalVisible(true);
  };

  const showDetailModal = (ext) => { setSelectedExtension(ext); setDetailModalVisible(true); };

  const handleFormSubmit = async (values) => {
    if (!selectedExtension) return;
    if (values.status === 'APPROVED') {
      await handleApprove(selectedExtension, { newMonthlyPayment: values.newMonthlyPayment, notes: values.reviewNotes });
    } else {
      if (!values.reason) { message.error('Vui lòng nhập lý do từ chối'); return; }
      await handleReject(selectedExtension, values.reason);
    }
  };

  /* ── Extension card ── */
  const renderExtensionCard = (extension, showActions = true) => {
    if (!extension.originalContract) return null;
    const contract = extension.originalContract;
    const effectiveMonthlyPayment = extension.proposedMonthlyPayment ?? contract.monthlyPayment;
    const summary = contractExtensionService.generateExtensionSummary(
      extension, { ...contract, monthlyPayment: effectiveMonthlyPayment }
    );

    return (
      <div key={extension.extensionId} style={S.card}
        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.08)'}
        onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
      >
        {/* Card header */}
        <div style={S.cardHeader}>
          <div>
            <div style={S.contractLabel}>Mã hợp đồng</div>
            <div style={S.contractNum}>{contract.contractNumber}</div>
          </div>
          <div style={S.durationTag}>
            Gia hạn {contractExtensionService.formatDuration(extension.durationMonths)}
          </div>
        </div>

        {/* Card body */}
        <div style={S.cardBody}>
          <div style={S.infoGrid}>
            {/* Left column */}
            <div style={S.infoBlock}>
              <div style={S.infoRow}>
                <span style={S.infoLabel}>Người yêu cầu</span>
                <span style={S.infoValue}>{extension.requester?.fullName || 'N/A'}</span>
              </div>
              <div style={S.infoRow}>
                <span style={S.infoLabel}>Ngày yêu cầu</span>
                <span style={S.infoValue}>{contractExtensionService.formatDate(extension.requestedAt)}</span>
              </div>
              <div style={S.infoRowLast}>
                <span style={S.infoLabel}>Chi phí hiện tại</span>
                <span style={S.infoValue}>{contractExtensionService.formatCurrency(contract.monthlyPayment)}</span>
              </div>
            </div>
            {/* Right column */}
            <div style={S.infoBlock}>
              <div style={S.infoRow}>
                <span style={S.infoLabel}>Thời hạn hiện tại</span>
                <span style={S.infoValue}>{summary.currentEndDate}</span>
              </div>
              <div style={S.infoRow}>
                <span style={S.infoLabel}>Thời hạn mới</span>
                <span style={S.infoHighlight}>{summary.newEndDate}</span>
              </div>
              <div style={S.infoRowLast}>
                <span style={S.infoLabel}>Chi phí gia hạn</span>
                <span style={S.infoBold}>{summary.formattedCost}</span>
              </div>
            </div>
          </div>

          {extension.reason && (
            <div style={S.reasonBox}>
              <span style={S.reasonLabel}>Lý do gia hạn</span>
              <p style={S.reasonText}>{extension.reason}</p>
            </div>
          )}

          <div style={S.cardFooter}>
            <Button onClick={() => showDetailModal(extension)} style={S.detailBtn}>
              Xem chi tiết
            </Button>
            {showActions && (
              <Button type="primary" onClick={() => showReviewModal(extension)} style={S.reviewBtn}>
                Xét duyệt
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  /* ── Loading state ── */
  if (loading) {
    return (
      <Layout style={S.page}>
        <Content style={{ ...S.content, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Spin size="large" />
        </Content>
      </Layout>
    );
  }

  /* ── Main render ── */
  return (
    <Layout style={S.page}>
      <Content style={S.content}>
        {/* ── Header ── */}
        <div style={S.header}>
          <Row justify="space-between" align="middle">
            <Col>
              <h2 style={S.headerTitle}>Quản lý gia hạn hợp đồng</h2>
              <div style={S.headerSub}>Duyệt yêu cầu gia hạn từ người thuê kho</div>
            </Col>
            <Col>
              <Space size={12}>
                <div style={{ ...S.statCard, borderBottom: '3px solid #fa8c16' }}>
                  <span style={S.statLabel}>Chờ duyệt</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: '#fa8c16' }}>{pendingExtensions.length}</span>
                </div>
                <div style={{ ...S.statCard, borderBottom: '3px solid #1677ff' }}>
                  <span style={S.statLabel}>Chờ ký</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: '#1677ff' }}>{pendingSignatureExtensions.length}</span>
                </div>
              </Space>
            </Col>
          </Row>
        </div>

        {/* ── Main panel ── */}
        <div style={S.panel}>
          {/* Toolbar */}
          <div style={S.toolbar}>
            <Row gutter={12} align="middle">
              <Col flex="auto">
                <Input
                  placeholder="Tìm kiếm theo mã hợp đồng, tên người thuê..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  allowClear size="large" style={S.searchInput}
                />
              </Col>
              <Col>
                <Button onClick={() => loadData(true)} loading={refreshing} size="large" style={S.refreshBtn}>
                  Làm mới
                </Button>
              </Col>
            </Row>
          </div>

          {/* Tabs */}
          <Tabs activeKey={activeTab} onChange={setActiveTab} tabBarStyle={S.tabBar}>
            <TabPane
              tab={
                <span style={{ padding: '8px 0', fontSize: 15, fontWeight: activeTab === 'pending' ? 600 : 400 }}>
                  Chờ duyệt
                  <Badge count={pendingExtensions.length} showZero style={{ backgroundColor: '#fa8c16', marginLeft: 8 }} />
                </span>
              }
              key="pending"
            >
              <div style={S.tabContent}>
                {filterExtensions(pendingExtensions).length === 0
                  ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có yêu cầu gia hạn nào cần duyệt" />
                  : filterExtensions(pendingExtensions).map(ext => renderExtensionCard(ext, true))
                }
              </div>
            </TabPane>

            <TabPane
              tab={
                <span style={{ padding: '8px 0', fontSize: 15, fontWeight: activeTab === 'pending-signature' ? 600 : 400 }}>
                  Chờ ký hợp đồng
                  <Badge count={pendingSignatureExtensions.length} showZero style={{ backgroundColor: '#1677ff', marginLeft: 8 }} />
                </span>
              }
              key="pending-signature"
            >
              <div style={S.tabContent}>
                {filterExtensions(pendingSignatureExtensions).length === 0
                  ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có hợp đồng gia hạn nào cần ký" />
                  : filterExtensions(pendingSignatureExtensions).map(ext => renderExtensionCard(ext, false))
                }
              </div>
            </TabPane>
          </Tabs>
        </div>

        {/* ── Review Modal ── */}
        <Modal
          title={<span style={{ fontWeight: 700, fontSize: 17 }}>Duyệt yêu cầu gia hạn</span>}
          open={reviewModalVisible}
          onCancel={() => setReviewModalVisible(false)}
          footer={null} width={580}
        >
          <Form form={form} onFinish={handleFormSubmit} layout="vertical"
            initialValues={{ status: 'APPROVED', newMonthlyPayment: selectedExtension?.originalContract?.monthlyPayment }}>

            {selectedExtension?.originalContract && (
              <div style={{ background: '#f8fafc', borderRadius: 8, padding: '14px 18px', marginBottom: 20, border: '1px solid #e2e8f0' }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <div style={{ marginBottom: 4 }}>
                      <span style={{ color: '#64748b', fontSize: 12 }}>Hợp đồng</span>
                      <div style={{ fontWeight: 700, color: '#1677ff' }}>{selectedExtension.originalContract.contractNumber}</div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div>
                      <span style={{ color: '#64748b', fontSize: 12 }}>Người yêu cầu</span>
                      <div style={{ fontWeight: 600 }}>{selectedExtension.requester?.fullName || 'N/A'}</div>
                    </div>
                  </Col>
                </Row>
              </div>
            )}

            <Form.Item name="status" label={<span style={{ fontWeight: 600 }}>Quyết định</span>}>
              <Select size="large">
                <Option value="APPROVED">Phê duyệt</Option>
                <Option value="REJECTED">Từ chối</Option>
              </Select>
            </Form.Item>

            <Form.Item noStyle shouldUpdate={(prev, cur) => prev.status !== cur.status}>
              {({ getFieldValue }) =>
                getFieldValue('status') === 'APPROVED' ? (
                  <>
                    <Form.Item name="newMonthlyPayment" label={<span style={{ fontWeight: 600 }}>Giá thuê mới (VND/tháng)</span>}
                      rules={[{ required: true, message: 'Vui lòng nhập giá thuê' }]}>
                      <InputNumber style={{ width: '100%' }}
                        formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={v => (v || '').replace(/\$\s?|(,*)/g, '')}
                        size="large" min={0} />
                    </Form.Item>
                    <div style={{ marginTop: -8, marginBottom: 16, padding: '10px 14px', background: '#f0fdf4', borderRadius: 6, border: '1px solid #bbf7d0' }}>
                      <span style={{ color: '#15803d', fontSize: 13 }}>
                        Tổng tiền gia hạn ({contractExtensionService.formatDuration(selectedDurationMonths)}):
                      </span>
                      <span style={{ marginLeft: 8, fontWeight: 700, color: '#166534', fontSize: 15 }}>
                        {contractExtensionService.formatCurrency(extensionTotalAmount)}
                      </span>
                    </div>
                    <Form.Item name="reviewNotes" label={<span style={{ fontWeight: 600 }}>Ghi chú (không bắt buộc)</span>}>
                      <TextArea rows={3} placeholder="Nhập ghi chú..." size="large" />
                    </Form.Item>
                  </>
                ) : (
                  <Form.Item name="reason" label={<span style={{ fontWeight: 600 }}>Lý do từ chối</span>}
                    rules={[{ required: true, message: 'Vui lòng nhập lý do từ chối' }]}>
                    <TextArea rows={4} placeholder="Nhập lý do từ chối..." size="large" />
                  </Form.Item>
                )
              }
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <Button onClick={() => setReviewModalVisible(false)} disabled={actionLoading} style={{ borderRadius: 8 }}>
                  Hủy bỏ
                </Button>
                <Button type="primary" htmlType="submit" loading={actionLoading} size="large" style={{ borderRadius: 8, fontWeight: 600, minWidth: 120 }}>
                  {actionLoading ? 'Đang xử lý...' : 'Xác nhận'}
                </Button>
              </div>
            </Form.Item>
          </Form>
        </Modal>

        {/* ── Detail Modal ── */}
        <Modal
          title={<span style={{ fontWeight: 700, fontSize: 17 }}>Chi tiết yêu cầu gia hạn</span>}
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          footer={null} width={680}
        >
          {selectedExtension?.originalContract && (
            <Descriptions column={2} bordered size="middle"
              labelStyle={{ fontWeight: 600, background: '#f8fafc', color: '#475569', width: '35%' }}
              contentStyle={{ background: '#fff' }}>
              <Descriptions.Item label="Mã hợp đồng" span={2}>
                <span style={{ fontWeight: 700, color: '#1677ff' }}>{selectedExtension.originalContract.contractNumber}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Người yêu cầu">
                {selectedExtension.requester?.fullName || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {selectedExtension.requester?.email || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Thời gian gia hạn">
                {contractExtensionService.formatDuration(selectedExtension.durationMonths)}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày yêu cầu">
                {contractExtensionService.formatDate(selectedExtension.requestedAt)}
              </Descriptions.Item>
              <Descriptions.Item label="Tiền thuê hiện tại">
                {contractExtensionService.formatCurrency(selectedExtension.originalContract.monthlyPayment)}
              </Descriptions.Item>
              <Descriptions.Item label="Chi phí gia hạn">
                <span style={{ fontWeight: 700, color: '#059669' }}>
                  {contractExtensionService.formatCurrency(
                    contractExtensionService.calculateAdditionalCost(
                      selectedExtension.proposedMonthlyPayment ?? selectedExtension.originalContract.monthlyPayment,
                      selectedExtension.durationMonths
                    )
                  )}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Lý do gia hạn" span={2}>
                <Paragraph style={{ margin: 0 }}>{selectedExtension.reason}</Paragraph>
              </Descriptions.Item>
            </Descriptions>
          )}
        </Modal>
      </Content>
    </Layout>
  );
};

export default OwnerExtensionPage;
