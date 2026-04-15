import { useState, useEffect, useCallback, useRef } from 'react';
import axiosClient from '../services/axiosClient';
import scheduleService from '../services/scheduleService';
import { getTasks } from '../services/taskSchedulingService';
import attendanceService from '../services/attendanceService';

/* ── helpers ─────────────────────────────────────────────── */
const pad     = n => String(n).padStart(2, '0');
const toKey   = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const add     = (d, n) => { const r = new Date(d); r.setDate(r.getDate()+n); return r; };
const getMon  = d => { const r = new Date(d); const dw = r.getDay(); r.setDate(r.getDate()-(dw===0?6:dw-1)); r.setHours(0,0,0,0); return r; };
const fmtDate = d => `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
const fmtDT   = s => { if (!s) return ''; const d = new Date(s); return `${pad(d.getHours())}:${pad(d.getMinutes())} ${d.getDate()}/${pad(d.getMonth()+1)}`; };

const DAY_NAMES  = ['CN','Th 2','Th 3','Th 4','Th 5','Th 6','Th 7'];
const MONTH_NAMES = ['Thang 1','Thang 2','Thang 3','Thang 4','Thang 5','Thang 6',
                     'Thang 7','Thang 8','Thang 9','Thang 10','Thang 11','Thang 12'];
const SHIFT_TYPE_LABEL = { NC:'Nghi ca', NP:'Nghi phep', OFF:'Ngay off' };
const STATUS_STYLE = {
  Pending:    { bg:'#fef9c3', color:'#a16207' },
  InProgress: { bg:'#dbeafe', color:'#1d4ed8' },
  Completed:  { bg:'#d1fae5', color:'#065f46' },
  Cancelled:  { bg:'#fee2e2', color:'#b91c1c' },
};

/* ── AttendanceModal: hien thi khi click vao 1 ngay/ca ──── */
function AttendanceModal({ slot, dateKey, warehouseId, onClose, onRefresh }) {
  const fileRef = useRef();
  const [preview, setPreview]   = useState(null);
  const [file, setFile]         = useState(null);
  const [submitting, setSubmit] = useState(false);
  const [err, setErr]           = useState('');

  if (!slot) return null;

  const todayKey = toKey(new Date());
  const isPast   = dateKey < todayKey;
  const isToday  = dateKey === todayKey;

  const hasCheckIn  = !!slot.checkInAt;
  const hasCheckOut = !!slot.checkOutAt;
  const isOffDay    = slot.shiftType === 'NC' || slot.shiftType === 'OFF';

  const handleFile = e => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (type) => {
    if (!file) { setErr('Vui long chon anh truoc khi diem danh.'); return; }
    setSubmit(true); setErr('');
    try {
      if (type === 'in')  await attendanceService.checkIn(slot.staffShiftId, file);
      if (type === 'out') await attendanceService.checkOut(slot.staffShiftId, file);
      onRefresh();
      onClose();
    } catch (e) {
      setErr(e?.response?.data?.message || 'Co loi xay ra.');
    } finally { setSubmit(false); }
  };

  // Modal overlay style
  const overlay = {
    position:'fixed', inset:0, background:'rgba(0,0,0,.55)',
    display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000,
  };
  const card = {
    background:'#fff', borderRadius:14, padding:28, minWidth:340, maxWidth:480, width:'90%',
    boxShadow:'0 20px 60px rgba(0,0,0,.2)', fontFamily:'Inter,sans-serif', position:'relative',
  };
  const btnPrimary = (color='#3b82f6') => ({
    width:'100%', padding:'10px 0', borderRadius:8, border:'none',
    background: color, color:'#fff', fontWeight:700, fontSize:'0.9rem', cursor:'pointer',
    marginTop:10, transition:'opacity .2s',
  });

  const closeBtn = {
    position:'absolute', top:14, right:16, background:'none', border:'none',
    fontSize:'1.3rem', cursor:'pointer', color:'#94a3b8', lineHeight:1,
  };

  const shiftLabel = slot.shiftType
    ? (SHIFT_TYPE_LABEL[slot.shiftType] || slot.shiftType)
    : slot.timeIn1
      ? `${slot.timeIn1} - ${slot.timeOut1}`
      : 'Chua co ca';

  return (
    <div style={overlay} onClick={onClose}>
      <div style={card} onClick={e => e.stopPropagation()}>
        <button style={closeBtn} onClick={onClose}>x</button>

        {/* Tieu de ngay */}
        <div style={{ marginBottom:16 }}>
          <div style={{ fontWeight:800, fontSize:'1.05rem', color:'#0f172a' }}>
            {dateKey}
          </div>
          <div style={{ fontSize:'0.82rem', color:'#64748b', marginTop:2 }}>
            Ca: <strong>{shiftLabel}</strong>
            {slot.overtimeHours > 0 && (
              <span style={{ marginLeft:8, background:'#fef9c3', color:'#92400e',
                borderRadius:4, padding:'1px 7px', fontSize:'0.72rem', fontWeight:700 }}>
                +{slot.overtimeHours}h OT
              </span>
            )}
          </div>
        </div>

        {/* Ngay nghi */}
        {isOffDay && (
          <div style={{ padding:'14px', background:'#f1f5f9', borderRadius:9, color:'#64748b', fontSize:'0.88rem' }}>
            Hom nay la ngay nghi, khong can diem danh.
          </div>
        )}

        {/* Ngay trong tuong lai hoac qua kha — chi hien thi thong tin */}
        {!isOffDay && isPast && (
          <div>
            <Info label="Check-in" time={slot.checkInAt} photo={slot.checkInPhoto} />
            <Info label="Check-out" time={slot.checkOutAt} photo={slot.checkOutPhoto} />
            {!hasCheckIn && !hasCheckOut && (
              <div style={{ color:'#94a3b8', fontSize:'0.82rem', marginTop:8 }}>Chua co du lieu diem danh.</div>
            )}
          </div>
        )}

        {/* Hom nay — co the diem danh */}
        {!isOffDay && isToday && (
          <div>
            <Info label="Check-in" time={slot.checkInAt} photo={slot.checkInPhoto} />
            <Info label="Check-out" time={slot.checkOutAt} photo={slot.checkOutPhoto} />

            {/* Upload khu vuc */}
            {(!hasCheckIn || !hasCheckOut) && (
              <div style={{ marginTop:16 }}>
                <label style={{ fontSize:'0.8rem', fontWeight:700, color:'#374151' }}>Chon anh bằng chứng</label>
                <div
                  style={{ marginTop:6, border:'2px dashed #cbd5e1', borderRadius:9, padding:12,
                    textAlign:'center', cursor:'pointer', background: preview?'transparent':'#f8fafc' }}
                  onClick={() => fileRef.current?.click()}
                >
                  {preview
                    ? <img src={preview} alt="preview" style={{ maxHeight:160, borderRadius:7, maxWidth:'100%' }} />
                    : <span style={{ color:'#94a3b8', fontSize:'0.82rem' }}>Nhan de chon anh</span>}
                </div>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} />
              </div>
            )}

            {err && <div style={{ color:'#dc2626', fontSize:'0.8rem', marginTop:8 }}>{err}</div>}

            {!hasCheckIn && (
              <button
                style={btnPrimary('#16a34a')}
                disabled={submitting}
                onClick={() => handleSubmit('in')}
              >
                {submitting ? 'Dang gui...' : 'Diem danh vao ca'}
              </button>
            )}
            {!hasCheckOut && (
              <button
                style={btnPrimary('#3b82f6')}
                disabled={submitting}
                onClick={() => handleSubmit('out')}
              >
                {submitting ? 'Dang gui...' : 'Diem danh ra ca'}
              </button>
            )}
          </div>
        )}

        {/* Ngay tuong lai */}
        {!isOffDay && !isPast && !isToday && (
          <div style={{ padding:'14px', background:'#f0f9ff', borderRadius:9, color:'#0369a1', fontSize:'0.88rem' }}>
            Ca chua bat dau. Diem danh se kha dung vao ngay {dateKey}.
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Info row: hien thi thoi gian + anh ──────────────────── */
function Info({ label, time, photo }) {
  const [open, setOpen] = useState(false);
  if (!time) return null;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ width:8, height:8, borderRadius:'50%', background: label==='Check-in'?'#16a34a':'#3b82f6' }} />
        <span style={{ fontWeight:700, fontSize:'0.82rem', color:'#374151' }}>{label}:</span>
        <span style={{ fontSize:'0.83rem', color:'#0f172a' }}>{fmtDT(time)}</span>
        {photo && (
          <span
            style={{ fontSize:'0.72rem', color:'#3b82f6', cursor:'pointer', textDecoration:'underline' }}
            onClick={() => setOpen(o => !o)}
          >
            {open ? 'An anh' : 'Xem anh'}
          </span>
        )}
      </div>
      {open && photo && (
        <img src={photo} alt={label} style={{ marginTop:6, maxWidth:'100%', maxHeight:160, borderRadius:7 }} />
      )}
    </div>
  );
}

/* ── Badge diem danh nho hien thi trong moi row bang ────── */
function AttendanceBadge({ slot }) {
  if (!slot) return null;
  const hasIn  = !!slot.checkInAt;
  const hasOut = !!slot.checkOutAt;
  if (!hasIn && !hasOut) return null;

  return (
    <div style={{ marginTop:4, display:'flex', flexDirection:'column', gap:2 }}>
      {hasIn && (
        <div style={{ fontSize:'0.68rem', color:'#065f46', background:'#d1fae5',
          borderRadius:4, padding:'1px 6px', display:'inline-flex', alignItems:'center', gap:3, width:'fit-content' }}>
          <span style={{ fontWeight:700 }}>Vao:</span> {fmtDT(slot.checkInAt).split(' ')[0]}
        </div>
      )}
      {hasOut && (
        <div style={{ fontSize:'0.68rem',
          color: slot.isEarlyLeave ? '#b45309' : '#1d4ed8',
          background: slot.isEarlyLeave ? '#fef3c7' : '#dbeafe',
          borderRadius:4, padding:'1px 6px', display:'inline-flex', alignItems:'center', gap:3, width:'fit-content' }}>
          <span style={{ fontWeight:700 }}>Ra:</span> {fmtDT(slot.checkOutAt).split(' ')[0]}
          {slot.isEarlyLeave && <span style={{ fontWeight:700 }}>(Som)</span>}
        </div>
      )}
    </div>
  );
}

/* ── WeekTable ──────────────────────────────────────────── */
function WeekTable({ monday, shifts, onRowClick }) {
  const days     = Array.from({ length: 7 }, (_, i) => add(monday, i));
  const todayKey = toKey(new Date());

  return (
    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.85rem' }}>
      <thead>
        <tr style={{ background:'#1e293b' }}>
          <th style={{ padding:'10px 14px', color:'#fff', textAlign:'left', fontWeight:700, fontSize:'0.78rem', width:110 }}>Ngay</th>
          <th style={{ padding:'10px 14px', color:'#fff', textAlign:'center', fontWeight:700, fontSize:'0.78rem', width:170 }}>Ca lam</th>
          <th style={{ padding:'10px 14px', color:'#fff', textAlign:'left', fontWeight:700, fontSize:'0.78rem' }}>Cong viec</th>
        </tr>
      </thead>
      <tbody>
        {days.map((d, i) => {
          const key       = toKey(d);
          const slot      = shifts?.[key];
          const isToday   = key === todayKey;
          const isWeekend = d.getDay() === 0 || d.getDay() === 6;
          const rowBg     = isToday ? '#eff6ff' : i%2===0 ? '#fff' : '#f8fafc';
          const stype     = slot?.shiftType;
          const hasTasks  = slot?.tasks?.length > 0;

          return (
            <tr
              key={key}
              style={{ background: rowBg, borderBottom:'1px solid #e2e8f0', cursor: slot ? 'pointer' : 'default' }}
              title={slot ? 'Nhan de xem chi tiet / diem danh' : ''}
              onClick={() => slot && onRowClick(key, slot)}
            >
              {/* Date */}
              <td style={{ padding:'12px 14px', verticalAlign:'top' }}>
                <div style={{ fontWeight: isToday?800:600, color: isToday?'#3b82f6':isWeekend?'#dc2626':'#0f172a', fontSize:'0.82rem' }}>
                  {DAY_NAMES[d.getDay()]}
                </div>
                <div style={{ color:'#64748b', fontSize:'0.73rem', marginTop:2 }}>
                  {d.getDate()}/{pad(d.getMonth()+1)}
                  {isToday && (
                    <span style={{ marginLeft:5, background:'#3b82f6', color:'#fff',
                      fontSize:'0.62rem', padding:'1px 5px', borderRadius:4, fontWeight:700 }}>
                      Hom nay
                    </span>
                  )}
                </div>
              </td>

              {/* Shift + attendance badge */}
              <td style={{ padding:'12px 14px', textAlign:'center', verticalAlign:'top' }}>
                {!slot ? (
                  <span style={{ color:'#cbd5e1', fontSize:'0.75rem' }}>--</span>
                ) : stype ? (
                  <span style={{
                    background: stype==='NC'?'#fee2e2':stype==='NP'?'#fef9c3':'#f1f5f9',
                    color:      stype==='NC'?'#b91c1c':stype==='NP'?'#92400e':'#64748b',
                    borderRadius:5, padding:'3px 9px', fontSize:'0.75rem', fontWeight:700,
                  }}>{SHIFT_TYPE_LABEL[stype] || stype}</span>
                ) : (
                  <div>
                    {slot.timeIn1 && (
                      <div style={{ background:'#dbeafe', color:'#1d4ed8',
                        borderRadius:5, padding:'3px 9px', fontSize:'0.75rem', fontWeight:600,
                        display:'inline-block', marginBottom:3 }}>
                        {slot.timeIn1} - {slot.timeOut1}
                        {slot.overtimeHours > 0 && (
                          <span style={{ marginLeft:4, color:'#b45309', fontWeight:700, fontSize:'0.65rem' }}>
                            +{slot.overtimeHours}h
                          </span>
                        )}
                      </div>
                    )}
                    {!slot.timeIn1 && (
                      <span style={{ color:'#94a3b8', fontSize:'0.75rem' }}>Co ca</span>
                    )}
                    <AttendanceBadge slot={slot} />
                  </div>
                )}
              </td>

              {/* Tasks */}
              <td style={{ padding:'12px 14px', verticalAlign:'top' }}>
                {!hasTasks ? (
                  <span style={{ color:'#cbd5e1', fontSize:'0.75rem' }}>--</span>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                    {slot.tasks.map((t, ti) => {
                      const ss   = STATUS_STYLE[t.status] || { bg:'#f1f5f9', color:'#475569' };
                      const time = t.scheduledAt
                        ? (() => { const dt = new Date(t.scheduledAt); return `${pad(dt.getHours())}:${pad(dt.getMinutes())}`; })()
                        : null;
                      return (
                        <div key={ti} style={{
                          display:'flex', alignItems:'center', gap:6,
                          background: ss.bg, color: ss.color,
                          borderRadius:5, padding:'3px 9px', fontSize:'0.75rem', fontWeight:600,
                          border:`1px solid ${ss.color}30`, width:'fit-content',
                        }}>
                          <span>{t.taskTypeName || t.note || 'Task'}</span>
                          {time && <span style={{ opacity:.75 }}>{time}</span>}
                          <span style={{ opacity:.6, fontWeight:400, fontSize:'0.68rem' }}>[{t.status}]</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/* ── MonthTable ─────────────────────────────────────────── */
function MonthTable({ year, month, shifts, onRowClick }) {
  const lastDay  = new Date(year, month+1, 0);
  const todayStr = toKey(new Date());
  const rows     = [];
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date  = new Date(year, month, d);
    const key   = `${year}-${pad(month+1)}-${pad(d)}`;
    const slot  = shifts?.[key];
    rows.push({ d, date, key, slot });
  }

  return (
    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.83rem' }}>
      <thead>
        <tr style={{ background:'#1e293b' }}>
          <th style={{ padding:'9px 12px', color:'#fff', textAlign:'left', fontWeight:700, fontSize:'0.75rem' }}>Ngay</th>
          <th style={{ padding:'9px 12px', color:'#fff', textAlign:'left', fontWeight:700, fontSize:'0.75rem' }}>Thu</th>
          <th style={{ padding:'9px 12px', color:'#fff', textAlign:'center', fontWeight:700, fontSize:'0.75rem' }}>Ca lam</th>
          <th style={{ padding:'9px 12px', color:'#fff', textAlign:'center', fontWeight:700, fontSize:'0.75rem' }}>Diem danh</th>
          <th style={{ padding:'9px 12px', color:'#fff', textAlign:'center', fontWeight:700, fontSize:'0.75rem' }}>Task</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ d, date, key, slot }, i) => {
          const isToday   = key === todayStr;
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
          const stype     = slot?.shiftType;
          const taskCount = slot?.tasks?.length || 0;
          const hasIn     = !!slot?.checkInAt;
          const hasOut    = !!slot?.checkOutAt;

          return (
            <tr
              key={key}
              style={{ background: isToday?'#eff6ff':i%2===0?'#fff':'#f8fafc',
                borderBottom:'1px solid #e2e8f0', cursor: slot ? 'pointer' : 'default' }}
              onClick={() => slot && onRowClick(key, slot)}
            >
              <td style={{ padding:'8px 12px', fontWeight: isToday?800:600,
                color: isToday?'#3b82f6':isWeekend?'#dc2626':'#0f172a', width:60 }}>
                {d}/{pad(month+1)}
                {isToday && <span style={{ marginLeft:4, fontSize:'0.62rem', background:'#3b82f6', color:'#fff',
                  padding:'1px 4px', borderRadius:3 }}>Hom nay</span>}
              </td>
              <td style={{ padding:'8px 12px', color: isWeekend?'#dc2626':'#64748b', width:60, fontSize:'0.75rem' }}>
                {DAY_NAMES[date.getDay()]}
              </td>
              <td style={{ padding:'8px 12px', textAlign:'center' }}>
                {!slot ? <span style={{ color:'#e2e8f0' }}>--</span>
                  : stype ? <span style={{ background: stype==='NC'?'#fee2e2':stype==='NP'?'#fef9c3':'#f1f5f9',
                    color: stype==='NC'?'#b91c1c':stype==='NP'?'#92400e':'#64748b',
                    borderRadius:4, padding:'1px 7px', fontSize:'0.72rem', fontWeight:700 }}>{SHIFT_TYPE_LABEL[stype]||stype}</span>
                  : slot.timeIn1 ? <span style={{ background:'#dbeafe', color:'#1d4ed8',
                    borderRadius:4, padding:'1px 7px', fontSize:'0.72rem', fontWeight:600 }}>
                    {slot.timeIn1}-{slot.timeOut1}
                    {slot.overtimeHours>0 && <span style={{ marginLeft:3, color:'#b45309' }}>+{slot.overtimeHours}h</span>}
                  </span> : <span style={{ color:'#e2e8f0' }}>--</span>}
              </td>
              <td style={{ padding:'8px 12px', textAlign:'center' }}>
                {hasIn || hasOut ? (
                  <div style={{ display:'inline-flex', gap:4, flexDirection:'column', alignItems:'center' }}>
                    {hasIn && <span style={{ fontSize:'0.68rem', background:'#d1fae5', color:'#065f46',
                      borderRadius:4, padding:'1px 6px', fontWeight:700 }}>Vao {fmtDT(slot.checkInAt).split(' ')[0]}</span>}
                    {hasOut && <span style={{ fontSize:'0.68rem',
                      background: slot.isEarlyLeave?'#fef3c7':'#dbeafe',
                      color: slot.isEarlyLeave?'#b45309':'#1d4ed8',
                      borderRadius:4, padding:'1px 6px', fontWeight:700 }}>
                      Ra {fmtDT(slot.checkOutAt).split(' ')[0]}{slot.isEarlyLeave?' (Som)':''}
                    </span>}
                  </div>
                ) : <span style={{ color:'#e2e8f0' }}>--</span>}
              </td>
              <td style={{ padding:'8px 12px', textAlign:'center' }}>
                {taskCount > 0
                  ? <span style={{ background:'#ede9fe', color:'#6d28d9',
                    borderRadius:4, padding:'1px 7px', fontSize:'0.72rem', fontWeight:700 }}>{taskCount} task</span>
                  : <span style={{ color:'#e2e8f0' }}>--</span>}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/* ── Main ──────────────────────────────────────────────── */
export default function MySchedulePage() {
  const [viewMode,    setViewMode]    = useState('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedule,    setSchedule]    = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [loadingWh,   setLoadingWh]   = useState(true);
  const [error,       setError]       = useState('');
  const [warehouses,  setWarehouses]  = useState([]);
  const [warehouseId, setWarehouseId] = useState(null);
  const [modalKey,    setModalKey]    = useState(null);
  const [modalSlot,   setModalSlot]   = useState(null);

  useEffect(() => {
    setLoadingWh(true);
    axiosClient.get('/staff/my-warehouses')
      .then(r => {
        const list = r.data || [];
        setWarehouses(list);
        if (list.length > 0) setWarehouseId(list[0].warehouseId);
      })
      .catch(console.error)
      .finally(() => setLoadingWh(false));
  }, []);

  const monday    = getMon(currentDate);
  const monEnd    = add(monday, 6);
  const lastOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth()+1, 0);

  const from = viewMode === 'week'
    ? toKey(monday)
    : `${currentDate.getFullYear()}-${pad(currentDate.getMonth()+1)}-01`;
  const to = viewMode === 'week' ? toKey(monEnd) : toKey(lastOfMonth);

  const warehouseName = warehouses.find(w => w.warehouseId === warehouseId)?.warehouseName || '';

  const fetchAll = useCallback(async () => {
    if (!warehouseId) return;
    setLoading(true); setError('');
    try {
      const shiftData = await scheduleService.getMySchedule(warehouseId, from, to);
      let taskData = [];
      try { taskData = await getTasks(warehouseId, `${from}T00:00:00Z`, `${to}T23:59:59Z`); } catch {}

      const merged = { ...(shiftData?.shifts || {}) };
      const allTasks = Array.isArray(taskData) ? taskData : [];
      allTasks.forEach(t => {
        if (!t.scheduledAt) return;
        const d   = new Date(t.scheduledAt);
        const key = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
        if (!merged[key]) merged[key] = { timeIn1:null,timeOut1:null,timeIn2:null,timeOut2:null,shiftType:null,tasks:[] };
        if (!(merged[key].tasks||[]).some(x => x.taskId === t.id)) {
          merged[key] = { ...merged[key], tasks:[...(merged[key].tasks||[]), {
            taskId:t.id, taskTypeName:t.taskTypeName, status:t.status, note:t.note, scheduledAt:t.scheduledAt,
          }]};
        }
      });
      setSchedule({ ...shiftData, shifts: merged });
    } catch(e) {
      setError(e?.response?.data?.message || 'Khong the tai lich.');
    } finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warehouseId, from, to, viewMode]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openModal = (dateKey, slot) => {
    setModalKey(dateKey);
    setModalSlot(slot);
  };
  const closeModal = () => { setModalKey(null); setModalSlot(null); };

  if (loadingWh) return <div style={{ padding:40, textAlign:'center', color:'#94a3b8', fontFamily:'Inter,sans-serif' }}>Dang tai...</div>;
  if (warehouses.length === 0) return <div style={{ padding:40, textAlign:'center', color:'#94a3b8', fontFamily:'Inter,sans-serif' }}>Ban chua duoc them vao kho nao.</div>;

  const hasData    = schedule && Object.keys(schedule.shifts||{}).length > 0;
  const periodLabel = viewMode === 'week'
    ? `${fmtDate(monday)} - ${fmtDate(monEnd)}`
    : `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  const btnStyle = (active) => ({
    padding:'7px 16px', borderRadius:7, fontSize:'0.82rem', fontWeight:600,
    cursor:'pointer', border:'none',
    background: active ? '#3b82f6' : '#f1f5f9',
    color: active ? '#fff' : '#374151',
  });

  return (
    <div style={{ fontFamily:'Inter,sans-serif', maxWidth:1100, margin:'0 auto', color:'#0f172a' }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:10 }}>
        <div>
          <h2 style={{ margin:0, fontSize:'1.25rem', fontWeight:800 }}>Lich lam viec cua toi</h2>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:5, flexWrap:'wrap' }}>
            {schedule?.fullName && <span style={{ fontSize:'0.82rem', color:'#64748b' }}>{schedule.fullName}</span>}
            {schedule?.roleCode && (
              <span style={{ padding:'2px 8px', borderRadius:5, fontSize:'0.7rem', fontWeight:700, background:'#dbeafe', color:'#1d4ed8' }}>
                {schedule.roleCode}
              </span>
            )}
            {warehouses.length > 1 ? (
              <select value={warehouseId??''} onChange={e => setWarehouseId(Number(e.target.value))}
                style={{ padding:'4px 9px', borderRadius:6, border:'1px solid #e2e8f0',
                  fontSize:'0.8rem', color:'#374151', background:'#f8fafc', cursor:'pointer' }}>
                {warehouses.map(w => <option key={w.warehouseId} value={w.warehouseId}>{w.warehouseName}</option>)}
              </select>
            ) : (
              <span style={{ fontSize:'0.8rem', color:'#94a3b8' }}>{warehouseName}</span>
            )}
          </div>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          <button style={btnStyle(viewMode==='week')}  onClick={() => setViewMode('week')}>Tuan</button>
          <button style={btnStyle(viewMode==='month')} onClick={() => setViewMode('month')}>Thang</button>
        </div>
      </div>

      {/* Nav */}
      <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:9, padding:'9px 14px',
        marginBottom:14, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
        <div style={{ display:'flex', gap:6 }}>
          <button style={btnStyle(false)} onClick={() => {
            if (viewMode==='week') setCurrentDate(d => add(d,-7));
            else setCurrentDate(d => new Date(d.getFullYear(), d.getMonth()-1, 1));
          }}>Truoc</button>
          <button style={btnStyle(false)} onClick={() => {
            if (viewMode==='week') setCurrentDate(d => add(d,7));
            else setCurrentDate(d => new Date(d.getFullYear(), d.getMonth()+1, 1));
          }}>Sau</button>
          <button style={btnStyle(false)} onClick={() => setCurrentDate(new Date())}>Hom nay</button>
        </div>
        <span style={{ fontWeight:700, fontSize:'0.93rem' }}>{periodLabel}</span>
        <button style={btnStyle(false)} onClick={fetchAll}>Lam moi</button>
      </div>

      {/* Table */}
      <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:10,
        overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,.05)' }}>
        {loading ? (
          <div style={{ padding:60, textAlign:'center', color:'#94a3b8' }}>Dang tai lich...</div>
        ) : error ? (
          <div style={{ padding:20, color:'#dc2626', background:'#fef2f2', fontSize:'0.88rem' }}>{error}</div>
        ) : (
          <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
            {viewMode === 'week'
              ? <WeekTable monday={monday} shifts={schedule?.shifts} onRowClick={openModal} />
              : <MonthTable year={currentDate.getFullYear()} month={currentDate.getMonth()} shifts={schedule?.shifts} onRowClick={openModal} />
            }
          </div>
        )}

        {!loading && !error && !hasData && viewMode === 'week' && (
          <div style={{ padding:'14px 18px', background:'#fffbeb', borderTop:'1px solid #fde68a',
            color:'#92400e', fontSize:'0.82rem', textAlign:'center' }}>
            Chua co ca lam viec trong tuan nay. Lien he quan ly de duoc sap xep lich.
          </div>
        )}
      </div>

      {/* Skills & Zones */}
      {schedule && (schedule.skills?.length > 0 || schedule.zones?.length > 0) && (
        <div style={{ marginTop:14, display:'flex', gap:12, flexWrap:'wrap' }}>
          {schedule.skills?.length > 0 && (
            <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:9, padding:'10px 14px', flex:1, minWidth:140 }}>
              <div style={{ fontSize:'0.68rem', color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:'.4px', marginBottom:6 }}>KY NANG</div>
              <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                {schedule.skills.map((s,i) => <span key={i} style={{ background:'#dbeafe', color:'#1d4ed8', padding:'2px 8px', borderRadius:4, fontSize:'0.72rem', fontWeight:600 }}>{s}</span>)}
              </div>
            </div>
          )}
          {schedule.zones?.length > 0 && (
            <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:9, padding:'10px 14px', flex:1, minWidth:140 }}>
              <div style={{ fontSize:'0.68rem', color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:'.4px', marginBottom:6 }}>KHU VUC</div>
              <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                {schedule.zones.map((z,i) => <span key={i} style={{ background:'#d1fae5', color:'#065f46', padding:'2px 8px', borderRadius:4, fontSize:'0.72rem', fontWeight:600 }}>{z}</span>)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Attendance Modal */}
      {modalKey && (
        <AttendanceModal
          slot={modalSlot}
          dateKey={modalKey}
          warehouseId={warehouseId}
          onClose={closeModal}
          onRefresh={fetchAll}
        />
      )}
    </div>
  );
}
