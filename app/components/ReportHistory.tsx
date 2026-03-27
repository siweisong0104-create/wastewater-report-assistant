"use client";
import { useEffect, useState } from "react";

export default function ReportHistory() {
  const [history, setHistory] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    const loadHistory = () => {
      const stored = JSON.parse(localStorage.getItem("reportHistory") || "[]");
      setHistory(stored);
    };
    loadHistory();
    window.addEventListener("storage", loadHistory);
    return () => window.removeEventListener("storage", loadHistory);
  }, []);

  if (history.length === 0) {
    return (
      <div style={{
        backgroundColor: "#111318",
        border: "1px solid #1f2937",
        borderRadius: "12px",
        padding: "16px"
      }}>
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "8px",
          marginBottom: "12px"
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 style={{ fontSize: "13px", fontWeight: 500, color: "#9ca3af" }}>
            历史记录
          </h2>
        </div>
        <p style={{ fontSize: "12px", color: "#4b5563", textAlign: "center", padding: "20px 0" }}>
          暂无历史记录
        </p>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: "#111318",
      border: "1px solid #1f2937",
      borderRadius: "12px",
      overflow: "hidden"
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 16px",
        backgroundColor: "#1a1d24",
        borderBottom: "1px solid #1f2937"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 style={{ fontSize: "13px", fontWeight: 500, color: "#9ca3af" }}>
            历史记录
          </h2>
        </div>
        <span style={{ fontSize: "11px", color: "#4b5563" }}>
          {history.length}
        </span>
      </div>
      <div style={{ maxHeight: "420px", overflowY: "auto" }}>
        {history.map((item, idx) => (
          <div
            key={idx}
            style={{
              borderBottom: idx < history.length - 1 ? "1px solid #1f2937" : "none"
            }}
          >
            <button
              onClick={() => setExpanded(expanded === idx ? null : idx)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "12px 16px",
                background: "none",
                border: "none",
                cursor: "pointer"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#1a1d24";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <p style={{
                fontSize: "12px",
                lineHeight: "1.6",
                color: "#9ca3af",
                display: expanded === idx ? "block" : "-webkit-box",
                WebkitLineClamp: expanded === idx ? undefined : 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden"
              }}>
                {item}
              </p>
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "2px",
                marginTop: "8px",
                fontSize: "11px",
                color: "#6b7280"
              }}>
                {expanded === idx ? "收起" : "展开"}
                <svg 
                  width="14" 
                  height="14" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  style={{
                    transform: expanded === idx ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s"
                  }}
                >
                  <path d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
