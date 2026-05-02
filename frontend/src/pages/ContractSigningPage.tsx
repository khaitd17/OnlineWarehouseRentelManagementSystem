import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Spin,
  Modal
} from 'antd';
import {
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  MailOutlined,
  LockOutlined,
  ContainerOutlined,
  CalendarOutlined,
  DollarOutlined
} from '@ant-design/icons';
import contractExtensionService from '../services/contractExtensionService';
import {
  Contract,
  ContractExtension
} from '../types/contractExtension';

const { Title, Text, Paragraph } = Typography;
const { Content } = Layout;
const { Step } = Steps;

interface ContractSigningPageProps {
  contractId?: number;
  extensionId?: number;
  userRole: 'OWNER' | 'RENTER';
}

// Mock contract service - replace with real API calls
const contractService = {
  getContractById: async (contractId: number): Promise<Contract> => {
    // Mock implementation
    throw new Error('Not implemented');
  },
  sendSigningOTP: async (contractId: number): Promise<{ success: boolean; message: string }> => {
    // Mock implementation
    return { success: true, message: 'OTP ─æ├ú ─æ╞░ß╗úc gß╗¡i' };
  },
  verifyOTPAndSign: async (contractId: number, otp: string): Promise<{ success: boolean; message: string }> => {
    // Mock implementation
    return { success: true, message: 'K├╜ th├ánh c├┤ng' };
  }
};

const ContractSigningPage: React.FC<ContractSigningPageProps> = ({
  contractId,
  extensionId,
  userRole
}) => {
  const [contract, setContract] = useState<Contract | null>(null);
  const [extension, setExtension] = useState<ContractExtension | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);

  const [form] = Form.useForm();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load contract data
  const loadData = useCallback(async () => {
    if (!contractId) return;

    try {
      setLoading(true);
      const [contractData, extensionData] = await Promise.all([
        contractService.getContractById(contractId),
        extensionId ? contractExtensionService.getExtensionById(extensionId) : Promise.resolve(null)
      ]);

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
    } catch (error: any) {
      message.error('Kh├┤ng thß╗â tß║úi dß╗» liß╗çu hß╗úp ─æß╗ông: ' + 'Có lỗi xảy ra');
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
      const response = await contractService.sendSigningOTP(contractId);

      if (response.success) {
        setOtpSent(true);
        setCountdown(60); // 60 seconds countdown
        setCurrentStep(1);
        message.success('M├ú OTP ─æ├ú ─æ╞░ß╗úc gß╗¡i ─æß║┐n email cß╗ºa bß║ín');
      } else {
        message.error(response.message || 'Kh├┤ng thß╗â gß╗¡i OTP');
      }
    } catch (error: any) {
      message.error('Lß╗ùi: ' + (error.response?.data?.message || 'Có lỗi xảy ra'));
    } finally {
      setSendingOtp(false);
    }
  };

  // Verify OTP and sign
  const handleSign = async () => {
    if (!contractId || !otp) {
      message.error('Vui l├▓ng nhß║¡p m├ú OTP');
      return;
    }

    try {
      setSigning(true);
      const response = await contractService.verifyOTPAndSign(contractId, otp);

      if (response.success) {
        setSigned(true);
        setCurrentStep(userRole === 'OWNER' ? 2 : 3);
        message.success('K├╜ hß╗úp ─æß╗ông th├ánh c├┤ng!');

        // Reload data to update status
        setTimeout(() => {
          loadData();
        }, 1000);
      } else {
        message.error(response.message || 'M├ú OTP kh├┤ng ─æ├║ng');
      }
    } catch (error: any) {
      message.error('Lß╗ùi: ' + (error.response?.data?.message || 'Có lỗi xảy ra'));
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
            message="Kh├┤ng t├¼m thß║Ñy hß╗úp ─æß╗ông"
            description="Hß╗úp ─æß╗ông kh├┤ng tß╗ôn tß║íi hoß║╖c bß║ín kh├┤ng c├│ quyß╗ün truy cß║¡p."
            type="error"
            showIcon
          />
        </Content>
      </Layout>
    );
  }

  const steps = [
    {
      title: 'X├íc thß╗▒c',
      description: 'Gß╗¡i m├ú OTP',
      icon: <MailOutlined />
    },
    {
      title: 'K├╜ hß╗úp ─æß╗ông',
      description: 'Nhß║¡p OTP ─æß╗â k├╜',
      icon: <LockOutlined />
    },
    ...(userRole === 'OWNER' ? [{
      title: 'Chß╗¥ ng╞░ß╗¥i thu├¬',
      description: '─Éß╗úi ng╞░ß╗¥i thu├¬ k├╜',
      icon: <ClockCircleOutlined />
    }] : []),
    {
      title: 'Ho├án th├ánh',
      description: 'K├╜ th├ánh c├┤ng',
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
            <Title level={2}>K├╜ hß╗úp ─æß╗ông ─æiß╗çn tß╗¡</Title>
            <Text type="secondary">
              {extension ? 'K├╜ hß╗úp ─æß╗ông gia hß║ín' : 'K├╜ hß╗úp ─æß╗ông thu├¬ kho'}
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
        <Card title={<Space><ContainerOutlined />Th├┤ng tin hß╗úp ─æß╗ông</Space>} style={{ marginBottom: 24 }}>
          <Descriptions column={2} bordered>
            <Descriptions.Item label="M├ú hß╗úp ─æß╗ông" span={2}>
              <Text strong>{contract.contractNumber}</Text>
            </Descriptions.Item>

            {extension ? (
              <>
                <Descriptions.Item label="Loß║íi">
                  <Text>Hß╗úp ─æß╗ông gia hß║ín</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Thß╗¥i gian gia hß║ín">
                  <Text>{contractExtensionService.formatDuration(extension.durationMonths)}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Ng├áy kß║┐t th├║c c┼⌐">
                  <Text>{contractExtensionService.formatDate(extension.originalContract?.endDate)}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Ng├áy kß║┐t th├║c mß╗¢i">
                  <Text style={{ color: '#52c41a', fontWeight: 'bold' }}>
                    {contractExtensionService.formatDate(contract.endDate)}
                  </Text>
                </Descriptions.Item>
              </>
            ) : (
              <>
                <Descriptions.Item label="Ng├áy bß║»t ─æß║ºu">
                  <Text>{contractExtensionService.formatDate(contract.startDate)}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Ng├áy kß║┐t th├║c">
                  <Text>{contractExtensionService.formatDate(contract.endDate)}</Text>
                </Descriptions.Item>
              </>
            )}

            <Descriptions.Item label="Tiß╗ün thu├¬/th├íng" span={2}>
              <Text style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>
                {contractExtensionService.formatCurrency(contract.monthlyPayment)}
              </Text>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Signing Process */}
        <Card title="Quy tr├¼nh k├╜">
          {currentStep === 0 && !signed && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <MailOutlined style={{ fontSize: '48px', color: '#1677ff', marginBottom: 16 }} />
              <Title level={4}>Gß╗¡i m├ú x├íc thß╗▒c OTP</Title>
              <Paragraph>
                Ch├║ng t├┤i sß║╜ gß╗¡i m├ú OTP ─æß║┐n email cß╗ºa bß║ín ─æß╗â x├íc thß╗▒c danh t├¡nh tr╞░ß╗¢c khi k├╜ hß╗úp ─æß╗ông.
              </Paragraph>
              <Button
                type="primary"
                size="large"
                onClick={handleSendOtp}
                loading={sendingOtp}
                style={{ minWidth: 140 }}
              >
                {sendingOtp ? '─Éang gß╗¡i...' : 'Gß╗¡i m├ú OTP'}
              </Button>
            </div>
          )}

          {currentStep === 1 && !signed && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <LockOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: 16 }} />
              <Title level={4}>Nhß║¡p m├ú OTP ─æß╗â k├╜ hß╗úp ─æß╗ông</Title>
              <Paragraph>
                M├ú OTP ─æ├ú ─æ╞░ß╗úc gß╗¡i ─æß║┐n email cß╗ºa bß║ín. Vui l├▓ng kiß╗âm tra v├á nhß║¡p m├ú b├¬n d╞░ß╗¢i.
              </Paragraph>

              <Form form={form} style={{ maxWidth: '300px', margin: '0 auto' }}>
                <Form.Item>
                  <Input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Nhß║¡p m├ú OTP"
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
                      {signing ? '─Éang k├╜...' : 'X├íc nhß║¡n v├á k├╜ hß╗úp ─æß╗ông'}
                    </Button>

                    <Button
                      type="link"
                      onClick={handleResendOtp}
                      disabled={countdown > 0 || sendingOtp}
                      size="small"
                    >
                      {countdown > 0 ? `Gß╗¡i lß║íi sau ${countdown}s` : 'Gß╗¡i lß║íi m├ú OTP'}
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </div>
          )}

          {currentStep === 2 && userRole === 'OWNER' && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <ClockCircleOutlined style={{ fontSize: '48px', color: '#fa8c16', marginBottom: 16 }} />
              <Title level={4}>Chß╗¥ ng╞░ß╗¥i thu├¬ k├╜ hß╗úp ─æß╗ông</Title>
              <Paragraph>
                Bß║ín ─æ├ú k├╜ th├ánh c├┤ng. Hß╗ç thß╗æng ─æang chß╗¥ ng╞░ß╗¥i thu├¬ k├╜ hß╗úp ─æß╗ông ─æß╗â ho├án tß║Ñt quy tr├¼nh.
              </Paragraph>
              <Alert
                message="Ng╞░ß╗¥i thu├¬ sß║╜ nhß║¡n ─æ╞░ß╗úc th├┤ng b├ío ─æß╗â k├╜ hß╗úp ─æß╗ông"
                type="info"
                showIcon
              />
            </div>
          )}

          {signed && currentStep >= 3 && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <CheckCircleOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: 16 }} />
              <Title level={4}>K├╜ hß╗úp ─æß╗ông th├ánh c├┤ng!</Title>
              <Paragraph>
                {extension
                  ? 'Hß╗úp ─æß╗ông gia hß║ín ─æ├ú ─æ╞░ß╗úc k├╜ th├ánh c├┤ng. Hß╗úp ─æß╗ông sß║╜ c├│ hiß╗çu lß╗▒c sau khi thanh to├ín.'
                  : 'Hß╗úp ─æß╗ông ─æ├ú ─æ╞░ß╗úc k├╜ th├ánh c├┤ng. Vui l├▓ng tiß║┐n h├ánh thanh to├ín ─æß╗â k├¡ch hoß║ít hß╗úp ─æß╗ông.'
                }
              </Paragraph>
              {contract.status === 'PENDING_PAYMENT' && (
                <Button type="primary" size="large">
                  <DollarOutlined /> Tiß║┐n h├ánh thanh to├ín
                </Button>
              )}
            </div>
          )}
        </Card>
      </Content>
    </Layout>
  );
};

export default ContractSigningPage;
