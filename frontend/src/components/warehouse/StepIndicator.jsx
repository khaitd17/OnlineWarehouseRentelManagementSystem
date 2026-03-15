import React from "react";

const StepIndicator = ({ step }) => {
  const steps = [
    { title: "Thông tin", icon: "inventory_2" },
    { title: "Hình ảnh", icon: "photo_library" },
    { title: "Pháp lý", icon: "fact_check" },
    { title: "Hoàn tất", icon: "verified" }
  ];

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: "50px",
      padding: "0 20px"
    }}>
      {steps.map((s, index) => {
        const active = step === index + 1;
        const done = step > index + 1;
        const isLast = index === steps.length - 1;

        return (
          <React.Fragment key={index}>
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              position: "relative",
              zIndex: 1
            }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "16px",
                  backgroundColor: done ? "#10b981" : active ? "#00b2d6" : "#f1f5f9",
                  color: done || active ? "#fff" : "#94a3b8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "12px",
                  boxShadow: active ? "0 8px 16px rgba(0, 178, 214, 0.2)" : "none",
                  transition: "all 0.3s ease",
                  border: active ? "2px solid #00b2d6" : "2px solid transparent"
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "24px" }}>
                  {done ? "check" : s.icon}
                </span>
              </div>
              <span
                style={{
                  fontSize: "0.85rem",
                  fontWeight: active ? 800 : 500,
                  color: active ? "#1e293b" : "#64748b",
                  whiteSpace: "nowrap"
                }}
              >
                {s.title}
              </span>
            </div>

            {!isLast && (
              <div style={{
                flex: 1,
                height: "3px",
                backgroundColor: done ? "#10b981" : "#f1f5f9",
                margin: "0 10px",
                marginTop: "-25px",
                maxWidth: "100px",
                borderRadius: "2px",
                transition: "all 0.3s ease"
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default StepIndicator;