import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosClient from '../../services/axiosClient';
import inventoryService from '../../services/inventoryService';
import renterAssetService from '../../services/renterAssetService';

/* ── Shared helpers ─────────────────────────────────────────────── */
const FIELD = ({ label, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-semibold text-slate-700">{label}</label>
    {children}
  </div>
);

const inputCls =
  'w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-primary focus:ring-2 transition-all';

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

/* ── Inbound tab ─────────────────────────────────────────────────── */
function InboundTab({ warehouses, loadingWH }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [assets, setAssets] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [isNewAsset, setIsNewAsset] = useState(false);
  const [docFiles, setDocFiles] = useState([]);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState([]);
  const [dragOver, setDragOver] = useState(false);

  const [form, setForm] = useState({
    warehouseId: '', assetId: '', qty: 1, unit: 'cái',
    itemName: '', weightPerUnit: '', description: '', notes: '',
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

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
    } else {
      setIsNewAsset(false);
      const asset = assets.find(a => String(a.assetId) === assetId);
      if (asset) {
        setForm(f => ({ ...f, assetId: String(asset.assetId), itemName: asset.assetName, unit: asset.unit || 'cái', weightPerUnit: asset.weightPerUnit ?? '' }));
      } else {
        setForm(f => ({ ...f, assetId: '', itemName: '' }));
      }
    }
  };

  const ALLOWED_TYPES = [
    'application/pdf', 'image/jpeg', 'image/png',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  const addFiles = (fileList) => {
    const incoming = Array.from(fileList);
    const valid = incoming.filter(f => {
      if (!ALLOWED_TYPES.includes(f.type) && !f.name.match(/\.(pdf|jpg|jpeg|png|xls|xlsx|doc|docx)$/i)) return false;
      if (f.size > 10 * 1024 * 1024) return false;
      return true;
    });
    if (valid.length !== incoming.length) setError('Một số file không hợp lệ hoặc vượt 10MB và đã bị bỏ qua.');
    setDocFiles(prev => [...prev, ...valid.map(f => ({ file: f, name: f.name, size: f.size }))].slice(0, 10));
    setUploadedUrls([]);
  };

  const removeFile = (idx) => { setDocFiles(prev => prev.filter((_, i) => i !== idx)); setUploadedUrls([]); };

  const uploadDocuments = async () => {
    if (docFiles.length === 0) return [];
    setUploadingDocs(true);
    try {
      const formData = new FormData();
      docFiles.forEach(({ file }) => formData.append('files', file));
      const res = await axiosClient.post('/upload/inventory-documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
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
    setError('');
    if (!form.warehouseId) { setError('Vui lòng chọn kho hàng.'); return; }
    if (!form.assetId && !form.itemName.trim()) { setError('Vui lòng chọn hoặc tạo tài sản mới.'); return; }
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
        warehouseId: Number(form.warehouseId), type: 'INBOUND',
        notes: form.notes || null,
        documentUrls: documentUrls.length > 0 ? documentUrls : null,
        items: [{ assetId, itemName: form.itemName.trim(), quantity: Number(form.qty), unit: form.unit, weight: form.weightPerUnit ? Number(form.weightPerUnit) * Number(form.qty) : null, description: form.description || null }],
      });
      navigate('/renter-inventory-history?tab=inbound', { state: { created: true, type: 'INBOUND' } });
    } catch (err) {
      setError(err?.message || err?.response?.data?.message || 'Tạo yêu cầu thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Info banner */}
      <div className="flex items-start justify-between rounded-xl px-5 py-4 mb-8 gap-4" style={{ backgroundColor: '#e0f7fa', border: '1px solid #b2ebf2' }}>
        <div className="flex items-start gap-3 flex-1">
          <span className="material-symbols-outlined text-[20px] mt-0.5" style={{ color: '#00b2d6' }}>info</span>
          <div>
            <p className="text-sm font-bold" style={{ color: '#00b2d6' }}>Kiểm tra trước khi nhập kho</p>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">Chọn tài sản từ danh mục hoặc tạo mới. Hệ thống sẽ tự động cập nhật tồn kho khi yêu cầu được xác nhận.</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg px-4 py-3 flex items-center gap-2 text-sm font-medium" style={{ backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}>
          <span className="material-symbols-outlined text-[18px]">error</span>{error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
            <div className="space-y-5">
              <FIELD label="Chọn kho hàng">
                <div className="relative">
                  {loadingWH ? (
                    <div className={inputCls + ' text-slate-400'}>Đang tải danh sách kho...</div>
                  ) : (
                    <select value={form.warehouseId} onChange={set('warehouseId')} className={inputCls + ' appearance-none pr-10'} required>
                      <option value="">Chọn kho hàng đích</option>
                      {warehouses.length > 0
                        ? warehouses.map(w => <option key={w.warehouseId} value={w.warehouseId}>{w.name}</option>)
                        : <option value="" disabled>Không có kho đang thuê</option>}
                    </select>
                  )}
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                </div>
              </FIELD>

              <FIELD label="Chọn tài sản">
                <div className="relative">
                  {loadingAssets ? (
                    <div className={inputCls + ' text-slate-400'}>Đang tải danh mục...</div>
                  ) : (
                    <select value={isNewAsset ? '__new__' : form.assetId} onChange={handleAssetChange} className={inputCls + ' appearance-none pr-10'}>
                      <option value="">— Chọn từ danh mục tài sản —</option>
                      {assets.map(a => <option key={a.assetId} value={a.assetId}>{a.assetName} ({a.unit})</option>)}
                      <option value="__new__">➕ Tạo tài sản mới...</option>
                    </select>
                  )}
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                </div>
              </FIELD>

              {isNewAsset && (
                <FIELD label="Tên tài sản mới">
                  <input type="text" value={form.itemName} onChange={set('itemName')} placeholder="VD: Mì tôm Hảo Hảo 75g" className={inputCls} required />
                </FIELD>
              )}

              <FIELD label="Mô tả mặt hàng">
                <textarea value={form.description} onChange={set('description')} placeholder="Cung cấp thêm chi tiết về mặt hàng" rows={4} className={inputCls + ' resize-none'} />
              </FIELD>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <FIELD label="Số lượng">
                  <input type="number" min={1} value={form.qty} onChange={set('qty')} className={inputCls} required />
                </FIELD>
                <FIELD label="Đơn vị">
                  {isNewAsset ? (
                    <input type="text" value={form.unit} onChange={set('unit')} placeholder="cái, kg, thùng..." className={inputCls} />
                  ) : (
                    <div className={inputCls + ' bg-slate-100 text-slate-600'}>{form.unit || 'cái'}</div>
                  )}
                </FIELD>
              </div>

              {isNewAsset && (
                <FIELD label="Khối lượng / đơn vị (kg)">
                  <input type="number" step="0.01" min="0" value={form.weightPerUnit} onChange={set('weightPerUnit')} placeholder="Tuỳ chọn" className={inputCls} />
                </FIELD>
              )}

              <FIELD label="Ghi chú lô hàng">
                <textarea value={form.notes} onChange={set('notes')} placeholder="Hướng dẫn xử lý, ghi chú giao hàng, v.v." rows={4} className={inputCls + ' resize-none'} />
              </FIELD>
            </div>
          </div>

          {/* Document Upload */}
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-[20px]" style={{ color: '#00b2d6' }}>folder_open</span>
              <span className="text-sm font-semibold text-slate-700">Chứng từ đính kèm</span>
              <span className="text-xs text-slate-400 font-normal">(Không bắt buộc)</span>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">Upload invoice, packing list, hoặc các tài liệu liên quan đến lô hàng. Chấp nhận: PDF, JPG, PNG, Excel, Word — Tối đa 10 file, mỗi file ≤ 10MB.</p>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
              onClick={() => fileInputRef.current?.click()}
              style={{ border: `2px dashed ${dragOver ? '#00b2d6' : '#cbd5e1'}`, backgroundColor: dragOver ? '#e0f7fa' : '#f8fafc', borderRadius: '12px', padding: '28px 20px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s ease' }}
            >
              <span className="material-symbols-outlined text-[40px] mb-2 block" style={{ color: dragOver ? '#00b2d6' : '#94a3b8' }}>cloud_upload</span>
              <p className="text-sm font-semibold text-slate-600">Kéo thả file vào đây hoặc <span style={{ color: '#00b2d6' }}>nhấn để chọn file</span></p>
              <p className="text-xs text-slate-400 mt-1">PDF, ảnh, Excel, Word · Tối đa 10 file</p>
              <input ref={fileInputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.xls,.xlsx,.doc,.docx" className="hidden" onChange={(e) => addFiles(e.target.files)} />
            </div>
            {docFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                {docFiles.map((f, idx) => {
                  const { icon, color } = getFileIcon(f.name);
                  const isUploaded = uploadedUrls.length > 0;
                  return (
                    <div key={idx} className="flex items-center gap-3 rounded-lg px-4 py-3" style={{ backgroundColor: isUploaded ? '#f0fdf4' : '#f8fafc', border: `1px solid ${isUploaded ? '#bbf7d0' : '#e2e8f0'}` }}>
                      <span className="material-symbols-outlined text-[22px]" style={{ color }}>{icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-700 truncate">{f.name}</p>
                        <p className="text-xs text-slate-400">{formatBytes(f.size)}</p>
                      </div>
                      {isUploaded ? (
                        <span className="material-symbols-outlined text-[18px]" style={{ color: '#16a34a' }}>check_circle</span>
                      ) : (
                        <button type="button" onClick={(e) => { e.stopPropagation(); removeFile(idx); }} className="text-slate-400 hover:text-red-500 transition-colors">
                          <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-slate-100 bg-slate-50 px-8 py-5 flex flex-col sm:flex-row justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)} disabled={submitting} className="px-6 py-2.5 rounded-lg border border-slate-200 bg-white font-semibold text-sm text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50">Hủy bỏ</button>
          <button type="submit" disabled={submitting || loadingWH || uploadingDocs} className="px-6 py-2.5 rounded-lg font-bold text-sm text-white transition-all shadow-sm hover:opacity-90 flex items-center gap-2 disabled:opacity-60" style={{ backgroundColor: '#00b2d6' }}>
            {(submitting || uploadingDocs) && <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>}
            {uploadingDocs ? 'Đang upload chứng từ...' : submitting ? 'Đang tạo...' : 'Tạo yêu cầu nhập kho'}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ── Outbound tab ────────────────────────────────────────────────── */
function OutboundTab({ warehouses, loadingWH }) {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [inventory, setInventory] = useState([]);
  const [loadingInv, setLoadingInv] = useState(false);
  const [availableQty, setAvailableQty] = useState(null);

  const [form, setForm] = useState({
    warehouseId: '', assetId: '', itemName: '', qty: 1, unit: 'cái', destination: '', description: '', notes: '',
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    if (!form.warehouseId) { setInventory([]); return; }
    setLoadingInv(true);
    setForm(f => ({ ...f, assetId: '', itemName: '', unit: 'cái' }));
    setAvailableQty(null);
    renterAssetService.getInventoryByWarehouse(Number(form.warehouseId))
      .then(res => setInventory((Array.isArray(res.data) ? res.data : []).filter(i => i.quantity > 0)))
      .catch(() => setInventory([]))
      .finally(() => setLoadingInv(false));
  }, [form.warehouseId]);

  const handleAssetChange = (e) => {
    const assetId = e.target.value;
    const item = inventory.find(i => String(i.assetId) === assetId);
    if (item) {
      setForm(f => ({ ...f, assetId: String(item.assetId), itemName: item.assetName, unit: item.unit || 'cái' }));
      setAvailableQty(item.quantity);
    } else {
      setForm(f => ({ ...f, assetId: '', itemName: '', unit: 'cái' }));
      setAvailableQty(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.warehouseId) { setError('Vui lòng chọn kho xuất hàng.'); return; }
    if (!form.assetId) { setError('Vui lòng chọn tài sản cần xuất.'); return; }
    if (availableQty !== null && Number(form.qty) > availableQty) { setError(`Số lượng xuất (${form.qty}) vượt quá tồn kho (${availableQty}).`); return; }
    setSubmitting(true);
    try {
      await inventoryService.createInventoryRequest({
        warehouseId: Number(form.warehouseId), type: 'OUTBOUND',
        notes: form.notes || null,
        items: [{ assetId: Number(form.assetId), itemName: form.itemName, quantity: Number(form.qty), unit: form.unit, description: form.description || null }],
      });
      navigate('/renter-inventory-history?tab=outbound', { state: { created: true, type: 'OUTBOUND' } });
    } catch (err) {
      setError(err?.response?.data?.message || 'Tạo yêu cầu thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Info banner */}
      <div className="flex items-start justify-between rounded-xl px-5 py-4 mb-8 gap-4" style={{ backgroundColor: '#fff8e1', border: '1px solid #ffe082' }}>
        <div className="flex items-start gap-3 flex-1">
          <span className="material-symbols-outlined text-[20px] mt-0.5 text-amber-500">info</span>
          <div>
            <p className="text-sm font-bold text-amber-700">Kiểm tra trước khi xuất kho</p>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">Chỉ những tài sản có tồn kho tại warehouse đã chọn mới hiện trong danh sách. Số lượng xuất không được vượt quá tồn kho hiện có.</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg px-4 py-3 flex items-center gap-2 text-sm font-medium" style={{ backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}>
          <span className="material-symbols-outlined text-[18px]">error</span>{error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
            <div className="space-y-5">
              <FIELD label="Chọn kho xuất hàng">
                <div className="relative">
                  {loadingWH ? (
                    <div className={inputCls + ' text-slate-400'}>Đang tải danh sách kho...</div>
                  ) : (
                    <select value={form.warehouseId} onChange={set('warehouseId')} className={inputCls + ' appearance-none pr-10'} required>
                      <option value="">Chọn kho xuất hàng</option>
                      {warehouses.length > 0
                        ? warehouses.map(w => <option key={w.warehouseId} value={w.warehouseId}>{w.name}</option>)
                        : <option value="" disabled>Không có kho đang thuê</option>}
                    </select>
                  )}
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                </div>
              </FIELD>

              <FIELD label="Chọn tài sản xuất kho">
                <div className="relative">
                  {loadingInv ? (
                    <div className={inputCls + ' text-slate-400'}>Đang tải tồn kho...</div>
                  ) : !form.warehouseId ? (
                    <div className={inputCls + ' text-slate-400'}>Vui lòng chọn kho trước</div>
                  ) : inventory.length === 0 ? (
                    <div className={inputCls + ' text-slate-400'}>Không có tài sản tồn kho tại kho này</div>
                  ) : (
                    <select value={form.assetId} onChange={handleAssetChange} className={inputCls + ' appearance-none pr-10'} required>
                      <option value="">— Chọn tài sản —</option>
                      {inventory.map(i => <option key={i.assetId} value={i.assetId}>{i.assetName} — Tồn: {i.quantity} {i.unit}</option>)}
                    </select>
                  )}
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                </div>
                {availableQty !== null && (
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]" style={{ color: '#16a34a' }}>inventory_2</span>
                    <span className="text-xs font-medium" style={{ color: '#16a34a' }}>Tồn kho: {availableQty} {form.unit}</span>
                  </div>
                )}
              </FIELD>

              <FIELD label="Mô tả hàng hóa">
                <textarea value={form.description} onChange={set('description')} placeholder="Mô tả chi tiết về lô hàng xuất kho" rows={4} className={inputCls + ' resize-none'} />
              </FIELD>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <FIELD label="Số lượng">
                  <input type="number" min={1} max={availableQty ?? undefined} value={form.qty}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setForm(f => ({ ...f, qty: e.target.value }));
                      if (availableQty !== null && val > availableQty) setError(`Vượt quá tồn kho (${availableQty}).`);
                      else setError('');
                    }}
                    className={inputCls} required />
                  {availableQty !== null && Number(form.qty) > availableQty && <p className="text-xs text-red-500 mt-1">Vượt quá tồn kho!</p>}
                </FIELD>
                <FIELD label="Đơn vị">
                  <div className={inputCls + ' bg-slate-100 text-slate-600'}>{form.unit || 'cái'}</div>
                </FIELD>
              </div>

              <FIELD label="Địa chỉ điểm đến">
                <div className="relative">
                  <input type="text" value={form.destination} onChange={set('destination')} placeholder="Nhập địa chỉ đường phố, thành phố, mã bưu chính" className={inputCls + ' pr-10'} />
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">location_on</span>
                </div>
              </FIELD>

              <FIELD label="Ghi chú vận chuyển">
                <textarea value={form.notes} onChange={set('notes')} placeholder="Hướng dẫn xử lý, mức độ khẩn cấp hoặc thông tin cổng ra vào..." rows={3} className={inputCls + ' resize-none'} />
              </FIELD>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 bg-slate-50 px-8 py-5 flex flex-col sm:flex-row justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)} disabled={submitting} className="px-6 py-2.5 rounded-lg border border-slate-200 bg-white font-semibold text-sm text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50">Hủy bỏ</button>
          <button type="submit" disabled={submitting || loadingWH || (availableQty !== null && Number(form.qty) > availableQty)} className="px-6 py-2.5 rounded-lg font-bold text-sm text-white transition-all shadow-sm hover:opacity-90 flex items-center gap-2 disabled:opacity-60" style={{ backgroundColor: '#00b2d6' }}>
            {submitting && <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>}
            <span className="material-symbols-outlined text-[18px]">send</span>
            {submitting ? 'Đang tạo...' : 'Tạo yêu cầu xuất kho'}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────────────── */
export default function CreateInventoryRequest() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialTab = params.get("tab") === "outbound" ? "outbound" : "inbound";
  const [activeTab, setActiveTab] = useState(initialTab);

  const [warehouses, setWarehouses] = useState([]);
  const [loadingWH, setLoadingWH] = useState(true);

  const accentColor = "#00b2d6";

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

  const tabStyle = (tab) => ({
    display: "flex",
    alignItems: "center",
    gap: "7px",
    padding: "10px 20px",
    color: activeTab === tab ? accentColor : "#64748b",
    fontWeight: activeTab === tab ? 700 : 500,
    fontSize: "0.92rem",
    cursor: "pointer",
    background: "none",
    border: "none",
    borderBottom: activeTab === tab ? `2.5px solid ${accentColor}` : "2.5px solid transparent",
    transition: "all 0.18s",
    fontFamily: "Inter,sans-serif",
    whiteSpace: "nowrap",
  });

  return (
    <div className="w-full flex-1 flex flex-col min-w-0" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Tạo yêu cầu nhập/xuất kho</h1>
        <p className="mt-1 text-sm text-slate-500">Đăng ký yêu cầu nhập hoặc xuất hàng mới vào hệ thống quản lý kho.</p>
      </div>

      {/* Tab bar */}
      <div style={{ backgroundColor: "#fff", borderRadius: "12px 12px 0 0", border: "1px solid #f1f5f9", borderBottom: "none", display: "flex", paddingLeft: "8px", paddingRight: "8px" }}>
        <button style={tabStyle("inbound")} onClick={() => setActiveTab("inbound")}>
          <span className="material-symbols-outlined" style={{ fontSize: "19px" }}>move_to_inbox</span>
          Tạo yêu cầu nhập
        </button>
        <button style={tabStyle("outbound")} onClick={() => setActiveTab("outbound")}>
          <span className="material-symbols-outlined" style={{ fontSize: "19px" }}>outbox</span>
          Tạo yêu cầu xuất
        </button>
      </div>

      {/* Tab underline */}
      <div style={{ height: "1px", backgroundColor: "#e2e8f0", marginBottom: "24px" }} />

      {/* Tab content */}
      {activeTab === "inbound"
        ? <InboundTab warehouses={warehouses} loadingWH={loadingWH} />
        : <OutboundTab warehouses={warehouses} loadingWH={loadingWH} />}

      {/* Footer help */}
      <p className="mt-10 text-center text-sm text-slate-400 flex items-center justify-center gap-1.5">
        <span className="material-symbols-outlined text-[16px]">support_agent</span>
        Cần hỗ trợ lập lịch?{' '}
        <a href="#" className="font-semibold hover:underline" style={{ color: '#00b2d6' }}>Liên hệ với Bàn hỗ trợ</a>.
      </p>
    </div>
  );
}
