import React, { useState, useEffect, useRef } from "react";
import api from "../../api/api";
import { Maximize2, Move, AlertTriangle } from "lucide-react";

// Helper for collision detection
const checkOverlap = (rect1, rect2) => {
  return (
    rect1.x < rect2.x + rect2.w &&
    rect1.x + rect1.w > rect2.x &&
    rect1.y < rect2.y + rect2.h &&
    rect1.y + rect1.h > rect2.y
  );
};

const RentalAreaManagement = ({ warehouseId }) => {
  const [warehouse, setWarehouse] = useState(null);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    size: "",
    description: "",
    positionX: 0,
    positionY: 0,
    width: 0,
    length: 0
  });
  const [formError, setFormError] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  // Map state
  const mapRef = useRef(null);
  const [draggingBlock, setDraggingBlock] = useState(null);
  const [resizingBlock, setResizingBlock] = useState(null);
  const [ghostBlock, setGhostBlock] = useState(null);

  const fetchWarehouseAndAreas = async () => {
    try {
      setLoading(true);
      const whRes = await api.get(`/Warehouse/${warehouseId}`);
      setWarehouse(whRes.data);

      const areaRes = await api.get(`/RentalAreas/warehouse/${warehouseId}`);
      setAreas(areaRes.data);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (warehouseId) {
      fetchWarehouseAndAreas();
    }
  }, [warehouseId]);

  // Physical to Pixel mapping
  const physW = warehouse?.width || (warehouse ? Math.sqrt(warehouse.totalArea) : 100);
  const physL = warehouse?.length || (warehouse ? Math.sqrt(warehouse.totalArea) : 100);
  const MAX_PX = 600;
  // Force container to be a fixed square specifically to make editing easier
  const PX_WIDTH = MAX_PX;
  const PX_HEIGHT = MAX_PX;
  const SCALE_X = PX_WIDTH / physW;
  const SCALE_Y = PX_HEIGHT / physL;

  const handleInputChange = (e) => {
    let { name, value } = e.target;
    // Auto calculate dim if size changes
    if (name === "size" && value) {
      const s = parseFloat(value);
      const w = Math.sqrt(s).toFixed(2);
      setFormData((prev) => ({ ...prev, [name]: value, width: w, length: w }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const openCreateForm = () => {
    setFormError("");
    setEditingId(null);
    setFormData({ name: "", size: "", description: "", positionX: 0, positionY: 0, width: 10, length: 10 });
    setShowForm(true);
  };

  const openEditForm = (area) => {
    setFormError("");
    setEditingId(area.id);
    setFormData({
      name: area.name,
      size: area.size,
      description: area.description || "",
      positionX: area.positionX || 0,
      positionY: area.positionY || 0,
      width: area.width || Math.sqrt(area.size),
      length: area.length || Math.sqrt(area.size)
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const findEmptySpot = (w, h) => {
    const step = 2; 
    for (let y = 0; y <= physL - h; y += step) {
      for (let x = 0; x <= physW - w; x += step) {
        let overlap = false;
        for (const a of areas) {
          const aW = a.width || Math.sqrt(a.size);
          const aH = a.length || Math.sqrt(a.size);
          const aX = a.positionX || 0;
          const aY = a.positionY || 0;
          if (x < aX + aW && x + w > aX && y < aY + aH && y + h > aY) {
            overlap = true;
            break;
          }
        }
        if (!overlap) return { x, y };
      }
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitLoading(true);

    try {
      let finalW = parseFloat(formData.width) || 1;
      let finalH = parseFloat(formData.length) || 1;
      let finalX = parseFloat(formData.positionX) || 0;
      let finalY = parseFloat(formData.positionY) || 0;

      if (finalW > physW) {
        throw new Error(`Chiều rộng khu vực (${finalW}m) vượt quá chiều rộng giới hạn của kho (${physW}m). Vui lòng nhập lại!`);
      }
      if (finalH > physL) {
        throw new Error(`Chiều dài khu vực (${finalH}m) vượt quá chiều dài giới hạn của kho (${physL}m). Vui lòng nhập lại!`);
      }

      if (!editingId) {
        const spot = findEmptySpot(finalW, finalH);
        if (!spot) {
          throw new Error(`Nhà kho đã kín đoạn không gian ${finalW}x${finalH}m liên tục. Hãy thử diện tích nhỏ hơn.`);
        }
        finalX = spot.x;
        finalY = spot.y;
      }

      // Ensure they don't exceed warehouse
      if (finalX + finalW > physW) finalX = physW - finalW;
      if (finalY + finalH > physL) finalY = physL - finalH;
      // Clamp negative coordinates
      if (finalX < 0) finalX = 0;
      if (finalY < 0) finalY = 0;

      const payload = {
        id: editingId,
        warehouseId: parseInt(warehouseId),
        name: formData.name,
        size: finalW * finalH,
        description: formData.description,
        positionX: finalX,
        positionY: finalY,
        width: finalW,
        length: finalH
      };

      if (editingId) {
        await api.put(`/RentalAreas/${editingId}`, payload);
        alert("Cập nhật thành công!");
      } else {
        await api.post(`/RentalAreas`, payload);
        alert("Thêm mới thành công!");
      }
      closeForm();
      fetchWarehouseAndAreas();
    } catch (err) {
      const errMsg = err.response?.data?.error || err.response?.data?.message || err.message || "Lỗi. Có thể khu vực chồng lấn.";
      setFormError(errMsg);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa khu vực này không?")) {
      try {
        await api.delete(`/RentalAreas/${id}`);
        alert("Xóa thành công!");
        closeForm();
        fetchWarehouseAndAreas();
      } catch (err) {
        alert("Lỗi khi xóa: " + (err.response?.data?.error || err.message));
      }
    }
  };

  // --- DRAG & DROP LOGIC ---
  const handleMouseDown = (e, area, act) => {
    e.stopPropagation();
    if (act === "drag") {
      setDraggingBlock({
        ...area,
        startX: e.clientX,
        startY: e.clientY,
        origX: area.positionX || 0,
        origY: area.positionY || 0
      });
    } else if (act === "resize") {
      setResizingBlock({
        ...area,
        startX: e.clientX,
        startY: e.clientY,
        origW: area.width || Math.sqrt(area.size),
        origH: area.length || Math.sqrt(area.size)
      });
    }
    setGhostBlock({ ...area });
  };

  const handleMouseMove = (e) => {
    if (draggingBlock) {
      const dx = (e.clientX - draggingBlock.startX) / SCALE_X;
      const dy = (e.clientY - draggingBlock.startY) / SCALE_Y;
      let newX = Math.max(0, draggingBlock.origX + dx);
      let newY = Math.max(0, draggingBlock.origY + dy);
      
      const w = draggingBlock.width || Math.sqrt(draggingBlock.size);
      const h = draggingBlock.length || Math.sqrt(draggingBlock.size);

      // Boundary check
      if (newX + w > physW) newX = physW - w;
      if (newY + h > physL) newY = physL - h;

      setGhostBlock({ ...draggingBlock, positionX: newX, positionY: newY });
    } else if (resizingBlock) {
      const dx = (e.clientX - resizingBlock.startX) / SCALE_X;
      const dy = (e.clientY - resizingBlock.startY) / SCALE_Y;
      
      let newW = Math.max(1, resizingBlock.origW + dx);
      let newH = Math.max(1, resizingBlock.origH + dy);

      // Boundary check
      const x = resizingBlock.positionX || 0;
      const y = resizingBlock.positionY || 0;
      if (x + newW > physW) newW = physW - x;
      if (y + newH > physL) newH = physL - y;

      setGhostBlock({ ...resizingBlock, width: newW, length: newH, size: newW * newH });
    }
  };

  const handleMouseUp = async () => {
    if (!ghostBlock || (!draggingBlock && !resizingBlock)) return;

    const blockToSave = ghostBlock;
    const isDrag = !!draggingBlock;
    setDraggingBlock(null);
    setResizingBlock(null);
    setGhostBlock(null);

    // Collision check locally before hitting API
    const rect = {
      x: blockToSave.positionX || 0,
      y: blockToSave.positionY || 0,
      w: blockToSave.width || Math.sqrt(blockToSave.size),
      h: blockToSave.length || Math.sqrt(blockToSave.size)
    };

    let overlap = false;
    for (const a of areas) {
      if (a.id === blockToSave.id) continue;
      const aRect = {
        x: a.positionX || 0,
        y: a.positionY || 0,
        w: a.width || Math.sqrt(a.size),
        h: a.length || Math.sqrt(a.size)
      };
      if (checkOverlap(rect, aRect)) {
        overlap = true;
        break;
      }
    }

    if (overlap) {
      alert("Không thể đặt vì chồng lấn với khu vực khác!");
      return;
    }

    // Sync to form if it is currently selected in form, else call API update mapping
    if (editingId === blockToSave.id) {
       setFormData(prev => ({
         ...prev,
         positionX: blockToSave.positionX,
         positionY: blockToSave.positionY,
         width: blockToSave.width,
         length: blockToSave.length,
         size: blockToSave.size || prev.size
       }));
    } else {
       // Optimistic update
       setAreas(areas.map(a => a.id === blockToSave.id ? { ...a, ...blockToSave } : a));
       
       // Fire API background
       try {
         await api.put(`/RentalAreas/${blockToSave.id}`, {
            id: blockToSave.id,
            warehouseId: parseInt(warehouseId),
            name: blockToSave.name,
            size: blockToSave.width * blockToSave.length, // update size
            description: blockToSave.description,
            positionX: blockToSave.positionX,
            positionY: blockToSave.positionY,
            width: blockToSave.width,
            length: blockToSave.length
         });
       } catch (err) {
         alert("Lỗi khi lưu vị trí: " + (err.response?.data?.message || err.message));
         fetchWarehouseAndAreas(); // revert
       }
    }
  };

  if (loading) return <p>Đang tải map...</p>;
  if (!warehouse) return <p>Không tìm thấy kho</p>;

  return (
    <div style={{ padding: "2rem", backgroundColor: "#fff", borderRadius: "16px", boxShadow: "0 4px 24px rgba(0,0,0,0.05)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>Bản Đồ Phân Phối Kho Không Gian</h2>
          <p style={{ color: "#64748b", margin: "5px 0" }}>Trực quan hóa và cấp phát không gian tránh chồng lấn.</p>
        </div>
        {!showForm && (
          <button onClick={openCreateForm} style={{ padding: "0.8rem 1.5rem", backgroundColor: "#10b981", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 10px rgba(16, 185, 129, 0.3)" }}>
            + Thêm Mới & Chỉ Định
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: "2rem", flexDirection: "row", alignItems: "flex-start" }}>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div 
            ref={mapRef}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ 
              width: PX_WIDTH, 
              height: PX_HEIGHT, 
              backgroundColor: "#f1f5f9",
              border: "2px dashed #cbd5e1",
              position: "relative",
              overflow: "hidden",
              cursor: draggingBlock || resizingBlock ? "grabbing" : "default",
              boxShadow: "inset 0 0 20px rgba(0,0,0,0.02)",
              borderRadius: "8px"
            }}
          >
            {/* Main Warehouse Door Indicator */}
            {(() => {
              const dir = warehouse?.mainDoorDirection?.toUpperCase() || "TOP";
              const doorWidth = 100;
              const doorThickness = 12;
              const doorStyle = {
                position: "absolute",
                backgroundColor: "#fbbf24", // Strong gold door
                zIndex: 100,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "10px",
                fontWeight: 900,
                color: "#92400e",
                textTransform: "uppercase",
                boxShadow: "0 0 10px rgba(0,0,0,0.2)"
              };

              if (dir === "TOP") return (
                <div style={{ ...doorStyle, top: 0, left: `calc(50% - ${doorWidth/2}px)`, width: doorWidth, height: doorThickness, borderRadius: "0 0 8px 8px" }}>Cổng Chính</div>
              );
              if (dir === "BOTTOM") return (
                <div style={{ ...doorStyle, bottom: 0, left: `calc(50% - ${doorWidth/2}px)`, width: doorWidth, height: doorThickness, borderRadius: "8px 8px 0 0" }}>Cổng Chính</div>
              );
              if (dir === "LEFT") return (
                <div style={{ ...doorStyle, left: 0, top: `calc(50% - ${doorWidth/2}px)`, height: doorWidth, width: doorThickness, borderRadius: "0 8px 8px 0", writingMode: "vertical-rl" }}>Cổng Chính</div>
              );
              if (dir === "RIGHT") return (
                <div style={{ ...doorStyle, right: 0, top: `calc(50% - ${doorWidth/2}px)`, height: doorWidth, width: doorThickness, borderRadius: "8px 0 0 8px", writingMode: "vertical-rl" }}>Cổng Chính</div>
              );
              return null;
            })()}

            {areas.map(a => {
              const isGhost = ghostBlock && ghostBlock.id === a.id;
              const target = isGhost ? ghostBlock : a;
              
              const left = (target.positionX || 0) * SCALE_X;
              const top = (target.positionY || 0) * SCALE_Y;
              const w = (target.width || Math.sqrt(target.size)) * SCALE_X;
              const h = (target.length || Math.sqrt(target.size)) * SCALE_Y;

              const isEditing = editingId === a.id;
              const bgCol = isEditing ? "rgba(234, 179, 8, 0.5)" : "rgba(14, 165, 233, 0.5)";
              const borderCol = isEditing ? "#ca8a04" : "#0284c7";

              return (
                <div 
                  key={a.id}
                  onMouseDown={(e) => handleMouseDown(e, target, "drag")}
                  style={{
                    position: "absolute",
                    left, top, width: w, height: h,
                    backgroundColor: isGhost ? "rgba(16, 185, 129, 0.6)" : bgCol,
                    border: `2px solid ${isGhost ? "#059669" : borderCol}`,
                    borderRadius: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "grab",
                    transition: isGhost ? "none" : "all 0.2s ease",
                    userSelect: "none",
                    zIndex: isGhost ? 100 : (isEditing ? 50 : 10)
                  }}
                  onDoubleClick={(e) => { e.stopPropagation(); openEditForm(a); }}
                >

                  <div style={{ textAlign: "center", pointerEvents: "none" }}>
                    <p style={{ margin: 0, fontWeight: "bold", fontSize: "0.85rem", color: "#0f172a" }}>{target.name}</p>
                    <p style={{ margin: 0, fontSize: "0.75rem", color: "#334155" }}>{(target.width * target.length || target.size).toFixed(1)} m²</p>
                  </div>

                  <div 
                    onMouseDown={(e) => handleMouseDown(e, target, "resize")}
                    style={{
                      position: "absolute",
                      right: -5, bottom: -5,
                      width: 15, height: 15,
                      backgroundColor: "#0ea5e9",
                      borderRadius: "50%",
                      cursor: "se-resize",
                      border: "2px solid #fff",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                    }}
                  />
                </div>
              );
            })}
          </div>
          
          <div style={{ padding: "1.5rem", border: "1px solid #e2e8f0", borderRadius: "12px", backgroundColor: "#f8fafc", width: "100%", boxSizing: "border-box" }}>
            <h4 style={{ margin: "0 0 0.8rem 0", color: "#334155", fontSize: "1rem" }}>💡 Hướng dẫn thao tác Bản đồ:</h4>
            <ul style={{ paddingLeft: "1.2rem", color: "#475569", fontSize: "0.95rem", lineHeight: "1.6", margin: 0 }}>
              <li style={{ marginBottom: "0.5rem" }}><strong>Kích đúp chuột</strong> vào một khối bất kỳ để chọn và mở bảng chỉnh sửa.</li>
              <li style={{ marginBottom: "0.5rem" }}><strong>Kéo thả (Túm phần lõi)</strong> khối vuông để dịch chuyển vị trí thực tế trên bản đồ.</li>
              <li style={{ marginBottom: "0.5rem" }}><strong>Kéo góc dưới cùng bên phải</strong> để dễ dàng mở rộng chiều dài, chiều rộng của khu thuê.</li>
              <li style={{ marginBottom: "0.5rem" }}><strong>Hướng cửa kho (Vạch vàng lớn - Cổng Chính):</strong> Giúp bạn định hướng các khu vực thuê dựa trên lối vào chính của kho.</li>
              <li>Hệ thống tích hợp AI sẽ chống việc các khu thuê chạm hay nằm đè lên nhau.</li>
            </ul>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          {showForm ? (
            <div style={{ backgroundColor: "#f8fafc", padding: "1.5rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "1rem", color: "#0f172a", borderBottom: "2px solid #e2e8f0", paddingBottom: "0.5rem" }}>
                {editingId ? "Cập Nhật Khu Vực" : "Tạo Mới Khu Vực"}
              </h3>
              
              {formError && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: "#fee2e2", color: "#b91c1c", padding: "0.8rem", borderRadius: "6px", marginBottom: "1rem", fontSize: "0.9rem" }}>
                  <AlertTriangle size={18} /> {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569", display: "block", marginBottom: 5 }}>Tên</label>
                  <input required name="name" value={formData.name} onChange={handleInputChange} style={{ width: "100%", padding: "0.7rem", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569", display: "block", marginBottom: 5 }}>Chiều rộng (m)</label>
                    <input required type="number" step="0.1" name="width" value={formData.width} onChange={(e) => setFormData({...formData, width: e.target.value, size: e.target.value * formData.length})} style={{ width: "100%", padding: "0.7rem", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569", display: "block", marginBottom: 5 }}>Chiều dài (m)</label>
                    <input required type="number" step="0.1" name="length" value={formData.length} onChange={(e) => setFormData({...formData, length: e.target.value, size: formData.width * e.target.value})} style={{ width: "100%", padding: "0.7rem", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                  </div>
                </div>

                <div style={{ borderTop: "1px dashed #cbd5e1", paddingTop: "1rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569", display: "block", marginBottom: 5 }}>Diện tích (m²)</label>
                  <input required type="number" step="0.1" name="size" value={formData.size} onChange={handleInputChange} style={{ width: "100%", padding: "0.7rem", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "#e2e8f0" }} readOnly />
                </div>

                <div>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569", display: "block", marginBottom: 5 }}>Mô tả</label>
                  <textarea name="description" value={formData.description} onChange={handleInputChange} rows="2" style={{ width: "100%", padding: "0.7rem", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                </div>

                <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                  <button type="submit" disabled={submitLoading} style={{ flex: 1, padding: "0.8rem", backgroundColor: "#0284c7", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
                    {submitLoading ? "Đang xử lý..." : "Lưu Thay Đổi"}
                  </button>
                  {editingId && (
                    <button type="button" onClick={() => handleDelete(editingId)} style={{ padding: "0.8rem 1.2rem", backgroundColor: "#fee2e2", color: "#ef4444", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
                      Xóa
                    </button>
                  )}
                  <button type="button" onClick={closeForm} style={{ padding: "0.8rem 1.5rem", backgroundColor: "#fff", color: "#64748b", border: "1px solid #cbd5e1", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div style={{ padding: "1.5rem", border: "1px solid #e2e8f0", borderRadius: "12px", backgroundColor: "#f8fafc" }}>
              <h3 style={{ margin: "0 0 1rem 0", color: "#0f172a" }}>Tổng quan Bản Đồ</h3>
              <p style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #cbd5e1", paddingBottom: "0.5rem" }}>
                <span>Tổng kích thước kho:</span> 
                <strong>{physW.toFixed(1)}m x {physL.toFixed(1)}m</strong>
              </p>
              <p style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #cbd5e1", paddingBottom: "0.5rem", marginTop: "0.5rem" }}>
                <span>Tổng sức chứa (Area):</span> 
                <strong>{warehouse.totalArea} m²</strong>
              </p>
              <p style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #cbd5e1", paddingBottom: "0.5rem", marginTop: "0.5rem" }}>
                <span>Đã cấp phát:</span> 
                <strong>
                  {areas.reduce((sum, a) => sum + (a.width * a.length || a.size), 0).toFixed(1)} m²
                </strong>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RentalAreaManagement;
