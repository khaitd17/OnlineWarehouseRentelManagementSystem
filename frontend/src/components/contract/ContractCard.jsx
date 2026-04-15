import React from 'react';
import {
  Card,
  Button,
  Tag,
  Typography,
  Space,
  Row,
  Col,
  Tooltip,
  Alert
} from 'antd';
import {
  CalendarOutlined,
  DollarOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  HomeOutlined
} from '@ant-design/icons';
import contractExtensionService from '../../services/contractExtensionService';

const { Title, Text } = Typography;

const ContractCard = ({
  contract,
  onRequestExtension,
  showExtensionButton = true
}) => {
  // Check extension eligibility
  const eligibility = contractExtensionService.checkExtensionEligibility(contract);

  // Calculate days until end
  const endDate = new Date(contract.endDate);
  const today = new Date();
  const daysUntilEnd = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // Get status color and text
  const getStatusDisplay = (status) => {
    const statusMap = {
      'ACTIVE': { color: 'success', text: 'Đang hoạt động' },
      'PENDING_OWNER_SIGNATURE': { color: 'warning', text: 'Chờ chủ kho ký' },
      'PENDING_RENTER_SIGNATURE': { color: 'warning', text: 'Chờ người thuê ký' },
      'PENDING_PAYMENT': { color: 'processing', text: 'Chờ thanh toán' },
      'PAYMENT_FAILED': { color: 'error', text: 'Thanh toán thất bại' },
      'DRAFT': { color: 'default', text: 'Nháp' },
      'SIGNED': { color: 'processing', text: 'Đã ký' },
      'COMPLETED': { color: 'success', text: 'Đã hoàn thành' },
      'CLOSED': { color: 'success', text: 'Đã đóng' },
      'OVERDUE': { color: 'error', text: 'Quá hạn' },
      'TERMINATED': { color: 'error', text: 'Đã chấm dứt' },
      'PENDING_TERMINATION': { color: 'warning', text: 'Chờ chấm dứt' },
      'PENDING_CLOSE': { color: 'warning', text: 'Chờ đóng' },
      'CANCELLED': { color: 'default', text: 'Đã hủy' },
      'CANCELLED_BY_USER': { color: 'default', text: 'Người dùng hủy' },
      'CANCELLED_BY_OWNER': { color: 'default', text: 'Chủ kho hủy' },
      'CANCELLED_NO_PAYMENT': { color: 'default', text: 'Hủy - Không thanh toán' },
      'EXPIRED_SIGNATURE': { color: 'error', text: 'Hết hạn ký' },
      'EXPIRED_PAYMENT': { color: 'error', text: 'Hết hạn thanh toán' },
      'EXPIRED': { color: 'error', text: 'Hết hạn' }
    };
    return statusMap[status] || { color: 'default', text: status };
  };

  const statusDisplay = getStatusDisplay(contract.status);

  // Get urgency alert for expiring contracts
  const getExpiryAlert = () => {
    if (contract.status !== 'ACTIVE') return null;

    if (daysUntilEnd <= 7 && daysUntilEnd > 0) {
      return (
        <Alert
          message={`Hợp đồng sắp hết hạn trong ${daysUntilEnd} ngày`}
          type="warning"
          icon={<WarningOutlined />}
          size="small"
          style={{ marginBottom: 12 }}
          showIcon
        />
      );
    } else if (daysUntilEnd <= 0) {
      return (
        <Alert
          message="Hợp đồng đã hết hạn"
          type="error"
          icon={<WarningOutlined />}
          size="small"
          style={{ marginBottom: 12 }}
          showIcon
        />
      );
    }
    return null;
  };

  const handleExtensionClick = () => {
    if (eligibility.eligible && onRequestExtension) {
      onRequestExtension(contract);
    }
  };

  return (
    <Card
      hoverable
      style={{ height: '100%' }}
      styles={{ body: { padding: '20px' } }}
      actions={
        showExtensionButton && contract.status === 'ACTIVE'
          ? [
              eligibility.eligible ? (
                <Button
                  type="primary"
                  icon={<ClockCircleOutlined />}
                  onClick={handleExtensionClick}
                  size="small"
                >
                  Yêu cầu gia hạn
                </Button>
              ) : (
                <Tooltip title={eligibility.reason}>
                  <Button disabled size="small" icon={<ClockCircleOutlined />}>
                    Không thể gia hạn
                  </Button>
                </Tooltip>
              )
            ]
          : undefined
      }
    >
      {getExpiryAlert()}

      {/* Contract Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <Title level={5} style={{ margin: 0, color: '#0f172a' }}>
            {contract.contractNumber}
          </Title>
          <Tag color={statusDisplay.color} style={{ fontSize: '12px' }}>
            {statusDisplay.text}
          </Tag>
        </div>

        {contract.warehouseName && (
          <Text type="secondary">
            <HomeOutlined /> {contract.warehouseName}
          </Text>
        )}
      </div>

      {/* Contract Details */}
      <Row gutter={[0, 12]}>
        <Col span={24}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text type="secondary">
                <CalendarOutlined /> Ngày bắt đầu:
              </Text>
              <Text strong>
                {contractExtensionService.formatDate(contract.startDate)}
              </Text>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text type="secondary">
                <CalendarOutlined /> Ngày kết thúc:
              </Text>
              <Text strong style={{ color: daysUntilEnd <= 7 ? '#ff4d4f' : undefined }}>
                {contractExtensionService.formatDate(contract.endDate)}
              </Text>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text type="secondary">
                <DollarOutlined /> Tiền thuê/tháng:
              </Text>
              <Text strong style={{ color: '#0f172a', fontSize: '14px' }}>
                {contractExtensionService.formatCurrency(contract.monthlyPayment)}
              </Text>
            </div>

            {contract.status === 'ACTIVE' && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">Thời gian còn lại:</Text>
                <Text
                  strong
                  style={{
                    color: daysUntilEnd <= 7 ? '#ff4d4f' : daysUntilEnd <= 30 ? '#fa8c16' : '#52c41a'
                  }}
                >
                  {daysUntilEnd > 0 ? `${daysUntilEnd} ngày` : 'Đã hết hạn'}
                </Text>
              </div>
            )}
          </Space>
        </Col>
      </Row>

      {/* Extension eligibility info */}
      {!eligibility.eligible && contract.status === 'ACTIVE' && (
        <Alert
          message={eligibility.reason}
          type="warning"
          size="small"
          style={{ marginTop: 12 }}
          showIcon={false}
        />
      )}
    </Card>
  );
};

export default ContractCard;
