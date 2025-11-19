import React, { useMemo, useRef } from "react";
import useVirtualList from "./a";

export default function App() {
  const containerRef = useRef(null);
  const wrapperRef = useRef(null);
  const [value, onChange] = React.useState(0);

  const originalList = useMemo(() => Array.from(Array(99999).keys()), []);

  const [list, scrollTo] = useVirtualList(originalList, {
    containerTarget: containerRef,
    wrapperTarget: wrapperRef,
    itemWidth: 60,
    overscan: 10,
  });
  return (
    <>
      <div style={{ textAlign: "right", marginBottom: 16 }}>
        <input
          style={{ width: 120 }}
          placeholder="line number"
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <button
          style={{ marginLeft: 8 }}
          type="button"
          onClick={() => {
            scrollTo(Number(value));
          }}
        >
          scroll to
        </button>
      </div>
      <div
        ref={containerRef}
        style={{
          width: "300px",
          height: "200px",
          overflow: "auto",
          border: "1px solid",
        }}
      >
        <div ref={wrapperRef} style={{ display: "flex", height: "100%" }}>
          {list.map((ele) => (
            <div
              style={{
                width: 52,
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                border: "1px solid #e8e8e8",
                marginLeft: 8,
              }}
              key={ele.index}
            >
              Row: {ele.data}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
