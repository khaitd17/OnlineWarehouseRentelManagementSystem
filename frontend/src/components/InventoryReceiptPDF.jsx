/**
 * InventoryReceiptPDF.jsx
 *
 * Renders a printable "Phiếu Nhập Kho" (Warehouse Inbound Receipt) using
 * @react-pdf/renderer.
 *
 * Exported helpers:
 *  - InventoryReceiptDocument  — the raw <Document> for use with PDFViewer/BlobProvider
 *  - ReceiptDownloadButton     — a ready-to-use download button
 *  - ReceiptPreviewModal       — an inline preview modal with download
 *
 * Data shape expected in `data` prop:
 * {
 *   invReqId       : number
 *   warehouseName  : string
 *   warehouseAddress?: string
 *   renterName     : string
 *   renterEmail?   : string
 *   managerName?   : string
 *   staffName?     : string
 *   scheduledDate? : string  // ISO date
 *   createdAt      : string  // ISO datetime
 *   notes?         : string
 *   items: [{
 *     itemName        : string
 *     quantity        : number
 *     unit            : string
 *     estimatedVolume?: number  // m² per item * qty
 *     note?           : string
 *   }]
 * }
 */

import React from 'react';
import {
  Document, Page, Text, View, StyleSheet, PDFDownloadLink, BlobProvider,
  Font, Image,
} from '@react-pdf/renderer';

Font.register({
  family: 'Roboto',
  src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf'
});
Font.register({
  family: 'Roboto-Bold',
  src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf'
});

/* ── Styles ──────────────────────────────────────────────────────────────── */
const S = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    fontSize: 9,
    padding: '20mm 18mm 20mm 22mm',
    color: '#1a1a1a',
  },
  // Header block
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  orgBlock: { fontSize: 8, color: '#555' },
  orgName: { fontFamily: 'Roboto-Bold', fontSize: 9, color: '#1a1a1a' },
  mauRow: { alignItems: 'flex-end' },
  mauLine: { fontSize: 8, color: '#555', textAlign: 'right' },

  // Title
  titleWrap: { alignItems: 'center', marginVertical: 6 },
  title: { fontFamily: 'Roboto-Bold', fontSize: 14, letterSpacing: 1 },
  titleSub: { fontSize: 8, color: '#555', marginTop: 2 },
  reqNo: { fontSize: 8, color: '#1a1a1a', marginTop: 4 },

  // Info grid
  infoSection: { marginVertical: 6 },
  infoRow: { flexDirection: 'row', marginBottom: 3 },
  infoLabel: { fontFamily: 'Roboto-Bold', width: 110, fontSize: 8.5 },
  infoValue: { flex: 1, fontSize: 8.5, borderBottomWidth: 0.5, borderBottomColor: '#555', paddingBottom: 1 },
  infoValuePlain: { flex: 1, fontSize: 8.5 },

  // Table
  tableWrap: { marginVertical: 8 },
  tableHeader: {
    flexDirection: 'row', backgroundColor: '#1e293b', color: '#fff',
    borderTopLeftRadius: 2, borderTopRightRadius: 2,
  },
  tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#d1d5db' },
  tableRowAlt: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#d1d5db', backgroundColor: '#f8fafc' },
  tableFooter: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderTopWidth: 1, borderTopColor: '#94a3b8' },

  // Table cells
  cellCenter: { textAlign: 'center', paddingVertical: 4, paddingHorizontal: 3 },
  cellLeft: { textAlign: 'left', paddingVertical: 4, paddingHorizontal: 5 },
  cellRight: { textAlign: 'right', paddingVertical: 4, paddingHorizontal: 5 },
  headerText: { fontFamily: 'Roboto-Bold', fontSize: 7.5, color: '#fff' },
  cellText: { fontSize: 8 },
  cellTextBold: { fontFamily: 'Roboto-Bold', fontSize: 8 },

  // Column widths
  colStt: { width: 28 },
  colName: { flex: 3 },
  colUnit: { width: 38 },
  colQty: { width: 38 },
  colVol: { width: 52 },
  colNote: { flex: 2 },

  // Notes block
  notesBlock: { marginTop: 6, paddingHorizontal: 8, paddingVertical: 6, backgroundColor: '#fffbeb', borderWidth: 0.5, borderColor: '#fde68a', borderRadius: 2 },
  notesLabel: { fontFamily: 'Roboto-Bold', fontSize: 7.5, color: '#92400e', marginBottom: 2 },
  notesText: { fontSize: 8, color: '#78350f', lineHeight: 1.4 },

  // Summary
  summaryBlock: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 5 },
  summaryBox: { borderWidth: 0.5, borderColor: '#94a3b8', borderRadius: 2, padding: '5 10', minWidth: 160 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  summaryLabel: { fontSize: 8, color: '#555' },
  summaryValue: { fontFamily: 'Roboto-Bold', fontSize: 8 },
  summaryTotal: { borderTopWidth: 0.5, borderTopColor: '#94a3b8', marginTop: 3, paddingTop: 3 },

  // Signatures
  sigSection: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  sigBox: { alignItems: 'center', flex: 1, marginHorizontal: 4 },
  sigTitle: { fontFamily: 'Roboto-Bold', fontSize: 8, marginBottom: 2, textAlign: 'center' },
  sigRole: { fontSize: 7.5, color: '#555', marginBottom: 2, textAlign: 'center' },
  sigSpace: { height: 50, justifyContent: 'flex-end', alignItems: 'center', width: '100%', marginVertical: 4 },
  sigLine: { width: '80%', borderBottomWidth: 0.5, borderBottomColor: '#888' },
  sigNameLabel: { fontSize: 7.5, color: '#888', textAlign: 'center' },
  sigNameValue: { fontFamily: 'Roboto-Bold', fontSize: 8, textAlign: 'center', marginTop: 2, color: '#1a1a1a', minHeight: 12 },

  // Footer
  footerLine: { marginTop: 12, borderTopWidth: 0.5, borderTopColor: '#d1d5db', paddingTop: 6 },
  footerText: { fontSize: 7, color: '#94a3b8', textAlign: 'center' },

  // Divider
  divider: { borderTopWidth: 0.5, borderTopColor: '#e2e8f0', marginVertical: 5 },
});

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const fmtDate = (str) => {
  if (!str) return '...../...../..........';
  const d = new Date(str);
  if (isNaN(d)) return str;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const fmtNum = (n, dec = 2) =>
  n == null || n === '' ? '—' : Number(n).toLocaleString('vi-VN', { maximumFractionDigits: dec });

/* ── PDF Document ────────────────────────────────────────────────────────── */
export function InventoryReceiptDocument({ data }) {
  const {
    invReqId,
    type = 'INBOUND',
    warehouseName = 'Kho hàng',
    warehouseAddress,
    renterName = '.....................',
    renterEmail,
    managerName,
    staffName: staffNameProp,
    assignedStaffName,
    scheduledDate,
    createdAt,
    notes,
    items = [],
  } = data;

  const isOutbound = type === 'OUTBOUND';
  const receiptTitle = isOutbound ? 'PHIẾU XUẤT KHO' : 'PHIẾU NHẬP KHO';
  const receiptLabel = isOutbound ? 'Mẫu Phiếu Xuất Kho' : 'Mẫu Phiếu Nhập Kho';
  const receiptCode  = isOutbound ? 'OUT' : 'INV';
  const renterRole   = isOutbound ? 'Người lập phiếu xuất' : 'Người lập phiếu nhập';
  const staffRole    = isOutbound ? 'Thủ kho' : 'Thủ kho';

  const staffName = assignedStaffName || staffNameProp;

  const totalQty = items.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
  const totalVol = items.reduce((s, i) => s + (Number(i.estimatedVolume) || 0), 0);
  const notesLines = notes?.trim() ? notes.trim() : null;

  return (
    <Document
      title={`${receiptTitle}-#${invReqId}`}
      author="OWRMS - Online Warehouse Rental Management System"
      creator="OWRMS"
    >
      <Page size="A4" style={S.page}>

        {/* ── Header ─────────────────────────────────────── */}
        <View style={S.headerRow}>
          <View style={S.orgBlock}>
            <Text style={S.orgName}>OWRMS</Text>
            <Text>Online Warehouse Rental Management System</Text>
            <Text style={{ marginTop: 2 }}>Kho: {warehouseName}</Text>
            {warehouseAddress ? <Text>{warehouseAddress}</Text> : null}
          </View>
          <View style={S.mauRow}>
            <Text style={S.mauLine}>{receiptLabel}</Text>
            <Text style={S.mauLine}>(Tùy chỉnh theo hệ thống OWRMS)</Text>
            <Text style={[S.mauLine, { marginTop: 2 }]}>
              Ngày lập: {fmtDate(createdAt)}
            </Text>
          </View>
        </View>

        <View style={S.divider} />

        {/* ── Title ──────────────────────────────────────── */}
        <View style={S.titleWrap}>
          <Text style={S.title}>{receiptTitle}</Text>
          <Text style={S.reqNo}>Mã phiếu: {receiptCode}-{String(invReqId).padStart(5, '0')}</Text>
        </View>

        {/* ── Info block ─────────────────────────────────── */}
        <View style={S.infoSection}>
          <View style={S.infoRow}>
            <Text style={S.infoLabel}>Người lập phiếu:</Text>
            <Text style={S.infoValue}>{renterName}</Text>
            <Text style={[S.infoLabel, { marginLeft: 12 }]}>Email:</Text>
            <Text style={S.infoValue}>{renterEmail || '.....................'}</Text>
          </View>
          <View style={S.infoRow}>
            <Text style={S.infoLabel}>{isOutbound ? 'Kho xuất hàng:' : 'Kho nhận hàng:'}</Text>
            <Text style={S.infoValue}>{warehouseName}</Text>
            <Text style={[S.infoLabel, { marginLeft: 12 }]}>{isOutbound ? 'Ngày dự kiến xuất:' : 'Ngày dự kiến nhập:'}</Text>
            <Text style={S.infoValue}>{fmtDate(scheduledDate)}</Text>
          </View>
          {!isOutbound && (
            <View style={S.infoRow}>
              <Text style={S.infoLabel}>Điều kiện bảo quản:</Text>
              <Text style={S.infoValue}>Giữ khô, tránh ẩm ướt, xếp gọn gàng</Text>
            </View>
          )}
        </View>

        {/* ── Items table ────────────────────────────────── */}
        <View style={S.tableWrap}>
          {/* Table header */}
          <View style={S.tableHeader}>
            <View style={[S.colStt, S.cellCenter]}>
              <Text style={S.headerText}>STT</Text>
            </View>
            <View style={[S.colName, S.cellLeft]}>
              <Text style={S.headerText}>Tên hàng hóa / tài sản</Text>
            </View>
            <View style={[S.colUnit, S.cellCenter]}>
              <Text style={S.headerText}>Đơn vị</Text>
            </View>
            <View style={[S.colQty, S.cellCenter]}>
              <Text style={S.headerText}>Số lượng</Text>
            </View>
            <View style={[S.colVol, S.cellCenter]}>
              <Text style={S.headerText}>diện tích (m²)</Text>
            </View>
            <View style={[S.colNote, S.cellLeft]}>
              <Text style={S.headerText}>Ghi chú / Tình trạng</Text>
            </View>
          </View>

          {/* Item rows */}
          {items.map((item, idx) => {
            const RowStyle = idx % 2 === 0 ? S.tableRow : S.tableRowAlt;
            return (
              <View key={idx} style={RowStyle}>
                <View style={[S.colStt, S.cellCenter]}>
                  <Text style={S.cellText}>{idx + 1}</Text>
                </View>
                <View style={[S.colName, S.cellLeft]}>
                  <Text style={S.cellText}>{item.itemName || '—'}</Text>
                </View>
                <View style={[S.colUnit, S.cellCenter]}>
                  <Text style={S.cellText}>{item.unit || 'cái'}</Text>
                </View>
                <View style={[S.colQty, S.cellCenter]}>
                  <Text style={S.cellText}>{fmtNum(item.quantity, 0)}</Text>
                </View>
                <View style={[S.colVol, S.cellCenter]}>
                  <Text style={S.cellText}>
                    {item.estimatedVolume ? fmtNum(item.estimatedVolume) : '—'}
                  </Text>
                </View>
                <View style={[S.colNote, S.cellLeft]}>
                  <Text style={S.cellText}>{item.note || ''}</Text>
                </View>
              </View>
            );
          })}

          {/* Cong (totals) row */}
          <View style={S.tableFooter}>
            <View style={[S.colStt, S.cellCenter]} />
            <View style={[S.colName, S.cellLeft]}>
              <Text style={S.cellTextBold}>Tổng:</Text>
            </View>
            <View style={[S.colUnit, S.cellCenter]} />
            <View style={[S.colQty, S.cellCenter]}>
              <Text style={S.cellTextBold}>{fmtNum(totalQty, 0)}</Text>
            </View>
            <View style={[S.colVol, S.cellCenter]}>
              <Text style={S.cellTextBold}>{totalVol > 0 ? fmtNum(totalVol) : '—'}</Text>
            </View>
            <View style={[S.colNote, S.cellLeft]} />
          </View>
        </View>

        {/* ── Notes ──────────────────────────────────────── */}
        {notesLines && (
          <View style={S.notesBlock}>
            <Text style={S.notesLabel}>{isOutbound ? 'Ghi chú xuất kho:' : 'Ghi chú từ người thuê:'}</Text>
            <Text style={S.notesText}>{notesLines}</Text>
          </View>
        )}

        {/* ── Summary ────────────────────────────────────── */}
        <View style={S.summaryBlock}>
          <View style={S.summaryBox}>
            <View style={S.summaryRow}>
              <Text style={S.summaryLabel}>Tổng số mặt hàng:</Text>
              <Text style={S.summaryValue}>{items.length}</Text>
            </View>
            <View style={S.summaryRow}>
              <Text style={S.summaryLabel}>Tổng số lượng:</Text>
              <Text style={S.summaryValue}>{fmtNum(totalQty, 0)}</Text>
            </View>
            {totalVol > 0 && (
              <View style={[S.summaryRow, S.summaryTotal]}>
                <Text style={S.summaryLabel}>Ước tính diện tích:</Text>
                <Text style={S.summaryValue}>{fmtNum(totalVol)} m²</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Signature section ──────────────────────────── */}
        <View style={S.sigSection}>
          {/* Người lập phiếu = Renter */}
          <View style={S.sigBox}>
            <Text style={S.sigTitle}>Người Lập Phiếu</Text>
            <Text style={S.sigRole}>{renterRole}</Text>
            <View style={S.sigSpace}>
              {data.renterSignatureBase64 ? (
                <Image 
                  style={{ width: 80, height: 40 }} 
                  src={data.renterSignatureBase64.startsWith('data:image') ? data.renterSignatureBase64 : `data:image/png;base64,${data.renterSignatureBase64}`} 
                />
              ) : (
                <View style={S.sigLine} />
              )}
            </View>
            <Text style={S.sigNameLabel}>Họ và tên:</Text>
            <Text style={S.sigNameValue}>{renterName}</Text>
          </View>

          {/* Quản lý kho = Manager — chỉ hiển thị khi có quản lý duyệt */}
          {managerName ? (
            <View style={S.sigBox}>
              <Text style={S.sigTitle}>Quản Lý Kho</Text>
              <Text style={S.sigRole}>Người duyệt</Text>
              <View style={S.sigSpace}>
                {data.managerSignatureBase64 ? (
                  <Image 
                    style={{ width: 80, height: 40 }} 
                    src={data.managerSignatureBase64.startsWith('data:image') ? data.managerSignatureBase64 : `data:image/png;base64,${data.managerSignatureBase64}`} 
                  />
                ) : (
                  <View style={S.sigLine} />
                )}
              </View>
              <Text style={S.sigNameLabel}>Họ và tên:</Text>
              <Text style={S.sigNameValue}>{managerName}</Text>
            </View>
          ) : null}

          {/* Nhân viên kho = Staff */}
          <View style={S.sigBox}>
            <Text style={S.sigTitle}>Nhân Viên Kho</Text>
            <Text style={S.sigRole}>{staffRole}</Text>
            <View style={S.sigSpace}>
              {data.staffSignatureBase64 ? (
                <Image
                  style={{ width: 80, height: 40 }}
                  src={data.staffSignatureBase64.startsWith('data:image') ? data.staffSignatureBase64 : `data:image/png;base64,${data.staffSignatureBase64}`}
                />
              ) : (
                <View style={S.sigLine} />
              )}
            </View>
            <Text style={S.sigNameLabel}>Họ và tên:</Text>
            <Text style={S.sigNameValue}>{staffName || '.....................'}</Text>
          </View>
        </View>

        {/* ── Footer ─────────────────────────────────────── */}
        <View style={S.footerLine}>
          <Text style={S.footerText}>
            Phiếu được tạo tự động bởi hệ thống OWRMS •
            Mã phiếu: {receiptCode}-{String(invReqId).padStart(5, '0')} •
            Ngày tạo: {fmtDate(createdAt)}
          </Text>
          <Text style={[S.footerText, { marginTop: 2 }]}>
            Phiếu này có giá trị làm căn cứ giao nhận và kiểm đếm hàng hóa tại kho theo hợp đồng thuê.
          </Text>
        </View>

      </Page>
    </Document>
  );
}

/* ── Download Button ─────────────────────────────────────────────────────── */
/**
 * Renders a styled download link for the PDF.
 */
export function ReceiptDownloadButton({ data, style = {}, children }) {
  const isOutboundBtn = data?.type === 'OUTBOUND';
  const fileName = isOutboundBtn
    ? `Phieu-Xuat-Kho-OUT-${String(data?.invReqId || '0').padStart(5, '0')}.pdf`
    : `Phieu-Nhap-Kho-INV-${String(data?.invReqId || '0').padStart(5, '0')}.pdf`;
  const btnLabel = isOutboundBtn ? 'Tải Phiếu Xuất Kho (PDF)' : 'Tải Phiếu Nhập Kho (PDF)';
  return (
    <PDFDownloadLink
      document={<InventoryReceiptDocument data={data} />}
      fileName={fileName}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 18px',
        borderRadius: 8,
        background: '#1e293b',
        color: '#fff',
        fontWeight: 700,
        fontSize: '0.83rem',
        textDecoration: 'none',
        fontFamily: 'Inter,sans-serif',
        border: 'none',
        cursor: 'pointer',
        transition: 'background 0.15s',
        ...style,
      }}
    >
      {({ loading: pdfLoading }) =>
        pdfLoading
          ? 'Đang tạo PDF...'
          : (children || btnLabel)
      }
    </PDFDownloadLink>
  );
}

/* ── Preview Modal ───────────────────────────────────────────────────────── */
/**
 * A modal overlay that shows a PDF preview inside an <iframe> via blob URL,
 * plus a download button. Keeps the PDF rendering 100% client-side.
 */
export function ReceiptPreviewModal({ data, onClose }) {
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  // Memoize the document to prevent BlobProvider from re-rendering the PDF whenever state changes
  const doc = React.useMemo(() => <InventoryReceiptDocument data={data} />, [data]);

  return (
    <BlobProvider document={doc}>
      {({ blob, url, loading: pdfLoading, error }) => (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: isFullscreen ? 0 : 24,
          }}
          onClick={e => {
            e.stopPropagation();
            if (e.target === e.currentTarget && !isFullscreen) onClose();
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: isFullscreen ? 0 : 16,
              width: '100%',
              maxWidth: isFullscreen ? '100%' : 860,
              height: isFullscreen ? '100vh' : 'auto',
              maxHeight: isFullscreen ? '100vh' : '92vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: isFullscreen ? 'none' : '0 32px 80px rgba(0,0,0,0.35)',
              overflow: 'hidden',
              transition: 'all 0.2s ease-in-out',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 22px',
                borderBottom: '1px solid #e2e8f0',
                background: '#f8fafc',
              }}
            >
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a', fontFamily: 'Inter,sans-serif' }}>
                  {data?.type === 'OUTBOUND' ? 'Phiếu Xuất Kho' : 'Phiếu Nhập Kho'} — {data?.type === 'OUTBOUND' ? 'OUT' : 'INV'}-{String(data?.invReqId || '0').padStart(5, '0')}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2, fontFamily: 'Inter,sans-serif' }}>
                  Kho: {data?.warehouseName} &nbsp;·&nbsp; Ngày lập: {data?.createdAt ? new Date(data.createdAt).toLocaleDateString('vi-VN') : '—'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 8,
                    border: '1.5px solid #e2e8f0',
                    background: '#f1f5f9',
                    fontFamily: 'Inter,sans-serif',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#475569',
                    cursor: 'pointer',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                  onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
                >
                  {isFullscreen ? 'Thu nhỏ' : 'Phóng to'}
                </button>
                {!pdfLoading && !error && url && (
                  <a
                    href={url}
                    download={data?.type === 'OUTBOUND'
                      ? `Phieu-Xuat-Kho-OUT-${String(data?.invReqId || '0').padStart(5, '0')}.pdf`
                      : `Phieu-Nhap-Kho-INV-${String(data?.invReqId || '0').padStart(5, '0')}.pdf`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '7px 16px',
                      borderRadius: 8,
                      background: '#1e293b',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      textDecoration: 'none',
                      fontFamily: 'Inter,sans-serif',
                    }}
                  >
                    Tải xuống PDF
                  </a>
                )}
                <button
                  onClick={onClose}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 8,
                    border: '1.5px solid #e2e8f0',
                    background: '#fff',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    color: '#64748b',
                    cursor: 'pointer',
                    fontFamily: 'Inter,sans-serif',
                  }}
                >
                  Đóng
                </button>
              </div>
            </div>

            {/* PDF Viewer */}
            <div style={{ flex: 1, overflow: 'hidden', background: '#525659', padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {pdfLoading && (
                <div style={{ color: '#fff', fontFamily: 'Inter,sans-serif', fontSize: '0.9rem' }}>
                  Dang tao phieu PDF...
                </div>
              )}
              {error && (
                <div style={{ color: '#fca5a5', fontFamily: 'Inter,sans-serif', fontSize: '0.9rem' }}>
                  Loi khi tao PDF. Vui long thu lai.
                </div>
              )}
              {!pdfLoading && !error && url && (
                <iframe
                  key={isFullscreen ? 'full' : 'normal'}
                  src={`${url}#zoom=${isFullscreen ? 100 : 67}`}
                  title="Phieu Nhap Kho Preview"
                  style={{
                    width: '100%',
                    height: '100%',
                    minHeight: isFullscreen ? '100%' : 520,
                    border: 'none',
                    borderRadius: 4,
                    background: '#fff',
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </BlobProvider>
  );
}

export default InventoryReceiptDocument;

