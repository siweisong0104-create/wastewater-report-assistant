"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

// 年份选项
const generateYearOptions = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const years: number[] = [];
  for (let year = currentYear - 5; year <= currentYear + 5; year++) {
    years.push(year);
  }
  return years.reverse();
};

const yearOptions = generateYearOptions();
const monthOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const getMaxWeeksInMonth = (year: number, month: number) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  return daysInMonth >= 29 ? 5 : 4;
};

// 生成周列表（从开始日期到结束日期之间的所有周）
const generateWeekList = (startYear: number, startMonth: number, startWeek: number, endYear: number, endMonth: number, endWeek: number) => {
  const weeks: { year: number; month: number; week: number; label: string }[] = [];
  let currentYear = startYear;
  let currentMonth = startMonth;
  let currentWeek = startWeek;

  // 添加起始周
  weeks.push({ year: currentYear, month: currentMonth, week: currentWeek, label: `${currentYear}年${currentMonth}月第${currentWeek}周` });

  // 循环添加周直到达到结束日期
  while (!(currentYear === endYear && currentMonth === endMonth && currentWeek === endWeek)) {
    const maxWeeks = getMaxWeeksInMonth(currentYear, currentMonth);
    
    if (currentWeek < maxWeeks) {
      currentWeek++;
    } else {
      currentWeek = 1;
      if (currentMonth < 12) {
        currentMonth++;
      } else {
        currentMonth = 1;
        currentYear++;
      }
    }
    
    weeks.push({ year: currentYear, month: currentMonth, week: currentWeek, label: `${currentYear}年${currentMonth}月第${currentWeek}周` });
  }

  return weeks;
};

interface BatchReport {
  weekLabel: string;
  content: string;
  loading: boolean;
  error?: string;
}

export default function BatchReportGenerator() {
  const { data: session } = useSession();
  
  // 开始日期
  const [startYear, setStartYear] = useState<number | null>(null);
  const [startMonth, setStartMonth] = useState<number | null>(null);
  const [startWeek, setStartWeek] = useState<number>(1);
  const [startMaxWeeks, setStartMaxWeeks] = useState<number>(4);
  
  // 结束日期
  const [endYear, setEndYear] = useState<number | null>(null);
  const [endMonth, setEndMonth] = useState<number | null>(null);
  const [endWeek, setEndWeek] = useState<number>(1);
  const [endMaxWeeks, setEndMaxWeeks] = useState<number>(4);
  
  // 批量生成内容
  const [name, setName] = useState("");
  const [mainTasks, setMainTasks] = useState("");
  const [keyAchievements, setKeyAchievements] = useState("");
  const [tone, setTone] = useState<"formal" | "casual">("formal");
  
  const [reports, setReports] = useState<BatchReport[]>([]);
  const [generating, setGenerating] = useState(false);
  const [historyData, setHistoryData] = useState<string[]>([]);

  // 读取历史记录
  useEffect(() => {
    const history = JSON.parse(localStorage.getItem("reportHistory") || "[]");
    setHistoryData(history);
  }, []);

  const handleStartYearChange = (year: number | null) => {
    setStartYear(year);
    if (year && startMonth) {
      setStartMaxWeeks(getMaxWeeksInMonth(year, startMonth));
    }
  };

  const handleStartMonthChange = (month: number | null) => {
    setStartMonth(month);
    if (startYear && month) {
      setStartMaxWeeks(getMaxWeeksInMonth(startYear, month));
    }
  };

  const handleEndYearChange = (year: number | null) => {
    setEndYear(year);
    if (year && endMonth) {
      setEndMaxWeeks(getMaxWeeksInMonth(year, endMonth));
    }
  };

  const handleEndMonthChange = (month: number | null) => {
    setEndMonth(month);
    if (endYear && month) {
      setEndMaxWeeks(getMaxWeeksInMonth(endYear, month));
    }
  };

  const generateBatchReports = async () => {
    if (!startYear || !startMonth || !endYear || !endMonth || !name || !mainTasks) {
      alert("请填写完整信息");
      return;
    }

    const weeks = generateWeekList(startYear, startMonth, startWeek, endYear, endMonth, endWeek);
    
    if (weeks.length > 10) {
      alert("一次最多生成10周的周报，请缩小时间范围");
      return;
    }

    setGenerating(true);
    setReports(weeks.map(w => ({ weekLabel: w.label, content: "", loading: true })));

    // 依次生成每周的周报
    for (let i = 0; i < weeks.length; i++) {
      const week = weeks[i];
      
      try {
        const res = await fetch("/api/generate-batch-report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            weekLabel: week.label,
            mainTasks,
            keyAchievements,
            tone,
            historyData: historyData.slice(0, 3), // 传递最近3条历史记录作为参考
            weekIndex: i,
            totalWeeks: weeks.length
          }),
          credentials: "include",
        });

        const data = await res.json();
        
        setReports(prev => {
          const newReports = [...prev];
          newReports[i] = {
            weekLabel: week.label,
            content: data.report || "生成失败",
            loading: false,
            error: data.error
          };
          return newReports;
        });

        // 保存到历史记录
        if (data.report) {
          const history = JSON.parse(localStorage.getItem("reportHistory") || "[]");
          const newHistory = [data.report, ...history].slice(0, 5);
          localStorage.setItem("reportHistory", JSON.stringify(newHistory));
        }

        // 延迟一下再生成下一周，避免请求过快
        if (i < weeks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (err) {
        setReports(prev => {
          const newReports = [...prev];
          newReports[i] = {
            weekLabel: week.label,
            content: "",
            loading: false,
            error: "请求失败"
          };
          return newReports;
        });
      }
    }

    setGenerating(false);
    // 刷新历史记录
    const updatedHistory = JSON.parse(localStorage.getItem("reportHistory") || "[]");
    setHistoryData(updatedHistory);
    window.dispatchEvent(new Event("storage"));
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    backgroundColor: "#1a1d24",
    border: "1px solid #2a2e3a",
    borderRadius: "6px",
    fontSize: "13px",
    color: "#e5e7eb",
    outline: "none"
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "12px",
    color: "#9ca3af",
    fontWeight: 500,
    marginBottom: "6px",
    display: "block"
  };

  return (
    <div>
      {/* 基本信息 */}
      <div style={{ marginBottom: "20px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#e5e7eb", marginBottom: "12px" }}>
          📋 批量生成设置
        </h3>
        
        {/* 姓名 */}
        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle}>姓名 *</label>
          <input
            type="text"
            placeholder="请输入您的姓名"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{...inputStyle, height: "38px"}}
          />
        </div>

        {/* 时间范围 */}
        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle}>时间范围 *</label>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "12px", color: "#6b7280" }}>从</span>
            <select
              value={startYear || ""}
              onChange={(e) => handleStartYearChange(e.target.value ? parseInt(e.target.value) : null)}
              style={{...inputStyle, width: "80px", height: "36px"}}
            >
              <option value="">年</option>
              {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select
              value={startMonth || ""}
              onChange={(e) => handleStartMonthChange(e.target.value ? parseInt(e.target.value) : null)}
              disabled={!startYear}
              style={{...inputStyle, width: "65px", height: "36px", opacity: startYear ? 1 : 0.5}}
            >
              <option value="">月</option>
              {monthOptions.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select
              value={startWeek}
              onChange={(e) => setStartWeek(parseInt(e.target.value))}
              disabled={!startYear || !startMonth}
              style={{...inputStyle, width: "75px", height: "36px", opacity: (startYear && startMonth) ? 1 : 0.5}}
            >
              {Array.from({ length: startMaxWeeks }, (_, i) => i + 1).map(w => (
                <option key={w} value={w}>第{w}周</option>
              ))}
            </select>

            <span style={{ fontSize: "12px", color: "#6b7280", marginLeft: "8px" }}>至</span>
            
            <select
              value={endYear || ""}
              onChange={(e) => handleEndYearChange(e.target.value ? parseInt(e.target.value) : null)}
              style={{...inputStyle, width: "80px", height: "36px"}}
            >
              <option value="">年</option>
              {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select
              value={endMonth || ""}
              onChange={(e) => handleEndMonthChange(e.target.value ? parseInt(e.target.value) : null)}
              disabled={!endYear}
              style={{...inputStyle, width: "65px", height: "36px", opacity: endYear ? 1 : 0.5}}
            >
              <option value="">月</option>
              {monthOptions.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select
              value={endWeek}
              onChange={(e) => setEndWeek(parseInt(e.target.value))}
              disabled={!endYear || !endMonth}
              style={{...inputStyle, width: "75px", height: "36px", opacity: (endYear && endMonth) ? 1 : 0.5}}
            >
              {Array.from({ length: endMaxWeeks }, (_, i) => i + 1).map(w => (
                <option key={w} value={w}>第{w}周</option>
              ))}
            </select>
          </div>
        </div>

        {/* 主要完成任务 */}
        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle}>此期间主要完成任务 *</label>
          <textarea
            placeholder="请描述这段时间内完成的主要工作任务，例如：
• 完成生化池清淤维护
• 更换老化曝气头设备
• 配合环保部门检查"
            value={mainTasks}
            onChange={(e) => setMainTasks(e.target.value)}
            style={{...inputStyle, height: "100px", resize: "vertical"}}
          />
        </div>

        {/* 关键成果 */}
        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle}>关键成果（选填）</label>
          <textarea
            placeholder="请描述这段时间取得的关键成果，例如：
• 出水达标率100%
• 设备完好率提升"
            value={keyAchievements}
            onChange={(e) => setKeyAchievements(e.target.value)}
            style={{...inputStyle, height: "80px", resize: "vertical"}}
          />
        </div>

        {/* 风格选择 */}
        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle}>报告风格</label>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => setTone("formal")}
              style={{
                padding: "6px 16px",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
                backgroundColor: tone === "formal" ? "#374151" : "#1a1d24",
                color: tone === "formal" ? "white" : "#9ca3af",
                fontSize: "12px"
              }}
            >
              正式
            </button>
            <button
              onClick={() => setTone("casual")}
              style={{
                padding: "6px 16px",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
                backgroundColor: tone === "casual" ? "#374151" : "#1a1d24",
                color: tone === "casual" ? "white" : "#9ca3af",
                fontSize: "12px"
              }}
            >
              轻松
            </button>
          </div>
        </div>

        {/* 生成按钮 */}
        <button
          onClick={generateBatchReports}
          disabled={generating}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: generating ? "#0891b2" : "#06b6d4",
            color: "white",
            fontSize: "14px",
            fontWeight: 500,
            border: "none",
            borderRadius: "8px",
            cursor: generating ? "not-allowed" : "pointer",
            opacity: generating ? 0.7 : 1
          }}
        >
          {generating ? (
            <span>正在批量生成... ({reports.filter(r => !r.loading).length}/{reports.length})</span>
          ) : (
            "开始批量生成"
          )}
        </button>
      </div>

      {/* 生成结果 */}
      {reports.length > 0 && (
        <div>
          <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#e5e7eb", marginBottom: "12px" }}>
            📄 生成结果 ({reports.filter(r => !r.loading).length}/{reports.length})
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {reports.map((report, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: "#1a1d24",
                  border: "1px solid #2a2e3a",
                  borderRadius: "8px",
                  overflow: "hidden"
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 12px",
                    backgroundColor: "#1f2937",
                    borderBottom: "1px solid #2a2e3a"
                  }}
                >
                  <span style={{ fontSize: "13px", fontWeight: 500, color: "#06b6d4" }}>
                    {report.weekLabel}
                  </span>
                  {report.loading ? (
                    <span style={{ fontSize: "11px", color: "#6b7280" }}>生成中...</span>
                  ) : report.error ? (
                    <span style={{ fontSize: "11px", color: "#ef4444" }}>失败</span>
                  ) : (
                    <button
                      onClick={() => navigator.clipboard.writeText(report.content)}
                      style={{
                        padding: "4px 10px",
                        fontSize: "11px",
                        borderRadius: "4px",
                        border: "none",
                        cursor: "pointer",
                        backgroundColor: "#374151",
                        color: "#d1d5db"
                      }}
                    >
                      复制
                    </button>
                  )}
                </div>
                <div style={{ padding: "12px" }}>
                  {report.loading ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#6b7280", fontSize: "13px" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                        <path d="M12 2a10 10 0 0110 10" strokeOpacity="1">
                          <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite" />
                        </path>
                      </svg>
                      正在生成周报内容...
                    </div>
                  ) : report.error ? (
                    <span style={{ color: "#ef4444", fontSize: "13px" }}>{report.error}</span>
                  ) : (
                    <div
                      style={{
                        fontSize: "13px",
                        lineHeight: "1.7",
                        color: "#d1d5db",
                        whiteSpace: "pre-wrap",
                        maxHeight: "200px",
                        overflowY: "auto"
                      }}
                    >
                      {report.content}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
