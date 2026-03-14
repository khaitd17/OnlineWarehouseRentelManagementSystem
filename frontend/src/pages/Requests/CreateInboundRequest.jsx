import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../services/axiosClient';
import inventoryService from '../../services/inventoryService';

const FIELD = ({ label, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-semibold text-slate-700">{label}</label>
    {children}
  </div>
);

const inputCls =
  'w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-primary focus:ring-2 transition-all';

const CreateInboundRequest = () => {
  const navigate = useNavigate();

  const [warehouses, setWarehouses] = useState([]);
  const [loadingWH, setLoadingWH] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    warehouseId: '',
    qty: 1,
    unit: 'Pallet',
    itemName: '',
    description: '',
    notes: '',
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Tải danh sách kho renter đang thuê từ hợp đồng
  useEffect(() => {
    axiosClient.get('/rental-contracts/my-contracts')
      .then(res => {
        const contracts = Array.isArray(res.data) ? res.data : [];
        // Lấy các kho duy nhất từ hợp đồng đang hoạt động
        const seen = new Set();
        const whs = contracts
          .reduce((acc, c) => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.warehouseId) { setError('Vui lòng chọn kho hàng.'); return; }
    if (!form.itemName.trim()) { setError('Vui lòng nhập tên mặt hàng.'); return; }

    setSubmitting(true);
    try {
      await inventoryService.createInventoryRequest({
        warehouseId: Number(form.warehouseId),
        type: 'INBOUND',
        notes: form.notes || null,
        items: [{
          itemName: form.itemName.trim(),
          quantity: Number(form.qty),
          unit: form.unit,
          description: form.description || null,
        }],
      });
      navigate('/renter-inbound-requests', { state: { created: true } });
    } catch (err) {
      setError(err?.response?.data?.message || 'Tạo yêu cầu thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col min-w-0" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Tạo yêu cầu nhập kho</h1>
        <p className="mt-1 text-sm text-slate-500">Đăng ký một lô hàng nhập kho mới vào hệ thống quản lý kho.</p>
      </div>

      {/* Info banner */}
      <div
        className="flex items-start justify-between rounded-xl px-5 py-4 mb-8 gap-4"
        style={{ backgroundColor: '#e0f7fa', border: '1px solid #b2ebf2' }}
      >
        <div className="flex items-start gap-3 flex-1">
          <span className="material-symbols-outlined text-[20px] mt-0.5" style={{ color: '#00b2d6' }}>info</span>
          <div>
            <p className="text-sm font-bold" style={{ color: '#00b2d6' }}>Kiểm tra trước khi nhập kho</p>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              Đảm bảo tất cả các mặt hàng đều được dán nhãn mã vạch phù hợp và tài liệu được đính kèm bên ngoài pallet
              để xử lý nhanh chóng khi hàng đến.
            </p>
          </div>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="mb-6 rounded-lg px-4 py-3 flex items-center gap-2 text-sm font-medium"
          style={{ backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}>
          <span className="material-symbols-outlined text-[18px]">error</span>
          {error}
        </div>
      )}

      {/* Form card */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
      >
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">

            {/* LEFT column */}
            <div className="space-y-5">
              <FIELD label="Chọn kho hàng">
                <div className="relative">
                  {loadingWH ? (
                    <div className={inputCls + ' text-slate-400'}>Đang tải danh sách kho...</div>
                  ) : (
                    <select
                      value={form.warehouseId}
                      onChange={set('warehouseId')}
                      className={inputCls + ' appearance-none pr-10'}
                      required
                    >
                      <option value="">Chọn kho hàng đích</option>
                      {warehouses.length > 0
                        ? warehouses.map(w => (
                            <option key={w.warehouseId} value={w.warehouseId}>{w.name}</option>
                          ))
                        : <option value="" disabled>Không có kho đang thuê</option>
                      }
                    </select>
                  )}
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    expand_more
                  </span>
                </div>
              </FIELD>

              <FIELD label="Tên mặt hàng">
                <input
                  type="text"
                  value={form.itemName}
                  onChange={set('itemName')}
                  placeholder="Nhập tên sản phẩm hoặc mã SKU"
                  className={inputCls}
                  required
                />
              </FIELD>

              <FIELD label="Mô tả mặt hàng">
                <textarea
                  value={form.description}
                  onChange={set('description')}
                  placeholder="Cung cấp thêm chi tiết về mặt hàng"
                  rows={4}
                  className={inputCls + ' resize-none'}
                />
              </FIELD>
            </div>

            {/* RIGHT column */}
            <div className="space-y-5">
              {/* Qty + Unit side by side */}
              <div className="grid grid-cols-2 gap-4">
                <FIELD label="Số lượng">
                  <input
                    type="number"
                    min={1}
                    value={form.qty}
                    onChange={set('qty')}
                    className={inputCls}
                    required
                  />
                </FIELD>
                <FIELD label="Đơn vị">
                  <div className="relative">
                    <select
                      value={form.unit}
                      onChange={set('unit')}
                      className={inputCls + ' appearance-none pr-10'}
                    >
                      <option>Pallet</option>
                      <option>Thùng</option>
                      <option>Kiện</option>
                      <option>Chiếc</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      expand_more
                    </span>
                  </div>
                </FIELD>
              </div>

              <FIELD label="Ghi chú lô hàng">
                <textarea
                  value={form.notes}
                  onChange={set('notes')}
                  placeholder="Hướng dẫn xử lý, ghi chú giao hàng, v.v."
                  rows={4}
                  className={inputCls + ' resize-none'}
                />
              </FIELD>
            </div>
          </div>
        </div>

        {/* Divider + Actions */}
        <div className="border-t border-slate-100 bg-slate-50 px-8 py-5 flex flex-col sm:flex-row justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            disabled={submitting}
            className="px-6 py-2.5 rounded-lg border border-slate-200 bg-white font-semibold text-sm text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={submitting || loadingWH}
            className="px-6 py-2.5 rounded-lg font-bold text-sm text-white transition-all shadow-sm hover:opacity-90 flex items-center gap-2 disabled:opacity-60"
            style={{ backgroundColor: '#00b2d6' }}
          >
            {submitting && <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>}
            {submitting ? 'Đang tạo...' : 'Tạo yêu cầu nhập kho'}
          </button>
        </div>
      </form>

      {/* Footer help */}
      <p className="mt-10 text-center text-sm text-slate-400 flex items-center justify-center gap-1.5">
        <span className="material-symbols-outlined text-[16px]">support_agent</span>
        Cần hỗ trợ lập lịch nhập kho?{' '}
        <a href="#" className="font-semibold hover:underline" style={{ color: '#00b2d6' }}>
          Liên hệ với Bàn hỗ trợ
        </a>
        .
      </p>
    </div>
  );
};

export default CreateInboundRequest;
