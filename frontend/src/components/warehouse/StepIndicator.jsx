import React from "react";

const StepIndicator = ({ step }) => {
  const steps = [
    { title: "Thông tin", sub: "Thông tin kho" },
    { title: "Hình ảnh", sub: "Tải ảnh lên" },
    { title: "Pháp lý",  sub: "Hồ sơ" },
    { title: "Sơ đồ",    sub: "Vẽ sơ đồ kho" },
    { title: "Hoàn tất", sub: "Xem lại" }
  ];

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: "48px",
      padding: "0 20px",
      gap: 0
    }}>
      {steps.map((s, index) => {
        const active = step === index + 1;
        const done   = step >  index + 1;
        const isLast = index === steps.length - 1;

        return (
          <React.Fragment key={index}>
            {/* Step circle + label */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "10px",
              minWidth: 72,
              zIndex: 1
            }}>
              {/* Circle */}
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                backgroundColor: done ? "#10b981" : active ? "#00b2d6" : "#e2e8f0",
                color: done || active ? "#fff" : "#94a3b8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "0.95rem",
                boxShadow: active
                  ? "0 0 0 5px rgba(0,178,214,0.15)"
                  : done
                    ? "0 0 0 5px rgba(16,185,129,0.13)"
                    : "none",
                transition: "all 0.35s ease"
              }}>
                {done ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>

              {/* Label */}
              <div style={{ textAlign: "center" }}>
                <div style={{
                  fontSize: "0.78rem",
                  fontWeight: active ? 800 : done ? 600 : 500,
                  color: active ? "#00b2d6" : done ? "#10b981" : "#94a3b8",
                  lineHeight: 1.3,
                  whiteSpace: "nowrap"
                }}>
                  {s.title}
                </div>
              </div>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div style={{
                flex: 1,
                height: "2px",
                maxWidth: "80px",
                margin: "-22px 6px 0",
                background: done
                  ? "linear-gradient(90deg,#10b981,#10b981)"
                  : "linear-gradient(90deg,#e2e8f0,#e2e8f0)",
                borderRadius: "2px",
                transition: "all 0.35s ease"
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default StepIndicator;