import React from "react";

const StepIndicator = ({ step }) => {

  const steps = [
    "Thông tin kho",
    "Hình ảnh kho",
    "Giấy tờ pháp lý",
    "Hoàn tất"
  ];

  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      marginBottom: "40px"
    }}>

      {steps.map((s, index) => {

        const active = step === index + 1;
        const done = step > index + 1;

        return (
          <div
            key={index}
            style={{
              flex: 1,
              textAlign: "center",
              fontWeight: active ? "bold" : "normal",
              color: done || active ? "#0095c7" : "#94a3b8"
            }}
          >
            <div
              style={{
                width: "35px",
                height: "35px",
                borderRadius: "50%",
                margin: "0 auto 8px",
                backgroundColor: done || active ? "#0095c7" : "#e2e8f0",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              {index + 1}
            </div>

            {s}
          </div>
        );
      })}
    </div>
  );
};

export default StepIndicator;