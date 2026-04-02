import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Layout,
  Card,
  Typography,
  Button,
  Input,
  Form,
  Space,
  Steps,
  Alert,
  Row,
  Col,
  Descriptions,
  message,
  Spin
} from 'antd';
import {
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  MailOutlined,
  LockOutlined,
  ContainerOutlined,
  DollarOutlined
} from '@ant-design/icons';
import contractExtensionService from '../../services/contractExtensionService';

const { Title, Text, Paragraph } = Typography;
const { Content } = Layout;
const { Step } = Steps;

// Mock contract service - replace with real API calls
const contractService = {
  getContractById: async (contractId) => {
    // Mock implementation
    throw new Error('Not implemented');
  },
  sendSigningOTP: async (contractId) => {
    // Mock implementation
    return { success: true, message: 'OTP đã được gửi' };
  },
  verifyOTPAndSign: async (contractId, otp) => {
    // Mock implementation
    return { success: true, message: 'Ký thành công' };
  }
};

const ContractSigningWrapper = ({ userRole }) => {
  const { contractId, extensionId } = useParams();
  const [contract, setContract] = useState(null);
  const [extension, setExtension] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);

  const [form] = Form.useForm();
  const intervalRef = useRef(null);

  // Load contract data
  const loadData = useCallback(async () => {
    if (!contractId) return;

    try {
      setLoading(true);
      const promises = [contractService.getContractById(parseInt(contractId, 10))];

      if (extensionId) {
        promises.push(contractExtensionService.getExtensionById(parseInt(extensionId, 10)));
      }

      const [contractData, extensionData = null] = await Promise.all(promises);

      setContract(contractData);
      setExtension(extensionData);

      // Determine step based on contract status
      if (contractData.status === 'PENDING_OWNER_SIGNATURE' && userRole === 'OWNER') {
        setCurrentStep(0);
      } else if (contractData.status === 'PENDING_RENTER_SIGNATURE' && userRole === 'RENTER') {
        setCurrentStep(0);
      } else if (contractData.status === 'PENDING_PAYMENT') {
        setCurrentStep(2);
      } else if (contractData.status === 'ACTIVE') {
        setCurrentStep(3);
        setSigned(true);
      }
    } catch (error) {
      message.error('Không thể tải dữ liệu hợp đồng: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [contractId, extensionId, userRole]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      intervalRef.current = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [countdown]);

  // Send OTP
  const handleSendOtp = async () => {
    if (!contractId) return;

    try {
      setSendingOtp(true);
      const response = await contractService.sendSigningOTP(parseInt(contractId, 10));

      if (response.success) {
        setOtpSent(true);
        setCountdown(60); // 60 seconds countdown
        setCurrentStep(1);
        message.success('Mã OTP đã được gửi đến email của bạn');
      } else {
        message.error(response.message || 'Không thể gửi OTP');
      }
    } catch (error) {
      message.error('Lỗi: ' + (error.response?.data?.message || error.message));
    } finally {
      setSendingOtp(false);
    }
  };

  // Verify OTP and sign
  const handleSign = async () => {
    if (!contractId || !otp) {
      message.error('Vui lòng nhập mã OTP');
      return;
    }

    try {
      setSigning(true);
      const response = await contractService.verifyOTPAndSign(parseInt(contractId, 10), otp);

      if (response.success) {
        setSigned(true);
        setCurrentStep(userRole === 'OWNER' ? 2 : 3);
        message.success('Ký hợp đồng thành công!');

        // Reload data to update status
        setTimeout(() => {
          loadData();
        }, 1000);
      } else {
        message.error(response.message || 'Mã OTP không đúng');
      }
    } catch (error) {
      message.error('Lỗi: ' + (error.response?.data?.message || error.message));
    } finally {
      setSigning(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    await handleSendOtp();
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

  if (!contract) {
    return (
      <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        <Content style={{ padding: '24px' }}>
          <Alert
            message="Không tìm thấy hợp đồng"
            description="Hợp đồng không tồn tại hoặc bạn không có quyền truy cập."
            type="error"
            showIcon
          />
        </Content>
      </Layout>
    );
  }

  const steps = [
    {
      title: 'Xác thực',
      description: 'Gửi mã OTP',
      icon: <MailOutlined />
    },
    {
      title: 'Ký hợp đồng',
      description: 'Nhập OTP để ký',
      icon: <LockOutlined />
    },
    ...(userRole === 'OWNER' ? [{
      title: 'Chờ người thuê',
      description: 'Đợi người thuê ký',
      icon: <ClockCircleOutlined />
    }] : []),
    {
      title: 'Hoàn thành',
      description: 'Ký thành công',
      icon: <CheckCircleOutlined />
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Content style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <Card style={{ marginBottom: 24 }}>
          <div style={{ textAlign: 'center' }}>
            <SafetyCertificateOutlined style={{ fontSize: '48px', color: '#1677ff', marginBottom: 16 }} />
            <Title level={2}>Ký hợp đồng điện tử</Title>
            <Text type="secondary">
              {extension ? 'Ký hợp đồng gia hạn' : 'Ký hợp đồng thuê kho'}
            </Text>
          </div>
        </Card>

        {/* Steps */}
        <Card style={{ marginBottom: 24 }}>
          <Steps current={currentStep}>
            {steps.map((step, index) => (
              <Step
                key={index}
                title={step.title}
                description={step.description}
                icon={step.icon}
              />
            ))}
          </Steps>
        </Card>

        {/* Contract Details */}
        <Card title={<Space><ContainerOutlined />Thông tin hợp đồng</Space>} style={{ marginBottom: 24 }}>
          <Descriptions column={2} bordered>
            <Descriptions.Item label="Mã hợp đồng" span={2}>
              <Text strong>{contract.contractNumber}</Text>
            </Descriptions.Item>

            {extension ? (
              <>
                <Descriptions.Item label="Loại">
                  <Text>Hợp đồng gia hạn</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Thời gian gia hạn">
                  <Text>{contractExtensionService.formatDuration(extension.durationMonths)}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Ngày kết thúc cũ">
                  <Text>{contractExtensionService.formatDate(extension.originalContract?.endDate)}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Ngày kết thúc mới">
                  <Text style={{ color: '#52c41a', fontWeight: 'bold' }}>
                    {contractExtensionService.formatDate(contract.endDate)}
                  </Text>
                </Descriptions.Item>
              </>
            ) : (
              <>
                <Descriptions.Item label="Ngày bắt đầu">
                  <Text>{contractExtensionService.formatDate(contract.startDate)}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Ngày kết thúc">
                  <Text>{contractExtensionService.formatDate(contract.endDate)}</Text>
                </Descriptions.Item>
              </>
            )}

            <Descriptions.Item label="Tiền thuê/tháng" span={2}>
              <Text style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>
                {contractExtensionService.formatCurrency(contract.monthlyPayment)}
              </Text>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Signing Process */}
        <Card title="Quy trình ký">
          {currentStep === 0 && !signed && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <MailOutlined style={{ fontSize: '48px', color: '#1677ff', marginBottom: 16 }} />
              <Title level={4}>Gửi mã xác thực OTP</Title>
              <Paragraph>
                Chúng tôi sẽ gửi mã OTP đến email của bạn để xác thực danh tính trước khi ký hợp đồng.
              </Paragraph>
              <Button
                type="primary"
                size="large"
                onClick={handleSendOtp}
                loading={sendingOtp}
                style={{ minWidth: 140 }}
              >
                {sendingOtp ? 'Đang gửi...' : 'Gửi mã OTP'}
              </Button>
            </div>
          )}

          {currentStep === 1 && !signed && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <LockOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: 16 }} />
              <Title level={4}>Nhập mã OTP để ký hợp đồng</Title>
              <Paragraph>
                Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra và nhập mã bên dưới.
              </Paragraph>

              <Form form={form} style={{ maxWidth: '300px', margin: '0 auto' }}>
                <Form.Item>
                  <Input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Nhập mã OTP"
                    size="large"
                    maxLength={6}
                    style={{ textAlign: 'center', fontSize: '18px', letterSpacing: '2px' }}
                  />
                </Form.Item>
                <Form.Item>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Button
                      type="primary"
                      size="large"
                      onClick={handleSign}
                      loading={signing}
                      disabled={!otp || otp.length < 4}
                      block
                    >
                      {signing ? 'Đang ký...' : 'Xác nhận và ký hợp đồng'}
                    </Button>

                    <Button
                      type="link"
                      onClick={handleResendOtp}
                      disabled={countdown > 0 || sendingOtp}
                      size="small"
                    >
                      {countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Gửi lại mã OTP'}
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </div>
          )}

          {currentStep === 2 && userRole === 'OWNER' && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <ClockCircleOutlined style={{ fontSize: '48px', color: '#fa8c16', marginBottom: 16 }} />
              <Title level={4}>Chờ người thuê ký hợp đồng</Title>
              <Paragraph>
                Bạn đã ký thành công. Hệ thống đang chờ người thuê ký hợp đồng để hoàn tất quy trình.
              </Paragraph>
              <Alert
                message="Người thuê sẽ nhận được thông báo để ký hợp đồng"
                type="info"
                showIcon
              />
            </div>
          )}

          {signed && currentStep >= 3 && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <CheckCircleOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: 16 }} />
              <Title level={4}>Ký hợp đồng thành công!</Title>
              <Paragraph>
                {extension
                  ? 'Hợp đồng gia hạn đã được ký thành công. Hợp đồng sẽ có hiệu lực sau khi thanh toán.'
                  : 'Hợp đồng đã được ký thành công. Vui lòng tiến hành thanh toán để kích hoạt hợp đồng.'
                }
              </Paragraph>
              {contract.status === 'PENDING_PAYMENT' && (
                <Button type="primary" size="large">
                  <DollarOutlined /> Tiến hành thanh toán
                </Button>
              )}
            </div>
          )}
        </Card>
      </Content>
    </Layout>
  );
};

export default ContractSigningWrapper;