import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import scheduleService from '../services/scheduleService';
import authService from '../services/authService';

/* ─── Helpers ──────────────────────────────────────────────────────────── */
const DAYS_VI = ['CN', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7'];
const MONTHS_VI = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6',
                   'Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];

function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function getWeekStart(d) {
  const date = new Date(d);
  const day = date.getDay(); // 0 = Sun
  date.setDate(date.getDate() - day + 1); // Monday
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

/* ─── Sub-components ──────────────────────────────────────────────────── */
const statusColors = {
  Pending:     { bg: '#fef9c3', color: '#a16207' },
  InProgress:  { bg: '#dbeafe', color: '#1d4ed8' },
  Completed:   { bg: '#d1fae5', color: '#065f46' },
  Cancelled:   { bg: '#fee2e2', color: '#b91c1c' },
};
const statusLabel = { Pending: 'Chờ', InProgress: 'Đang làm', Completed: 'Xong', Cancelled: 'Huỷ' };

function TaskChip({ task }) {
  const s = statusColors[task.status] || { bg: '#f1f5f9', color: '#475569' };
  return (
    <div style={{
      marginTop: 4, padding: '3px 8px', borderRadius: 6,
      backgroundColor: s.bg, color: s.color,
      fontSize: '0.7rem', fontWeight: 600,
      display: 'flex', alignItems: 'center', gap: 4,
      border: `1px solid ${s.color}22`,
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>task_alt</span>
      {task.taskTypeName}
      {task.scheduledAt && (
        <span style={{ opacity: 0.7 }}>
          {task.scheduledAt.split('T')[1]}
        </span>
      )}
    </div>
  );
}

function ShiftBlock({ timeIn, timeOut, idx }) {
  if (!timeIn && !timeOut) return null;
  const colors = ['#3b82f6', '#8b5cf6'];
  return (
    <div style={{
      backgroundColor: colors[idx],
      color: '#fff',
      borderRadius: 6,
      padding: '4px 8px',
      fontSize: '0.75rem',
      fontWeight: 600,
      marginTop: idx === 1 ? 4 : 0,
      display: 'flex', alignItems: 'center', gap: 4,
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>schedule</span>
      {timeIn || '--:--'} – {timeOut || '--:--'}
    </div>
  );
}

function ShiftTypeBadge({ type }) {
  const map = {
    OFF: { label: 'Ngày Off', bg: '#f1f5f9', color: '#64748b' },
    NC:  { label: 'Nghỉ ca',  bg: '#fee2e2', color: '#b91c1c' },
    CD:  { label: 'Cả ngày',  bg: '#fef9c3', color: '#a16207' },
  };
  const s = map[type];
  if (!s) return null;
  return (
    <div style={{
      padding: '4px 10px', borderRadius: 6,
      backgroundColor: s.bg, color: s.color,
      fontSize: '0.75rem', fontWeight: 700,
      display: 'inline-block',
    }}>
      {s.label}
    </div>
  );
}

/* ─── Week View ──────────────────────────────────────────────────────────── */
function WeekView({ shifts, weekStart }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const todayStr = toDateStr(new Date());

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
      {days.map((d, i) => {
        const dateStr = toDateStr(d);
        const slot = shifts?.[dateStr];
        const isToday = dateStr === todayStr;

        return (
          <div key={i} style={{
            backgroundColor: isToday ? '#eff6ff' : '#fff',
            border: isToday ? '2px solid #3b82f6' : '1px solid #f1f5f9',
            borderRadius: 12,
            padding: 12,
            minHeight: 160,
          }}>
            {/* Day header */}
            <div style={{ textAlign: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>
                {DAYS_VI[d.getDay()]}
              </div>
              <div style={{
                fontSize: '1.1rem', fontWeight: 800,
                color: isToday ? '#3b82f6' : '#111827',
                lineHeight: 1.2,
              }}>
                {d.getDate()}
              </div>
              <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                {String(d.getMonth() + 1).padStart(2, '0')}/{d.getFullYear().toString().slice(2)}
              </div>
            </div>

            {!slot ? (
              <div style={{ color: '#cbd5e1', fontSize: '0.7rem', textAlign: 'center', marginTop: 16 }}>
                Không có ca
              </div>
            ) : slot.shiftType ? (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <ShiftTypeBadge type={slot.shiftType} />
              </div>
            ) : (
              <div>
                <ShiftBlock timeIn={slot.timeIn1} timeOut={slot.timeOut1} idx={0} />
                <ShiftBlock timeIn={slot.timeIn2} timeOut={slot.timeOut2} idx={1} />
              </div>
            )}

            {/* Tasks */}
            {slot?.tasks?.length > 0 && (
              <div style={{ marginTop: 8 }}>
                {slot.tasks.map((t, ti) => (
                  <TaskChip key={ti} task={t} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Month View ─────────────────────────────────────────────────────────── */
function MonthView({ shifts, year, month }) {
  // First day of month
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7; // Monday = 0
  const todayStr = toDateStr(new Date());

  const cells = [];
  // Empty cells before month start
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) cells.push(d);

  const dayHeaders = ['Th 2','Th 3','Th 4','Th 5','Th 6','Th 7','CN'];

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
        {dayHeaders.map(h => (
          <div key={h} style={{ textAlign: 'center', fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, padding: '4px 0' }}>
            {h}
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const slot = shifts?.[dateStr];
          const isToday = dateStr === todayStr;
          const hasShift = slot && (slot.timeIn1 || slot.shiftType);
          const taskCount = slot?.tasks?.length || 0;

          return (
            <div key={i} style={{
              backgroundColor: isToday ? '#eff6ff' : '#fff',
              border: isToday ? '2px solid #3b82f6' : '1px solid #f1f5f9',
              borderRadius: 8,
              padding: '6px 8px',
              minHeight: 70,
              cursor: 'default',
            }}>
              <div style={{
                fontWeight: isToday ? 800 : 600,
                color: isToday ? '#3b82f6' : '#374151',
                fontSize: '0.8rem',
                marginBottom: 4,
              }}>{day}</div>
              {hasShift && !slot.shiftType && (
                <div style={{
                  fontSize: '0.65rem', color: '#fff',
                  backgroundColor: '#3b82f6',
                  borderRadius: 4, padding: '2px 5px',
                  marginBottom: 2,
                }}>
                  {slot.timeIn1}–{slot.timeOut1}
                </div>
              )}
              {slot?.shiftType && <ShiftTypeBadge type={slot.shiftType} />}
              {taskCount > 0 && (
                <div style={{
                  fontSize: '0.65rem', color: '#fff',
                  backgroundColor: '#8b5cf6',
                  borderRadius: 4, padding: '2px 5px',
                  display: 'inline-block', marginTop: 2,
                }}>
                  {taskCount} task
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export default function MySchedulePage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('week'); // 'week' | 'month'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const ctx = authService.getWarehouseContext?.() || {};
  const warehouseId = ctx?.warehouseId;
  const warehouseName = ctx?.warehouseName || 'Kho';

  const weekStart = getWeekStart(currentDate);
  const weekEnd   = addDays(weekStart, 6);

  // Compute from/to based on view
  const from = viewMode === 'week'
    ? toDateStr(weekStart)
    : `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`;

  const to = viewMode === 'week'
    ? toDateStr(weekEnd)
    : toDateStr(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0));

  const fetchSchedule = useCallback(async () => {
    if (!warehouseId) return;
    setLoading(true);
    setError('');
    try {
      const data = await scheduleService.getMySchedule(warehouseId, from, to);
      setSchedule(data);
    } catch (e) {
      setError(e?.response?.data?.message || 'Không thể tải lịch.');
    } finally {
      setLoading(false);
    }
  }, [warehouseId, from, to]);

  useEffect(() => { fetchSchedule(); }, [fetchSchedule]);

  function prev() {
    if (viewMode === 'week') {
      setCurrentDate(d => addDays(d, -7));
    } else {
      setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    }
  }
  function next() {
    if (viewMode === 'week') {
      setCurrentDate(d => addDays(d, 7));
    } else {
      setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    }
  }
  function goToday() { setCurrentDate(new Date()); }

  const periodLabel = viewMode === 'week'
    ? `${weekStart.getDate()}/${weekStart.getMonth() + 1} – ${weekEnd.getDate()}/${weekEnd.getMonth() + 1}/${weekEnd.getFullYear()}`
    : `${MONTHS_VI[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  const roleLabel = {
    STAFF:    { text: 'Nhân viên',  bg: '#dbeafe', color: '#1d4ed8' },
    MANAGER:  { text: 'Quản lý',    bg: '#d1fae5', color: '#065f46' },
    OPERATOR: { text: 'Điều hành',  bg: '#ede9fe', color: '#6d28d9' },
  };
  const role = roleLabel[schedule?.roleCode] || { text: schedule?.roleCode || '', bg: '#f1f5f9', color: '#475569' };

  const btnBase = {
    padding: '8px 18px', borderRadius: 8, fontWeight: 600, fontSize: '0.85rem',
    cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: 6,
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: 1200, margin: '0 auto' }}>

      {/* ── Page Header ── */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#111827' }}>
            Lịch làm việc của tôi
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: '0.875rem', color: '#64748b' }}>
            {warehouseName} — {schedule?.fullName || '...'}
            {schedule?.roleCode && (
              <span style={{
                marginLeft: 8, padding: '2px 10px', borderRadius: 6,
                backgroundColor: role.bg, color: role.color,
                fontSize: '0.75rem', fontWeight: 700,
              }}>{role.text}</span>
            )}
          </p>
        </div>

        {/* View toggle */}
        <div style={{ display: 'flex', gap: 8 }}>
          {['week', 'month'].map(v => (
            <button key={v} onClick={() => setViewMode(v)} style={{
              ...btnBase,
              backgroundColor: viewMode === v ? '#00b2d6' : '#f1f5f9',
              color: viewMode === v ? '#fff' : '#64748b',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                {v === 'week' ? 'calendar_view_week' : 'calendar_month'}
              </span>
              {v === 'week' ? 'Tuần' : 'Tháng'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Navigation Bar ── */}
      <div style={{
        backgroundColor: '#fff',
        borderRadius: 12,
        border: '1px solid #f1f5f9',
        padding: '12px 20px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={prev} style={{ ...btnBase, backgroundColor: '#f1f5f9', color: '#374151' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_left</span>
            Trước
          </button>
          <button onClick={next} style={{ ...btnBase, backgroundColor: '#f1f5f9', color: '#374151' }}>
            Sau
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span>
          </button>
          <button onClick={goToday} style={{ ...btnBase, backgroundColor: '#eff6ff', color: '#3b82f6' }}>
            Hôm nay
          </button>
        </div>
        <div style={{ fontWeight: 700, color: '#111827', fontSize: '1rem' }}>{periodLabel}</div>
        <button onClick={fetchSchedule} style={{ ...btnBase, backgroundColor: '#f0fdf4', color: '#16a34a' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span>
          Làm mới
        </button>
      </div>

      {/* ── Legend ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { color: '#3b82f6', label: 'Ca 1' },
          { color: '#8b5cf6', label: 'Ca 2' },
          { color: '#8b5cf6', label: 'Task được giao', icon: true },
        ].map((l, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: '#64748b' }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: l.color }} />
            {l.label}
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: '#64748b' }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: '#f59e0b' }} />
          Nghỉ ca / Ngày off
        </div>
      </div>

      {/* ── Content ── */}
      {!warehouseId ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          backgroundColor: '#fff', borderRadius: 16, border: '1px solid #f1f5f9',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#cbd5e1', display: 'block', marginBottom: 12 }}>
            warehouse
          </span>
          <p style={{ color: '#64748b', marginBottom: 16 }}>Bạn chưa chọn kho làm việc.</p>
          <button
            onClick={() => navigate('/dashboard')}
            style={{ ...btnBase, backgroundColor: '#00b2d6', color: '#fff' }}
          >
            Về Dashboard
          </button>
        </div>
      ) : loading ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          backgroundColor: '#fff', borderRadius: 16, border: '1px solid #f1f5f9',
        }}>
          <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Đang tải lịch...</div>
        </div>
      ) : error ? (
        <div style={{
          backgroundColor: '#fef2f2', border: '1px solid #fecaca',
          borderRadius: 12, padding: 20, color: '#dc2626', fontSize: '0.875rem',
        }}>
          {error}
        </div>
      ) : (
        <div style={{
          backgroundColor: '#fff',
          borderRadius: 16,
          border: '1px solid #f1f5f9',
          padding: 20,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          {viewMode === 'week' ? (
            <WeekView shifts={schedule?.shifts} weekStart={weekStart} />
          ) : (
            <MonthView
              shifts={schedule?.shifts}
              year={currentDate.getFullYear()}
              month={currentDate.getMonth()}
            />
          )}
        </div>
      )}

      {/* ── Skills & Zones Info ── */}
      {schedule && (
        <div style={{ marginTop: 20, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {schedule.skills?.length > 0 && (
            <div style={{
              backgroundColor: '#fff', borderRadius: 12, border: '1px solid #f1f5f9',
              padding: '12px 16px', flex: 1, minWidth: 200,
            }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, marginBottom: 8 }}>
                KỸ NĂNG
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {schedule.skills.map((s, i) => (
                  <span key={i} style={{
                    backgroundColor: '#dbeafe', color: '#1d4ed8',
                    padding: '3px 10px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600,
                  }}>{s}</span>
                ))}
              </div>
            </div>
          )}
          {schedule.zones?.length > 0 && (
            <div style={{
              backgroundColor: '#fff', borderRadius: 12, border: '1px solid #f1f5f9',
              padding: '12px 16px', flex: 1, minWidth: 200,
            }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, marginBottom: 8 }}>
                KHU VỰC
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {schedule.zones.map((z, i) => (
                  <span key={i} style={{
                    backgroundColor: '#d1fae5', color: '#065f46',
                    padding: '3px 10px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600,
                  }}>{z}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
