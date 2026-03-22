import React, { useState, useEffect } from "react";
import { Rnd } from "react-rnd";
import api from "../../services/axiosClient";

const RentalAreaManagement = ({ warehouseId }) => {
  const [scale, setScale] = useState(10); // Minimum default zoom
  const [areas, setAreas] = useState([]);
  const [warehouse, setWarehouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    size: "",
    description: "",
    width: "10",
    length: "10",
    positionX: "0",
    positionY: "0"
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

  useEffect(() => {
    if (warehouseId) {
      fetchData();
    }
  }, [warehouseId]);

  // -------- VALIDATION LOGIC --------

  // 1. Overlap Prevention Function
  const isIntersecting = (x1, y1, w1, l1, x2, y2, w2, l2) => {
    // Basic 2D AABB collision detection with a relaxed EPSILON (0.2m) to forgive small legacy database overlaps and float errors
    const EPSILON = 0.2;
    return !(
      x1 + w1 <= x2 + EPSILON || // R1 is left of R2
      x2 + w2 <= x1 + EPSILON || // R2 is left of R1
      y1 + l1 <= y2 + EPSILON || // R1 is above R2
      y2 + l2 <= y1 + EPSILON    // R2 is above R1
    );
  };

  const checkOverlap = (excludeId, x, y, w, l) => {
    return areas.some(a => {
      if (a.id === excludeId) return false;
      return isIntersecting(
        x, y, w, l,
        a.positionX || 0, a.positionY || 0, a.width || 10, a.length || 10
      );
    });
  };

  // 2. Capacity Validation Function
  const checkCapacity = (excludeId, newAreaSize) => {
    const currentTotal = areas.reduce((sum, a) => sum + (a.id === excludeId ? 0 : a.size), 0);
    const maxArea = warehouse?.totalArea || 0;
    return (currentTotal + newAreaSize) <= maxArea;
  };

  // 3. Smart Assistance - optimal placement
  const findEmptySpot = (w, l) => {
    const whW = warehouse?.width || 50;
    const whL = warehouse?.length || 50;
    
    // Scan grid in steps of 1 meter
    for (let y = 0; y <= whL - l; y += 1) {
      for (let x = 0; x <= whW - w; x += 1) {
        if (!checkOverlap(null, x, y, w, l)) {
          return { x, y };
        }
      }
    }
    return { x: 0, y: 0 }; // Fallback
  };

  // -------- EVENT HANDLERS --------

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      if (name === "width" || name === "length") {
        const w = parseFloat(name === "width" ? value : next.width) || 0;
        const l = parseFloat(name === "length" ? value : next.length) || 0;
        next.size = (w * l).toFixed(2);
      }
      return next;
    });
  };

  const openCreateForm = () => {
    setFormError("");
    setEditingId(null);
    const w = 10, l = 10;
    const { x, y } = findEmptySpot(w, l);
    
    setFormData({ 
      name: `Khu ${areas.length + 1}`, 
      size: (w * l).toString(), 
      description: "", 
      width: w.toString(), 
      length: l.toString(), 
      positionX: x.toString(), 
      positionY: y.toString() 
    });
    setShowForm(true);
  };

  const openEditForm = (area) => {
    setFormError("");
    setEditingId(area.id);
    setFormData({
      name: area.name,
      size: area.size,
      description: area.description || "",
      width: area.width || 10,
      length: area.length || 10,
      positionX: area.positionX || 0,
      positionY: area.positionY || 0,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const parsedSize = parseFloat(formData.size);
    const w = parseFloat(formData.width) || 10;
    const l = parseFloat(formData.length) || 10;
    const x = parseFloat(formData.positionX) || 0;
    const y = parseFloat(formData.positionY) || 0;

    // Capacity check
    if (!checkCapacity(editingId, parsedSize)) {
      setFormError(`Lỗi sức chứa: Tổng diện tích vượt quá diện tích kho (${warehouse?.totalArea} m²).`);
      return;
    }

    // Overlap check
    if (checkOverlap(editingId, x, y, w, l)) {
      setFormError(`Lỗi vị trí: Khu vực này bị đè lên một khu vực khác đã có.`);
      return;
    }

    // Boundary Overflow check
    const whW = warehouse?.width || 50;
    const whL = warehouse?.length || 50;
    if (x + w > whW || y + l > whL) {
      setFormError(`Lỗi kích thước: Tọa độ sau chỉnh sửa làm khối diện tích tràn ra ngoài lãnh thổ kho (Kích thước kho: ${whW}m × ${whL}m).`);
      return;
    }

    setSubmitLoading(true);
    try {
      const payload = {
        name: formData.name,
        size: parsedSize,
        description: formData.description,
        width: w,
        length: l,
        positionX: x,
        positionY: y,
      };

      if (editingId) {
        await api.put(`/RentalAreas/${editingId}`, { id: editingId, ...payload });
        alert("Cập nhật thành công!");
      } else {
        await api.post(`/RentalAreas`, { warehouseId: parseInt(warehouseId), ...payload });
        alert("Thêm mới thành công!");
      }
      closeForm();
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa khu vực này không?")) {
      try {
        await api.delete(`/RentalAreas/${id}`);
        closeForm();
        fetchData();
      } catch (err) {
        alert("Lỗi khi xóa!");
      }
    }
  };

  const handleDragStop = async (id, d) => {
    const area = areas.find(a => a.id === id);
    if (!area) return;

    if (area.status?.toUpperCase() === 'RENTED') {
      alert("Không thể di chuyển khu vực đang được thuê!");
      setAreas([...areas]); // force snap back
      return;
    }
    
    // Math.round to 1 decimal to avoid dirty floats like 10.05
    const newX = Math.round((d.x / scale) * 10) / 10;
    const newY = Math.round((d.y / scale) * 10) / 10;
    
    // Overlap prevention during map drag
    if (checkOverlap(id, newX, newY, area.width || 10, area.length || 10)) {
      alert("Vị trí không hợp lệ! Bị chạm vào một khu vực khác.");
      setAreas([...areas]); // force component re-render to snap back
      return;
    }

    const upd = { ...area, positionX: newX, positionY: newY };
    setAreas(prev => prev.map(a => (a.id === id ? upd : a)));
    
    try {
        await api.put(`/RentalAreas/${id}`, upd);
    } catch(e) {
      console.error("Auto-save failed", e);
    }
  };

  const handleResizeStop = async (id, ref, position) => {
    const area = areas.find(a => a.id === id);
    if (!area) return;

    if (area.status?.toUpperCase() === 'RENTED') {
      alert("Không thể thay đổi kích thước khu vực đang được thuê!");
      setAreas([...areas]); // force snap back
      return;
    }

    // Round properly to fix tiny border/float errors
    const newW = Math.round((ref.offsetWidth / scale) * 10) / 10;
    const newL = Math.round((ref.offsetHeight / scale) * 10) / 10;
    const newSize = Number((newW * newL).toFixed(2));
    const newX = Math.round((position.x / scale) * 10) / 10;
    const newY = Math.round((position.y / scale) * 10) / 10;

    // Overlap Prevention during map resize
    if (checkOverlap(id, newX, newY, newW, newL)) {
      alert("Kích thước không hợp lệ! Bị chạm vào một khu vực khác.");
      setAreas([...areas]); // force snap back
      return;
    }

    // Capacity Validation during map resize
    if (!checkCapacity(id, newSize)) {
      alert(`Kích thước không hợp lệ! Tổng hệ thống vượt quá kho chứa.`);
      setAreas([...areas]); // force snap back
      return;
    }

    const upd = { ...area, width: newW, length: newL, size: newSize, positionX: newX, positionY: newY };
    setAreas(prev => prev.map(a => (a.id === id ? upd : a)));
    
    try {
        await api.put(`/RentalAreas/${id}`, upd);
    } catch(e) {
      console.error("Auto-save failed", e);
    }
  };

  if (loading) return <p style={{ color: "#64748b" }}>Đang tải sơ đồ 2D...</p>;

  // Grid dimensions
  const whW = warehouse?.width || 50; 
  const whL = warehouse?.length || 50;
  const inUseCount = areas.filter(a => a.status?.toUpperCase() === 'RENTED').length;
  const currentTotal = areas.reduce((s, a) => s + (a.size || 0), 0);
  
  const containerStyle = {
    position: "relative",
    width: `${whW * scale}px`,
    height: `${whL * scale}px`,
    backgroundColor: "#f8fafc",
    backgroundImage: `linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)`,
    backgroundSize: `${scale}px ${scale}px`,
    border: "3px solid #64748b",
    borderRadius: "8px",
    boxShadow: "inset 0 0 10px rgba(0,0,0,0.05)"
  };

  return (
    <div style={{ marginTop: "2rem", backgroundColor: "#fff", padding: "2.5rem", borderRadius: "24px", boxShadow: "0 10px 40px rgba(0,0,0,0.05)" }}>
      {/* HƯỚNG DẪN RÚT GỌN */}
      <div style={{ background: "#f0f9ff", border: "1px solid #e0f2fe", padding: "12px 20px", borderRadius: "16px", marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: "25px", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#0369a1", fontSize: "0.9rem", fontWeight: 600 }}>
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>drag_pan</span> Di chuyển: Kéo thả
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#0369a1", fontSize: "0.9rem", fontWeight: 600 }}>
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>aspect_ratio</span> Kích thước: Kéo góc
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#0369a1", fontSize: "0.9rem", fontWeight: 600 }}>
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>edit_square</span> Sửa: Nháy đúp
          </div>
        </div>
        
        <div style={{ display: "flex", gap: "20px" }}>
           <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <div style={{ width: 12, height: 12, background: "rgba(14, 165, 233, 0.1)", border: "1.5px dashed #0369a1", borderRadius: "2px" }}></div>
              <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 500 }}>Trống</span>
           </div>
           <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <div style={{ width: 12, height: 12, background: "rgba(245, 158, 11, 0.1)", border: "1.5px solid #b45309", borderRadius: "2px" }}></div>
              <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 500 }}>Đã thuê</span>
           </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
         <div>
           <h2 style={{ fontSize: "1.4rem", fontWeight: 700, margin: 0, color: "#0f172a" }}>Bản đồ Khu vực</h2>
           <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "12px" }}>
             <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#475569" }}>Thu phóng (Zoom):</span>
             <input 
               type="range" 
               min="10" 
               max="80" 
               step="5" 
               value={scale} 
               onChange={(e) => setScale(Number(e.target.value))}
               style={{ cursor: "pointer", accentColor: "#0ea5e9" }}
             />
             <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>Tỷ lệ: 1m = {scale}px</span>
           </div>
         </div>
         <button onClick={openCreateForm} style={{ height: "fit-content", padding: "12px 24px", background: "linear-gradient(135deg, #0284c7 0%, #00b2d6 100%)", color: "#fff", borderRadius: "10px", border: "none", cursor: "pointer", fontWeight: "bold", boxShadow: "0 4px 10px rgba(14, 165, 233, 0.3)" }}>+ Thêm khu vực tự động</button>
      </div>

      <div style={{ overflowX: "auto", padding: "60px 80px 80px 100px", display: "flex", justifyContent: "center" }}>
          <div style={{ position: "relative", width: `${whW * scale}px`, height: `${whL * scale}px`, flexShrink: 0 }}>
             
             {/* 🔹 Width Label (Top) - Smaller & cleaner */}
             <div style={{ position: "absolute", top: "-30px", left: "0", width: "100%", textAlign: "center", color: "#475569", fontWeight: 700, fontSize: "0.85rem", borderBottom: "1.5px solid #94a3b8", height: "10px" }}>
                <span style={{ background: "#fff", padding: "0 10px", position: "relative", top: "2px" }}>Ngang (W): {whW} m</span>
             </div>
             
             {/* 🔹 Length Label (Left) - Smaller & Fixed rotation clip */}
             <div style={{ position: "absolute", top: "0", left: "-60px", width: "40px", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", borderRight: "1.5px solid #94a3b8", color: "#475569", fontWeight: 700, fontSize: "0.85rem" }}>
                <span style={{ transform: "rotate(-90deg)", whiteSpace: "nowrap", background: "#fff", padding: "10px 0" }}>Dài (L): {whL} m</span>
             </div>

             <div style={containerStyle}>
                {console.log("Grid Rendered")}
             </div>

             {/* CỔNG CHÍNH - MAIN DOOR OUTSIDE THE GRID */}
             <div style={{
                 position: "absolute",
                 bottom: "-26px", 
                 left: "50%",
                 transform: "translateX(-50%)",
                 padding: "4px 20px",
                 background: "#f59e0b",
                 borderBottomLeftRadius: "8px",
                 borderBottomRightRadius: "8px",
                 zIndex: 0,
                 display: "inline-flex",
                 justifyContent: "center",
                 alignItems: "center",
                 fontSize: "12px",
                 color: "#fff",
                 fontWeight: 800,
                 boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
                 whiteSpace: "nowrap"
             }}>
                 CỔNG CHÍNH VÀO KHO
             </div>
             
             <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
               {areas.map(a => {
              const w = (a.width || 10) * scale;
              const l = (a.length || 10) * scale;
              const x = (a.positionX || 0) * scale;
              const y = (a.positionY || 0) * scale;
              
              const isLocked = a.status?.toUpperCase() === 'RENTED';

              return (
                <Rnd
                  key={a.id}
                  size={{ width: w, height: l }}
                  position={{ x, y }}
                  onDragStop={(e, d) => handleDragStop(a.id, d)}
                  onResizeStop={(e, dir, ref, delta, position) => handleResizeStop(a.id, ref, position)}
                  bounds="parent"
                  dragGrid={[scale, scale]}
                  resizeGrid={[scale, scale]}
                  disableDragging={isLocked}
                  enableResizing={!isLocked}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                    boxSizing: "border-box", // Ensure tiny border px doesn't inflate Rnd logic
                    background: isLocked ? "rgba(245, 158, 11, 0.15)" : "rgba(14, 165, 233, 0.2)",
                    border: isLocked ? "2px solid #b45309" : "2px dashed #0369a1",
                    borderRadius: "4px",
                    cursor: isLocked ? "not-allowed" : "move",
                    userSelect: "none",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                    transition: "background 0.2s"
                  }}
                  onDoubleClick={() => openEditForm(a)}
                  onMouseEnter={(e) => { if(!isLocked) e.currentTarget.style.background = "rgba(14, 165, 233, 0.35)"; }}
                  onMouseLeave={(e) => { if(!isLocked) e.currentTarget.style.background = "rgba(14, 165, 233, 0.2)"; }}
                >
                  <div style={{ fontWeight: 800, color: "#0f172a", fontSize: "0.9rem", textAlign: "center", pointerEvents: "none" }}>
                     {isLocked && <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: "middle", marginRight: 4 }}>lock</span>}
                     {a.name}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#1e293b", pointerEvents: "none", fontWeight: 700 }}>{a.size} m²</div>
                  <div style={{ fontSize: "0.7rem", color: "#475569", pointerEvents: "none", fontWeight: 600, marginTop: "2px", textAlign: "center" }}>
                     {a.width}m × {a.length}m
                  </div>
                </Rnd>
              );
            })}
             </div>
          </div>
      </div>

      {showForm && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ background: "#fff", padding: "2.5rem", borderRadius: "20px", width: "100%", maxWidth: "550px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h3 style={{ margin: 0, fontSize: "1.4rem", color: "#0f172a" }}>{editingId ? "Thông số Thể tích / Diện tích" : "Tạo Khối Area Mới"}</h3>
                <span className="material-symbols-outlined" style={{cursor:"pointer", color:"#94a3b8", fontSize: "24px"}} onClick={closeForm}>close</span>
            </div>
            
            {formError && <div style={{ color: "#b91c1c", background: "#fee2e2", padding: "10px", borderRadius: "8px", marginBottom: "1rem", fontWeight: 500 }}>{formError}</div>}
            
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 700, color: "#475569", fontSize: "0.9rem" }}>Tên khu (VD: Lô 1, Dãy B...)</label>
                <input required name="name" value={formData.name} onChange={handleInputChange} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", fontSize: "1rem" }} />
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: 6, fontWeight: 700, color: "#475569", fontSize: "0.9rem" }}>Chiều ngang (Width) (m)</label>
                    <input type="number" step="0.1" name="width" value={formData.width} onChange={handleInputChange} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 6, fontWeight: 700, color: "#475569", fontSize: "0.9rem" }}>Chiều dọc (Length) (m)</label>
                    <input type="number" step="0.1" name="length" value={formData.length} onChange={handleInputChange} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none" }} />
                  </div>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 700, color: "#475569", fontSize: "0.9rem" }}>Diện tích tổng thực (m²)</label>
                <input type="number" step="0.1" name="size" value={formData.size} onChange={handleInputChange} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#f8fafc", color: "#64748b", fontWeight: 700 }} readOnly />
              </div>

              {/* X and Y Axis fields have been logically hidden to simplify UX. Position updates solely via drag & drop. */}
              
              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 700, color: "#475569", fontSize: "0.9rem" }}>Mô tả thêm</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} rows="2" style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", resize: "none" }} />
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "1rem" }}>
                <button type="submit" disabled={submitLoading} style={{ flex: 1, padding: "14px", background: "linear-gradient(135deg, #0284c7 0%, #00b2d6 100%)", color: "#fff", border: "none", borderRadius: "10px", fontWeight: 700, fontSize: "1rem", cursor: submitLoading ? "not-allowed" : "pointer", boxShadow: "0 8px 16px rgba(2, 132, 199, 0.25)" }}>
                  {submitLoading ? "Đang xử lý..." : "Lưu Thay Đổi"}
                </button>
                {editingId && (
                    <button type="button" onClick={() => handleDelete(editingId)} style={{ padding: "14px 20px", background: "#fee2e2", color: "#b91c1c", border: "none", borderRadius: "10px", fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={(e)=>e.currentTarget.style.background="#fecaca"} onMouseLeave={(e)=>e.currentTarget.style.background="#fee2e2"}>
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
