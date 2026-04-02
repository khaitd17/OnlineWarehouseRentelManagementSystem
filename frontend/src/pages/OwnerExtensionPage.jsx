import React, { useState, useEffect, useCallback } from 'react';
import {
  Layout,
  Row,
  Col,
  Typography,
  Button,
  Input,
  Select,
  Card,
  Spin,
  Empty,
  message,
  Space,
  Badge,
  Tabs,
  Modal,
  Form,
  InputNumber,
  Tag,
  Tooltip,
  Descriptions
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CalendarOutlined,
  DollarOutlined,
  EditOutlined
} from '@ant-design/icons';
import contractExtensionService from '../services/contractExtensionService';

const { Title, Text, Paragraph } = Typography;
const { Content } = Layout;
const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;

const OwnerExtensionPage = () => {
  const [pendingExtensions, setPendingExtensions] = useState([]);
  const [pendingSignatureExtensions, setPendingSignatureExtensions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('pending');

  // Modal states
  const [selectedExtension, setSelectedExtension] = useState(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [form] = Form.useForm();

  // Load data
  const loadData = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [pendingData, signatureData] = await Promise.all([
        contractExtensionService.getPendingExtensions(),
        contractExtensionService.getPendingSignatureExtensions()
      ]);

      setPendingExtensions(pendingData);
      setPendingSignatureExtensions(signatureData);
    } catch (error) {
      message.error('Không thể tải dữ liệu: ' + (error.message || 'Lỗi không xác định'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter extensions
  const filterExtensions = (extensions) => {
    if (!searchTerm) return extensions;
    return extensions.filter(ext =>
      ext.originalContract?.contractNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ext.requester?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ext.originalContract?.warehouseName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Handle approve
  const handleApprove = async (extension, data) => {
    try {
      setActionLoading(true);
      await contractExtensionService.approveExtension(extension.extensionId, data);
      message.success('Đã phê duyệt yêu cầu gia hạn');
      loadData(true);
      setReviewModalVisible(false);
    } catch (error) {
      message.error('Lỗi: ' + (error.response?.data?.message || error.message));
    } finally {
      setActionLoading(false);
    }
  };

  // Handle reject
  const handleReject = async (extension, reason) => {
    try {
      setActionLoading(true);
      await contractExtensionService.rejectExtension(extension.extensionId, { reason });
      message.success('Đã từ chối yêu cầu gia hạn');
      loadData(true);
      setReviewModalVisible(false);
    } catch (error) {
      message.error('Lỗi: ' + (error.response?.data?.message || error.message));
    } finally {
      setActionLoading(false);
    }
  };

  // Show review modal
  const showReviewModal = (extension) => {
    setSelectedExtension(extension);
    form.setFieldsValue({
      status: 'APPROVED',
      newMonthlyPayment: extension.originalContract?.monthlyPayment,
      notes: ''
    });
    setReviewModalVisible(true);
  };

  // Show detail modal
  const showDetailModal = (extension) => {
    setSelectedExtension(extension);
    setDetailModalVisible(true);
  };

  // Handle form submit
  const handleFormSubmit = async (values) => {
    if (!selectedExtension) return;

    if (values.status === 'APPROVED') {
      await handleApprove(selectedExtension, {
        newMonthlyPayment: values.newMonthlyPayment,
        notes: values.reviewNotes
      });
    } else {
      if (!values.reason) {
        message.error('Vui lòng nhập lý do từ chối');
        return;
      }
      await handleReject(selectedExtension, values.reason);
    }
  };

  const renderExtensionCard = (extension, showActions = true) => {
    if (!extension.originalContract) return null;

    const contract = extension.originalContract;
    const summary = contractExtensionService.generateExtensionSummary(extension, contract);

    return (
      <Card
        key={extension.extensionId}
        title={
          <Space>
            <Text strong>{contract.contractNumber}</Text>
            <Tag color="blue">{contractExtensionService.formatDuration(extension.durationMonths)}</Tag>
          </Space>
        }
        extra={
          <Space>
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => showDetailModal(extension)}
              size="small"
            >
              Chi tiết
            </Button>
            {showActions && (
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => showReviewModal(extension)}
                size="small"
              >
                Duyệt
              </Button>
            )}
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div>
                <Text type="secondary">
                  <UserOutlined /> Người yêu cầu:
                </Text>
                <Text style={{ float: 'right' }}>{extension.requester?.fullName || 'N/A'}</Text>
              </div>
              <div>
                <Text type="secondary">
                  <CalendarOutlined /> Ngày yêu cầu:
                </Text>
                <Text style={{ float: 'right' }}>
                  {contractExtensionService.formatDate(extension.requestedAt)}
                </Text>
              </div>
              <div>
                <Text type="secondary">
                  <DollarOutlined /> Chi phí hiện tại:
                </Text>
                <Text style={{ float: 'right' }}>
                  {contractExtensionService.formatCurrency(contract.monthlyPayment)}
                </Text>
              </div>
            </Space>
          </Col>
          <Col span={12}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div>
                <Text type="secondary">Thời hạn hiện tại:</Text>
                <Text style={{ float: 'right' }}>{summary.currentEndDate}</Text>
              </div>
              <div>
                <Text type="secondary">Thời hạn mới:</Text>
                <Text style={{ float: 'right', color: '#52c41a', fontWeight: 'bold' }}>
                  {summary.newEndDate}
                </Text>
              </div>
              <div>
                <Text type="secondary">Chi phí gia hạn:</Text>
                <Text style={{ float: 'right', fontSize: '14px', fontWeight: 'bold' }}>
                  {summary.formattedCost}
                </Text>
              </div>
            </Space>
          </Col>
        </Row>

        {extension.reason && (
          <div style={{ marginTop: 12, padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>Lý do:</Text>
            <Paragraph style={{ margin: 0, fontSize: '13px' }}>{extension.reason}</Paragraph>
          </div>
        )}
      </Card>
    );
  };

  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        <Content style={{ padding: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Spin size="large" />
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Content style={{ padding: '24px' }}>
        {/* Header */}
        <div style={{ marginBottom: 24, background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={3} style={{ margin: '0 0 8px 0', color: '#0f172a' }}>
                <ClockCircleOutlined /> Quản lý gia hạn hợp đồng
              </Title>
              <Text type="secondary">Duyệt yêu cầu gia hạn từ người thuê kho</Text>
            </Col>
            <Col>
              <Space>
                <Badge count={pendingExtensions.length} showZero={false}>
                  <Card size="small" style={{ textAlign: 'center', minWidth: '80px' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>Chờ duyệt</Text>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fa8c16' }}>
                      {pendingExtensions.length}
                    </div>
                  </Card>
                </Badge>
                <Badge count={pendingSignatureExtensions.length} showZero={false}>
                  <Card size="small" style={{ textAlign: 'center', minWidth: '80px' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>Chờ ký</Text>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1677ff' }}>
                      {pendingSignatureExtensions.length}
                    </div>
                  </Card>
                </Badge>
              </Space>
            </Col>
          </Row>
        </div>

        {/* Main Content */}
        <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          {/* Search and Actions */}
          <div style={{ padding: '20px 20px 0' }}>
            <Row gutter={16} align="middle">
              <Col flex="auto">
                <Input
                  placeholder="Tìm kiếm theo mã hợp đồng, tên người thuê..."
                  prefix={<SearchOutlined />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  allowClear
                  size="large"
                />
              </Col>
              <Col>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => loadData(true)}
                  loading={refreshing}
                  size="large"
                >
                  Làm mới
                </Button>
              </Col>
            </Row>
          </div>

          {/* Tabs */}
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            tabBarStyle={{ padding: '0 20px', margin: 0 }}
          >
            <TabPane
              tab={
                <Space>
                  <ClockCircleOutlined />
                  <span>Chờ duyệt</span>
                  <Badge count={pendingExtensions.length} showZero style={{ backgroundColor: '#fa8c16' }} />
                </Space>
              }
              key="pending"
            >
              <div style={{ padding: '0 20px 20px' }}>
                {filterExtensions(pendingExtensions).length === 0 ? (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Không có yêu cầu gia hạn nào cần duyệt"
                  />
                ) : (
                  filterExtensions(pendingExtensions).map(extension => renderExtensionCard(extension, true))
                )}
              </div>
            </TabPane>

            <TabPane
              tab={
                <Space>
                  <EditOutlined />
                  <span>Chờ ký hợp đồng</span>
                  <Badge count={pendingSignatureExtensions.length} showZero style={{ backgroundColor: '#1677ff' }} />
                </Space>
              }
              key="pending-signature"
            >
              <div style={{ padding: '0 20px 20px' }}>
                {filterExtensions(pendingSignatureExtensions).length === 0 ? (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Không có hợp đồng gia hạn nào cần ký"
                  />
                ) : (
                  filterExtensions(pendingSignatureExtensions).map(extension => renderExtensionCard(extension, false))
                )}
              </div>
            </TabPane>
          </Tabs>
        </div>

        {/* Review Modal */}
        <Modal
          title="Duyệt yêu cầu gia hạn hợp đồng"
          open={reviewModalVisible}
          onCancel={() => setReviewModalVisible(false)}
          footer={null}
          width={600}
        >
          <Form
            form={form}
            onFinish={handleFormSubmit}
            layout="vertical"
            initialValues={{
              status: 'APPROVED',
              newMonthlyPayment: selectedExtension?.originalContract?.monthlyPayment
            }}
          >
            <Form.Item name="status" label="Quyết định">
              <Select size="large">
                <Option value="APPROVED">
                  <CheckCircleOutlined style={{ color: '#52c41a' }} /> Phê duyệt
                </Option>
                <Option value="REJECTED">
                  <CloseCircleOutlined style={{ color: '#ff4d4f' }} /> Từ chối
                </Option>
              </Select>
            </Form.Item>

            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) => prevValues.status !== currentValues.status}
            >
              {({ getFieldValue }) =>
                getFieldValue('status') === 'APPROVED' ? (
                  <>
                    <Form.Item
                      name="newMonthlyPayment"
                      label="Giá thuê mới (VND/tháng)"
                      rules={[{ required: true, message: 'Vui lòng nhập giá thuê' }]}
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={value => value.replace(/\$\s?|(,*)/g, '')}
                        size="large"
                        min={0}
                      />
                    </Form.Item>

                    <Form.Item name="reviewNotes" label="Ghi chú (không bắt buộc)">
                      <TextArea
                        rows={3}
                        placeholder="Nhập ghi chú cho yêu cầu gia hạn..."
                        size="large"
                      />
                    </Form.Item>
                  </>
                ) : (
                  <Form.Item
                    name="reason"
                    label="Lý do từ chối"
                    rules={[{ required: true, message: 'Vui lòng nhập lý do từ chối' }]}
                  >
                    <TextArea
                      rows={4}
                      placeholder="Nhập lý do từ chối yêu cầu gia hạn..."
                      size="large"
                    />
                  </Form.Item>
                )
              }
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button onClick={() => setReviewModalVisible(false)} disabled={actionLoading}>
                  Hủy
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={actionLoading}
                  size="large"
                >
                  {actionLoading ? 'Đang xử lý...' : 'Xác nhận'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* Detail Modal */}
        <Modal
          title="Chi tiết yêu cầu gia hạn"
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          footer={null}
          width={700}
        >
          {selectedExtension && selectedExtension.originalContract && (
            <Descriptions column={2} bordered>
              <Descriptions.Item label="Mã hợp đồng" span={2}>
                {selectedExtension.originalContract.contractNumber}
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
                {contractExtensionService.formatCurrency(
                  contractExtensionService.calculateAdditionalCost(
                    selectedExtension.originalContract.monthlyPayment,
                    selectedExtension.durationMonths
                  )
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Lý do gia hạn" span={2}>
                <Paragraph>{selectedExtension.reason}</Paragraph>
              </Descriptions.Item>
            </Descriptions>
          )}
        </Modal>
      </Content>
    </Layout>
  );
};

export default OwnerExtensionPage;