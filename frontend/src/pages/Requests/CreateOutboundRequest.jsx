import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const FIELD = ({ label, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-semibold text-slate-700">{label}</label>
    {children}
  </div>
);

const inputCls =
  'w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-primary focus:ring-2 transition-all';

const CreateOutboundRequest = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    warehouse: '',
    itemName: '',
    qty: 1,
    unit: 'Pallet',
    destination: '',
    shippingDate: '',
    description: '',
    notes: '',
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Yêu cầu xuất kho đã được tạo thành công!');
    navigate(-1);
  };

  return (
    <div className="w-full flex-1 flex flex-col min-w-0" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Tạo yêu cầu xuất kho</h1>
        <p className="mt-1 text-sm text-slate-500">Khởi tạo một yêu cầu vận chuyển mới bằng cách cung cấp thông tin logistics cần thiết.</p>
      </div>

      {/* Info banner */}
      <div
        className="flex items-start justify-between rounded-xl px-5 py-4 mb-8 gap-4"
        style={{ backgroundColor: '#fff8e1', border: '1px solid #ffe082' }}
      >
        <div className="flex items-start gap-3 flex-1">
          <span className="material-symbols-outlined text-[20px] mt-0.5 text-amber-500">info</span>
          <div>
            <p className="text-sm font-bold text-amber-700">Kiểm tra trước khi xuất kho</p>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              Đảm bảo hàng hóa đã được kiểm đếm chính xác, đóng gói đúng quy cách và tài liệu vận chuyển đầy đủ trước
              khi xác nhận xuất kho.
            </p>
          </div>
        </div>
        <button
          className="text-xs font-bold whitespace-nowrap flex items-center gap-1 text-amber-600 hover:opacity-70 transition-opacity"
        >
          Tìm hiểu thêm
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </button>
      </div>

      {/* Form card */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
      >
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">

            {/* LEFT column */}
            <div className="space-y-5">
              <FIELD label="Chọn kho xuất hàng">
                <div className="relative">
                  <select
                    value={form.warehouse}
                    onChange={set('warehouse')}
                    className={inputCls + ' appearance-none pr-10'}
                    required
                  >
                    <option value="">Chọn kho xuất hàng</option>
                    <option value="wh-01">Kho Quận 7 - TP.HCM</option>
                    <option value="wh-02">Kho Sóng Thần - Bình Dương</option>
                    <option value="wh-03">Kho Cảng Hải Phòng</option>
                    <option value="wh-04">Kho Hòa Lạc - Hà Nội</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    expand_more
                  </span>
                </div>
              </FIELD>

              <FIELD label="Tên mặt hàng / SKU">
                <div className="relative">
                  <input
                    type="text"
                    value={form.itemName}
                    onChange={set('itemName')}
                    placeholder="vd. LAPTOP-X1-CARBON hoặc SKU-9902"
                    className={inputCls + ' pr-10'}
                    required
                  />
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                    inventory_2
                  </span>
                </div>
              </FIELD>

              <FIELD label="Mô tả hàng hóa">
                <textarea
                  value={form.description}
                  onChange={set('description')}
                  placeholder="Mô tả chi tiết về lô hàng xuất kho"
                  rows={4}
                  className={inputCls + ' resize-none'}
                />
              </FIELD>
            </div>

            {/* RIGHT column */}
            <div className="space-y-5">
              {/* Qty + Unit */}
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

              <FIELD label="Địa chỉ điểm đến">
                <div className="relative">
                  <input
                    type="text"
                    value={form.destination}
                    onChange={set('destination')}
                    placeholder="Nhập địa chỉ đường phố, thành phố, mã bưu chính"
                    className={inputCls + ' pr-10'}
                    required
                  />
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                    location_on
                  </span>
                </div>
              </FIELD>

              <FIELD label="Ngày dự kiến xuất hàng">
                <input
                  type="date"
                  value={form.shippingDate}
                  onChange={set('shippingDate')}
                  className={inputCls}
                  required
                />
              </FIELD>

              <FIELD label="Ghi chú vận chuyển">
                <textarea
                  value={form.notes}
                  onChange={set('notes')}
                  placeholder="Hướng dẫn xử lý, mức độ khẩn cấp hoặc thông tin cổng ra vào..."
                  rows={3}
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
            className="px-6 py-2.5 rounded-lg border border-slate-200 bg-white font-semibold text-sm text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg font-bold text-sm text-white transition-all shadow-sm hover:opacity-90 flex items-center gap-2"
            style={{ backgroundColor: '#00b2d6' }}
          >
            <span className="material-symbols-outlined text-[18px]">send</span>
            Tạo yêu cầu xuất kho
          </button>
        </div>
      </form>

      {/* Footer help */}
      <p className="mt-10 text-center text-sm text-slate-400 flex items-center justify-center gap-1.5">
        <span className="material-symbols-outlined text-[16px]">support_agent</span>
        Cần hỗ trợ lập lịch xuất kho?{' '}
        <a href="#" className="font-semibold hover:underline" style={{ color: '#00b2d6' }}>
          Liên hệ với Bàn hỗ trợ
        </a>
        .
      </p>
    </div>
  );
};

export default CreateOutboundRequest;
