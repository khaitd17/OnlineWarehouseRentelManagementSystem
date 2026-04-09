import React, { useState } from 'react';
import { Card, Button, Modal, Spin, Typography, Space, message, Row, Col } from 'antd';
import { CheckCircleOutlined, StarOutlined, RocketOutlined } from '@ant-design/icons';
import subscriptionService from '../services/subscriptionService';

const { Title, Text, Paragraph } = Typography;

const SubscriptionPage = () => {
  const [loading, setLoading] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState(null);

  const handleSubscribe = async (planValue) => {
    try {
      setLoading(true);
      const res = await subscriptionService.createSubscription(planValue);
      if (res.data?.success) {
        setPaymentInfo(res.data.paymentInfo);
        setQrModalVisible(true);
      } else {
        message.error(res.data?.message || 'Có lỗi xảy ra khi tạo mã thanh toán.');
      }
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.message || 'Có lỗi xảy ra.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const handleAuthChange = () => {
      if (qrModalVisible) {
        setQrModalVisible(false);
        setPaymentInfo(null);
        Modal.success({
          title: 'Thanh toán thành công Cảm ơn',
          content: 'Gói dịch vụ cao cấp đã được kích hoạt. Hãy tận hưởng nhé!',
          onOk: () => { window.location.href = '/owner-dashboard'; } // redirect to dashboard or home
        });
      }
    };
    window.addEventListener('authChange', handleAuthChange);
    return () => window.removeEventListener('authChange', handleAuthChange);
  }, [qrModalVisible]);

  const handleModalClose = () => {
    setQrModalVisible(false);
    setPaymentInfo(null);
    message.info('Trạng thái giao dịch sẽ được cập nhật tự động khi thanh toán hoàn tất.');
  };

  return (
    <div style={{
      maxWidth: '1000px',
      margin: '0 auto',
      background: '#fff',
      padding: '40px',
      borderRadius: '24px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.05)',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#1e293b' }}>
          Gói Dịch Vụ
        </Title>
        <Text style={{ fontSize: '16px', color: '#64748b' }}>
          Nâng cấp để trải nghiệm toàn bộ tính năng quản lý kho cao cấp
        </Text>
      </div>

      <Row gutter={[32, 32]} justify="center">
        {/* Basic Plan */}
        <Col xs={24} md={11}>
          <div style={{
            position: 'relative',
            background: '#f8fafc',
            border: '2px solid #e2e8f0',
            borderRadius: '24px',
            padding: '32px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: '#e0f2fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '24px'
            }}>
              <StarOutlined style={{ fontSize: '28px', color: '#38bdf8' }} />
            </div>
            
            <Title level={3} style={{ marginTop: 0, color: '#0f172a', fontWeight: 700 }}>
              Gói Tiêu Chuẩn
            </Title>
            <div style={{ margin: '16px 0 24px' }}>
              <span style={{ fontSize: '36px', fontWeight: 800, color: '#0f172a' }}>2.000₫</span>
              <span style={{ fontSize: '16px', color: '#64748b', fontWeight: 500 }}> / 30 ngày</span>
            </div>

            <Paragraph style={{ color: '#475569', fontSize: '15px' }}>
              Dành cho cá nhân hoặc doanh nghiệp nhỏ mới bắt đầu quản lý.
            </Paragraph>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', flex: 1 }}>
               {['Quản lý 1 nhà kho', 'Số lượng nhân viên tối đa: 5', 'Giới hạn biểu đồ thống kê cơ bản', 'Hỗ trợ khách hàng qua email'].map((feature, idx) => (
                  <li key={idx} style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <CheckCircleOutlined style={{ color: '#10b981', fontSize: '18px' }} />
                    <span style={{ color: '#334155', fontSize: '15px', fontWeight: 500 }}>{feature}</span>
                  </li>
               ))}
            </ul>

            <Button size="large" onClick={() => handleSubscribe(0)} loading={loading} style={{
              height: '52px', borderRadius: '12px', fontSize: '16px', fontWeight: 600,
              background: '#fff', color: '#0f172a', border: '2px solid #cbd5e1'
            }} block>
              Mua Gói Tiêu Chuẩn
            </Button>
          </div>
        </Col>

        {/* Premium Plan */}
        <Col xs={24} md={11}>
          <div style={{
            position: 'relative',
            background: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
            borderRadius: '24px',
            padding: '32px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            boxShadow: '0 20px 40px rgba(15, 23, 42, 0.4)'
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
          >
            <div style={{
              position: 'absolute',
              top: '-16px', left: '50%', transform: 'translateX(-50%)',
              background: 'linear-gradient(90deg, #38bdf8 0%, #818cf8 100%)',
              color: '#fff', padding: '6px 20px', borderRadius: '30px',
              fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px'
            }}>
              Đề xuất
            </div>

            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '24px'
            }}>
              <RocketOutlined style={{ fontSize: '28px', color: '#818cf8' }} />
            </div>
            
            <Title level={3} style={{ marginTop: 0, color: '#fff', fontWeight: 700 }}>
              Gói Nâng Cao
            </Title>
            <div style={{ margin: '16px 0 24px' }}>
              <span style={{ fontSize: '36px', fontWeight: 800, color: '#fff' }}>500.000₫</span>
              <span style={{ fontSize: '16px', color: '#94a3b8', fontWeight: 500 }}> / 30 ngày</span>
            </div>

            <Paragraph style={{ color: '#cbd5e1', fontSize: '15px' }}>
              Trải nghiệm không giới hạn mọi nhu cầu và tùy chọn nâng cao.
            </Paragraph>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', flex: 1 }}>
               {['Quản lý số lượng kho mở rộng', 'Không giới hạn nhân viên', 'Biểu đồ công suất theo thời gian thực', 'Phân ca nhân viên tự động', 'Hỗ trợ ưu tiên 24/7'].map((feature, idx) => (
                  <li key={idx} style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <CheckCircleOutlined style={{ color: '#38bdf8', fontSize: '18px' }} />
                    <span style={{ color: '#f1f5f9', fontSize: '15px', fontWeight: 500 }}>{feature}</span>
                  </li>
               ))}
            </ul>

            <Button type="primary" size="large" onClick={() => handleSubscribe(1)} loading={loading} style={{
              height: '52px', borderRadius: '12px', fontSize: '16px', fontWeight: 700,
              background: 'linear-gradient(90deg, #38bdf8 0%, #818cf8 100%)', border: 'none'
            }} block>
              Mua Gói Nâng Cao
            </Button>
          </div>
        </Col>
      </Row>

      <Modal
        visible={qrModalVisible}
        onCancel={handleModalClose}
        footer={null}
        width={400}
        centered
        className="qr-payment-modal"
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Title level={3} style={{ color: '#0f172a', fontWeight: 700, marginBottom: '8px' }}>
            Thanh Toán Gói
          </Title>
          <Paragraph style={{ color: '#64748b', fontSize: '15px', marginBottom: '24px' }}>
            Quét mã QR bằng ứng dụng ngân hàng của bạn. Hệ thống tự động xác nhận sau 1-3 phút.
          </Paragraph>

          {paymentInfo ? (
            <div style={{
              background: '#f8fafc',
              padding: '24px',
              borderRadius: '20px',
              border: '1px solid #e2e8f0',
              display: 'inline-block'
            }}>
              <img 
                src={paymentInfo.qrImageUrl} 
                alt="QR Code" 
                style={{ width: '250px', height: '250px', objectFit: 'cover', borderRadius: '12px', marginBottom: '16px' }}
              />
              <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Mã giao dịch:</p>
                <p style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a', letterSpacing: '1px' }}>
                  {paymentInfo.paymentCode}
                </p>
              </div>
            </div>
          ) : (
            <Spin size="large" />
          )}

          <div style={{ marginTop: '24px' }}>
            <Button onClick={handleModalClose} style={{ height: '44px', borderRadius: '8px', fontWeight: 600 }}>
              Đóng và Chờ xác nhận
            </Button>
          </div>
        </div>
      </Modal>

      <style>{`
        .qr-payment-modal .ant-modal-content {
          border-radius: 24px;
          padding: 16px;
        }
      `}</style>
    </div>
  );
};

export default SubscriptionPage;
