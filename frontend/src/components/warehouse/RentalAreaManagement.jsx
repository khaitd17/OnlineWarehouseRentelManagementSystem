import React, { useState, useEffect, useRef, useCallback } from "react";
import { Rnd } from "react-rnd";
import api from "../../services/axiosClient";

// ── Gate sizing constants ──────────────────────────────────────────────────
const GATE_LONG  = 140; // px along the wall
const GATE_SHORT =  30; // px protruding out from wall

/**
 * gatePos = { side: 'top'|'bottom'|'left'|'right', ratio: 0-1 }
 * ratio=0 → start of side, ratio=1 → end of side
 */
const defaultGatePos = { side: 'bottom', ratio: 0.5 };

// Given mouse position relative to canvas, snap to nearest perimeter point
function snapToPerimeter(mx, my, cw, ch) {
  const clampedTop    = { side: 'top',    ratio: Math.min(1, Math.max(0, mx / cw)), dist: Math.abs(my) };
  const clampedBottom = { side: 'bottom', ratio: Math.min(1, Math.max(0, mx / cw)), dist: Math.abs(my - ch) };
  const clampedLeft   = { side: 'left',   ratio: Math.min(1, Math.max(0, my / ch)), dist: Math.abs(mx) };
  const clampedRight  = { side: 'right',  ratio: Math.min(1, Math.max(0, my / ch)), dist: Math.abs(mx - cw) };
  return [clampedTop, clampedBottom, clampedLeft, clampedRight]
    .sort((a, b) => a.dist - b.dist)[0];
}

// Returns the CSS style for the gate element (position: absolute relative to canvas wrapper)
function gateStyle(pos, cw, ch, isDragging) {
  const { side, ratio } = pos;
  const isH = side === 'top' || side === 'bottom';
  const long = isH ? GATE_LONG : GATE_SHORT;
  const short = isH ? GATE_SHORT : GATE_LONG;

  let top, left;
  if (side === 'top') {
    top  = -GATE_SHORT;
    left = ratio * cw - GATE_LONG / 2;
  } else if (side === 'bottom') {
    top  = ch;
    left = ratio * cw - GATE_LONG / 2;
  } else if (side === 'left') {
    left = -GATE_SHORT;
    top  = ratio * ch - GATE_LONG / 2;
  } else { // right
    left = cw;
    top  = ratio * ch - GATE_LONG / 2;
  }

  return {
    position: 'absolute',
    top,
    left,
    width:  isH ? GATE_LONG : GATE_SHORT,
    height: isH ? GATE_SHORT : GATE_LONG,
    background: 'linear-gradient(135deg,#f59e0b,#d97706)',
    color: '#fff',
    fontWeight: 800,
    fontSize: '11px',
    letterSpacing: '0.06em',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    whiteSpace: 'nowrap',
    boxShadow: '0 4px 12px rgba(245,158,11,0.45)',
    zIndex: 20,
    userSelect: 'none',
    cursor: isDragging ? 'grabbing' : 'grab',
    transition: isDragging ? 'none' : 'top 0.15s, left 0.15s',
    // border-radius: rounded on the side pointing away from the wall
    borderTopLeftRadius:     (side === 'bottom' || side === 'right') ? 8 : 0,
    borderTopRightRadius:    (side === 'bottom' || side === 'left')  ? 8 : 0,
    borderBottomLeftRadius:  (side === 'top'    || side === 'right') ? 8 : 0,
    borderBottomRightRadius: (side === 'top'    || side === 'left')  ? 8 : 0,
    writingMode: (!isH) ? 'vertical-lr' : undefined,
    transform:   (side === 'left') ? 'rotate(180deg)' : undefined,
  };
}

// ── Main Component ─────────────────────────────────────────────────────────
const RentalAreaManagement = ({ warehouseId, viewOnly = false }) => {
  const [scale, setScale] = useState(10);
  const [areas, setAreas] = useState([]);
  const [warehouse, setWarehouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [hoveredAreaId, setHoveredAreaId] = useState(null);

  // Gate drag-to-perimeter
  const [gatePos, setGatePos] = useState(() => {
    try {
      const s = localStorage.getItem(`gatePos_${warehouseId}`);
      return s ? JSON.parse(s) : defaultGatePos;
    } catch { return defaultGatePos; }
  });
  const [isDraggingGate, setIsDraggingGate] = useState(false);
  const canvasWrapperRef = useRef(null);

  const saveGatePos = useCallback((pos) => {
    setGatePos(pos);
    try { localStorage.setItem(`gatePos_${warehouseId}`, JSON.stringify(pos)); } catch {}
  }, [warehouseId]);

  // Gate drag handlers
  const handleGateMouseDown = useCallback((e) => {
    if (viewOnly) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingGate(true);
  }, [viewOnly]);

  useEffect(() => {
    if (!isDraggingGate) return;
    const onMove = (e) => {
      const wrapper = canvasWrapperRef.current;
      if (!wrapper) return;
      const rect = wrapper.getBoundingClientRect();
      const mx = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
      const my = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
      const cw = wrapper.offsetWidth;
      const ch = wrapper.offsetHeight;
      const snapped = snapToPerimeter(mx, my, cw, ch);
      setGatePos({ side: snapped.side, ratio: snapped.ratio });
    };
    const onUp = (e) => {
      setIsDraggingGate(false);
      const wrapper = canvasWrapperRef.current;
      if (!wrapper) return;
      const rect = wrapper.getBoundingClientRect();
      const mx = (e.clientX || e.changedTouches?.[0]?.clientX) - rect.left;
      const my = (e.clientY || e.changedTouches?.[0]?.clientY) - rect.top;
      const cw = wrapper.offsetWidth;
      const ch = wrapper.offsetHeight;
      const snapped = snapToPerimeter(mx, my, cw, ch);
      saveGatePos({ side: snapped.side, ratio: snapped.ratio });
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [isDraggingGate, saveGatePos]);

  // Form data
  const [formData, setFormData] = useState({
    name: "", size: "", description: "",
    width: "10", length: "10", height: "5",
    positionX: "0", positionY: "0"
  });
  const [formError, setFormError] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [whRes, areasRes] = await Promise.all([
        api.get(`/Warehouse/${warehouseId}`),
        api.get(`/RentalAreas/warehouse/${warehouseId}`)
      ]);
      setWarehouse(whRes.data);
      setAreas(areasRes.data || []);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (warehouseId) fetchData(); }, [warehouseId]);

  // Auto-scale: fit the larger warehouse dimension into ~480px
  useEffect(() => {
    if (!warehouse) return;
    const maxDim = Math.max(
      (warehouse.width  ?? warehouse.Width)  || 50,
      (warehouse.length ?? warehouse.Length) || 50
    );
    const ideal = Math.floor(480 / maxDim);
    setScale(Math.max(10, Math.min(40, ideal)));
  }, [warehouse]);

  // ── Validation ─────────────────────────────────────────────────────────
  const isIntersecting = (x1,y1,w1,l1,x2,y2,w2,l2) => {
    const E = 0.2;
    return !(x1+w1<=x2+E || x2+w2<=x1+E || y1+l1<=y2+E || y2+l2<=y1+E);
  };
  const checkOverlap = (excludeId,x,y,w,l) =>
    areas.some(a => a.id!==excludeId && isIntersecting(x,y,w,l,a.positionX||0,a.positionY||0,a.width||10,a.length||10));
  const checkCapacity = (excludeId,newSize) => {
    const cur = areas.reduce((s,a)=>s+(a.id===excludeId?0:a.size),0);
    return (cur+newSize)<=(warehouse?.totalArea||0);
  };
  const findEmptySpot = (w,l) => {
    const whW=warehouse?.width||50, whL=warehouse?.length||50;
    for(let y=0;y<=whL-l;y+=1)
      for(let x=0;x<=whW-w;x+=1)
        if(!checkOverlap(null,x,y,w,l)) return {x,y};
    return {x:0,y:0};
  };

  // ── Form handlers ───────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const {name,value}=e.target;
    setFormData(prev=>{
      const next={...prev,[name]:value};
      if(['width','length','height'].includes(name)){
        const w=parseFloat(name==='width'?value:next.width)||0;
        const l=parseFloat(name==='length'?value:next.length)||0;
        const h=parseFloat(name==='height'?value:next.height)||0;
        next.size=(w*l*h).toFixed(2);
      }
      return next;
    });
  };
  const openCreateForm = () => {
    setFormError(''); setEditingId(null);
    const w=10,l=10,h=5; const {x,y}=findEmptySpot(w,l);
    setFormData({name:`Khu ${areas.length+1}`,size:(w*l*h).toString(),description:'',width:w.toString(),length:l.toString(),height:h.toString(),positionX:x.toString(),positionY:y.toString()});
    setShowForm(true);
  };
  const openEditForm = (area) => {
    if(viewOnly) return;
    setFormError(''); setEditingId(area.id);
    const w=area.width||10,l=area.length||10;
    const inferredH=(w*l>0&&area.size>0)?parseFloat((area.size/(w*l)).toFixed(2)):5;
    setFormData({name:area.name,size:area.size,description:area.description||'',width:w,length:l,height:inferredH,positionX:area.positionX||0,positionY:area.positionY||0});
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditingId(null); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setFormError('');
    const parsedSize=parseFloat(formData.size);
    const w=parseFloat(formData.width)||10,l=parseFloat(formData.length)||10;
    const x=parseFloat(formData.positionX)||0,y=parseFloat(formData.positionY)||0;
    if(!checkCapacity(editingId,parsedSize)){setFormError(`Lỗi sức chứa: Tổng thể tích vượt quá diện tích kho (${warehouse?.totalArea} m³).`);return;}
    if(checkOverlap(editingId,x,y,w,l)){setFormError('Lỗi vị trí: Khu vực này bị đè lên một khu vực khác đã có.');return;}
    const whW=warehouse?.width||50,whL=warehouse?.length||50;
    if(x+w>whW||y+l>whL){setFormError(`Lỗi kích thước: Tọa độ tràn ra ngoài kho (${whW}m × ${whL}m).`);return;}
    setSubmitLoading(true);
    try {
      const payload={name:formData.name,size:parsedSize,description:formData.description,width:w,length:l,positionX:x,positionY:y};
      if(editingId){await api.put(`/RentalAreas/${editingId}`,{id:editingId,...payload});alert('Cập nhật thành công!');}
      else{await api.post('/RentalAreas',{warehouseId:parseInt(warehouseId),...payload});alert('Thêm mới thành công!');}
      closeForm(); fetchData();
    } catch(err){setFormError(err.response?.data?.message||err.message);}
    finally{setSubmitLoading(false);}
  };

  const handleDelete = async (id) => {
    if(window.confirm('Bạn có chắc chắn muốn xóa khu vực này không?')){
      try{await api.delete(`/RentalAreas/${id}`);closeForm();fetchData();}
      catch{alert('Lỗi khi xóa!');}
    }
  };

  const handleDragStop = async (id,d) => {
    if(viewOnly) return;
    const area=areas.find(a=>a.id===id); if(!area) return;
    if(area.status?.toUpperCase()==='RENTED'){alert('Không thể di chuyển khu vực đang được thuê!');setAreas([...areas]);return;}
    const newX=Math.round((d.x/scale)*10)/10,newY=Math.round((d.y/scale)*10)/10;
    if(checkOverlap(id,newX,newY,area.width||10,area.length||10)){alert('Vị trí không hợp lệ! Bị chạm vào một khu vực khác.');setAreas([...areas]);return;}
    const upd={...area,positionX:newX,positionY:newY};
    setAreas(prev=>prev.map(a=>(a.id===id?upd:a)));
    try{await api.put(`/RentalAreas/${id}`,upd);}catch(e){console.error('Auto-save failed',e);}
  };

  const handleResizeStop = async (id,ref,position) => {
    if(viewOnly) return;
    const area=areas.find(a=>a.id===id); if(!area) return;
    if(area.status?.toUpperCase()==='RENTED'){alert('Không thể thay đổi kích thước khu vực đang được thuê!');setAreas([...areas]);return;}
    const newW=Math.round((ref.offsetWidth/scale)*10)/10,newL=Math.round((ref.offsetHeight/scale)*10)/10;
    const newSize=Number((newW*newL*5).toFixed(2));
    const newX=Math.round((position.x/scale)*10)/10,newY=Math.round((position.y/scale)*10)/10;
    if(checkOverlap(id,newX,newY,newW,newL)){alert('Kích thước không hợp lệ! Bị chạm vào một khu vực khác.');setAreas([...areas]);return;}
    if(!checkCapacity(id,newSize)){alert('Kích thước không hợp lệ! Tổng hệ thống vượt quá kho chứa.');setAreas([...areas]);return;}
    const upd={...area,width:newW,length:newL,size:newSize,positionX:newX,positionY:newY};
    setAreas(prev=>prev.map(a=>(a.id===id?upd:a)));
    try{await api.put(`/RentalAreas/${id}`,upd);}catch(e){console.error('Auto-save failed',e);}
  };

  if(loading) return <p style={{color:'#64748b'}}>Đang tải sơ đồ 2D...</p>;

  const whW=(warehouse?.width??warehouse?.Width)||50;
  const whL=(warehouse?.length??warehouse?.Length)||50;
  const cw=whW*scale, ch=whL*scale;

  const containerStyle = {
    position: 'absolute',
    top: 0, left: 0,
    width:  `${cw}px`,
    height: `${ch}px`,
    backgroundColor: '#f8fafc',
    backgroundImage: 'linear-gradient(#e2e8f0 1px,transparent 1px),linear-gradient(90deg,#e2e8f0 1px,transparent 1px)',
    backgroundSize: `${scale}px ${scale}px`,
    border: '3px solid #64748b',
    borderRadius: '8px',
    boxShadow: 'inset 0 0 10px rgba(0,0,0,0.05)',
    pointerEvents: 'none',
  };

  return (
    <div style={{marginTop:'2rem',backgroundColor:'#fff',padding:'2.5rem',borderRadius:'24px',boxShadow:'0 10px 40px rgba(0,0,0,0.05)'}}>

      {/* ── EDIT MODE header ── */}
      {!viewOnly && (
        <>
          <div style={{background:'#f0f9ff',border:'1px solid #e0f2fe',padding:'12px 20px',borderRadius:'16px',marginBottom:'2rem',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12}}>
            <div style={{display:'flex',gap:'25px',alignItems:'center',flexWrap:'wrap'}}>
              {[['drag_pan','Di chuyển: Kéo thả'],['aspect_ratio','Kích thước: Kéo góc'],['edit_square','Sửa: Nháy đúp'],['open_with','Cổng: Kéo ra cạnh kho']].map(([icon,label])=>(
                <div key={icon} style={{display:'flex',alignItems:'center',gap:'6px',color:'#0369a1',fontSize:'0.88rem',fontWeight:600}}>
                  <span className="material-symbols-outlined" style={{fontSize:'18px'}}>{icon}</span> {label}
                </div>
              ))}
            </div>
            <div style={{display:'flex',gap:'20px'}}>
              {[['rgba(14,165,233,0.1)','1.5px dashed #0369a1','Trống'],['rgba(245,158,11,0.1)','1.5px solid #b45309','Đã thuê'],['linear-gradient(135deg,#f59e0b,#d97706)','none','Cổng vào']].map(([bg,border,label])=>(
                <div key={label} style={{display:'flex',gap:6,alignItems:'center'}}>
                  <div style={{width:12,height:12,background:bg,border,borderRadius:'2px'}}/>
                  <span style={{fontSize:'0.8rem',color:'#64748b',fontWeight:500}}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{display:'flex',justifyContent:'space-between',marginBottom:'1.5rem',flexWrap:'wrap',gap:'1rem'}}>
            <div>
              <h2 style={{fontSize:'1.4rem',fontWeight:700,margin:0,color:'#0f172a'}}>Bản đồ Khu vực</h2>
              <div style={{display:'flex',alignItems:'center',gap:'12px',marginTop:'12px',flexWrap:'wrap'}}>
                <span style={{fontSize:'0.9rem',fontWeight:600,color:'#475569'}}>Thu phóng (Zoom):</span>
                <input type="range" min="10" max="80" step="5" value={scale} onChange={e=>setScale(Number(e.target.value))} style={{cursor:'pointer',accentColor:'#0ea5e9'}}/>
                <span style={{fontSize:'0.85rem',color:'#64748b',fontWeight:600}}>Tỷ lệ: 1m = {scale}px</span>
              </div>
            </div>
            <button onClick={openCreateForm} style={{height:'fit-content',padding:'12px 24px',background:'linear-gradient(135deg,#0284c7 0%,#00b2d6 100%)',color:'#fff',borderRadius:'10px',border:'none',cursor:'pointer',fontWeight:'bold',boxShadow:'0 4px 10px rgba(14,165,233,0.3)'}}>
              + Thêm khu vực tự động
            </button>
          </div>
        </>
      )}

      {/* ── VIEW MODE header ── */}
      {viewOnly && (
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem',flexWrap:'wrap',gap:'1rem'}}>
          <div>
            <h2 style={{fontSize:'1.25rem',fontWeight:800,margin:0,color:'#0f172a'}}>Bản đồ Khu vực</h2>
            <p style={{fontSize:'0.82rem',color:'#94a3b8',margin:'4px 0 0',fontStyle:'italic'}}>Chỉ xem — Chỉnh sửa trong trang "Chỉnh sửa kho"</p>
          </div>
          <div style={{display:'flex',gap:'16px',alignItems:'center'}}>
            {[['rgba(14,165,233,0.18)','1.5px dashed #0369a1','Còn trống'],['rgba(245,158,11,0.18)','1.5px solid #b45309','Đã thuê']].map(([bg,border,label])=>(
              <div key={label} style={{display:'flex',gap:6,alignItems:'center'}}>
                <div style={{width:14,height:14,background:bg,border,borderRadius:'3px'}}/>
                <span style={{fontSize:'0.82rem',color:'#475569',fontWeight:600}}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Canvas ── */}
      <div style={{overflowX:'auto',display:'flex',justifyContent:'center',paddingTop:'20px',paddingBottom:'50px'}}>
        <div style={{display:'inline-flex',flexDirection:'column',alignItems:'center'}}>
          {/* Width label */}
          <div style={{fontSize:'0.82rem',fontWeight:700,color:'#475569',marginBottom:6,marginLeft:'54px',letterSpacing:'0.02em'}}>
            Ngang (W): {whW} m
          </div>

          <div style={{display:'flex',alignItems:'center',gap:0}}>
            {/* Length label */}
            <div style={{writingMode:'vertical-lr',transform:'rotate(180deg)',fontSize:'0.82rem',fontWeight:700,color:'#475569',marginRight:8,whiteSpace:'nowrap'}}>
              Dài (L): {whL} m
            </div>

            {/* Canvas wrapper — gate positioned relative to this */}
            <div
              ref={canvasWrapperRef}
              style={{
                position: 'relative',
                width:  `${cw}px`,
                height: `${ch}px`,
                flexShrink: 0,
              }}
            >
              {/* Grid background */}
              <div style={containerStyle}/>

              {/* Areas overlay — same size as canvas, clips to bounds */}
              <div style={{ position:'absolute', top:0, left:0, width:`${cw}px`, height:`${ch}px`, overflow:'hidden' }}>
                {areas.length === 0 && !viewOnly && (
                  <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, textAlign:'center', pointerEvents:'none' }}>
                    <div style={{ fontSize:'0.85rem', fontWeight:700, color:'#94a3b8' }}>Chưa có khu vực nào</div>
                    <div style={{ fontSize:'0.78rem', color:'#cbd5e1', maxWidth:180 }}>Bấm "+ Thêm khu vực tự động" để tạo ô khu đầu tiên</div>
                  </div>
                )}
                {areas.map(a=>{
                  const w=(a.width||10)*scale;
                  const l=(a.length||10)*scale;
                  const x=(a.positionX||0)*scale;
                  const y=(a.positionY||0)*scale;
                  const isLocked=a.status?.toUpperCase()==='RENTED';
                  return (
                    <Rnd
                      key={a.id}
                      size={{width:w,height:l}}
                      position={{x,y}}
                      onDragStop={(e,d)=>handleDragStop(a.id,d)}
                      onResizeStop={(e,dir,ref,delta,position)=>handleResizeStop(a.id,ref,position)}
                      bounds="parent"
                      dragGrid={[scale,scale]}
                      resizeGrid={[scale,scale]}
                      disableDragging={isLocked||viewOnly}
                      enableResizing={!isLocked&&!viewOnly}
                      style={{
                        display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',
                        boxSizing:'border-box',
                        background:isLocked?'rgba(245,158,11,0.15)':'rgba(14,165,233,0.18)',
                        border:isLocked?'2px solid #b45309':'2px dashed #0369a1',
                        borderRadius:'4px',
                        cursor:viewOnly?'default':(isLocked?'not-allowed':'move'),
                        userSelect:'none',
                        boxShadow:'0 4px 8px rgba(0,0,0,0.07)',
                        transition:'background 0.2s',
                      }}
                      onDoubleClick={()=>!viewOnly&&openEditForm(a)}
                      onMouseEnter={e=>{setHoveredAreaId(a.id);if(!isLocked&&!viewOnly)e.currentTarget.style.background='rgba(14,165,233,0.32)';}}
                      onMouseLeave={e=>{setHoveredAreaId(null);if(!isLocked&&!viewOnly)e.currentTarget.style.background='rgba(14,165,233,0.18)';}}
                    >
                      {!viewOnly&&!isLocked&&hoveredAreaId===a.id&&(
                        <button
                          onClick={e=>{e.stopPropagation();handleDelete(a.id);}}
                          style={{position:'absolute',top:4,right:4,width:22,height:22,background:'rgba(220,38,38,0.85)',color:'#fff',border:'none',borderRadius:'50%',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:800,zIndex:10,lineHeight:1,boxShadow:'0 2px 6px rgba(220,38,38,0.4)'}}
                          onMouseEnter={e=>e.currentTarget.style.background='rgba(185,28,28,1)'}
                          onMouseLeave={e=>e.currentTarget.style.background='rgba(220,38,38,0.85)'}
                        >✕</button>
                      )}
                      <div style={{fontWeight:800,color:'#0f172a',fontSize:'0.9rem',textAlign:'center',pointerEvents:'none'}}>
                        {isLocked&&<span className="material-symbols-outlined" style={{fontSize:14,verticalAlign:'middle',marginRight:4}}>lock</span>}
                        {a.name}
                      </div>
                      <div style={{fontSize:'0.75rem',color:'#1e293b',pointerEvents:'none',fontWeight:700}}>{a.size} m³</div>
                      <div style={{fontSize:'0.7rem',color:'#475569',pointerEvents:'none',fontWeight:600,marginTop:'2px',textAlign:'center'}}>{a.width}m × {a.length}m</div>
                    </Rnd>
                  );
                })}
              </div>

              {/* ── Draggable Gate ── */}
              <div
                onMouseDown={handleGateMouseDown}
                onTouchStart={handleGateMouseDown}
                title={viewOnly ? 'Cổng chính vào kho' : 'Kéo để di chuyển cổng vào'}
                style={gateStyle(gatePos, cw, ch, isDraggingGate)}
              >
                CỔNG CHÍNH VÀO KHO
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Edit Form Modal ── */}
      {!viewOnly&&showForm&&(
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(15,23,42,0.6)',backdropFilter:'blur(4px)',zIndex:9999,display:'flex',justifyContent:'center',alignItems:'center'}}>
          <div style={{background:'#fff',padding:'2.5rem',borderRadius:'20px',width:'100%',maxWidth:'550px',boxShadow:'0 25px 50px -12px rgba(0,0,0,0.3)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
              <h3 style={{margin:0,fontSize:'1.4rem',color:'#0f172a'}}>{editingId?'Thông số Thể tích / Diện tích':'Tạo Khối Area Mới'}</h3>
              <span className="material-symbols-outlined" style={{cursor:'pointer',color:'#94a3b8',fontSize:'24px'}} onClick={closeForm}>close</span>
            </div>
            {formError&&<div style={{color:'#b91c1c',background:'#fee2e2',padding:'10px',borderRadius:'8px',marginBottom:'1rem',fontWeight:500}}>{formError}</div>}
            <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:'1.2rem'}}>
              <div>
                <label style={{display:'block',marginBottom:6,fontWeight:700,color:'#475569',fontSize:'0.9rem'}}>Tên khu (VD: Lô 1, Dãy B...)</label>
                <input required name="name" value={formData.name} onChange={handleInputChange} style={{width:'100%',padding:'12px',borderRadius:'8px',border:'1px solid #cbd5e1',outline:'none',fontSize:'1rem'}}/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'16px'}}>
                {[['width','Chiều ngang (m)'],['length','Chiều dọc (m)'],['height','Chiều cao (m)']].map(([name,label])=>(
                  <div key={name}>
                    <label style={{display:'block',marginBottom:6,fontWeight:700,color:'#475569',fontSize:'0.9rem'}}>{label}</label>
                    <input type="number" step="0.1" min="0.1" name={name} value={formData[name]} onChange={handleInputChange} style={{width:'100%',padding:'12px',borderRadius:'8px',border:'1px solid #cbd5e1',outline:'none'}}/>
                  </div>
                ))}
              </div>
              <div>
                <label style={{display:'block',marginBottom:6,fontWeight:700,color:'#475569',fontSize:'0.9rem'}}>
                  Thể tích (m³) <span style={{fontWeight:400,color:'#94a3b8',fontSize:'0.8rem'}}>= ngang × dọc × cao</span>
                </label>
                <input type="number" step="0.1" name="size" value={formData.size} readOnly style={{width:'100%',padding:'12px',borderRadius:'8px',border:'1px solid #e2e8f0',background:'#f8fafc',color:'#64748b',fontWeight:700}}/>
              </div>
              <div>
                <label style={{display:'block',marginBottom:6,fontWeight:700,color:'#475569',fontSize:'0.9rem'}}>Mô tả thêm</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} rows="2" style={{width:'100%',padding:'12px',borderRadius:'8px',border:'1px solid #cbd5e1',outline:'none',resize:'none'}}/>
              </div>
              <div style={{display:'flex',gap:'12px',marginTop:'1rem'}}>
                <button type="submit" disabled={submitLoading} style={{flex:1,padding:'14px',background:'linear-gradient(135deg,#0284c7 0%,#00b2d6 100%)',color:'#fff',border:'none',borderRadius:'10px',fontWeight:700,fontSize:'1rem',cursor:submitLoading?'not-allowed':'pointer',boxShadow:'0 8px 16px rgba(2,132,199,0.25)'}}>
                  {submitLoading?'Đang xử lý...':'Lưu Thay Đổi'}
                </button>
                {editingId&&(
                  <button type="button" onClick={()=>handleDelete(editingId)} style={{padding:'14px 20px',background:'#fee2e2',color:'#b91c1c',border:'none',borderRadius:'10px',fontWeight:700,cursor:'pointer'}}
                    onMouseEnter={e=>e.currentTarget.style.background='#fecaca'}
                    onMouseLeave={e=>e.currentTarget.style.background='#fee2e2'}>
                    Xóa
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RentalAreaManagement;
