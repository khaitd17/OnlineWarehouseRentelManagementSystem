import React, { useState } from 'react';
import { Card, Button, Modal, Spin, Typography, Space, message, Row, Col } from 'antd';
import { CheckCircleOutlined, StarOutlined, RocketOutlined } from '@ant-design/icons';
import subscriptionService from '../services/subscriptionService';
import authService from '../services/authService';

const { Title, Text, Paragraph } = Typography;

const SubscriptionPage = () => {
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [packages, setPackages] = useState([]);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [targetPlan, setTargetPlan] = useState("");

  React.useEffect(() => {
    const loadPackages = async () => {
      try {
        const res = await subscriptionService.getPackages();
        if (res.data?.success) {
          setPackages(res.data.data || []);
        }
      } catch (err) {
        console.error("Failed to load packages", err);
      } finally {
        setFetchLoading(false);
      }
    };
    loadPackages();
  }, []);

  const handleSubscribe = async (planValue) => {
    try {
      setLoading(true);
      const res = await subscriptionService.getPreview(planValue);
      if (res.data?.success) {
        setPreviewData(res.data);
        setTargetPlan(planValue);
        setConfirmModalVisible(true);
      } else {
        message.error(res.data?.message || 'Không thể lấy thông tin xem trước.');
      }
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.message || 'Có lỗi xảy ra.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSubscription = async () => {
    try {
      setLoading(true);
      const res = await subscriptionService.createSubscription(targetPlan);
      if (res.data?.success) {
        setConfirmModalVisible(false);
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

  React.useEffect(() => {
    if (!qrModalVisible || !paymentInfo?.paymentCode) return;

    let cancelled = false;
    let timerId;

    const pollStatus = async () => {
      try {
        const res = await subscriptionService.getSubscriptionStatus();
        if (res.data?.success && res.data?.isActive) {
          await authService.refreshWarehouseContext();
          window.dispatchEvent(new Event("authChange"));
          return;
        }
      } catch (err) {
        console.warn("Failed to sync subscription status", err);
      }

      if (!cancelled) {
        timerId = setTimeout(pollStatus, 5000);
      }
    };

    pollStatus();

    return () => {
      cancelled = true;
      if (timerId) clearTimeout(timerId);
    };
  }, [qrModalVisible, paymentInfo?.paymentCode]);

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
        {fetchLoading ? (
            <div style={{ textAlign: 'center', width: '100%', padding: '40px' }}>
                <Spin size="large" />
                <p style={{ marginTop: '16px', color: '#64748b' }}>Đang tải gói cước...</p>
            </div>
        ) : packages.length === 0 ? (
            <div style={{ textAlign: 'center', width: '100%', padding: '40px' }}>
                <p style={{ color: '#64748b' }}>Hiện chưa có gói cước nào.</p>
            </div>
        ) : (
            packages.map((pkg, idx) => {
                const isPremium = pkg.price > 100000;
                return (
                    <Col xs={24} md={11} key={pkg.packageId}>
                      <div style={{
                        position: 'relative',
                        background: isPremium ? 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)' : '#f8fafc',
                        border: isPremium ? 'none' : '2px solid #e2e8f0',
                        borderRadius: '24px',
                        padding: '32px',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        boxShadow: isPremium ? '0 20px 40px rgba(15, 23, 42, 0.4)' : 'none'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px)'; if (!isPremium) e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.08)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; if (!isPremium) e.currentTarget.style.boxShadow = 'none'; }}
                      >
                        {isPremium && (
                            <div style={{
                              position: 'absolute',
                              top: '-16px', left: '50%', transform: 'translateX(-50%)',
                              background: 'linear-gradient(90deg, #38bdf8 0%, #818cf8 100%)',
                              color: '#fff', padding: '6px 20px', borderRadius: '30px',
                              fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px'
                            }}>
                              Đề xuất
                            </div>
                        )}
            
                        <div style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '16px',
                          background: isPremium ? 'rgba(255,255,255,0.1)' : '#e0f2fe',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 24px auto'
                        }}>
                          {isPremium ? <RocketOutlined style={{ fontSize: '28px', color: '#818cf8' }} /> : <StarOutlined style={{ fontSize: '28px', color: '#38bdf8' }} />}
                        </div>
                        
                        <Title level={3} style={{ marginTop: 0, color: isPremium ? '#fff' : '#0f172a', fontWeight: 700, textAlign: 'center' }}>
                          {pkg.name}
                        </Title>
                        <div style={{ margin: '16px 0 24px', textAlign: 'center' }}>
                          <span style={{ fontSize: '36px', fontWeight: 800, color: isPremium ? '#fff' : '#0f172a' }}>{pkg.price.toLocaleString()}₫</span>
                          <span style={{ fontSize: '16px', color: isPremium ? '#94a3b8' : '#64748b', fontWeight: 500 }}> / {pkg.durationMonths * 30} ngày</span>
                        </div>
            
                        <Paragraph style={{ color: isPremium ? '#cbd5e1' : '#475569', fontSize: '15px', textAlign: 'center', minHeight: '44px', marginBottom: '8px' }}>
                          {pkg.name === 'Basic' ? 'Giải pháp khởi đầu cho quản lý kho nhỏ.' : 'Giải pháp toàn diện cho chuỗi kho bãi chuyên nghiệp.'}
                        </Paragraph>

                        <div style={{ padding: '16px 0', borderTop: `1px solid ${isPremium ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`, borderBottom: `1px solid ${isPremium ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}` }}>
                          <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: isPremium ? '#fff' : '#1e293b', fontSize: '14px' }}>
                            <li style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                               <CheckCircleOutlined style={{ color: '#10b981' }} />
                               <span>Tối đa <strong>{pkg.name === 'Basic' ? '1' : '5'}</strong> kho bãi</span>
                            </li>
                            <li style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                               <CheckCircleOutlined style={{ color: '#10b981' }} />
                               <span><strong>{pkg.name === 'Basic' ? '5' : '50'}</strong> nhân viên / mỗi kho</span>
                            </li>
                            <li style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                               <CheckCircleOutlined style={{ color: '#10b981' }} />
                               <span><strong>{pkg.name === 'Basic' ? '3' : '10'}</strong> khu vực (Zones) / kho</span>
                            </li>
                            <li style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                               <CheckCircleOutlined style={{ color: '#10b981' }} />
                               <span>Tổng diện tích: <strong>{pkg.name === 'Basic' ? '500' : '5000'}</strong> m²</span>
                            </li>
                            <li style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: pkg.name === 'Basic' ? 0.5 : 1 }}>
                               <span className="material-symbols-outlined" style={{ fontSize: '16px', color: pkg.name === 'Basic' ? '#94a3b8' : '#10b981' }}>
                                 {pkg.name === 'Basic' ? 'block' : 'check_circle'}
                               </span>
                               <span style={{ textDecoration: pkg.name === 'Basic' ? 'line-through' : 'none' }}>Quản lý thiết bị vòng đời</span>
                            </li>
                          </ul>
                        </div>
            
                        <div style={{ flex: 1 }}></div>
                        <Button type={isPremium ? "primary" : "default"} size="large" onClick={() => handleSubscribe(pkg.name)} loading={loading} style={{
                          height: '52px', borderRadius: '12px', fontSize: '16px', fontWeight: isPremium ? 700 : 600,
                          background: isPremium ? 'linear-gradient(90deg, #38bdf8 0%, #818cf8 100%)' : '#fff', 
                          color: isPremium ? '#fff' : '#0f172a', 
                          border: isPremium ? 'none' : '2px solid #cbd5e1',
                          marginTop: '24px'
                        }} block>
                          Mua Gói {pkg.name}
                        </Button>
                      </div>
                    </Col>
                );
            })
        )}
      </Row>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="material-symbols-outlined" style={{ color: '#0ea5e9' }}>verified</span>
            <span>Xác nhận đăng ký / Nâng cấp</span>
          </div>
        }
        open={confirmModalVisible}
        onCancel={() => setConfirmModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setConfirmModalVisible(false)} disabled={loading}>
            Để sau
          </Button>,
          <Button key="confirm" type="primary" onClick={handleConfirmSubscription} loading={loading} style={{ background: '#0ea5e9', border: 'none' }}>
            Xác nhận thanh toán
          </Button>
        ]}
        width={500}
      >
        {previewData && (
          <div style={{ padding: '10px 0' }}>
            <div style={{ background: '#f0f9ff', padding: '16px', borderRadius: '12px', border: '1px solid #e0f2fe', marginBottom: '20px' }}>
              <div style={{ color: '#0369a1', fontWeight: 600, fontSize: '15px' }}>
                {previewData.transitionType === 'Upgrade' ? '🚀 Bạn đang nâng cấp lên Premium' : 
                 previewData.transitionType === 'Renewal' ? '🔄 Bạn đang gia hạn gói cước' : '📦 Đăng ký gói mới'}
              </div>
            </div>

            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Text type="secondary">Gói hiện tại</Text>
                  <div style={{ fontSize: '16px', fontWeight: 700 }}>{previewData.currentPlan === 'None' ? 'Chưa có' : previewData.currentPlan}</div>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Gói đăng ký</Text>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#0ea5e9' }}>{previewData.targetPlan}</div>
                </Col>
              </Row>

              <div style={{ height: '1px', background: '#f1f5f9', margin: '8px 0' }} />

              {previewData.transitionType === 'Upgrade' && (
                <div style={{ background: '#ecfdf5', padding: '12px', borderRadius: '8px', border: '1px solid #d1fae5' }}>
                  <Space align="start">
                    <CheckCircleOutlined style={{ color: '#10b981', marginTop: '4px' }} />
                    <Text style={{ fontSize: '14px' }}>
                      Bạn còn <strong>{previewData.remainingDays} ngày</strong> {previewData.currentPlan}. 
                      Được quy đổi thành <strong>{previewData.convertedDays} ngày</strong> {previewData.targetPlan}.
                    </Text>
                  </Space>
                </div>
              )}

              {previewData.transitionType === 'Renewal' && previewData.remainingDays > 0 && (
                <div style={{ background: '#ecfdf5', padding: '12px', borderRadius: '8px', border: '1px solid #d1fae5' }}>
                  <Space align="start">
                    <CheckCircleOutlined style={{ color: '#10b981', marginTop: '4px' }} />
                    <Text style={{ fontSize: '14px' }}>
                      Bạn đang còn <strong>{previewData.remainingDays} ngày</strong>. 
                      Sau khi gia hạn bạn sẽ có tổng cộng <strong>{previewData.newDuration} ngày</strong> sử dụng.
                    </Text>
                  </Space>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <Text strong>Ngày hết hạn dự kiến:</Text>
                <Text strong style={{ color: '#0ea5e9', fontSize: '16px' }}>
                  {new Date(previewData.newEndDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </Text>
              </div>

              {previewData.message && (
                <div style={{ background: '#fffbeb', padding: '12px', borderRadius: '8px', border: '1px solid #fef3c7', fontSize: '13px', color: '#92400e' }}>
                  <Text type="warning" style={{ fontSize: '13px' }}>⚠️ {previewData.message}</Text>
                </div>
              )}
            </Space>
          </div>
        )}
      </Modal>

      <Modal
        title="Thanh toán qua QR Code"
        open={qrModalVisible}
        onCancel={handleModalClose}
        footer={null}
        width={400}
      >
        {paymentInfo ? (
          <div style={{ textAlign: 'center' }}>
            <Paragraph>Quét mã QR để hoàn tất thanh toán cho gói <strong>{targetPlan}</strong></Paragraph>
            <img src={paymentInfo.qrImageUrl} alt="QR Code" style={{ width: '100%', marginBottom: '20px' }} />
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', textAlign: 'left' }}>
              <Paragraph style={{ marginBottom: '4px' }}><strong>Mã giao dịch:</strong> {paymentInfo.paymentCode}</Paragraph>
              <Paragraph style={{ marginBottom: '4px' }}><strong>Số tiền:</strong> {new Intl.NumberFormat('vi-VN').format(paymentInfo.amount)} ₫</Paragraph>
            </div>
            <Button type="primary" block style={{ marginTop: '20px' }} onClick={() => setQrModalVisible(false)}>
              Tôi đã thanh toán
            </Button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin size="large" />
          </div>
        )}
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
