import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../services/axiosClient';
import inventoryService from '../../services/inventoryService';
import renterAssetService from '../../services/renterAssetService';

/* ─── Validation rules ────────────────────────────────────────────── */
const RULES = {
  warehouseId:  (v)            => !v                                                        ? 'Vui lòng chọn kho xuất hàng.'                                  : '',
  assetId:      (v)            => !v                                                        ? 'Vui lòng chọn tài sản cần xuất.'                               : '',
  qty:          (v, ctx)       => {
    if (!v && v !== 0)                                                                        return 'Số lượng không được để trống.';
    if (isNaN(Number(v)))                                                                     return 'Số lượng phải là số.';
    if (Number(v) < 1)                                                                        return 'Số lượng phải ít nhất là 1.';
    if (!Number.isInteger(Number(v)))                                                         return 'Số lượng phải là số nguyên.';
    if (ctx.availableQty !== null && Number(v) > ctx.availableQty)
      return `Vượt quá tồn kho hiện có (${ctx.availableQty} ${ctx.unit}).`;
    if (Number(v) > 99999)                                                                    return 'Số lượng không được vượt quá 99.999.';
    return '';
  },
  description:  (v)            => v.length > 500                                            ? 'Mô tả không được vượt quá 500 ký tự.'                           : '',
  notes:        (v)            => v.length > 1000                                           ? 'Ghi chú không được vượt quá 1.000 ký tự.'                       : '',
};

const validate = (field, value, ctx = {}) => (RULES[field] ? RULES[field](value, ctx) : '');

const validateAll = (form, ctx) => {
  const errs = {};
  Object.keys(RULES).forEach(k => { errs[k] = validate(k, form[k] ?? '', ctx); });
  return errs;
};

const hasErrors = (errs) => Object.values(errs).some(e => e);

/* ─── UI helpers ──────────────────────────────────────────────────── */
const ERR_COLOR  = '#dc2626';
const ERR_BG     = '#fef2f2';
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

/* ─── Main Component ──────────────────────────────────────────────── */
const CreateOutboundRequest = () => {
  const navigate = useNavigate();

  const [warehouses,  setWarehouses]  = useState([]);
  const [loadingWH,   setLoadingWH]   = useState(true);
  const [submitting,  setSubmitting]  = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [inventory,   setInventory]   = useState([]);
  const [loadingInv,  setLoadingInv]  = useState(false);
  const [availableQty, setAvailableQty] = useState(null);

  const [form, setForm] = useState({
    warehouseId: '', assetId: '', itemName: '',
    qty: 1, unit: 'cái', description: '', notes: '',
  });

  const [errors,  setErrors]  = useState({});
  const [touched, setTouched] = useState({});

  const getCtx = useCallback(() => ({ availableQty, unit: form.unit }), [availableQty, form.unit]);

  const touch = useCallback((field) => {
    setTouched(t => ({ ...t, [field]: true }));
    setErrors(e => ({ ...e, [field]: validate(field, form[field] ?? '', getCtx()) }));
  }, [form, getCtx]);

  const set = (k) => (e) => {
    const val = e.target.value;
    setForm(f => ({ ...f, [k]: val }));
    if (touched[k]) setErrors(err => ({ ...err, [k]: validate(k, val, getCtx()) }));
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

  // Load inventory when warehouse changes
  useEffect(() => {
    if (!form.warehouseId) { setInventory([]); return; }
    setLoadingInv(true);
    setForm(f => ({ ...f, assetId: '', itemName: '', unit: 'cái' }));
    setAvailableQty(null);
    setErrors(e => ({ ...e, assetId: '', qty: '' }));
    renterAssetService.getInventoryByWarehouse(Number(form.warehouseId))
      .then(res => {
        const inv = Array.isArray(res.data) ? res.data : [];
        setInventory(inv.filter(i => i.quantity > 0));
      })
      .catch(() => setInventory([]))
      .finally(() => setLoadingInv(false));
  }, [form.warehouseId]); // eslint-disable-line

  const handleAssetChange = (e) => {
    const assetId = e.target.value;
    const item = inventory.find(i => String(i.assetId) === assetId);
    if (item) {
      setForm(f => ({ ...f, assetId: String(item.assetId), itemName: item.assetName, unit: item.unit || 'cái' }));
      setAvailableQty(item.quantity);
      setErrors(err => ({ ...err, assetId: '', qty: validate('qty', form.qty, { availableQty: item.quantity, unit: item.unit || 'cái' }) }));
    } else {
      setForm(f => ({ ...f, assetId: '', itemName: '', unit: 'cái' }));
      setAvailableQty(null);
      if (touched.assetId) setErrors(err => ({ ...err, assetId: 'Vui lòng chọn tài sản cần xuất.' }));
    }
  };

  const handleQtyChange = (e) => {
    const val = e.target.value;
    setForm(f => ({ ...f, qty: val }));
    if (touched.qty) setErrors(err => ({ ...err, qty: validate('qty', val, { availableQty, unit: form.unit }) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    const allTouched = Object.keys(RULES).reduce((acc, k) => ({ ...acc, [k]: true }), {});
    setTouched(allTouched);
    const ctx = { availableQty, unit: form.unit };
    const errs = validateAll(form, ctx);
    setErrors(errs);
    if (hasErrors(errs)) {
      setSubmitError('Vui lòng kiểm tra lại các trường bị lỗi bên dưới.');
      return;
    }

    setSubmitting(true);
    try {
      await inventoryService.createInventoryRequest({
        warehouseId: Number(form.warehouseId),
        type: 'OUTBOUND',
        notes: form.notes || null,
        items: [{
          assetId: Number(form.assetId),
          itemName: form.itemName,
          quantity: Number(form.qty),
          unit: form.unit,
          description: form.description || null,
        }],
      });
      navigate('/renter-outbound-requests', { state: { created: true } });
    } catch (err) {
      setSubmitError(err?.response?.data?.message || 'Tạo yêu cầu thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const inp = (field) => inputBase(touched[field] && errors[field]);

  return (
    <div style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif', minWidth: 0 }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: '#0f172a' }}>Tạo yêu cầu xuất kho</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>Khởi tạo một yêu cầu vận chuyển mới bằng cách cung cấp thông tin logistics cần thiết.</p>
      </div>

      {/* Info banner */}
      <div style={{ display: 'flex', alignItems: 'flex-start', borderRadius: 12, padding: '14px 18px', marginBottom: 24, gap: 12, background: '#fff8e1', border: '1px solid #ffe082' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#f59e0b', marginTop: 1 }}>info</span>
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#b45309' }}>Kiểm tra trước khi xuất kho</p>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
            Chỉ những tài sản có tồn kho tại warehouse đã chọn mới hiện trong danh sách. Số lượng xuất không được vượt quá tồn kho hiện có.
          </p>
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
                <Label required>Chọn kho xuất hàng</Label>
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
                        <option value="">Chọn kho xuất hàng</option>
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
                <Label required>Chọn tài sản xuất kho</Label>
                <div style={{ position: 'relative' }}>
                  {loadingInv ? (
                    <div style={{ ...inp('assetId'), color: '#94a3b8' }}>Đang tải tồn kho...</div>
                  ) : !form.warehouseId ? (
                    <div style={{ ...inp('assetId'), color: '#94a3b8', userSelect: 'none' }}>Vui lòng chọn kho trước</div>
                  ) : inventory.length === 0 ? (
                    <div style={{ ...inp('assetId'), color: '#94a3b8', userSelect: 'none' }}>Không có tài sản tồn kho tại kho này</div>
                  ) : (
                    <select
                      value={form.assetId}
                      onChange={(e) => { handleAssetChange(e); if (!touched.assetId) setTouched(t => ({ ...t, assetId: true })); }}
                      onBlur={() => touch('assetId')}
                      style={{ ...inp('assetId'), appearance: 'none', paddingRight: 36, cursor: 'pointer' }}
                    >
                      <option value="">— Chọn tài sản —</option>
                      {inventory.map(i => (
                        <option key={i.assetId} value={i.assetId}>{i.assetName} — Tồn: {i.quantity} {i.unit}</option>
                      ))}
                    </select>
                  )}
                  <span className="material-symbols-outlined" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none', fontSize: 18 }}>expand_more</span>
                </div>
                {/* Available qty badge */}
                {availableQty !== null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 13, color: '#16a34a' }}>inventory_2</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#16a34a' }}>Tồn kho: {availableQty} {form.unit}</span>
                  </div>
                )}
                <FieldError msg={touched.assetId && errors.assetId} />
              </div>

              {/* Description */}
              <div>
                <Label>Mô tả hàng hóa</Label>
                <textarea
                  value={form.description}
                  onChange={set('description')}
                  onBlur={() => touch('description')}
                  placeholder="Mô tả chi tiết về lô hàng xuất kho (tùy chọn)"
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
                    max={availableQty ?? 99999}
                    step={1}
                    value={form.qty}
                    onChange={handleQtyChange}
                    onBlur={() => touch('qty')}
                    style={inp('qty')}
                  />
                  <FieldError msg={touched.qty && errors.qty} />
                </div>
                <div>
                  <Label>Đơn vị</Label>
                  <div style={{ ...inp('unit'), background: '#f1f5f9', color: '#64748b', userSelect: 'none' }}>{form.unit || 'cái'}</div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label>Ghi chú vận chuyển</Label>
                <textarea
                  value={form.notes}
                  onChange={set('notes')}
                  onBlur={() => touch('notes')}
                  placeholder="Hướng dẫn xử lý, mức độ khẩn cấp hoặc thông tin cổng ra vào... (tùy chọn)"
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
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #f1f5f9', background: '#f8fafc', padding: '16px 28px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" onClick={() => navigate(-1)} disabled={submitting}
            style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer', opacity: submitting ? 0.5 : 1 }}>
            Hủy bỏ
          </button>
          <button type="submit" disabled={submitting || loadingWH}
            style={{ padding: '10px 22px', borderRadius: 8, border: 'none', background: '#f59e0b', fontSize: 13, fontWeight: 700, color: '#fff', cursor: submitting ? 'not-allowed' : 'pointer', opacity: (submitting || loadingWH) ? 0.65 : 1, display: 'flex', alignItems: 'center', gap: 7 }}>
            {submitting && <span className="material-symbols-outlined" style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}>sync</span>}
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>send</span>
            {submitting ? 'Đang tạo...' : 'Tạo yêu cầu xuất kho'}
          </button>
        </div>
      </form>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default CreateOutboundRequest;
