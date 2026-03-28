import { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import ReportForm from "../app/components/ReportForm";
import BatchReportGenerator from "../app/components/BatchReportGenerator";
import ReportHistory from "../app/components/ReportHistory";

export default function Home() {
  const { data: session, status } = useSession();
  const [mode, setMode] = useState<"single" | "batch">("single");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (status === "loading") {
    return (
      <div style={{ 
        minHeight: "100vh", 
        backgroundColor: "#0a0c10", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center" 
      }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <div style={{ 
            width: "8px", 
            height: "8px", 
            backgroundColor: "#06b6d4", 
            borderRadius: "50%",
            animation: "bounce 1s infinite"
          }} />
          <div style={{ 
            width: "8px", 
            height: "8px", 
            backgroundColor: "#06b6d4", 
            borderRadius: "50%",
            animation: "bounce 1s infinite 0.1s"
          }} />
          <div style={{ 
            width: "8px", 
            height: "8px", 
            backgroundColor: "#06b6d4", 
            borderRadius: "50%",
            animation: "bounce 1s infinite 0.2s"
          }} />
        </div>
        <style>{`
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
        `}</style>
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        backgroundColor: "#0a0c10", 
        display: "flex", 
        flexDirection: "column",
        alignItems: "center", 
        justifyContent: "center",
        padding: "0 16px"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ 
            width: "48px", 
            height: "48px", 
            margin: "0 auto 16px",
            background: "linear-gradient(135deg, #06b6d4, #2563eb)",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 style={{ fontSize: "20px", fontWeight: "bold", color: "white", marginBottom: "4px" }}>
            AI 周报助手
          </h1>
          <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "24px" }}>
            智能生成专业周报
          </p>
          <button
            onClick={() => signIn("github")}
            style={{
              padding: "10px 20px",
              backgroundColor: "#1f2937",
              color: "white",
              border: "1px solid #374151",
              borderRadius: "8px",
              fontSize: "14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              margin: "0 auto"
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            使用 GitHub 登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0a0c10" }}>
      {/* 顶部导航 */}
      <header style={{ 
        backgroundColor: "#111318", 
        borderBottom: "1px solid #1f2937"
      }}>
        <div style={{ 
          maxWidth: "960px", 
          margin: "0 auto", 
          padding: "0 16px",
          height: "56px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          {/* 左侧 Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ 
              width: "32px", 
              height: "32px", 
              background: "linear-gradient(135deg, #06b6d4, #0891b2)",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span style={{ fontSize: "15px", fontWeight: "600", color: "#e5e7eb" }}>
              AI 周报助手
            </span>
          </div>

          {/* 右侧用户信息 */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "8px",
              padding: "4px 10px",
              backgroundColor: "#1f2937",
              borderRadius: "6px",
              border: "1px solid #374151"
            }}>
              {session.user?.image ? (
                <img 
                  src={session.user.image} 
                  alt=""
                  style={{ width: "22px", height: "22px", borderRadius: "50%" }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    const parent = (e.target as HTMLImageElement).parentElement;
                    if (parent) {
                      const fallback = document.createElement('div');
                      fallback.style.cssText = 'width:22px;height:22px;border-radius:50%;background:#4b5563;display:flex;align-items:center;justify-content:center;font-size:11px;color:white;';
                      fallback.textContent = session.user?.name?.[0]?.toUpperCase() || '?';
                      parent.insertBefore(fallback, e.target as HTMLImageElement);
                    }
                  }}
                />
              ) : (
                <div style={{ 
                  width: "22px", 
                  height: "22px", 
                  borderRadius: "50%", 
                  backgroundColor: "#4b5563",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  color: "white"
                }}>
                  {session.user?.name?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <span style={{ fontSize: "13px", color: "#d1d5db" }}>
                {session.user?.name}
              </span>
            </div>
            <button
              onClick={() => signOut()}
              style={{
                padding: "6px",
                backgroundColor: "transparent",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                color: "#6b7280"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#d1d5db")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7280")}
              title="退出登录"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main style={{ maxWidth: "960px", margin: "0 auto", padding: "24px 16px" }}>
        {/* 模式切换 */}
        <div style={{ 
          display: "flex", 
          gap: "8px", 
          marginBottom: "16px",
          padding: "4px",
          backgroundColor: "#111318",
          border: "1px solid #1f2937",
          borderRadius: "8px",
          width: "fit-content"
        }}>
          <button
            onClick={() => setMode("single")}
            style={{
              padding: "6px 16px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              fontSize: "13px",
              backgroundColor: mode === "single" ? "#06b6d4" : "transparent",
              color: mode === "single" ? "white" : "#9ca3af"
            }}
          >
            单周生成
          </button>
          <button
            onClick={() => setMode("batch")}
            style={{
              padding: "6px 16px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              fontSize: "13px",
              backgroundColor: mode === "batch" ? "#06b6d4" : "transparent",
              color: mode === "batch" ? "white" : "#9ca3af"
            }}
          >
            批量生成
          </button>
        </div>

        <div style={{ 
          display: "grid", 
          gridTemplateColumns: isMobile ? "1fr" : (mode === "single" ? "1fr 280px" : "1fr"), 
          gap: "16px" 
        }}>
          {/* 左侧：表单 */}
          <div>
            <div style={{ 
              backgroundColor: "#111318", 
              border: "1px solid #1f2937",
              borderRadius: "12px",
              padding: "20px"
            }}>
              {mode === "single" ? <ReportForm /> : <BatchReportGenerator />}
            </div>
          </div>
          {/* 右侧：历史记录（仅在单周模式显示） */}
          {mode === "single" && (
            <div>
              <ReportHistory />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
