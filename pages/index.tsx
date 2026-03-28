import { useState, useEffect, useRef } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import ReportForm from "../app/components/ReportForm";
import BatchReportGenerator from "../app/components/BatchReportGenerator";
import ReportHistory from "../app/components/ReportHistory";

// 测试数据
const testData = {
  names: ["王建国", "李大炮", "张铁柱", "赵富贵", "刘二狗", "孙大壮", "周小波", "吴师傅"],
  tasks: [
    "本周对格栅机进行了例行维护，清理出的杂物中居然发现了一只完好的手机壳，看来我们的格栅过滤效果确实不错",
    "完成了曝气系统的全面检修，更换了15个老化曝气头。拆下来的旧曝气头已经服役三年，算是功成身退了",
    "优化了加药系统的投加曲线，现在药剂投加比我的减肥计划还要精准——该多的时候绝不少，该少的时候绝不多"
  ],
  achievements: [
    "本周出水COD稳定在42mg/L以下，氨氮和总磷全部达标。水质这么好，连化验室的锦鲤都游得更欢了",
    "设备完好率99.1%，故障停机时间仅1.5小时。这稳定性比我坚持早睡早起还要可靠",
    "药剂单耗环比下降8%，在不牺牲处理效果的前提下实现了降本增效，可谓是既要马儿跑又要马儿少吃草"
  ],
  dataMetrics: [
    "本周累计处理水量：31,500吨，日均4500吨。按照每人每天用水150升计算，相当于服务了21万人",
    "进水COD 320mg/L，出水42mg/L，去除率86.9%。这组数据如果放在考试成绩里，妥妥的A+",
    "氨氮去除率91.5%，总磷去除率88.2%，均优于设计标准。各项指标就像交响乐团一样和谐统一"
  ],
  issues: [
    "2#鼓风机出现异常振动，经检查发现是轴承磨损所致。及时更换后恢复正常，这轴承也算是鞠躬尽瘁了",
    "进水PH值出现过两次短时波动，通过加大中和剂投加量及时缓冲，没让生化系统受到惊吓",
    "污泥泵出现间歇性堵塞，拆开一看原来是几片树叶在作怪。格栅以后得更加留意这些'漏网之鱼'"
  ],
  collaboration: [
    "配合第三方检测机构完成季度取样，准备充分、配合默契，顺利通过了这次'突击考试'",
    "协助维修班组完成年度设备大修，分工明确、配合得当，提前半天完成了既定任务",
    "对两位新来的实习生进行了系统培训，从工艺流程到操作规程倾囊相授，希望他们早日独当一面"
  ],
  learning: [
    "研读了《城镇污水处理厂运行维护及安全技术规程》2024版的新增条款，更新了自己的知识储备",
    "学习了污泥厌氧消化工艺的原理与应用，虽然本站暂未采用，但多了解总是有益无害",
    "参加了在线监测设备厂家组织的技术培训，掌握了新款仪表的维护要点"
  ],
  nextWeek: [
    "计划对生化池进行全面巡检，重点观察曝气均匀性和污泥性状，确保工艺运行状态良好",
    "准备更换3#沉淀池的刮泥机链条，新链条已到货，就等时机成熟进行更换",
    "开展一次针对性的应急演练，模拟进水COD突增场景，检验大家的实战应变能力"
  ]
};

export default function Home() {
  const { data: session, status } = useSession();
  const [mode, setMode] = useState<"single" | "batch">("single");
  const [isMobile, setIsMobile] = useState(false);
  const reportFormRef = useRef<{ fillTestData: () => void } | null>(null);

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
          alignItems: "center",
          gap: "12px",
          marginBottom: "16px",
          flexWrap: "wrap"
        }}>
          <div style={{ 
            display: "flex", 
            gap: "8px", 
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
          
          {/* 测试填充按钮 */}
          {mode === "single" && (
            <button
              onClick={() => {
                // 触发自定义事件来填充表单
                window.dispatchEvent(new CustomEvent('fillTestData'));
              }}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px dashed #8b5cf6",
                cursor: "pointer",
                fontSize: "12px",
                backgroundColor: "rgba(139, 92, 246, 0.1)",
                color: "#a78bfa",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}
              title="一键填充测试数据"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              测试填充
            </button>
          )}
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
