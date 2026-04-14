import { useState, useEffect, useCallback } from 'react';
import axiosClient from '../services/axiosClient';
import scheduleService from '../services/scheduleService';
import { getTasks } from '../services/taskSchedulingService';

/* ─── Helpers ─────────────────────────────────────────────── */
const pad   = n => String(n).padStart(2,'0');
const toKey = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const add   = (d,n) => { const r=new Date(d); r.setDate(r.getDate()+n); return r; };
const getMon= d => { const r=new Date(d); const dw=r.getDay(); r.setDate(r.getDate()-(dw===0?6:dw-1)); r.setHours(0,0,0,0); return r; };
const fmtDate = d => `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
const DAY_NAMES = ['CN','Th 2','Th 3','Th 4','Th 5','Th 6','Th 7'];
const MONTH_NAMES = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6',
                     'Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];

const SHIFT_TYPE_LABEL = { NC:'Nghỉ ca', NP:'Nghỉ phép', OFF:'Ngày off' };
const STATUS_STYLE = {
  Pending:    { bg:'#fef9c3', color:'#a16207' },
  InProgress: { bg:'#dbeafe', color:'#1d4ed8' },
  Completed:  { bg:'#d1fae5', color:'#065f46' },
  Cancelled:  { bg:'#fee2e2', color:'#b91c1c' },
};

/* ─── Week Table (simple list) ────────────────────────────── */
function WeekTable({ monday, shifts }) {
  const days = Array.from({ length:7 }, (_,i) => add(monday,i));
  const todayKey = toKey(new Date());

  return (
    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.85rem' }}>
      <thead>
        <tr style={{ background:'#1e293b' }}>
          <th style={{ padding:'10px 14px', color:'#fff', textAlign:'left', fontWeight:700, fontSize:'0.78rem', width:110 }}>Ngày</th>
          <th style={{ padding:'10px 14px', color:'#fff', textAlign:'center', fontWeight:700, fontSize:'0.78rem', width:150 }}>Ca làm</th>
          <th style={{ padding:'10px 14px', color:'#fff', textAlign:'left', fontWeight:700, fontSize:'0.78rem' }}>Công việc được giao</th>
        </tr>
      </thead>
      <tbody>
        {days.map((d, i) => {
          const key  = toKey(d);
          const slot = shifts?.[key];
          const isToday   = key === todayKey;
          const isWeekend = d.getDay() === 0 || d.getDay() === 6;
          const rowBg = isToday ? '#eff6ff' : i%2===0 ? '#fff' : '#f8fafc';
          const stype = slot?.shiftType;
          const hasTasks = slot?.tasks?.length > 0;

          return (
            <tr key={key} style={{ background: rowBg, borderBottom:'1px solid #e2e8f0' }}>
              {/* Date */}
              <td style={{ padding:'12px 14px', verticalAlign:'top' }}>
                <div style={{
                  fontWeight: isToday ? 800 : 600,
                  color: isToday ? '#3b82f6' : isWeekend ? '#dc2626' : '#0f172a',
                  fontSize:'0.82rem',
                }}>
                  {DAY_NAMES[d.getDay()]}
                </div>
                <div style={{ color:'#64748b', fontSize:'0.73rem', marginTop:2 }}>
                  {d.getDate()}/{pad(d.getMonth()+1)}
                  {isToday && (
                    <span style={{ marginLeft:5, background:'#3b82f6', color:'#fff',
                      fontSize:'0.62rem', padding:'1px 5px', borderRadius:4, fontWeight:700 }}>
                      Hôm nay
                    </span>
                  )}
                </div>
              </td>

              {/* Shift */}
              <td style={{ padding:'12px 14px', textAlign:'center', verticalAlign:'top' }}>
                {!slot ? (
                  <span style={{ color:'#cbd5e1', fontSize:'0.75rem' }}>—</span>
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
                        {slot.timeIn1} – {slot.timeOut1}
                        {slot.timeOut1 < slot.timeIn1 && <span style={{ fontSize:'0.65rem', marginLeft:3 }}>+1</span>}
                      </div>
                    )}
                    {slot.timeIn2 && (
                      <div style={{ background:'#ede9fe', color:'#6d28d9',
                        borderRadius:5, padding:'3px 9px', fontSize:'0.75rem', fontWeight:600,
                        display:'inline-block' }}>
                        {slot.timeIn2} – {slot.timeOut2}
                      </div>
                    )}
                    {!slot.timeIn1 && !slot.timeIn2 && (
                      <span style={{ color:'#94a3b8', fontSize:'0.75rem' }}>Có ca</span>
                    )}
                  </div>
                )}
              </td>

              {/* Tasks */}
              <td style={{ padding:'12px 14px', verticalAlign:'top' }}>
                {!hasTasks ? (
                  <span style={{ color:'#cbd5e1', fontSize:'0.75rem' }}>—</span>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                    {slot.tasks.map((t, ti) => {
                      const ss = STATUS_STYLE[t.status] || { bg:'#f1f5f9', color:'#475569' };
                      const time = t.scheduledAt ? (() => {
                        const dt = new Date(t.scheduledAt);
                        return `${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
                      })() : null;
                      return (
                        <div key={ti} style={{
                          display:'flex', alignItems:'center', gap:6,
                          background: ss.bg, color: ss.color,
                          borderRadius:5, padding:'3px 9px',
                          fontSize:'0.75rem', fontWeight:600,
                          border:`1px solid ${ss.color}30`, width:'fit-content',
                        }}>
                          <span>{t.taskTypeName || t.note || 'Task'}</span>
                          {time && <span style={{ opacity:0.75 }}>{time}</span>}
                          <span style={{ opacity:0.6, fontWeight:400, fontSize:'0.68rem' }}>[{t.status}]</span>
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

/* ─── Month mini-table ─────────────────────────────────────── */
function MonthTable({ year, month, shifts }) {
  const lastDay   = new Date(year, month+1, 0);
  const todayStr  = toKey(new Date());
  const rows = [];
  for (let d=1; d<=lastDay.getDate(); d++) {
    const date = new Date(year, month, d);
    const key  = `${year}-${pad(month+1)}-${pad(d)}`;
    const slot = shifts?.[key];
    const isToday   = key === todayStr;
    const isWeekend = date.getDay()===0||date.getDay()===6;
    const stype = slot?.shiftType;
    const taskCount = slot?.tasks?.length || 0;
    rows.push({ d, date, key, slot, isToday, isWeekend, stype, taskCount });
  }

  return (
    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.83rem' }}>
      <thead>
        <tr style={{ background:'#1e293b' }}>
          <th style={{ padding:'9px 12px', color:'#fff', textAlign:'left', fontWeight:700, fontSize:'0.75rem' }}>Ngày</th>
          <th style={{ padding:'9px 12px', color:'#fff', textAlign:'left', fontWeight:700, fontSize:'0.75rem' }}>Thứ</th>
          <th style={{ padding:'9px 12px', color:'#fff', textAlign:'center', fontWeight:700, fontSize:'0.75rem' }}>Ca làm</th>
          <th style={{ padding:'9px 12px', color:'#fff', textAlign:'center', fontWeight:700, fontSize:'0.75rem' }}>Task</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ d, date, key, slot, isToday, isWeekend, stype, taskCount }, i) => (
          <tr key={key} style={{ background: isToday?'#eff6ff': i%2===0?'#fff':'#f8fafc', borderBottom:'1px solid #e2e8f0' }}>
            <td style={{ padding:'8px 12px', fontWeight: isToday?800:600,
              color: isToday?'#3b82f6': isWeekend?'#dc2626':'#0f172a', width:60 }}>
              {d}/{pad(month+1)}
              {isToday && <span style={{ marginLeft:4, fontSize:'0.62rem', background:'#3b82f6', color:'#fff',
                padding:'1px 4px', borderRadius:3 }}>Hôm nay</span>}
            </td>
            <td style={{ padding:'8px 12px', color: isWeekend?'#dc2626':'#64748b', width:60, fontSize:'0.75rem' }}>
              {DAY_NAMES[date.getDay()]}
            </td>
            <td style={{ padding:'8px 12px', textAlign:'center' }}>
              {!slot ? (
                <span style={{ color:'#e2e8f0' }}>—</span>
              ) : stype ? (
                <span style={{
                  background: stype==='NC'?'#fee2e2':stype==='NP'?'#fef9c3':'#f1f5f9',
                  color:      stype==='NC'?'#b91c1c':stype==='NP'?'#92400e':'#64748b',
                  borderRadius:4, padding:'1px 7px', fontSize:'0.72rem', fontWeight:700 }}>
                  {SHIFT_TYPE_LABEL[stype]||stype}
                </span>
              ) : slot.timeIn1 ? (
                <span style={{ background:'#dbeafe', color:'#1d4ed8',
                  borderRadius:4, padding:'1px 7px', fontSize:'0.72rem', fontWeight:600 }}>
                  {slot.timeIn1}–{slot.timeOut1}
                </span>
              ) : <span style={{ color:'#e2e8f0' }}>—</span>}
            </td>
            <td style={{ padding:'8px 12px', textAlign:'center' }}>
              {taskCount>0
                ? <span style={{ background:'#ede9fe', color:'#6d28d9',
                    borderRadius:4, padding:'1px 7px', fontSize:'0.72rem', fontWeight:700 }}>
                    {taskCount} task
                  </span>
                : <span style={{ color:'#e2e8f0' }}>—</span>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ─── Main ─────────────────────────────────────────────────── */
export default function MySchedulePage() {
  const [viewMode,    setViewMode]    = useState('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedule,    setSchedule]    = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [loadingWh,   setLoadingWh]   = useState(true);
  const [error,       setError]       = useState('');
  const [warehouses,  setWarehouses]  = useState([]);
  const [warehouseId, setWarehouseId] = useState(null);

  /* Fetch warehouses once */
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

  const monday = getMon(currentDate);
  const monEnd = add(monday, 6);
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
      // API 1: ca làm việc
      const shiftData = await scheduleService.getMySchedule(warehouseId, from, to);
      // API 2: task được gán
      let taskData = [];
      try { taskData = await getTasks(warehouseId, `${from}T00:00:00Z`, `${to}T23:59:59Z`); } catch {}

      // Merge tasks vào slots theo ngày
      const merged = { ...(shiftData?.shifts || {}) };
      const allTasks = Array.isArray(taskData) ? taskData : [];
      allTasks.forEach(t => {
        if (!t.scheduledAt) return;
        const d   = new Date(t.scheduledAt);
        const key = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
        if (!merged[key]) merged[key] = { timeIn1:null,timeOut1:null,timeIn2:null,timeOut2:null,shiftType:null,tasks:[] };
        if (!(merged[key].tasks||[]).some(x => x.taskId===t.id)) {
          merged[key] = { ...merged[key], tasks:[...(merged[key].tasks||[]), {
            taskId:t.id, taskTypeName:t.taskTypeName, status:t.status, note:t.note, scheduledAt:t.scheduledAt,
          }]};
        }
      });
      setSchedule({ ...shiftData, shifts: merged });
    } catch(e) {
      setError(e?.response?.data?.message || 'Không thể tải lịch.');
    } finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warehouseId, from, to, viewMode]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const hasData = schedule && Object.keys(schedule.shifts||{}).length > 0;

  const periodLabel = viewMode === 'week'
    ? `${fmtDate(monday)} – ${fmtDate(monEnd)}`
    : `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  /* Loading warehouses */
  if (loadingWh) {
    return (
      <div style={{ padding:40, textAlign:'center', color:'#94a3b8', fontFamily:'Inter,sans-serif' }}>
        Đang tải...
      </div>
    );
  }

  if (warehouses.length === 0) {
    return (
      <div style={{ padding:40, textAlign:'center', color:'#94a3b8', fontFamily:'Inter,sans-serif' }}>
        Bạn chưa được thêm vào kho nào.
      </div>
    );
  }

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
          <h2 style={{ margin:0, fontSize:'1.25rem', fontWeight:800 }}>Lịch làm việc của tôi</h2>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:5, flexWrap:'wrap' }}>
            {schedule?.fullName && <span style={{ fontSize:'0.82rem', color:'#64748b' }}>{schedule.fullName}</span>}
            {schedule?.roleCode && (
              <span style={{ padding:'2px 8px', borderRadius:5, fontSize:'0.7rem', fontWeight:700,
                background:'#dbeafe', color:'#1d4ed8' }}>{schedule.roleCode}</span>
            )}
            {warehouses.length > 1 ? (
              <select value={warehouseId??''} onChange={e => setWarehouseId(Number(e.target.value))}
                style={{ padding:'4px 9px', borderRadius:6, border:'1px solid #e2e8f0',
                  fontSize:'0.8rem', color:'#374151', background:'#f8fafc', cursor:'pointer' }}>
                {warehouses.map(w => (
                  <option key={w.warehouseId} value={w.warehouseId}>{w.warehouseName}</option>
                ))}
              </select>
            ) : (
              <span style={{ fontSize:'0.8rem', color:'#94a3b8' }}>{warehouseName}</span>
            )}
          </div>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          <button style={btnStyle(viewMode==='week')}  onClick={() => setViewMode('week')}>Tuần</button>
          <button style={btnStyle(viewMode==='month')} onClick={() => setViewMode('month')}>Tháng</button>
        </div>
      </div>

      {/* Nav */}
      <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:9, padding:'9px 14px',
        marginBottom:14, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
        <div style={{ display:'flex', gap:6 }}>
          <button style={btnStyle(false)} onClick={() => {
            if (viewMode==='week') setCurrentDate(d => add(d,-7));
            else setCurrentDate(d => new Date(d.getFullYear(), d.getMonth()-1, 1));
          }}>Trước</button>
          <button style={btnStyle(false)} onClick={() => {
            if (viewMode==='week') setCurrentDate(d => add(d,7));
            else setCurrentDate(d => new Date(d.getFullYear(), d.getMonth()+1, 1));
          }}>Sau</button>
          <button style={btnStyle(false)} onClick={() => setCurrentDate(new Date())}>Hôm nay</button>
        </div>
        <span style={{ fontWeight:700, fontSize:'0.93rem' }}>{periodLabel}</span>
        <button style={btnStyle(false)} onClick={fetchAll}>Làm mới</button>
      </div>

      {/* Table */}
      <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:10,
        overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,.05)' }}>
        {loading ? (
          <div style={{ padding:60, textAlign:'center', color:'#94a3b8' }}>Đang tải lịch...</div>
        ) : error ? (
          <div style={{ padding:20, color:'#dc2626', background:'#fef2f2', fontSize:'0.88rem' }}>{error}</div>
        ) : (
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            {viewMode === 'week'
              ? <WeekTable monday={monday} shifts={schedule?.shifts} />
              : <MonthTable year={currentDate.getFullYear()} month={currentDate.getMonth()} shifts={schedule?.shifts} />
            }
          </div>
        )}

        {/* No data notice */}
        {!loading && !error && !hasData && viewMode === 'week' && (
          <div style={{ padding:'14px 18px', background:'#fffbeb', borderTop:'1px solid #fde68a',
            color:'#92400e', fontSize:'0.82rem', textAlign:'center' }}>
            Chưa có ca làm việc trong tuần này. Liên hệ quản lý để được sắp xếp lịch.
          </div>
        )}
      </div>

      {/* Skills & Zones */}
      {schedule && (schedule.skills?.length > 0 || schedule.zones?.length > 0) && (
        <div style={{ marginTop:14, display:'flex', gap:12, flexWrap:'wrap' }}>
          {schedule.skills?.length > 0 && (
            <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:9,
              padding:'10px 14px', flex:1, minWidth:140 }}>
              <div style={{ fontSize:'0.68rem', color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:'.4px', marginBottom:6 }}>KỸ NĂNG</div>
              <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                {schedule.skills.map((s,i) => (
                  <span key={i} style={{ background:'#dbeafe', color:'#1d4ed8', padding:'2px 8px', borderRadius:4, fontSize:'0.72rem', fontWeight:600 }}>{s}</span>
                ))}
              </div>
            </div>
          )}
          {schedule.zones?.length > 0 && (
            <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:9,
              padding:'10px 14px', flex:1, minWidth:140 }}>
              <div style={{ fontSize:'0.68rem', color:'#94a3b8', fontWeight:700, textTransform:'uppercase', letterSpacing:'.4px', marginBottom:6 }}>KHU VỰC</div>
              <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                {schedule.zones.map((z,i) => (
                  <span key={i} style={{ background:'#d1fae5', color:'#065f46', padding:'2px 8px', borderRadius:4, fontSize:'0.72rem', fontWeight:600 }}>{z}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
