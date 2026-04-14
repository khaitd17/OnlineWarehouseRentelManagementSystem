import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../services/axiosClient';
import inventoryService from '../../services/inventoryService';
import renterAssetService from '../../services/renterAssetService';

/* ─── Validation rules ────────────────────────────────────────────── */
const RULES = {
  warehouseId:   (v)       => !v                                     ? 'Vui lòng chọn kho hàng.'                                       : '',
  assetId:       (v, ctx)  => !v && !ctx.isNewAsset                  ? 'Vui lòng chọn tài sản hoặc chọn "Tạo tài sản mới".'             : '',
  itemName:      (v, ctx)  => ctx.isNewAsset && !v.trim()            ? 'Tên tài sản không được để trống.'
                            : ctx.isNewAsset && v.trim().length < 2  ? 'Tên tài sản phải có ít nhất 2 ký tự.'
                            : ctx.isNewAsset && v.trim().length > 100 ? 'Tên tài sản không được vượt quá 100 ký tự.'                    : '',
  unit:          (v, ctx)  => ctx.isNewAsset && !v.trim()            ? 'Đơn vị không được để trống.'
                            : ctx.isNewAsset && v.trim().length > 30  ? 'Đơn vị không được vượt quá 30 ký tự.'                         : '',
  qty:           (v)       => !v && v !== 0                          ? 'Số lượng không được để trống.'
                            : isNaN(Number(v))                        ? 'Số lượng phải là số.'
                            : Number(v) < 1                           ? 'Số lượng phải ít nhất là 1.'
                            : !Number.isInteger(Number(v))            ? 'Số lượng phải là số nguyên.'
                            : Number(v) > 99999                       ? 'Số lượng không được vượt quá 99.999.'                          : '',
  weightPerUnit: (v, ctx)  => ctx.isNewAsset && v !== '' && isNaN(Number(v))  ? 'Khối lượng phải là số.'
                            : ctx.isNewAsset && v !== '' && Number(v) < 0      ? 'Khối lượng không được âm.'
                            : ctx.isNewAsset && v !== '' && Number(v) > 99999  ? 'Khối lượng không được vượt quá 99.999 kg.'             : '',
  description:   (v)       => v.length > 500                         ? 'Mô tả không được vượt quá 500 ký tự.'                          : '',
  notes:         (v)       => v.length > 1000                        ? 'Ghi chú không được vượt quá 1.000 ký tự.'                      : '',
};

const validate = (field, value, ctx) => (RULES[field] ? RULES[field](value, ctx) : '');

const validateAll = (form, isNewAsset) => {
  const ctx = { isNewAsset };
  const errs = {};
  Object.keys(RULES).forEach(k => { errs[k] = validate(k, form[k] ?? '', ctx); });
  return errs;
};

const hasErrors = (errs) => Object.values(errs).some(e => e);

/* ─── UI helpers ──────────────────────────────────────────────────── */
const ERR_COLOR = '#dc2626';
const ERR_BG    = '#fef2f2';
const ERR_BORDER = '#fca5a5';

const inputBase = (err) => ({
  width: '100%', borderRadius: 8,
  border: `1px solid ${err ? ERR_BORDER : '#e2e8f0'}`,
  background: err ? ERR_BG : '#f8fafc',
  padding: '10px 14px', fontSize: 13, color: '#1e293b',
  outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
  fontFamily: 'Inter, sans-serif',
});

const FieldError = ({ msg }) => msg ? (
  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
    <span className="material-symbols-outlined" style={{ fontSize: 13, color: ERR_COLOR }}>error</span>
    <span style={{ fontSize: 11, color: ERR_COLOR }}>{msg}</span>
  </div>
) : null;

const Label = ({ children, required }) => (
  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
    {children}{required && <span style={{ color: ERR_COLOR, marginLeft: 2 }}>*</span>}
  </label>
);

const getFileIcon = (filename) => {
  const ext = filename.split('.').pop().toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return { icon: 'image', color: '#7c3aed' };
  if (ext === 'pdf') return { icon: 'picture_as_pdf', color: '#dc2626' };
  if (['xls', 'xlsx'].includes(ext)) return { icon: 'table_chart', color: '#16a34a' };
  if (['doc', 'docx'].includes(ext)) return { icon: 'description', color: '#2563eb' };
  return { icon: 'attach_file', color: '#64748b' };
};

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/* ─── Main Component ──────────────────────────────────────────────── */
const CreateInboundRequest = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [warehouses,    setWarehouses]    = useState([]);
  const [loadingWH,     setLoadingWH]     = useState(true);
  const [submitting,    setSubmitting]    = useState(false);
  const [submitError,   setSubmitError]   = useState('');

  const [assets,        setAssets]        = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [isNewAsset,    setIsNewAsset]    = useState(false);

  const [docFiles,      setDocFiles]      = useState([]);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [uploadedUrls,  setUploadedUrls]  = useState([]);
  const [dragOver,      setDragOver]      = useState(false);

  const [form, setForm] = useState({
    warehouseId: '', assetId: '', qty: 1,
    unit: 'cái', itemName: '', weightPerUnit: '', description: '', notes: '',
  });

  // Validation state: errors + touched
  const [errors,  setErrors]  = useState({});
  const [touched, setTouched] = useState({});

  // Live-validate a single field
  const touch = useCallback((field) => {
    setTouched(t => ({ ...t, [field]: true }));
    setErrors(e => ({ ...e, [field]: validate(field, form[field] ?? '', { isNewAsset }) }));
  }, [form, isNewAsset]);

  const set = (k) => (e) => {
    const val = e.target.value;
    setForm(f => ({ ...f, [k]: val }));
    if (touched[k]) setErrors(err => ({ ...err, [k]: validate(k, val, { isNewAsset }) }));
  };

  // Load warehouses
  useEffect(() => {
    axiosClient.get('/rental-contracts/my-contracts')
      .then(res => {
        const contracts = Array.isArray(res.data) ? res.data : [];
        const seen = new Set();
        const whs = contracts.reduce((acc, c) => {
          if (c.warehouseId && !seen.has(c.warehouseId)) {
            seen.add(c.warehouseId);
            acc.push({ warehouseId: c.warehouseId, name: c.warehouseName || `Kho #${c.warehouseId}` });
          }
          return acc;
        }, []);
        setWarehouses(whs);
      })
      .catch(() => setWarehouses([]))
      .finally(() => setLoadingWH(false));
  }, []);

  // Load assets
  useEffect(() => {
    setLoadingAssets(true);
    renterAssetService.getMyAssets()
      .then(res => setAssets(Array.isArray(res.data) ? res.data : []))
      .catch(() => setAssets([]))
      .finally(() => setLoadingAssets(false));
  }, []);

  const handleAssetChange = (e) => {
    const assetId = e.target.value;
    if (assetId === '__new__') {
      setIsNewAsset(true);
      setForm(f => ({ ...f, assetId: '', itemName: '', unit: 'cái', weightPerUnit: '' }));
      setErrors(err => ({ ...err, assetId: '' }));
    } else {
      setIsNewAsset(false);
      const asset = assets.find(a => String(a.assetId) === assetId);
      if (asset) {
        setForm(f => ({ ...f, assetId: String(asset.assetId), itemName: asset.assetName, unit: asset.unit || 'cái', weightPerUnit: asset.weightPerUnit ?? '' }));
        setErrors(err => ({ ...err, assetId: '', itemName: '', unit: '' }));
      } else {
        setForm(f => ({ ...f, assetId: '', itemName: '' }));
      }
      if (touched.assetId) setErrors(err => ({ ...err, assetId: validate('assetId', assetId, { isNewAsset: false }) }));
    }
  };

  // File upload
  const ALLOWED_TYPES = ['application/pdf','image/jpeg','image/png','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

  const addFiles = (fileList) => {
    const incoming = Array.from(fileList);
    const valid = incoming.filter(f => (ALLOWED_TYPES.includes(f.type) || f.name.match(/\.(pdf|jpg|jpeg|png|xls|xlsx|doc|docx)$/i)) && f.size <= 10 * 1024 * 1024);
    if (valid.length !== incoming.length) setSubmitError('Một số file không hợp lệ (chỉ PDF, ảnh, Excel, Word) hoặc vượt 10MB và đã bị bỏ qua.');
    setDocFiles(prev => [...prev, ...valid.map(f => ({ file: f, name: f.name, size: f.size }))].slice(0, 10));
    setUploadedUrls([]);
  };

  const removeFile = (idx) => { setDocFiles(prev => prev.filter((_, i) => i !== idx)); setUploadedUrls([]); };

  const uploadDocuments = async () => {
    if (docFiles.length === 0) return [];
    setUploadingDocs(true);
    try {
      const fd = new FormData();
      docFiles.forEach(({ file }) => fd.append('files', file));
      const res = await axiosClient.post('/upload/inventory-documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const urls = res.data?.urls || [];
      setUploadedUrls(urls);
      return urls;
    } catch (err) {
      throw new Error(err?.response?.data?.message || 'Upload chứng từ thất bại.');
    } finally {
      setUploadingDocs(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    // Mark all fields touched + validate all
    const allTouched = Object.keys(RULES).reduce((acc, k) => ({ ...acc, [k]: true }), {});
    setTouched(allTouched);
    const errs = validateAll(form, isNewAsset);
    setErrors(errs);
    if (hasErrors(errs)) {
      setSubmitError('Vui lòng kiểm tra lại các trường bị lỗi bên dưới.');
      return;
    }

    setSubmitting(true);
    try {
      let assetId = form.assetId ? Number(form.assetId) : null;
      if (isNewAsset && form.itemName.trim()) {
        const createRes = await renterAssetService.createAsset({
          assetName: form.itemName.trim(), unit: form.unit,
          weightPerUnit: form.weightPerUnit ? Number(form.weightPerUnit) : null,
          description: form.description || null,
        });
        assetId = createRes.data.assetId;
        const refreshed = await renterAssetService.getMyAssets();
        setAssets(Array.isArray(refreshed.data) ? refreshed.data : []);
      }

      let documentUrls = uploadedUrls;
      if (docFiles.length > 0 && uploadedUrls.length === 0) documentUrls = await uploadDocuments();

      await inventoryService.createInventoryRequest({
        warehouseId: Number(form.warehouseId),
        type: 'INBOUND',
        notes: form.notes || null,
        documentUrls: documentUrls.length > 0 ? documentUrls : null,
        items: [{ assetId, itemName: form.itemName.trim(), quantity: Number(form.qty), unit: form.unit, weight: form.weightPerUnit ? Number(form.weightPerUnit) * Number(form.qty) : null, description: form.description || null }],
      });
      navigate('/renter-inbound-requests', { state: { created: true } });
    } catch (err) {
      setSubmitError(err?.message || err?.response?.data?.message || 'Tạo yêu cầu thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const inp = (field) => inputBase(touched[field] && errors[field]);

  return (
    <div style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif', minWidth: 0 }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: '#0f172a' }}>Tạo yêu cầu nhập kho</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>Đăng ký một lô hàng nhập kho mới vào hệ thống quản lý kho.</p>
      </div>

      {/* Info banner */}
      <div style={{ display: 'flex', alignItems: 'flex-start', borderRadius: 12, padding: '14px 18px', marginBottom: 24, gap: 12, background: '#e0f7fa', border: '1px solid #b2ebf2' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#00b2d6', marginTop: 1 }}>info</span>
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#00b2d6' }}>Kiểm tra trước khi nhập kho</p>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: '#475569', lineHeight: 1.5 }}>Chọn tài sản từ danh mục hoặc tạo mới. Hệ thống sẽ tự động cập nhật tồn kho khi yêu cầu được xác nhận.</p>
        </div>
      </div>

      {/* Submit error */}
      {submitError && (
        <div style={{ marginBottom: 18, borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>
          {submitError}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '28px 28px 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px 40px' }}>

            {/* LEFT */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Warehouse */}
              <div>
                <Label required>Chọn kho hàng</Label>
                <div style={{ position: 'relative' }}>
                  {loadingWH
                    ? <div style={{ ...inp('warehouseId'), color: '#94a3b8' }}>Đang tải danh sách kho...</div>
                    : (
                      <select
                        value={form.warehouseId}
                        onChange={set('warehouseId')}
                        onBlur={() => touch('warehouseId')}
                        style={{ ...inp('warehouseId'), appearance: 'none', paddingRight: 36, cursor: 'pointer' }}
                      >
                        <option value="">Chọn kho hàng đích</option>
                        {warehouses.length > 0
                          ? warehouses.map(w => <option key={w.warehouseId} value={w.warehouseId}>{w.name}</option>)
                          : <option value="" disabled>Không có kho đang thuê</option>
                        }
                      </select>
                    )
                  }
                  <span className="material-symbols-outlined" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none', fontSize: 18 }}>expand_more</span>
                </div>
                <FieldError msg={touched.warehouseId && errors.warehouseId} />
              </div>

              {/* Asset */}
              <div>
                <Label required>Chọn tài sản</Label>
                <div style={{ position: 'relative' }}>
                  {loadingAssets
                    ? <div style={{ ...inp('assetId'), color: '#94a3b8' }}>Đang tải danh mục...</div>
                    : (
                      <select
                        value={isNewAsset ? '__new__' : form.assetId}
                        onChange={handleAssetChange}
                        onBlur={() => touch('assetId')}
                        style={{ ...inp('assetId'), appearance: 'none', paddingRight: 36, cursor: 'pointer' }}
                      >
                        <option value="">— Chọn từ danh mục tài sản —</option>
                        {assets.map(a => <option key={a.assetId} value={a.assetId}>{a.assetName} ({a.unit})</option>)}
                        <option value="__new__">➕ Tạo tài sản mới...</option>
                      </select>
                    )
                  }
                  <span className="material-symbols-outlined" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none', fontSize: 18 }}>expand_more</span>
                </div>
                <FieldError msg={touched.assetId && errors.assetId} />
              </div>

              {/* Item name — only when new asset */}
              {isNewAsset && (
                <div>
                  <Label required>Tên tài sản mới</Label>
                  <input
                    type="text"
                    value={form.itemName}
                    onChange={set('itemName')}
                    onBlur={() => touch('itemName')}
                    placeholder="VD: Mì tôm Hảo Hảo 75g"
                    maxLength={101}
                    style={inp('itemName')}
                  />
                  <FieldError msg={touched.itemName && errors.itemName} />
                </div>
              )}

              {/* Description */}
              <div>
                <Label>Mô tả mặt hàng</Label>
                <textarea
                  value={form.description}
                  onChange={set('description')}
                  onBlur={() => touch('description')}
                  placeholder="Cung cấp thêm chi tiết về mặt hàng (tùy chọn)"
                  rows={4}
                  maxLength={501}
                  style={{ ...inp('description'), resize: 'vertical', minHeight: 90 }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <FieldError msg={touched.description && errors.description} />
                  <span style={{ fontSize: 10, color: form.description.length > 480 ? ERR_COLOR : '#94a3b8', marginLeft: 'auto' }}>{form.description.length}/500</span>
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Qty + Unit */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <Label required>Số lượng</Label>
                  <input
                    type="number"
                    min={1}
                    max={99999}
                    step={1}
                    value={form.qty}
                    onChange={set('qty')}
                    onBlur={() => touch('qty')}
                    style={inp('qty')}
                  />
                  <FieldError msg={touched.qty && errors.qty} />
                </div>
                <div>
                  <Label required={isNewAsset}>Đơn vị</Label>
                  {isNewAsset ? (
                    <>
                      <input
                        type="text"
                        value={form.unit}
                        onChange={set('unit')}
                        onBlur={() => touch('unit')}
                        placeholder="cái, kg, thùng..."
                        maxLength={31}
                        style={inp('unit')}
                      />
                      <FieldError msg={touched.unit && errors.unit} />
                    </>
                  ) : (
                    <div style={{ ...inp('unit'), background: '#f1f5f9', color: '#64748b', userSelect: 'none' }}>{form.unit || 'cái'}</div>
                  )}
                </div>
              </div>

              {/* Weight — only when new asset */}
              {isNewAsset && (
                <div>
                  <Label>Khối lượng / đơn vị (kg)</Label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="99999"
                    value={form.weightPerUnit}
                    onChange={set('weightPerUnit')}
                    onBlur={() => touch('weightPerUnit')}
                    placeholder="Tuỳ chọn"
                    style={inp('weightPerUnit')}
                  />
                  <FieldError msg={touched.weightPerUnit && errors.weightPerUnit} />
                </div>
              )}

              {/* Notes */}
              <div>
                <Label>Ghi chú lô hàng</Label>
                <textarea
                  value={form.notes}
                  onChange={set('notes')}
                  onBlur={() => touch('notes')}
                  placeholder="Hướng dẫn xử lý, ghi chú giao hàng, điều kiện bảo quản... (tùy chọn)"
                  rows={4}
                  maxLength={1001}
                  style={{ ...inp('notes'), resize: 'vertical', minHeight: 90 }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <FieldError msg={touched.notes && errors.notes} />
                  <span style={{ fontSize: 10, color: form.notes.length > 950 ? ERR_COLOR : '#94a3b8', marginLeft: 'auto' }}>{form.notes.length}/1000</span>
                </div>
              </div>
            </div>
          </div>

          {/* Document Upload */}
          <div style={{ marginTop: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#00b2d6' }}>folder_open</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>Chứng từ đính kèm</span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>(Tùy chọn — tối đa 10 file, mỗi file ≤ 10MB)</span>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? '#00b2d6' : '#cbd5e1'}`,
                background: dragOver ? '#e0f7fa' : '#f8fafc',
                borderRadius: 10, padding: '22px 16px', textAlign: 'center',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 36, color: dragOver ? '#00b2d6' : '#94a3b8', display: 'block', marginBottom: 6 }}>cloud_upload</span>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#475569' }}>
                Kéo thả file vào đây hoặc <span style={{ color: '#00b2d6' }}>nhấn để chọn file</span>
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 11, color: '#94a3b8' }}>PDF, ảnh, Excel, Word · Tối đa 10 file, mỗi file ≤ 10MB</p>
              <input ref={fileInputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.xls,.xlsx,.doc,.docx" style={{ display: 'none' }} onChange={(e) => addFiles(e.target.files)} />
            </div>

            {/* File list */}
            {docFiles.length > 0 && (
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {docFiles.map((f, idx) => {
                  const { icon, color } = getFileIcon(f.name);
                  const uploaded = uploadedUrls.length > 0;
                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, borderRadius: 8, padding: '8px 12px', background: uploaded ? '#f0fdf4' : '#f8fafc', border: `1px solid ${uploaded ? '#bbf7d0' : '#e2e8f0'}` }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 20, color }}>{icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</p>
                        <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>{formatBytes(f.size)}</p>
                      </div>
                      {uploaded
                        ? <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#16a34a' }}>check_circle</span>
                        : <button type="button" onClick={(e) => { e.stopPropagation(); removeFile(idx); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                          </button>
                      }
                    </div>
                  );
                })}
                {uploadedUrls.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8, padding: '8px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#16a34a' }}>check_circle</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#15803d' }}>Đã upload {uploadedUrls.length} chứng từ thành công</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #f1f5f9', background: '#f8fafc', padding: '16px 28px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" onClick={() => navigate(-1)} disabled={submitting}
            style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer', opacity: submitting ? 0.5 : 1 }}>
            Hủy bỏ
          </button>
          <button type="submit" disabled={submitting || loadingWH || uploadingDocs}
            style={{ padding: '10px 22px', borderRadius: 8, border: 'none', background: '#00b2d6', fontSize: 13, fontWeight: 700, color: '#fff', cursor: submitting ? 'not-allowed' : 'pointer', opacity: (submitting || loadingWH || uploadingDocs) ? 0.65 : 1, display: 'flex', alignItems: 'center', gap: 7 }}>
            {(submitting || uploadingDocs) && <span className="material-symbols-outlined" style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}>sync</span>}
            {uploadingDocs ? 'Đang upload...' : submitting ? 'Đang tạo...' : 'Tạo yêu cầu nhập kho'}
          </button>
        </div>
      </form>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default CreateInboundRequest;
