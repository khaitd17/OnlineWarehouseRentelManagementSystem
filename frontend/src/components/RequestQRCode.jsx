import React, { useRef, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';

/**
 * Component hiển thị mã QR cho RequestCode / ReceiptCode.
 * Hỗ trợ in & download.
 *
 * QR sẽ encode URL dạng: http://<hostname>:3000/verify/<requestCode>
 * Khi quét sẽ mở trang xác thực đẹp với đầy đủ thông tin.
 * 
 * Hoạt động trên cùng mạng WiFi nội bộ (LAN) nhờ sử dụng hostname thay vì localhost.
 *
 * Props:
 *  - code: string    — mã định danh (VD: "INB-20260507-001")
 *  - label: string   — nhãn hiển thị bên dưới QR (VD: "Mã yêu cầu nhập kho")
 *  - size: number    — kích thước QR (default 180)
 *  - showActions: boolean — hiển thị nút In / Tải (default true)
 */
const RequestQRCode = ({ code, label, size = 180, showActions = true }) => {
  const printRef = useRef(null);

  const handlePrint = useCallback(() => {
    const content = printRef.current;
    if (!content) return;
    const w = window.open('', '_blank', 'width=400,height=500');
    w.document.write(`
      <html>
        <head>
          <title>QR - ${code}</title>
          <style>
            body { font-family: Inter, Arial, sans-serif; text-align: center; padding: 40px 20px; }
            .label { font-size: 14px; color: #475569; font-weight: 600; margin-top: 16px; }
            .code  { font-size: 22px; font-weight: 900; color: #0f172a; letter-spacing: 2px; margin-top: 8px; }
            .note  { font-size: 11px; color: #94a3b8; margin-top: 8px; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          ${content.innerHTML}
          <p class="note">Dán phiếu này lên kiện hàng khi giao đến kho</p>
          <script>window.onload = function(){ window.print(); }<\/script>
        </body>
      </html>
    `);
    w.document.close();
  }, [code]);

  const handleDownload = useCallback(() => {
    const svgElement = printRef.current?.querySelector('svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      
      const link = document.createElement('a');
      link.download = `QR-${code}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = url;
  }, [code]);

  if (!code) return null;

  // Build verification URL using current hostname (works on LAN, not just localhost)
  const verifyUrl = `${window.location.origin}/verify/${encodeURIComponent(code)}`;

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', width: '100%' }}>
      <div ref={printRef} style={{ textAlign:'center', background:'#fff', padding:'24px 24px 20px', borderRadius:24, boxShadow:'0 10px 40px -10px rgba(0,0,0,0.08)', border:'1px solid #f1f5f9', width:'100%', boxSizing:'border-box', marginBottom:20 }}>
        <div style={{ border:'4px solid #f8fafc', borderRadius:16, display:'inline-flex', padding:8, background:'#fff' }}>
          <QRCodeSVG value={verifyUrl} size={size} level="H" includeMargin={false} style={{ borderRadius: 8, display:'block' }} />
        </div>
        <div style={{ marginTop: 24 }}>
          {label && <p className="label" style={{ margin:'0 0 6px', fontSize:'0.72rem', color:'#64748b', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</p>}
          <p className="code" style={{ margin:0, fontSize:'1.15rem', fontWeight:900, color:'#0f172a', letterSpacing:'1px', fontFamily:'"Courier New", Courier, monospace', background:'#f8fafc', padding:'8px 20px', borderRadius:10, display:'inline-block', border:'1.5px dashed #cbd5e1' }}>{code}</p>
        </div>
        <p style={{ margin:'12px 0 0', fontSize:'0.72rem', color:'#0284c7', lineHeight:1.5, fontWeight:600 }}>
          Quét mã QR để xem đầy đủ thông tin yêu cầu
        </p>
      </div>

      {showActions && (
        <div style={{ display:'flex', gap:12, width:'100%', justifyContent:'center' }}>
          <button onClick={handlePrint} style={{ flex:1, padding:'11px', borderRadius:12, border:'1.5px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:'0.85rem', fontWeight:700, color:'#334155', transition:'all 0.2s', boxShadow:'0 2px 4px rgba(0,0,0,0.02)' }}
            onMouseEnter={e => { e.currentTarget.style.background='#f8fafc'; e.currentTarget.style.borderColor='#cbd5e1'; e.currentTarget.style.transform='translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.background='#fff'; e.currentTarget.style.borderColor='#e2e8f0'; e.currentTarget.style.transform='translateY(0)' }}>
            In mã QR
          </button>
          <button onClick={handleDownload} style={{ flex:1, padding:'11px', borderRadius:12, border:'none', background:'linear-gradient(135deg, #0ea5e9, #2563eb)', cursor:'pointer', fontSize:'0.85rem', fontWeight:700, color:'#fff', transition:'all 0.2s', boxShadow:'0 4px 12px rgba(37,99,235,0.25)' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow='0 6px 16px rgba(37,99,235,0.35)'; e.currentTarget.style.transform='translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow='0 4px 12px rgba(37,99,235,0.25)'; e.currentTarget.style.transform='translateY(0)' }}>
            Tải ảnh về
          </button>
        </div>
      )}
    </div>
  );
};

export default RequestQRCode;
