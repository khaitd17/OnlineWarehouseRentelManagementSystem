import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PaymentRetryButton from "../components/PaymentRetryButton";

const PaymentResult = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const success = searchParams.get('success') === 'true';
  const contractId = searchParams.get('contractId');
  const paymentId = searchParams.get('paymentId');
  const message = searchParams.get('message');
  const purpose = searchParams.get('purpose');
  const isTerminationPayment = purpose === 'termination';

  useEffect(() => {
    // Play success/error sound (optional)
    if (success) {
      // Can add success sound here
    }
  }, [success]);

  return (
    <div style={{
      padding: "4rem 2rem",
      maxWidth: "600px",
      margin: "0 auto",
      textAlign: "center"
    }}>
      {success ? (
        <>
          {/* Success Animation */}
          <div style={{
            width: "120px",
            height: "120px",
            margin: "0 auto 2rem",
            borderRadius: "50%",
            backgroundColor: "#dcfce7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "scaleIn 0.5s ease-out"
          }}>
            <span style={{ fontSize: "4rem" }}>✅</span>
          </div>

          <h1 style={{
            fontSize: "2rem",
            fontWeight: 800,
            color: "#166534",
            marginBottom: "1rem"
          }}>
            {isTerminationPayment ? "Thanh toán phí kết thúc sớm thành công!" : "Thanh toán thành công!"}
          </h1>

          <p style={{
            fontSize: "1.1rem",
            color: "#64748b",
            marginBottom: "2rem",
            lineHeight: 1.6
          }}>
            {message || (isTerminationPayment
              ? "Yêu cầu kết thúc sớm đã hoàn tất và trạng thái hợp đồng đã được cập nhật."
              : "Hợp đồng của bạn đã được kích hoạt thành công. Bạn có thể bắt đầu sử dụng kho ngay bây giờ.")}
          </p>

          <div style={{
            padding: "1.5rem",
            backgroundColor: "#f0fdf4",
            borderRadius: "12px",
            border: "1px solid #86efac",
            marginBottom: "2rem"
          }}>
            <h3 style={{
              fontSize: "1rem",
              fontWeight: 700,
              color: "#166534",
              marginBottom: "1rem"
            }}>
              Bước tiếp theo
            </h3>
            <ul style={{
              textAlign: "left",
              paddingLeft: "1.5rem",
              lineHeight: 1.8,
              color: "#166534"
            }}>
              {isTerminationPayment ? (
                <>
                  <li>Kiểm tra lại trạng thái hợp đồng ở trang chi tiết</li>
                  <li>Lưu lại biên nhận thanh toán để đối soát khi cần</li>
                  <li>Trao đổi với chủ kho về thủ tục bàn giao cuối cùng (nếu có)</li>
                </>
              ) : (
                <>
                  <li>Kiểm tra email để xem chi tiết hợp đồng</li>
                  <li>Liên hệ với chủ kho để nhận chìa khóa</li>
                  <li>Bắt đầu sử dụng kho theo thời gian đã thỏa thuận</li>
                </>
              )}
            </ul>
          </div>

          <div style={{
            display: "flex",
            gap: "1rem",
            justifyContent: "center",
            flexWrap: "wrap"
          }}>
            {contractId && (
              <button
                onClick={() => navigate(`/contracts/${contractId}`)}
                style={{
                  padding: "0.875rem 1.75rem",
                  borderRadius: "10px",
                  backgroundColor: "#16a34a",
                  color: "#fff",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "1rem",
                  cursor: "pointer",
                  transition: "background-color 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#15803d"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#16a34a"}
              >
                Xem hợp đồng
              </button>
            )}
            <button
              onClick={() => navigate('/my-contracts')}
              style={{
                padding: "0.875rem 1.75rem",
                borderRadius: "10px",
                backgroundColor: "#fff",
                color: "#0095c7",
                border: "2px solid #0095c7",
                fontWeight: 700,
                fontSize: "1rem",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f0f9ff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#fff";
              }}
            >
              Danh sách hợp đồng
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Error Animation */}
          <div style={{
            width: "120px",
            height: "120px",
            margin: "0 auto 2rem",
            borderRadius: "50%",
            backgroundColor: "#fee2e2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "shake 0.5s ease-out"
          }}>
            <span style={{ fontSize: "4rem" }}>❌</span>
          </div>

          <h1 style={{
            fontSize: "2rem",
            fontWeight: 800,
            color: "#dc2626",
            marginBottom: "1rem"
          }}>
            Thanh toán thất bại
          </h1>

          <p style={{
            fontSize: "1.1rem",
            color: "#64748b",
            marginBottom: "2rem",
            lineHeight: 1.6
          }}>
            {message || "Đã có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại hoặc liên hệ hỗ trợ."}
          </p>

          <div style={{
            padding: "1.5rem",
            backgroundColor: "#fef2f2",
            borderRadius: "12px",
            border: "1px solid #fecaca",
            marginBottom: "2rem"
          }}>
            <h3 style={{
              fontSize: "1rem",
              fontWeight: 700,
              color: "#dc2626",
              marginBottom: "1rem"
            }}>
              Có thể do
            </h3>
            <ul style={{
              textAlign: "left",
              paddingLeft: "1.5rem",
              lineHeight: 1.8,
              color: "#dc2626"
            }}>
              <li>Nội dung chuyển khoản không chính xác</li>
              <li>Số tiền chuyển khoản không đúng</li>
              <li>Giao dịch bị hủy hoặc thất bại</li>
              <li>Chưa nhận được xác nhận từ ngân hàng</li>
            </ul>
          </div>

          <div style={{
            display: "flex",
            gap: "1rem",
            justifyContent: "center",
            flexWrap: "wrap",
            alignItems: "center"
          }}>
            {/* Payment Retry Button */}
            {paymentId && (
              <PaymentRetryButton
                paymentId={parseInt(paymentId)}
                onRetrySuccess={(result) => {
                  // Redirect to online payment page with refreshed QR flow
                  if (contractId) {
                    navigate(`/contracts/${contractId}/payment/online${isTerminationPayment ? '?purpose=termination' : ''}`);
                  }
                }}
                onRetryError={(error) => {
                  alert(error);
                }}
              />
            )}
            
            {/* Manual retry if no paymentId */}
            {!paymentId && contractId && (
              <button
                onClick={() => navigate(`/contracts/${contractId}/payment${isTerminationPayment ? '?purpose=termination' : ''}`)}
                style={{
                  padding: "0.875rem 1.75rem",
                  borderRadius: "10px",
                  backgroundColor: "#dc2626",
                  color: "#fff",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "1rem",
                  cursor: "pointer",
                  transition: "background-color 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#b91c1c"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#dc2626"}
              >
                Thử lại
              </button>
            )}
            
            <button
              onClick={() => navigate('/help')}
              style={{
                padding: "0.875rem 1.75rem",
                borderRadius: "10px",
                backgroundColor: "#fff",
                color: "#64748b",
                border: "2px solid #e2e8f0",
                fontWeight: 700,
                fontSize: "1rem",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f8fafc";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#fff";
              }}
            >
              Liên hệ hỗ trợ
            </button>
          </div>
        </>
      )}

      {/* Inline CSS for animations */}
      <style>{`
        @keyframes scaleIn {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
      `}</style>
    </div>
  );
};

export default PaymentResult;
