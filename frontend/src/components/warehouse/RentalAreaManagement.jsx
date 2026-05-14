import React, { useState, useEffect, useRef, useCallback } from "react";
import { Rnd } from "react-rnd";
import api from "../../services/axiosClient";
import { parseBoundary, buildMaskPath, buildPolygonPoints, getGridDimensions, CELL_SIZE } from "../../utils/polygonUtils";

// ── Auto-generate zones ────────────────────────────────────────────────────
function buildAutoZones(warehouse, zoneW, zoneL, zoneH, existingCount) {
  const whW = warehouse.width || warehouse.Width || 50;
  const whL = warehouse.length || warehouse.Length || 50;
  const zones = [];
  let idx = existingCount + 1;
  for (let y = 0; y + zoneL <= whL + 0.001; y = Math.round((y + zoneL) * 100) / 100) {
    for (let x = 0; x + zoneW <= whW + 0.001; x = Math.round((x + zoneW) * 100) / 100) {
      zones.push({
        name: `Khu ${idx++}`,
        width: zoneW,
        length: zoneL,
        size: Math.round(zoneW * zoneL * zoneH * 100) / 100,
        positionX: x,
        positionY: y,
        description: '',
      });
    }
  }
  return zones;
}

// ── Main Component ─────────────────────────────────────────────────────────
const RentalAreaManagement = ({ warehouseId, viewOnly = false }) => {
  const [areas, setAreas] = useState([]);
  const [warehouse, setWarehouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [hoveredAreaId, setHoveredAreaId] = useState(null);

  // ── Auto-generate modal state ──────────────────────────────────────────
  const [showAutoModal, setShowAutoModal] = useState(false);
  const [autoConfig, setAutoConfig] = useState({ zoneW: '10', zoneL: '10', zoneH: '5' });
  const [autoGenerating, setAutoGenerating] = useState(false);
  const [autoPreview, setAutoPreview] = useState([]);

  // Gate state from DB
  const [gatePos, setGatePos] = useState(null);
  useEffect(() => {
    if (warehouse?.gatePosition) {
      try {
        setGatePos(JSON.parse(warehouse.gatePosition));
      } catch {}
    } else {
      setGatePos(null);
    }
  }, [warehouse?.gatePosition]);

  const canvasWrapperRef = useRef(null);

  // Form data
  const [formData, setFormData] = useState({
    name: '', size: '', description: '',
    width: '10', length: '10', height: '5',
    positionX: '0', positionY: '0',
  });
  const [formError, setFormError] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [whRes, areasRes] = await Promise.all([
        api.get(`/Warehouse/${warehouseId}`),
        api.get(`/RentalAreas/warehouse/${warehouseId}`),
      ]);
      setWarehouse(whRes.data);
      setAreas(areasRes.data || []);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally { setLoading(false); }
  };

  useEffect(() => { if (warehouseId) fetchData(); }, [warehouseId]);



  // ── Validation ─────────────────────────────────────────────────────────
  const isIntersecting = (x1,y1,w1,l1,x2,y2,w2,l2) => {
    const E = 0.2;
    return !(x1+w1<=x2+E || x2+w2<=x1+E || y1+l1<=y2+E || y2+l2<=y1+E);
  };
  const checkOverlap = (excludeId,x,y,w,l) =>
    areas.some(a => a.id!==excludeId && isIntersecting(x,y,w,l,a.positionX||0,a.positionY||0,a.width||10,a.length||10));
  // TotalArea = total volume capacity in m³ (= W × L × H)
  // zone.size is also in m³ → compare directly
  const checkVolumeCapacity = (excludeId, newSize) => {
    const cur = areas.reduce((s,a) => s + (a.id===excludeId ? 0 : (a.size||0)), 0);
    return (cur + newSize) <= (warehouse?.totalArea || 999999);
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
    if (name === 'height') return; // chiều cao cố định theo kho, không cho sửa
    setFormData(prev=>{
      const next={...prev,[name]:value};
      if(['width','length'].includes(name)){
        const w=parseFloat(name==='width'?value:next.width)||0;
        const l=parseFloat(name==='length'?value:next.length)||0;
        const h=parseFloat(next.height)||0;
        next.size=(w*l*h).toFixed(2);
      }
      return next;
    });
  };

  const openCreateForm = () => {
    setFormError(''); setEditingId(null);
    const w=10,l=10,h=5; const {x,y}=findEmptySpot(w,l);
    setFormData({name:`Khu ${areas.length+1}`,size:(w*l*h).toString(),description:'',
      width:w.toString(),length:l.toString(),height:h.toString(),
      positionX:x.toString(),positionY:y.toString()});
    setShowForm(true);
  };

  const openEditForm = (area) => {
    if(viewOnly) return;
    setFormError(''); setEditingId(area.id);
    const w=area.width||10, l=area.length||10;
    const inferredH=(w*l>0&&area.size>0)?parseFloat((area.size/(w*l)).toFixed(2)):5;
    setFormData({name:area.name,size:area.size,description:area.description||'',
      width:w,length:l,height:inferredH,
      positionX:area.positionX||0,positionY:area.positionY||0});
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditingId(null); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setFormError('');
    const parsedSize=parseFloat(formData.size);
    const w=parseFloat(formData.width)||10, l=parseFloat(formData.length)||10;
    const x=parseFloat(formData.positionX)||0, y=parseFloat(formData.positionY)||0;
    if(!checkVolumeCapacity(editingId,parsedSize)){setFormError(`Lỗi sức chứa: Tổng thể tích các khu vượt quá sức chứa kho (${warehouse?.totalArea} m³).`);return;}
    if(checkOverlap(editingId,x,y,w,l)){setFormError('Lỗi vị trí: Khu vực này bị đè lên một khu vực khác đã có.');return;}
    const whW=warehouse?.width||50, whL=warehouse?.length||50;
    if(x+w>whW||y+l>whL){setFormError(`Lỗi kích thước: Tọa độ tràn ra ngoài kho (${whW}m × ${whL}m).`);return;}
    setSubmitLoading(true);
    try {
      const payload={name:formData.name,size:parsedSize,description:formData.description,width:w,length:l,positionX:x,positionY:y};
      if(editingId){ await api.put(`/RentalAreas/${editingId}`,{id:editingId,...payload}); alert('Cập nhật thành công!'); }
      else { await api.post('/RentalAreas',{warehouseId:parseInt(warehouseId),...payload}); alert('Thêm mới thành công!'); }
      closeForm(); fetchData();
    } catch(err){ setFormError(err.response?.data?.error || err.response?.data?.Error || err.response?.data?.message || 'Có lỗi xảy ra'); }
    finally { setSubmitLoading(false); }
  };

  const handleDelete = async (id) => {
    if(window.confirm('Bạn có chắc chắn muốn xóa khu vực này không?')){
      try {
        await api.delete(`/RentalAreas/${id}`);
        closeForm(); fetchData();
      } catch(err) {
        const msg = err.response?.data?.error || err.response?.data?.Error || err.response?.data?.message || 'Lỗi khi xóa khu vực!';
        alert(msg);
      }
    }
  };

  const handleDragStop = async (id,d) => {
    if(viewOnly) return;
    const area=areas.find(a=>a.id===id); if(!area) return;
    if(area.isOccupied){alert('Không thể di chuyển khu vực đang được thuê!');setAreas([...areas]);return;}
    const newX=Math.round((d.x/scale)*10)/10, newY=Math.round((d.y/scale)*10)/10;
    if(checkOverlap(id,newX,newY,area.width||10,area.length||10)){alert('Vị trí không hợp lệ! Bị chạm vào một khu vực khác.');setAreas([...areas]);return;}
    const upd={...area,positionX:newX,positionY:newY};
    setAreas(prev=>prev.map(a=>(a.id===id?upd:a)));
    try{ await api.put(`/RentalAreas/${id}`,upd); } catch(e){ console.error('Auto-save failed',e); }
  };

  const handleResizeStop = async (id,ref,position) => {
    if(viewOnly) return;
    const area=areas.find(a=>a.id===id); if(!area) return;
    if(area.isOccupied){alert('Không thể thay đổi kích thước khu vực đang được thuê!');setAreas([...areas]);return;}
    const newW=Math.round((ref.offsetWidth/scale)*10)/10, newL=Math.round((ref.offsetHeight/scale)*10)/10;
    // derive warehouse height from TotalArea / (W × L) since Height is not a separate DB column
    const derivedH = (warehouse?.totalArea && whW && whL) ? Math.round((warehouse.totalArea / (whW * whL)) * 10) / 10 : 5;
    const newSize=Number((newW*newL*derivedH).toFixed(2));
    const newX=Math.round((position.x/scale)*10)/10, newY=Math.round((position.y/scale)*10)/10;
    if(checkOverlap(id,newX,newY,newW,newL)){alert('Kích thước không hợp lệ! Bị chạm vào một khu vực khác.');setAreas([...areas]);return;}
    if(!checkVolumeCapacity(id,newSize)){alert('Kích thước không hợp lệ! Tổng thể tích vượt quá sức chứa kho.');setAreas([...areas]);return;}
    const upd={...area,width:newW,length:newL,size:newSize,positionX:newX,positionY:newY};
    setAreas(prev=>prev.map(a=>(a.id===id?upd:a)));
    try{ await api.put(`/RentalAreas/${id}`,upd); } catch(e){ console.error('Auto-save failed',e); }
  };

  // ── Auto-generate handlers ──────────────────────────────────────────────
  const openAutoModal = () => {
    const wh = warehouse;
    if (!wh) return;
    const w = parseFloat(wh.width ?? wh.Width ?? 0) || 0;
    const l = parseFloat(wh.length ?? wh.Length ?? 0) || 0;
    if (!w || !l) {
      alert('Kho chưa có thông tin chiều rộng/dài. Vui lòng lưu thông tin kho với đầy đủ Chiều rộng và Chiều dài trước.');
      return;
    }
    // Derive height from TotalArea (m³) / floor area (m²) since no Height column in DB
    const derivedH = (wh.totalArea && w && l) ? Math.round((wh.totalArea / (w * l)) * 10) / 10 : 5;
    const defaultZoneW = Math.min(w, parseFloat((w / 2).toFixed(1)));
    const defaultZoneL = Math.min(l, parseFloat((l / 3).toFixed(1)));
    setAutoConfig({
      zoneW: defaultZoneW.toString(),
      zoneL: defaultZoneL.toString(),
      zoneH: derivedH.toString(),
    });
    setShowAutoModal(true);
  };

  // Rebuild preview whenever config changes
  useEffect(() => {
    if (!showAutoModal || !warehouse) return;
    const w = parseFloat(autoConfig.zoneW) || 0;
    const l = parseFloat(autoConfig.zoneL) || 0;
    const h = parseFloat(autoConfig.zoneH) || 0;
    if (w <= 0 || l <= 0 || h <= 0) { setAutoPreview([]); return; }
    setAutoPreview(buildAutoZones(warehouse, w, l, h, areas.length));
  }, [autoConfig, showAutoModal, warehouse, areas.length]);

  const handleAutoConfigChange = (e) => {
    const { name, value } = e.target;
    setAutoConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleAutoGenerate = async () => {
    if (autoPreview.length === 0) return;
    setAutoGenerating(true);
    try {
      for (const zone of autoPreview) {
        await api.post('/RentalAreas', {
          warehouseId: parseInt(warehouseId),
          name: zone.name,
          width: zone.width,
          length: zone.length,
          size: zone.size,
          positionX: zone.positionX,
          positionY: zone.positionY,
          description: zone.description,
        });
      }
      setShowAutoModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.Error || err.response?.data?.message || 'Lỗi khi tạo ô khu vực!');
    } finally { setAutoGenerating(false); }
  };

  // ── Render ──────────────────────────────────────────────────────────────
  if(loading) return <p style={{color:'#64748b'}}>Đang tải sơ đồ 2D...</p>;

  // ── Boundary polygon (from BoundaryPoints JSON) ──────────────────────────
  const boundary = parseBoundary(warehouse?.boundaryPoints);

  let whW = 0;
  let whL = 0;

  if (boundary && boundary.length >= 3) {
    const { cols, rows } = getGridDimensions(boundary);
    whW = cols * CELL_SIZE;  // each grid cell = 0.5m
    whL = rows * CELL_SIZE;
  } else {
    whW = parseFloat(warehouse?.width ?? warehouse?.Width ?? 0) || 0;
    whL = parseFloat(warehouse?.length ?? warehouse?.Length ?? 0) || 0;
    if (!whW || !whL) {
      const area = parseFloat(warehouse?.totalArea ?? 0);
      if (area > 0) {
        whW = Math.ceil(Math.sqrt(area));
        whL = Math.ceil(area / whW);
      }
    }
  }    

  // Cố định kích thước khung để vừa vặn trong cột bên phải
  const scaleW = Math.floor(200 / (whW || 50));
  const scaleH = Math.floor(260 / (whL || 50));
  const scale = Math.max(2, Math.min(scaleW, scaleH));

  const whH = (warehouse?.height ?? warehouse?.Height) ? parseFloat(warehouse?.height ?? warehouse?.Height) : 0;
  const cw=whW*scale, ch=whL*scale;
  const cellPx = scale * CELL_SIZE;

  // Guard: still no usable dimensions
  if (!whW || !whL) {
    return (
      <div style={{marginTop:'2rem',backgroundColor:'#fff',padding:'2.5rem',borderRadius:'24px',boxShadow:'0 10px 40px rgba(0,0,0,0.05)'}}>
        <div style={{background:'linear-gradient(135deg,#fffbeb,#fef3c7)',border:'2px solid #f59e0b',borderRadius:'16px',padding:'2rem',textAlign:'center'}}>
          <span className="material-symbols-outlined" style={{fontSize:'2.5rem',color:'#d97706',display:'block',marginBottom:'1rem'}}>info</span>
          <h3 style={{margin:'0 0 0.5rem',color:'#92400e',fontSize:'1.1rem',fontWeight:800}}>Chưa có thông tin kích thước kho</h3>
          <p style={{margin:0,color:'#b45309',fontSize:'0.9rem',lineHeight:1.6}}>
            Vui lòng lưu thông tin kho với <strong>Diện tích sàn</strong> hợp lệ hoặc vẽ <strong>sơ đồ kho</strong> trước khi tạo sơ đồ khu vực.
          </p>
        </div>
      </div>
    );
  }


  const containerStyle = {
    position:'absolute', top:0, left:0,
    width:`${cw}px`, height:`${ch}px`,
    backgroundColor:'#f8fafc',
    backgroundImage:'linear-gradient(#e2e8f0 1px,transparent 1px),linear-gradient(90deg,#e2e8f0 1px,transparent 1px)',
    backgroundSize:`${scale/2}px ${scale/2}px`,
    border:'3px solid #64748b', borderRadius:'8px',
    boxShadow:'inset 0 0 10px rgba(0,0,0,0.05)',
    pointerEvents:'none',
  };

  return (
    <div style={{marginTop:'2rem',backgroundColor:'#fff',padding:'2.5rem',borderRadius:'24px',boxShadow:'0 10px 40px rgba(0,0,0,0.05)'}}>

      {/* ── EDIT MODE header ── */}
      {!viewOnly && (
        <>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:'1.5rem',flexWrap:'wrap',gap:'1rem'}}>
            <div>
              <h2 style={{fontSize:'1.4rem',fontWeight:700,margin:0,color:'#0f172a'}}>Bản đồ Khu vực</h2>
              <div style={{display:'flex',alignItems:'center',gap:'12px',marginTop:'12px',flexWrap:'wrap'}}>
                <span style={{fontSize:'0.85rem',color:'#64748b',fontWeight:600}}>Tỷ lệ hiển thị: 1m = {scale}px</span>
                <span style={{fontSize:'0.78rem',color:'#94a3b8',fontStyle:'italic',marginLeft:8}}>📐 Mỗi ô lưới = 0.5m × 0.5m</span>
              </div>
            </div>
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
            <span style={{fontSize:'0.75rem',color:'#94a3b8',fontStyle:'italic',marginRight:4}}>📐 Mỗi ô = 0.5m × 0.5m</span>
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
      <div style={{overflowX:'hidden',display:'flex',justifyContent:'center',paddingTop:'20px',paddingBottom:'50px'}}>
        <div style={{display:'inline-flex',flexDirection:'column',alignItems:'center'}}>
          <div style={{fontSize:'0.82rem',fontWeight:700,color:'#475569',marginBottom:6,marginLeft:'54px',letterSpacing:'0.02em'}}>
            Ngang (W): {whW} m
          </div>
          <div style={{display:'flex',alignItems:'center',gap:0}}>
            <div style={{writingMode:'vertical-lr',transform:'rotate(180deg)',fontSize:'0.82rem',fontWeight:700,color:'#475569',marginRight:8,whiteSpace:'nowrap'}}>
              Dài (L): {whL} m
            </div>
            <div ref={canvasWrapperRef} style={{position:'relative',width:`${cw}px`,height:`${ch}px`,flexShrink:0}}>
              <div style={containerStyle}/>

              {/* ── Boundary polygon mask overlay (visual only, no booking impact) ── */}
              {boundary && (
                <svg style={{
                  position:'absolute', top:0, left:0,
                  width:cw, height:ch,
                  pointerEvents:'none',
                  zIndex:10,
                  overflow:'visible',
                }}>
                  {/* Grey-out outside boundary using SVG evenodd fill rule */}
                  <path
                    fillRule="evenodd"
                    fill="rgba(100,116,139,0.45)"
                    d={buildMaskPath(boundary, cw, ch, cellPx)}
                  />
                  {/* Boundary outline — blue dashed */}
                  <polygon
                    points={buildPolygonPoints(boundary, cw, ch, cellPx)}
                    fill="none"
                    stroke="#0095c7"
                    strokeWidth={2}
                    strokeDasharray="6 3"
                  />
                </svg>
              )}

              <div style={{position:'absolute',top:0,left:0,width:`${cw}px`,height:`${ch}px`,overflow:'hidden'}}>

                {areas.map(a=>{
                  const w=(a.width||10)*scale;
                  const l=(a.length||10)*scale;
                  const x=(a.positionX||0)*scale;
                  const y=(a.positionY||0)*scale;
                  // isOccupied from DTO (backend field)
                  const isLocked = a.isOccupied === true;
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
              {/* Gate */}
              {gatePos && (gatePos.gx !== undefined || gatePos.px !== undefined) && (
                <div style={{
                  position: 'absolute',
                  left: gatePos.gx !== undefined ? `${(gatePos.gx * 0.5) * scale}px` : `${gatePos.px * cw}px`,
                  top: gatePos.gy !== undefined ? `${(gatePos.gy * 0.5) * scale}px` : `${gatePos.py * ch}px`,
                  transform: `translate(-50%, -50%) rotate(${gatePos.angle || 0}deg)`,
                  background: 'linear-gradient(135deg,#f59e0b,#d97706)',
                  color: '#fff',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  letterSpacing: '0.5px',
                  boxShadow: '0 4px 10px rgba(245,158,11,0.4)',
                  border: '1.5px solid #fff',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  zIndex: 20
                }}>
                  CỔNG CHÍNH VÀO KHO
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Zone list table (all zones, including out-of-bounds) ── */}
      {!viewOnly && areas.length > 0 && (
        <div style={{marginTop:'1.5rem',background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'16px',padding:'1.2rem'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
            <h4 style={{margin:0,fontSize:'1rem',fontWeight:700,color:'#0f172a'}}>
              Tất cả Khu cho thuê ({areas.length})
            </h4>
            <span style={{fontSize:'0.8rem',color:'#94a3b8'}}>Nhấn ✕ để xóa, nháy đúp trên bản đồ để sửa</span>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:'10px'}}>
            {areas.map(a => {
              const isLocked = a.isOccupied === true;
              const outOfBounds = (a.positionX||0)+(a.width||0) > whW || (a.positionY||0)+(a.length||0) > whL;
              return (
                <div key={a.id} style={{
                  background:'#fff',border:`1.5px solid ${isLocked?'#f59e0b':outOfBounds?'#f43f5e':'#e2e8f0'}`,
                  borderRadius:'10px',padding:'12px 14px',position:'relative',
                  boxShadow:'0 1px 4px rgba(0,0,0,0.06)'
                }}>
                  {!isLocked && (
                    <button
                      onClick={() => handleDelete(a.id)}
                      title="Xóa khu vực này"
                      style={{position:'absolute',top:8,right:8,width:22,height:22,background:'rgba(220,38,38,0.85)',color:'#fff',border:'none',borderRadius:'50%',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:800,lineHeight:1,boxShadow:'0 2px 4px rgba(220,38,38,0.3)'}}
                      onMouseEnter={e=>e.currentTarget.style.background='rgba(185,28,28,1)'}
                      onMouseLeave={e=>e.currentTarget.style.background='rgba(220,38,38,0.85)'}
                    >✕</button>
                  )}
                  <div style={{fontWeight:700,color:'#0f172a',fontSize:'0.92rem',paddingRight:26}}>
                    {a.name}
                    {isLocked && <span style={{marginLeft:6,fontSize:'0.75rem',background:'#fef3c7',color:'#92400e',borderRadius:'4px',padding:'1px 6px',fontWeight:600}}>Đang thuê</span>}
                    {outOfBounds && !isLocked && <span style={{marginLeft:6,fontSize:'0.75rem',background:'#ffe4e6',color:'#be123c',borderRadius:'4px',padding:'1px 6px',fontWeight:600}}>Ngoài biên</span>}
                  </div>
                  <div style={{fontSize:'0.8rem',color:'#64748b',marginTop:4}}>
                    Thể tích: <strong>{a.size} m³</strong>
                  </div>
                  <div style={{fontSize:'0.8rem',color:'#94a3b8'}}>
                    Kích thước: {a.width}m × {a.length}m
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Edit / Create Form Modal ── */}
      {!viewOnly&&showForm&&(
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(15,23,42,0.6)',backdropFilter:'blur(4px)',zIndex:9999,display:'flex',justifyContent:'center',alignItems:'center',padding:'1rem'}}>
          <div style={{background:'#fff',padding:'2rem',borderRadius:'20px',width:'100%',maxWidth:'720px',boxShadow:'0 25px 50px -12px rgba(0,0,0,0.3)',maxHeight:'92vh',overflowY:'auto'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.2rem'}}>
              <h3 style={{margin:0,fontSize:'1.3rem',color:'#0f172a'}}>{editingId?'Chỉnh sửa ô khu':'Tạo ô khu mới'}</h3>
              <span className="material-symbols-outlined" style={{cursor:'pointer',color:'#94a3b8',fontSize:'24px'}} onClick={closeForm}>close</span>
            </div>
            {formError&&<div style={{color:'#b91c1c',background:'#fee2e2',padding:'10px',borderRadius:'8px',marginBottom:'1rem',fontWeight:500}}>{formError}</div>}
            <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
              {/* Tên khu */}
              <div>
                <label style={{display:'block',marginBottom:5,fontWeight:700,color:'#475569',fontSize:'0.88rem'}}>Tên khu (VD: Lô 1, Dãy B...)</label>
                <input required name="name" value={formData.name} onChange={handleInputChange}
                  style={{width:'100%',padding:'10px 12px',borderRadius:'8px',border:'1px solid #cbd5e1',outline:'none',fontSize:'0.95rem',boxSizing:'border-box'}}/>
              </div>

              {/* Layout 2 cột */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem',alignItems:'start'}}>
                {/* Cột trái — inputs */}
                <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>

                  {/* Kích thước: Ngang + Dọc editable, Cao readonly */}
                  <div>
                    <label style={{display:'block',marginBottom:6,fontWeight:700,color:'#334155',fontSize:'0.85rem'}}>Kích thước ô khu</label>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px',alignItems:'flex-end'}}>
                      {/* Ngang */}
                      <div>
                        <label style={{display:'block',marginBottom:4,fontSize:'0.78rem',fontWeight:600,color:'#64748b'}}>Ngang (m)</label>
                        <input type="number" step="0.5" min="0.5" name="width" value={formData.width} onChange={handleInputChange}
                          style={{width:'100%',padding:'8px 10px',borderRadius:'7px',border:'1px solid #cbd5e1',outline:'none',fontSize:'0.9rem',boxSizing:'border-box'}}/>
                      </div>
                      {/* Dọc */}
                      <div>
                        <label style={{display:'block',marginBottom:4,fontSize:'0.78rem',fontWeight:600,color:'#64748b'}}>Dọc (m)</label>
                        <input type="number" step="0.5" min="0.5" name="length" value={formData.length} onChange={handleInputChange}
                          style={{width:'100%',padding:'8px 10px',borderRadius:'7px',border:'1px solid #cbd5e1',outline:'none',fontSize:'0.9rem',boxSizing:'border-box'}}/>
                      </div>
                      {/* Cao — READONLY, locked to warehouse height */}
                      <div>
                        <label style={{display:'block',marginBottom:4,fontSize:'0.78rem',fontWeight:600,color:'#94a3b8',whiteSpace:'nowrap'}}>
                          Cao (m) <span style={{fontSize:'0.66rem',color:'#cbd5e1'}}>— cố định</span>
                        </label>
                        <input type="number" name="height" value={formData.height} readOnly
                          style={{width:'100%',padding:'8px 10px',borderRadius:'7px',border:'1px solid #e2e8f0',
                            outline:'none',fontSize:'0.9rem',boxSizing:'border-box',
                            background:'#f8fafc',color:'#94a3b8',cursor:'not-allowed'}}/>
                      </div>
                    </div>
                    <div style={{marginTop:6,fontSize:'0.73rem',color:'#94a3b8',fontStyle:'italic'}}>
                      Chiều cao được cố định theo chiều cao kho đã đăng ký ({whH} m) — kéo thả trên sơ đồ để thay đổi ngang/dọc.
                    </div>
                  </div>

                  {/* Thể tích badge */}
                  <div style={{background:'#f0f9ff',border:'1px solid #bae6fd',borderRadius:'10px',padding:'10px 14px',display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
                    <span style={{fontWeight:700,color:'#0369a1',fontSize:'0.85rem'}}>Thể tích:</span>
                    <span style={{fontWeight:800,color:'#0f172a',fontSize:'1.1rem'}}>{formData.size} m³</span>
                    <span style={{fontSize:'0.74rem',color:'#64748b'}}>=&nbsp;{formData.width}&nbsp;×&nbsp;{formData.length}&nbsp;×&nbsp;{formData.height}</span>
                  </div>

                  {/* Vị trí X/Y + auto-find */}
                  <div style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'10px',padding:'12px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                      <label style={{fontWeight:700,color:'#334155',fontSize:'0.85rem'}}>Vị trí (m)</label>
                      <button type="button"
                        onClick={()=>{
                          const w=parseFloat(formData.width)||10;
                          const l=parseFloat(formData.length)||10;
                          const spot=findEmptySpot(w,l);
                          setFormData(prev=>({...prev,positionX:spot.x.toString(),positionY:spot.y.toString()}));
                        }}
                        style={{padding:'4px 10px',background:'linear-gradient(135deg,#059669,#10b981)',color:'#fff',
                          border:'none',borderRadius:'6px',fontWeight:700,fontSize:'0.74rem',cursor:'pointer',
                          boxShadow:'0 2px 6px rgba(5,150,105,0.3)',whiteSpace:'nowrap'}}
                      >
                        ↳ Ô trống tiếp theo
                      </button>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                      {[['positionX','X — từ trái (m)'],['positionY','Y — từ trên (m)']].map(([name,label])=>(
                        <div key={name}>
                          <label style={{display:'block',marginBottom:4,fontSize:'0.78rem',fontWeight:600,color:'#64748b'}}>{label}</label>
                          <input type="number" step="0.5" min="0" name={name} value={formData[name]} onChange={handleInputChange}
                            style={{width:'100%',padding:'8px 10px',borderRadius:'7px',border:'1px solid #cbd5e1',outline:'none',fontSize:'0.9rem',boxSizing:'border-box'}}/>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mô tả */}
                  <div>
                    <label style={{display:'block',marginBottom:5,fontWeight:700,color:'#475569',fontSize:'0.88rem'}}>Mô tả thêm</label>
                    <textarea name="description" value={formData.description} onChange={handleInputChange} rows="2"
                      style={{width:'100%',padding:'10px 12px',borderRadius:'8px',border:'1px solid #cbd5e1',outline:'none',resize:'none',boxSizing:'border-box',fontSize:'0.88rem'}}/>
                  </div>
                </div>

                {/* Cột phải — interactive mini floor plan */}
                {whW>0&&whL>0&&(()=>{
                  const px  = Math.max(0, parseFloat(formData.positionX) || 0);
                  const py  = Math.max(0, parseFloat(formData.positionY) || 0);
                  const fw  = Math.max(0.5, parseFloat(formData.width)  || 10);
                  const fl  = Math.max(0.5, parseFloat(formData.length) || 10);
                  const fh  = parseFloat(formData.height) || whH || 5;
                  const PREV_MAX = 260;
                  const sc = Math.min(PREV_MAX / whW, (PREV_MAX * 1.5) / whL);
                  const cW = Math.round(whW * sc);
                  const cH = Math.round(whL * sc);
                  const SNAP = 0.5; // snap grid in metres
                  const gridPx = SNAP * sc;

                  const overlap      = checkOverlap(editingId, px, py, fw, fl);
                  const outOfBounds  = px + fw > whW || py + fl > whL;
                  const isErr        = overlap || outOfBounds;

                  // Called when user finishes dragging the new zone in preview
                  const onPreviewDragStop = (_e, d) => {
                    const newX = Math.round(Math.max(0, Math.min(d.x / sc, whW - fw)) / SNAP) * SNAP;
                    const newY = Math.round(Math.max(0, Math.min(d.y / sc, whL - fl)) / SNAP) * SNAP;
                    setFormData(prev => ({ ...prev, positionX: newX.toString(), positionY: newY.toString() }));
                  };

                  // Called while dragging (live feedback)
                  const onPreviewDrag = (_e, d) => {
                    const newX = Math.round(Math.max(0, Math.min(d.x / sc, whW - fw)) / SNAP) * SNAP;
                    const newY = Math.round(Math.max(0, Math.min(d.y / sc, whL - fl)) / SNAP) * SNAP;
                    setFormData(prev => ({ ...prev, positionX: newX.toString(), positionY: newY.toString() }));
                  };

                  // Called when user finishes resizing
                  const onPreviewResizeStop = (_e, _dir, ref, _delta, pos) => {
                    const newW = Math.round(Math.max(0.5, ref.offsetWidth  / sc) / SNAP) * SNAP;
                    const newL = Math.round(Math.max(0.5, ref.offsetHeight / sc) / SNAP) * SNAP;
                    const newX = Math.round(Math.max(0, pos.x / sc) / SNAP) * SNAP;
                    const newY = Math.round(Math.max(0, pos.y / sc) / SNAP) * SNAP;
                    const newSize = Number((newW * newL * fh).toFixed(2));
                    setFormData(prev => ({
                      ...prev,
                      width:     newW.toString(),
                      length:    newL.toString(),
                      size:      newSize.toString(),
                      positionX: newX.toString(),
                      positionY: newY.toString(),
                    }));
                  };

                  // Called while resizing (live feedback)
                  const onPreviewResize = (_e, _dir, ref, _delta, pos) => {
                    const newW = Math.round(Math.max(0.5, ref.offsetWidth  / sc) / SNAP) * SNAP;
                    const newL = Math.round(Math.max(0.5, ref.offsetHeight / sc) / SNAP) * SNAP;
                    const newX = Math.round(Math.max(0, pos.x / sc) / SNAP) * SNAP;
                    const newY = Math.round(Math.max(0, pos.y / sc) / SNAP) * SNAP;
                    const newSize = Number((newW * newL * fh).toFixed(2));
                    setFormData(prev => ({
                      ...prev,
                      width:     newW.toString(),
                      length:    newL.toString(),
                      size:      newSize.toString(),
                      positionX: newX.toString(),
                      positionY: newY.toString(),
                    }));
                  };

                  return (
                    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8}}>
                      <div style={{fontWeight:700,color:'#334155',fontSize:'0.83rem',alignSelf:'flex-start'}}>
                        Kéo & resize trực tiếp trên sơ đồ
                      </div>
                      <div style={{fontSize:'0.7rem',color:'#64748b',alignSelf:'flex-start',marginTop:-6}}>
                        Kéo ô xanh để di chuyển · Kéo góc/cạnh để thay đổi kích thước
                      </div>
                      {/* Canvas */}
                      <div style={{
                        position:'relative', width:cW, height:cH,
                        background:'#f0f7ff', border:'2px solid #3b82f6', borderRadius:8,
                        overflow:'hidden', flexShrink:0,
                        backgroundImage:'linear-gradient(rgba(59,130,246,0.08) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,0.08) 1px,transparent 1px)',
                        backgroundSize:`${Math.max(gridPx,6)}px ${Math.max(gridPx,6)}px`,
                        userSelect:'none',
                      }}>
                        {/* Static existing zones */}
                        {areas.map(a => {
                          if (a.id === editingId) return null;
                          const aw = Math.max((a.width  || 1) * sc, 4);
                          const al = Math.max((a.length || 1) * sc, 4);
                          return (
                            <div key={a.id} title={a.name} style={{
                              position:'absolute',
                              left:`${(a.positionX||0)*sc}px`, top:`${(a.positionY||0)*sc}px`,
                              width:`${aw}px`, height:`${al}px`,
                              background: a.isOccupied ? 'rgba(245,158,11,0.28)' : 'rgba(14,165,233,0.22)',
                              border: a.isOccupied ? '1.5px solid #b45309' : '1.5px dashed #0369a1',
                              borderRadius:2, boxSizing:'border-box',
                              display:'flex', alignItems:'center', justifyContent:'center',
                              fontSize:'0.46rem', fontWeight:700, color:'#1e293b', overflow:'hidden',
                              pointerEvents:'none',
                            }}>
                              {aw > 18 && al > 10 ? a.name : ''}
                            </div>
                          );
                        })}
                        {/* Interactive new zone via Rnd */}
                        <Rnd
                          size={{ width: Math.max(fw * sc, 12), height: Math.max(fl * sc, 12) }}
                          position={{ x: px * sc, y: py * sc }}
                          onDrag={onPreviewDrag}
                          onDragStop={onPreviewDragStop}
                          onResize={onPreviewResize}
                          onResizeStop={onPreviewResizeStop}
                          bounds="parent"
                          dragGrid={[gridPx, gridPx]}
                          resizeGrid={[gridPx, gridPx]}
                          minWidth={gridPx}
                          minHeight={gridPx}
                          style={{
                            background: isErr ? 'rgba(220,38,38,0.28)' : 'rgba(5,150,105,0.32)',
                            border: isErr ? '2px solid #dc2626' : '2px solid #059669',
                            borderRadius:3, boxSizing:'border-box',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            fontSize:'0.5rem', fontWeight:800,
                            color: isErr ? '#991b1b' : '#065f46',
                            zIndex:2, overflow:'hidden',
                            cursor:'move',
                          }}
                          enableResizing={{
                            top:true, right:true, bottom:true, left:true,
                            topRight:true, topLeft:true, bottomRight:true, bottomLeft:true,
                          }}
                        >
                          <div style={{pointerEvents:'none',textAlign:'center',padding:'0 2px',overflow:'hidden',whiteSpace:'nowrap'}}>
                            {fw * sc > 22 && fl * sc > 13 ? (formData.name || 'Mới') : ''}
                          </div>
                        </Rnd>
                      </div>
                      {/* Labels */}
                      <div style={{fontSize:'0.7rem',color:'#94a3b8',fontWeight:600}}>
                        {whW}m × {whL}m &nbsp;|&nbsp; Snap: 0.5m
                      </div>
                      {/* Live size readout */}
                      <div style={{fontSize:'0.78rem',fontWeight:700,color:'#334155'}}>
                        {formData.width}m × {formData.length}m @ ({formData.positionX}, {formData.positionY})
                      </div>
                      {/* Validity */}
                      {isErr ? (
                        <div style={{background:'#fee2e2',border:'1px solid #fca5a5',borderRadius:'8px',
                          padding:'5px 12px',fontSize:'0.76rem',color:'#dc2626',fontWeight:700,textAlign:'center'}}>
                          {outOfBounds ? '⚠ Tràn ra ngoài kho' : '⚠ Đè lên khu khác'}
                        </div>
                      ) : (
                        <div style={{background:'#dcfce7',border:'1px solid #86efac',borderRadius:'8px',
                          padding:'5px 12px',fontSize:'0.76rem',color:'#15803d',fontWeight:700}}>
                          ✓ Vị trí hợp lệ
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div style={{display:'flex',gap:'12px',marginTop:'0.5rem'}}>
                <button type="submit" disabled={submitLoading}
                  style={{flex:1,padding:'13px',background:'linear-gradient(135deg,#0284c7 0%,#00b2d6 100%)',
                    color:'#fff',border:'none',borderRadius:'10px',fontWeight:700,fontSize:'1rem',
                    cursor:submitLoading?'not-allowed':'pointer',boxShadow:'0 8px 16px rgba(2,132,199,0.25)'}}>
                  {submitLoading?'Đang xử lý...':'Lưu Thay Đổi'}
                </button>
                {editingId&&(
                  <button type="button" onClick={()=>handleDelete(editingId)}
                    style={{padding:'13px 20px',background:'#fee2e2',color:'#b91c1c',border:'none',borderRadius:'10px',fontWeight:700,cursor:'pointer'}}
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

      {/* ── Auto-Generate Modal ── */}
      {!viewOnly&&showAutoModal&&(
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(15,23,42,0.65)',backdropFilter:'blur(4px)',zIndex:9999,display:'flex',justifyContent:'center',alignItems:'center',padding:'1rem'}}>
          <div style={{background:'#fff',padding:'2.5rem',borderRadius:'20px',width:'100%',maxWidth:'640px',boxShadow:'0 25px 50px -12px rgba(0,0,0,0.3)',maxHeight:'90vh',overflowY:'auto'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
              <div>
                <h3 style={{margin:0,fontSize:'1.4rem',color:'#0f172a'}}>Tạo sơ đồ tự động</h3>
                <p style={{margin:'4px 0 0',fontSize:'0.85rem',color:'#64748b'}}>
                  Kho: {whW}m × {whL}m × {whH}m = <strong>{whW*whL*whH} m³</strong>
                </p>
              </div>
              <span className="material-symbols-outlined" style={{cursor:'pointer',color:'#94a3b8',fontSize:'24px'}} onClick={()=>setShowAutoModal(false)}>close</span>
            </div>

            {/* Config inputs */}
            <div style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'12px',padding:'1.2rem',marginBottom:'1.5rem'}}>
              <p style={{margin:'0 0 1rem',fontWeight:700,color:'#334155',fontSize:'0.95rem'}}>Kích thước mỗi ô khu</p>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'12px'}}>
                {[['zoneW','Chiều ngang (m)',whW],['zoneL','Chiều dọc (m)',whL],['zoneH','Chiều cao (m)',whH]].map(([name,label,max])=>(
                  <div key={name}>
                    <label style={{display:'block',marginBottom:5,fontWeight:600,color:'#475569',fontSize:'0.85rem'}}>{label}</label>
                    <input
                      type="number" step="0.5" min="0.5" max={max}
                      name={name} value={autoConfig[name]}
                      onChange={handleAutoConfigChange}
                      style={{width:'100%',padding:'10px',borderRadius:'8px',border:'1px solid #cbd5e1',outline:'none',fontSize:'0.95rem'}}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:'12px',padding:'1.2rem',marginBottom:'1.5rem'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8}}>
                <div style={{fontWeight:700,color:'#166534',fontSize:'0.95rem'}}>
                  Preview: <span style={{color:'#15803d'}}>{autoPreview.length} ô khu</span>
                </div>
                {autoPreview.length > 0 && (
                  <div style={{fontSize:'0.82rem',color:'#166534',fontWeight:600}}>
                    Mỗi ô: {autoConfig.zoneW}m × {autoConfig.zoneL}m × {autoConfig.zoneH}m =&nbsp;
                    <strong>{(parseFloat(autoConfig.zoneW)||0)*(parseFloat(autoConfig.zoneL)||0)*(parseFloat(autoConfig.zoneH)||0)} m³</strong>
                  </div>
                )}
              </div>
              {autoPreview.length === 0 && (
                <p style={{margin:'8px 0 0',fontSize:'0.82rem',color:'#6b7280'}}>Kích thước ô vượt quá kho hoặc không hợp lệ.</p>
              )}
              {autoPreview.length > 0 && (
                <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:'10px'}}>
                  {autoPreview.map((z,i)=>(
                    <div key={i} style={{background:'rgba(14,165,233,0.12)',border:'1px dashed #0369a1',borderRadius:'6px',padding:'4px 8px',fontSize:'0.78rem',fontWeight:600,color:'#0f172a'}}>
                      {z.name}
                      <span style={{color:'#64748b',fontWeight:400,marginLeft:4}}>({z.positionX},{z.positionY})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{background:'#fffbeb',border:'1px solid #fde68a',borderRadius:'10px',padding:'10px 14px',marginBottom:'1.5rem',fontSize:'0.82rem',color:'#92400e'}}>
              Sau khi tạo, bạn vẫn có thể <strong>nháy đúp</strong> vào từng ô để sửa kích thước tùy ý, hoặc <strong>kéo góc</strong> để resize trực tiếp.
            </div>

            <div style={{display:'flex',gap:'12px'}}>
              <button
                onClick={handleAutoGenerate}
                disabled={autoGenerating||autoPreview.length===0}
                style={{flex:1,padding:'14px',background:autoPreview.length===0?'#e2e8f0':'linear-gradient(135deg,#7c3aed 0%,#a855f7 100%)',color:autoPreview.length===0?'#94a3b8':'#fff',border:'none',borderRadius:'10px',fontWeight:700,fontSize:'1rem',cursor:autoGenerating||autoPreview.length===0?'not-allowed':'pointer',boxShadow:autoPreview.length>0?'0 8px 16px rgba(124,58,237,0.25)':'none'}}
              >
                {autoGenerating?'Đang tạo...':`Xác nhận tạo ${autoPreview.length} ô`}
              </button>
              <button
                onClick={()=>setShowAutoModal(false)}
                style={{padding:'14px 24px',background:'#f1f5f9',color:'#475569',border:'none',borderRadius:'10px',fontWeight:700,cursor:'pointer'}}
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RentalAreaManagement;
