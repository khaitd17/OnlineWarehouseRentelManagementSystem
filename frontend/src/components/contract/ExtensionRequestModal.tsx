import React, { useState, useCallback } from 'react';
import {
  Modal,
  Form,
  Select,
  Input,
  Alert,
  Button,
  Card,
  Row,
  Col,
  Typography,
  Divider,
  Space,
  message
} from 'antd';
import {
  CalendarOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import contractExtensionService from '../../services/contractExtensionService';
import {
  Contract,
  ExtensionFormData,
  ExtensionRequestModalProps
} from '../../types/contractExtension';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const ExtensionRequestModal: React.FC<ExtensionRequestModalProps> = ({
  contract,
  onClose,
  onSuccess
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [durationMonths, setDurationMonths] = useState(3);

  // Calculate new end date and additional cost
  const newEndDate = contractExtensionService.calculateNewEndDate(contract.endDate, durationMonths);
  const additionalCost = contractExtensionService.calculateAdditionalCost(contract.monthlyPayment, durationMonths);

  // Get options
  const durationOptions = contractExtensionService.getDurationOptions();
  const reasonTemplates = contractExtensionService.getReasonTemplates();

  const handleTemplateChange = useCallback((templateValue: string) => {
    if (templateValue) {
      form.setFieldsValue({ reason: templateValue });
    }
  }, [form]);

  const handleSubmit = async (values: ExtensionFormData) => {
    try {
      setLoading(true);

      // Validate form data
      const validation = contractExtensionService.validateExtensionRequest({
        contractId: contract.contractId,
        durationMonths: values.durationMonths,
        reason: values.reason
      });

      if (!validation.isValid) {
        validation.errors.forEach(error => message.error(error));
        return;
      }

      await contractExtensionService.requestExtension({
        contractId: contract.contractId,
        durationMonths: values.durationMonths,
        reason: values.reason
      });

      message.success('Gửi yêu cầu gia hạn thành công!');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Có lỗi xảy ra khi gửi yêu cầu gia hạn');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <ClockCircleOutlined />
          <span>Yêu cầu gia hạn hợp đồng</span>
        </Space>
      }
      open={true}
      onCancel={onClose}
      footer={null}
      width={700}
      destroyOnClose
    >
      <Alert
        message={`Hợp đồng: ${contract.contractNumber}`}
        type="info"
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: 24 }}
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          durationMonths: 3,
          reason: ''
        }}
      >
        {/* Duration Selection */}
        <Form.Item
          name="durationMonths"
          label="Thời gian gia hạn"
          rules={[{ required: true, message: 'Vui lòng chọn thời gian gia hạn' }]}
        >
          <Select
            placeholder="Chọn thời gian gia hạn"
            onChange={setDurationMonths}
            size="large"
          >
            {durationOptions.map((option) => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* Summary Card */}
        <Card
          style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            border: '1px solid #bbf7d0',
            marginBottom: 24
          }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text type="secondary">
                    <CalendarOutlined /> Ngày kết thúc hiện tại:
                  </Text>
                  <Text strong>{contractExtensionService.formatDate(contract.endDate)}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text type="secondary">
                    <CalendarOutlined /> Ngày kết thúc mới:
                  </Text>
                  <Text strong style={{ color: '#16a34a' }}>
                    {contractExtensionService.formatDate(newEndDate.toISOString())}
                  </Text>
                </div>
              </Space>
            </Col>
            <Col xs={24} sm={12}>
              <Divider type="vertical" style={{ height: '100%', margin: '0 16px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
                <Text type="secondary">
                  <DollarOutlined /> Chi phí gia hạn (dự kiến):
                </Text>
                <Title level={4} style={{ margin: 0, color: '#0f172a' }}>
                  {contractExtensionService.formatCurrency(additionalCost)}
                </Title>
              </div>
            </Col>
          </Row>
        </Card>

        {/* Reason Template Selection */}
        <Form.Item label="Mẫu lý do">
          <Select
            placeholder="-- Chọn mẫu lý do --"
            onChange={handleTemplateChange}
            allowClear
            size="large"
          >
            {reasonTemplates.slice(1).map((template) => (
              <Option key={template.value} value={template.value}>
                {template.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* Reason Input */}
        <Form.Item
          name="reason"
          label="Lý do gia hạn"
          rules={[
            { required: true, message: 'Vui lòng nhập lý do gia hạn' },
            { min: 10, message: 'Lý do phải có ít nhất 10 ký tự' }
          ]}
        >
          <TextArea
            rows={4}
            placeholder="Nhập lý do yêu cầu gia hạn hợp đồng..."
            showCount
            maxLength={500}
            size="large"
          />
        </Form.Item>

        {/* Form Actions */}
        <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button size="large" onClick={onClose} disabled={loading}>
              Hủy bỏ
            </Button>
            <Button
              type="primary"
              size="large"
              htmlType="submit"
              loading={loading}
              style={{ minWidth: 140 }}
            >
              {loading ? 'Đang gửi...' : 'Gửi yêu cầu gia hạn'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ExtensionRequestModal;