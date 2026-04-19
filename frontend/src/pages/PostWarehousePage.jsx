import React, { useState } from 'react';

const PostWarehousePage = () => {
  const [step, setStep] = useState(1);

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>Bước 1: Thông tin cơ bản</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748b' }}>Tiêu đề tin đăng</label>
              <input type="text" placeholder="Ví dụ: Kho lạnh hiện đại trung tâm Quận 1" style={{ padding: '0.8rem', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748b' }}>Loại hình kho</label>
              <select style={{ padding: '0.8rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <option>Kho chung (Shared Warehouse)</option>
                <option>Kho tự quản (Private Warehouse)</option>
                <option>Kho lạnh (Cold Storage)</option>
                <option>Bãi trống (Open Space)</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748b' }}>Địa chỉ chi tiết</label>
              <input type="text" placeholder="Số nhà, tên đường, phường/xã..." style={{ padding: '0.8rem', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
            </div>
          </div>
        );
      case 2:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>Bước 2: Diện tích & Giá thuê</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748b' }}>Diện tích (m³)</label>
                <input type="number" placeholder="0" style={{ padding: '0.8rem', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748b' }}>Giá thuê (VNĐ/m³/tháng)</label>
                <input type="number" placeholder="0" style={{ padding: '0.8rem', borderRadius: '10px', border: '1px solid #e2e8f0' }} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748b' }}>Mô tả thêm</label>
              <textarea placeholder="Mô tả chi tiết về kho, tiện ích, giao thông..." rows="5" style={{ padding: '0.8rem', borderRadius: '10px', border: '1px solid #e2e8f0', resize: 'vertical' }}></textarea>
            </div>
          </div>
        );
      case 3:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>Bước 3: Hình ảnh kho bãi</h3>
            <div style={{ 
              border: '2px dashed #cbd5e1', 
              borderRadius: '16px', 
              padding: '4rem 2rem', 
              textAlign: 'center',
              backgroundColor: '#f8fafc',
              cursor: 'pointer'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📸</div>
              <p style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.5rem' }}>Kéo thả hoặc nhấn để tải ảnh lên</p>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Hỗ trợ định dạng JPG, PNG, WEBP. Tối đa 10 ảnh.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
              <div style={{ width: '100%', aspectRatio: '1/1', backgroundColor: '#f1f5f9', borderRadius: '10px' }}></div>
              <div style={{ width: '100%', aspectRatio: '1/1', backgroundColor: '#f1f5f9', borderRadius: '10px' }}></div>
              <div style={{ width: '100%', aspectRatio: '1/1', backgroundColor: '#f1f5f9', borderRadius: '10px' }}></div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '3rem auto', padding: '0 2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.8rem' }}>Đăng tin cho thuê kho</h1>
        <p style={{ color: '#64748b' }}>Tiếp cận hàng nghìn khách hàng tiềm năng mỗi tháng</p>
      </div>

      {/* Progress Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3rem', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '2px', backgroundColor: '#e2e8f0', zIndex: 1, transform: 'translateY(-50%)' }}></div>
        <div style={{ position: 'absolute', top: '50%', left: 0, width: `${((step - 1) / 2) * 100}%`, height: '2px', backgroundColor: '#0095c7', zIndex: 2, transform: 'translateY(-50%)', transition: 'width 0.3s ease' }}></div>
        
        {[1, 2, 3].map(s => (
          <div key={s} style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '50%', 
            backgroundColor: step >= s ? '#0095c7' : '#fff', 
            border: step >= s ? 'none' : '2px solid #e2e8f0',
            color: step >= s ? '#fff' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            zIndex: 3,
            position: 'relative',
            boxShadow: step >= s ? '0 0 15px rgba(0,149,199,0.3)' : 'none'
          }}>
            {s}
          </div>
        ))}
      </div>

      {/* Form Content */}
      <div style={{ backgroundColor: '#fff', padding: '2.5rem', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
        {renderStep()}
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid #f1f5f9' }}>
          <button 
            disabled={step === 1}
            onClick={() => setStep(s => s - 1)}
            style={{ 
              padding: '0.8rem 2rem', 
              borderRadius: '10px', 
              border: '1px solid #e2e8f0', 
              backgroundColor: '#fff', 
              color: '#0f172a',
              fontWeight: 600,
              cursor: step === 1 ? 'not-allowed' : 'pointer',
              opacity: step === 1 ? 0.5 : 1
            }}
          >
            Quay lại
          </button>
          <button 
            onClick={() => step < 3 ? setStep(s => s + 1) : alert('Tin đăng của bạn đã được gửi!')}
            style={{ 
              padding: '0.8rem 2.5rem', 
              borderRadius: '10px', 
              border: 'none', 
              backgroundColor: '#0095c7', 
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {step === 3 ? 'Hoàn tất & Đăng tin' : 'Tiếp theo'}
          </button>
        </div>
      </div>

      <div style={{ marginTop: '3rem', backgroundColor: '#f0f9ff', padding: '1.5rem', borderRadius: '16px', display: 'flex', gap: '1rem' }}>
        <div style={{ fontSize: '1.5rem' }}>💡</div>
        <p style={{ fontSize: '0.9rem', color: '#0369a1', lineHeight: 1.6 }}>
          <strong>Mẹo:</strong> Tin đăng có hình ảnh sáng sủa, mô tả chi tiết các tiện ích và giá cả cạnh tranh thường nhận được sự quan tâm gấp 3 lần bình thường.
        </p>
      </div>
    </div>
  );
};

export default PostWarehousePage;
