"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import ReportExport from "./ReportExport";

// 生成年份选项（前后5年，共10年）
const generateYearOptions = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const years: number[] = [];
  
  // 生成本年及前后各5年
  for (let year = currentYear - 5; year <= currentYear + 5; year++) {
    years.push(year);
  }
  
  return years.reverse(); // 最新的在前面
};

const yearOptions = generateYearOptions();
const monthOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

// 获取某月的最大周数
const getMaxWeeksInMonth = (year: number, month: number) => {
  // 大月31天可能有5周，小月30天可能有5周，2月通常4周
  const daysInMonth = new Date(year, month, 0).getDate();
  return daysInMonth >= 29 ? 5 : 4;
};

// 污水设备运营人员的预设内容
const presets: Record<string, string[]> = {
  tasks: [
    "完成污水处理站A区曝气系统检修，更换老化曝气头12个",
    "对进水口格栅进行清理维护，清除杂物约150公斤",
    "监测并记录各工艺段水质指标，确保出水达标排放",
    "配合第三方检测机构完成月度水质取样检测工作"
  ],
  achievements: [
    "本周出水COD指标稳定在45mg/L以下，优于国家一级A标准",
    "污泥脱水设备运行效率提升15%，降低药剂消耗约200公斤",
    "成功处理进水突发高浓度事件1起，保障系统稳定运行",
    "设备故障率环比下降40%，有效降低停机时间"
  ],
  dataMetrics: [
    "本周处理污水量：28500吨，日平均4071吨",
    "进水COD：320mg/L，出水COD：42mg/L，去除率86.9%",
    "氨氮去除率：91.2%，总磷去除率：88.5%",
    "设备综合完好率：98.5%，故障停机时长：2.5小时"
  ],
  issues: [
    "2#污泥泵出现异响 → 及时更换轴承，恢复正常运行",
    "曝气池溶解氧偏低 → 调整曝气量，优化工艺参数",
    "在线监测仪数据漂移 → 完成校准维护，确保数据准确"
  ],
  collaboration: [
    "配合环保部门完成突击检查，提供运行记录台账",
    "协助维修团队完成鼓风机预防性保养",
    "为新入职员工进行操作规程培训",
    "参与公司安全生产会议，汇报运营情况"
  ],
  learning: [
    "学习《城镇污水处理厂运行管理规范》新标准",
    "掌握污泥浓度在线监测仪的日常维护要点",
    "了解新型生物脱氮除磷工艺的原理与应用",
    "完成特种设备操作安全培训"
  ],
  nextWeek: [
    "对生化池进行清淤维护，确保处理效率",
    "完成季度设备润滑保养计划",
    "配合准备环保督查相关材料",
    "开展应急预案演练，提升应急处置能力"
  ]
};

// 🎌 动漫主题测试数据 - 让周报变得有趣！
const animeTestData = {
  names: [
    "漩涡鸣人", "宇智波佐助", "旗木卡卡西", "春野樱", "路飞", "索隆", 
    "山治", "娜美", "炭治郎", "我妻善逸", "嘴平伊之助", "五条悟",
    "虎杖悠仁", "伏黑惠", "艾伦·耶格尔", "利威尔兵长", "阿尼亚",
    "约尔·福杰", "劳埃德·福杰", "琦玉", "杰诺斯", "坂田银时"
  ],
  
  tasks: [
    "像路飞一样充满干劲地完成了格栅清理工作，虽然中途肚子饿了三次，但最终还是坚持到了最后",
    "参考索隆的三刀流理念，创新性地采用三重过滤系统对进水进行预处理，效果显著",
    "模仿卡卡西的雷切，使用高压水枪快速清除了曝气池底部的顽固淤泥，效率提升200%",
    "受到善逸雷之呼吸的启发，优化了鼓风机的运行模式，现在曝气系统运转得像闪电一样快",
    "学习五条悟的无限咒术原理，设计了一套无限循环的水质监测系统，24小时不间断运行",
    "借鉴阿尼亚的读心术，通过观察设备运行声音就能预判故障，成功避免了3次设备停机",
    "效仿利威尔兵长的洁癖，对机房进行了360度无死角清洁，连一根头发丝都没放过",
    "用鸣人的影分身之术理念，同时监控了5个工艺段的运行数据， multitasking技能点满",
    "像埼玉一样一拳（键）解决了控制系统的小bug，虽然过程有点无聊但结果很完美",
    "模仿银时的武士道精神，即使在暴雨天气也坚守岗位，按时完成了水质取样任务"
  ],
  
  achievements: [
    "本周COD去除率达到了95%，就像鸣人的仙人模式一样强大，让出水水质达到完美状态",
    "成功处理了进水TN突增事件，像佐助开启须佐能乎一样精准控制，保护了生化系统",
    "污泥脱水效率提升18%，比娜美的航海术还要精准地控制了药剂投加量",
    "设备故障率降到历史最低0.5%，就像琦玉老师一样无敌，什么故障都打不倒我们",
    "出水氨氮稳定在1mg/L以下，纯净得像阿尼亚的心灵感应一样清澈透明",
    "完成了本季度所有维护任务，像调查兵团完成壁外调查一样凯旋归来，零伤亡！",
    "节能降耗效果显著，就像龟派气功一样用最少的能量打出了最大的效果",
    "团队协作效率MAX，像草帽海贼团一样默契配合，共同攻克了技术难题"
  ],
  
  dataMetrics: [
    "本周处理污水量：32000吨，相当于320个阿尼亚的饭量（她可是很能吃的）",
    "进水COD 350mg/L → 出水COD 38mg/L，去除率89.1%，比雷之呼吸还要犀利",
    "DO维持在3.5mg/L，就像呼吸一样自然稳定，连善逸都不会恐慌了",
    "污泥龄15天，像千年杀一样精准控制（啊，是专业的工艺控制！）",
    "设备完好率99.2%，只有2小时非计划停机，比银时的工作时间还短",
    "药剂消耗减少12%，省下的钱可以买很多草莓蛋糕（阿尼亚最喜欢了）"
  ],
  
  issues: [
    "1#提升泵异响 → 像发现巨人一样迅速响应，更换了机械密封后恢复正常，堵住了漏洞",
    "在线PH仪数据漂移 → 用写轮眼般的精准度完成了校准，现在数据比佐助还要稳定",
    "污泥泵堵塞 → 像路飞开二档一样全力疏通，清理出大量杂物，管道畅通无阻",
    "鼓风机温度偏高 → 借鉴炎之呼吸的散热原理，清理了冷却系统，温度恢复正常",
    "加药泵流量不稳 → 像五条悟的无下限术式一样精准调节，流量控制完美达成",
    "控制系统通讯中断 → 像程序员杰诺斯一样快速修复，系统重新上线运行"
  ],
  
  collaboration: [
    "配合环保检查就像参加中忍考试一样认真准备，台账资料齐全，一次通过",
    "帮助新员工培训，像卡卡西老师带第七班一样耐心，现在他们都能独立操作了",
    "与维修团队协作完成设备保养，配合得像索隆和山治（虽然平时吵架但关键时刻很靠谱）",
    "参加安全生产会议，像英雄协会开会一样严肃认真地汇报了S级（重大）运营情况",
    "协助实验室完成取样检测，配合默契得像虎杖和伏黑，数据准确率100%",
    "和同事们一起加班处理突发情况，团队精神像鬼杀队一样坚韧不屈"
  ],
  
  learning: [
    "学习了新的脱氮工艺，像习得新忍术一样兴奋，已经迫不及待想在实践中试试了",
    "研究了智能控制系统，感觉自己像杰诺斯一样变成了高科技战士（虽然还是人类）",
    "了解了碳中和相关政策，立志要像保护同伴一样保护我们的环境",
    "掌握了应急处理预案，就算遇到比九尾还可怕的突发状况也能从容应对",
    "学习了数据分析方法，现在看运行数据就像看动漫剧情一样津津有味",
    "参加了安全培训，记住了所有安全规范，比阿尼亚记住考试答案还要认真"
  ],
  
  nextWeek: [
    "计划对生化池进行全面体检，像给巨人做全身检查一样仔细，确保每个环节都正常",
    "准备更换老化的曝气头，像更换忍具一样准备充分，新装备已经在路上了",
    "开展应急演练，模拟各种突发情况，训练反应速度要像开启八门遁甲一样快",
    "整理上半年的运行数据，像整理航海日志一样认真，为下半年制定更完美的计划",
    "申请参加高级培训，提升自己的专业水平，目标是成为污水处理界的六道仙人",
    "优化加药系统参数，追求极致的控制精度，像无限列车一样稳定向前奔跑"
  ]
};

// 定义表单类型
type FormType = {
  name: string;
  date: string;
  tasks: string;
  achievements: string;
  issues: string;
  nextWeek: string;
  dataMetrics: string;
  collaboration: string;
  learning: string;
  tone: string;
};

export default function ReportForm() {
  const { data: session } = useSession();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const [form, setForm] = useState<FormType>({
    name: "",
    date: "",
    tasks: "",
    achievements: "",
    issues: "",
    nextWeek: "",
    dataMetrics: "",
    collaboration: "",
    learning: "",
    tone: "formal"
  });
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [maxWeeks, setMaxWeeks] = useState<number>(4);
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [openPreset, setOpenPreset] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);

  const applyPreset = (field: keyof FormType, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setOpenPreset(null);
  };

  const handleYearChange = (year: number | null) => {
    setSelectedYear(year);
    updateDate(year, selectedMonth, null);
  };

  const handleMonthChange = (month: number | null) => {
    setSelectedMonth(month);
    updateDate(selectedYear, month, null);
  };

  const updateDate = (year: number | null, month: number | null, week: number | null) => {
    if (year && month) {
      const weeks = getMaxWeeksInMonth(year, month);
      setMaxWeeks(weeks);
      
      // 如果传入了周数，则更新完整日期
      if (week) {
        const fullDate = `${year}年${month}月第${week}周`;
        setForm(prev => ({ ...prev, date: fullDate }));
      } else {
        // 只有年月时，如果周数超出范围，清空日期
        if (form.date) {
          const currentWeek = parseInt(form.date.match(/第(\d+)周/)?.[1] || "1");
          if (currentWeek > weeks) {
            setForm(prev => ({ ...prev, date: "" }));
          }
        }
      }
    } else {
      setForm(prev => ({ ...prev, date: "" }));
    }
  };

  const handleWeekChange = (week: number) => {
    updateDate(selectedYear, selectedMonth, week);
  };

  // 🎌 一键填充测试数据
  const fillTestData = () => {
    const randomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
    
    // 随机选择年月周
    const year = new Date().getFullYear();
    const month = Math.floor(Math.random() * 12) + 1;
    const week = Math.floor(Math.random() * 4) + 1;
    
    setSelectedYear(year);
    setSelectedMonth(month);
    
    setForm({
      name: randomItem(animeTestData.names),
      date: `${year}年${month}月第${week}周`,
      tasks: randomItem(animeTestData.tasks),
      achievements: randomItem(animeTestData.achievements),
      issues: randomItem(animeTestData.issues),
      dataMetrics: randomItem(animeTestData.dataMetrics),
      collaboration: randomItem(animeTestData.collaboration),
      learning: randomItem(animeTestData.learning),
      nextWeek: randomItem(animeTestData.nextWeek),
      tone: "professional"
    });
    
    // 显示提示
    alert("🎉 测试数据已填充！来自二次元世界的运营周报已准备好~\n\n点击「生成周报」即可查看AI扩写后的效果！");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setLoading(true);
    try {
      const res = await fetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setReport(data.report);
        saveToHistory(data.report);
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert("请求失败");
    } finally {
      setLoading(false);
    }
  };

  const saveToHistory = (newReport: string) => {
    const history = JSON.parse(localStorage.getItem("reportHistory") || "[]");
    const newHistory = [newReport, ...history].slice(0, 5);
    localStorage.setItem("reportHistory", JSON.stringify(newHistory));
    window.dispatchEvent(new Event("storage"));
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    backgroundColor: "#1a1d24",
    border: "1px solid #2a2e3a",
    borderRadius: "6px",
    fontSize: "13px",
    color: "#e5e7eb",
    resize: "none",
    outline: "none",
    transition: "border-color 0.2s, background-color 0.2s"
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "12px",
    color: "#9ca3af",
    fontWeight: 500,
    marginBottom: "6px",
    display: "block"
  };

  // 辅助函数：获取字段值
  const getFieldValue = (fieldName: keyof FormType): string => {
    return form[fieldName];
  };

  // 辅助函数：设置字段值
  const setFieldValue = (fieldName: keyof FormType, value: string) => {
    setForm(prev => ({ ...prev, [fieldName]: value }));
  };

  const FieldGroup = ({
    label,
    field,
    placeholder,
    rows = 2,
    required = false
  }: {
    label: string;
    field: keyof FormType;
    placeholder: string;
    rows?: number;
    required?: boolean;
  }) => {
    const fieldValue = getFieldValue(field);
    const fieldPresets = presets[field] || [];
    
    return (
      <div style={{ position: "relative" }}>
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          marginBottom: "6px"
        }}>
          <label style={labelStyle}>
            {label}
            {required && <span style={{ color: "#ef4444" }}>*</span>}
          </label>
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setOpenPreset(openPreset === field ? null : field)}
              style={{
                fontSize: "11px",
                color: "#6b7280",
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "2px 6px",
                borderRadius: "4px"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#06b6d4")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7280")}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              填充
            </button>
            {openPreset === field && (
              <>
                <div 
                  style={{ position: "fixed", inset: 0, zIndex: 10 }} 
                  onClick={() => setOpenPreset(null)} 
                />
                <div style={{
                  position: "absolute",
                  right: 0,
                  top: "28px",
                  width: "320px",
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  padding: "4px 0",
                  maxHeight: "240px",
                  overflowY: "auto",
                  zIndex: 20,
                  boxShadow: "0 10px 40px rgba(0,0,0,0.5)"
                }}>
                  {fieldPresets.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setFieldValue(field, item);
                        setOpenPreset(null);
                      }}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        textAlign: "left",
                        fontSize: "12px",
                        color: "#d1d5db",
                        background: "none",
                        border: "none",
                        borderBottom: idx < fieldPresets.length - 1 ? "1px solid #374151" : "none",
                        cursor: "pointer",
                        lineHeight: "1.5"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#374151";
                        e.currentTarget.style.color = "white";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "#d1d5db";
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        <textarea
          placeholder={placeholder}
          value={fieldValue}
          onChange={(e) => setFieldValue(field, e.target.value)}
          style={inputStyle}
          rows={rows}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#0891b2";
            e.currentTarget.style.backgroundColor = "#1f2937";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#2a2e3a";
            e.currentTarget.style.backgroundColor = "#1a1d24";
          }}
        />
      </div>
    );
  };

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <div style={{ 
      display: "flex", 
      alignItems: "center", 
      gap: "8px", 
      marginBottom: "12px",
      marginTop: "16px"
    }}>
      <div style={{ 
        width: "3px", 
        height: "16px", 
        backgroundColor: "#06b6d4", 
        borderRadius: "2px" 
      }} />
      <h3 style={{ 
        fontSize: "13px", 
        fontWeight: 600, 
        color: "#e5e7eb" 
      }}>
        {children}
      </h3>
    </div>
  );

  return (
    <div>
      <form onSubmit={handleSubmit}>
        {/* 测试填充按钮 */}
        <div style={{ 
          marginBottom: "20px", 
          padding: "12px 16px",
          backgroundColor: "rgba(139, 92, 246, 0.1)",
          border: "1px dashed #8b5cf6",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "20px" }}>🎌</span>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 500, color: "#e5e7eb" }}>
                快速测试模式
              </div>
              <div style={{ fontSize: "11px", color: "#9ca3af" }}>
                一键填充动漫主题测试数据，快速体验生成功能
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={fillTestData}
            style={{
              padding: "8px 16px",
              fontSize: "12px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              backgroundColor: "#8b5cf6",
              color: "white",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "background-color 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#7c3aed"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#8b5cf6"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            一键测试填充
          </button>
        </div>

        {/* 基本信息 */}
        <SectionTitle>基本信息</SectionTitle>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", 
          gap: "12px",
          marginBottom: "16px"
        }}>
          <div>
            <label style={labelStyle}>
              姓名 <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              type="text"
              placeholder="请输入您的姓名"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={{...inputStyle, height: "38px"}}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#0891b2";
                e.currentTarget.style.backgroundColor = "#1f2937";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#2a2e3a";
                e.currentTarget.style.backgroundColor = "#1a1d24";
              }}
            />
          </div>
          <div>
            <label style={labelStyle}>
              周报日期 <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              {/* 年份选择 */}
              <select
                value={selectedYear || ""}
                onChange={(e) => handleYearChange(e.target.value ? parseInt(e.target.value) : null)}
                style={{
                  ...inputStyle,
                  height: "38px",
                  width: "90px",
                  cursor: "pointer"
                }}
              >
                <option value="">年份</option>
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}年
                  </option>
                ))}
              </select>
              {/* 月份选择 */}
              <select
                value={selectedMonth || ""}
                onChange={(e) => handleMonthChange(e.target.value ? parseInt(e.target.value) : null)}
                disabled={!selectedYear}
                style={{
                  ...inputStyle,
                  height: "38px",
                  width: "70px",
                  cursor: selectedYear ? "pointer" : "not-allowed",
                  opacity: selectedYear ? 1 : 0.5
                }}
              >
                <option value="">月份</option>
                {monthOptions.map((month) => (
                  <option key={month} value={month}>
                    {month}月
                  </option>
                ))}
              </select>
              {/* 周数选择 */}
              <select
                value={form.date ? form.date.match(/第(\d+)周/)?.[1] || "" : ""}
                onChange={(e) => handleWeekChange(parseInt(e.target.value))}
                disabled={!selectedYear || !selectedMonth}
                style={{
                  ...inputStyle,
                  height: "38px",
                  width: "85px",
                  cursor: (selectedYear && selectedMonth) ? "pointer" : "not-allowed",
                  opacity: (selectedYear && selectedMonth) ? 1 : 0.5
                }}
              >
                <option value="">周</option>
                {Array.from({ length: maxWeeks }, (_, i) => i + 1).map((week) => (
                  <option key={week} value={week}>
                    第{week}周
                  </option>
                ))}
              </select>
            </div>
            {form.date && (
              <div style={{ 
                marginTop: "6px", 
                fontSize: "11px", 
                color: "#06b6d4" 
              }}>
                已选择：{form.date}
              </div>
            )}
          </div>
        </div>

        {/* 本周运营工作 */}
        <SectionTitle>本周运营工作</SectionTitle>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", 
          gap: "12px",
          marginBottom: "12px"
        }}>
          <FieldGroup
            label="关键任务"
            field="tasks"
            placeholder="如：完成曝气系统检修、格栅清理维护..."
            rows={3}
            required
          />
          <FieldGroup
            label="主要成果"
            field="achievements"
            placeholder="如：出水COD稳定达标、设备效率提升..."
            rows={3}
            required
          />
        </div>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", 
          gap: "12px",
          marginBottom: "16px"
        }}>
          <FieldGroup
            label="水质数据指标"
            field="dataMetrics"
            placeholder="如：处理量28500吨、COD去除率86.9%..."
          />
          <FieldGroup
            label="问题与解决"
            field="issues"
            placeholder="如：污泥泵异响→更换轴承修复..."
          />
        </div>

        {/* 团队协作 */}
        <SectionTitle>团队协作</SectionTitle>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", 
          gap: "12px",
          marginBottom: "16px"
        }}>
          <FieldGroup
            label="协作配合"
            field="collaboration"
            placeholder="如：配合环保检查、协助设备保养..."
          />
          <FieldGroup
            label="学习成长"
            field="learning"
            placeholder="如：学习运行规范、掌握监测维护..."
          />
        </div>

        {/* 下周计划 */}
        <SectionTitle>下周计划</SectionTitle>
        <div style={{ marginBottom: "20px" }}>
          <FieldGroup
            label="工作安排"
            field="nextWeek"
            placeholder="如：生化池清淤、季度保养、应急演练..."
          />
        </div>

        {/* 底部操作 */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          paddingTop: "16px",
          borderTop: "1px solid #1f2937"
        }}>
          <div style={{ 
            display: "flex", 
            gap: "4px",
            padding: "2px",
            backgroundColor: "#1a1d24",
            borderRadius: "6px"
          }}>
            <button
              type="button"
              onClick={() => setForm({ ...form, tone: "formal" })}
              style={{
                padding: "6px 12px",
                fontSize: "12px",
                borderRadius: "4px",
                border: "none",
                cursor: "pointer",
                backgroundColor: form.tone === "formal" ? "#374151" : "transparent",
                color: form.tone === "formal" ? "white" : "#9ca3af"
              }}
            >
              正式
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, tone: "casual" })}
              style={{
                padding: "6px 12px",
                fontSize: "12px",
                borderRadius: "4px",
                border: "none",
                cursor: "pointer",
                backgroundColor: form.tone === "casual" ? "#374151" : "transparent",
                color: form.tone === "casual" ? "white" : "#9ca3af"
              }}
            >
              轻松
            </button>
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "8px 20px",
              backgroundColor: loading ? "#0891b2" : "#06b6d4",
              color: "white",
              fontSize: "13px",
              fontWeight: 500,
              border: "none",
              borderRadius: "6px",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            {loading ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0110 10" strokeOpacity="1">
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      from="0 12 12"
                      to="360 12 12"
                      dur="1s"
                      repeatCount="indefinite"
                    />
                  </path>
                </svg>
                生成中
              </>
            ) : (
              "生成周报"
            )}
          </button>
        </div>
      </form>

      {/* 生成结果 */}
      {report && (
        <div style={{
          marginTop: "20px",
          backgroundColor: "#1a1d24",
          border: "1px solid #2a2e3a",
          borderRadius: "8px",
          overflow: "hidden"
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 16px",
            backgroundColor: "#1f2937",
            borderBottom: "1px solid #2a2e3a",
            flexWrap: "wrap",
            gap: "8px"
          }}>
            <span style={{ fontSize: "13px", fontWeight: 500, color: "#e5e7eb" }}>
              生成结果
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setShowExport(true)}
                style={{
                  padding: "6px 14px",
                  fontSize: "12px",
                  borderRadius: "4px",
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: "#06b6d4",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                导出文档
              </button>
              <button
                onClick={handleCopy}
                style={{
                  padding: "6px 14px",
                  fontSize: "12px",
                  borderRadius: "4px",
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: copied ? "rgba(34, 197, 94, 0.2)" : "#374151",
                  color: copied ? "#22c55e" : "#d1d5db"
                }}
              >
                {copied ? "已复制" : "复制"}
              </button>
            </div>
          </div>
          <div style={{ padding: "16px" }}>
            <div style={{
              fontSize: "13px",
              lineHeight: "1.7",
              color: "#d1d5db",
              whiteSpace: "pre-wrap",
              maxHeight: "400px",
              overflowY: "auto"
            }}>
              {report}
            </div>
          </div>
        </div>
      )}

      {/* 导出弹窗 */}
      {showExport && (
        <ReportExport
          reportData={{
            name: form.name,
            date: form.date,
            tasks: form.tasks,
            achievements: form.achievements,
            dataMetrics: form.dataMetrics,
            issues: form.issues,
            collaboration: form.collaboration,
            learning: form.learning,
            nextWeek: form.nextWeek,
            tone: form.tone,
            content: report
          }}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}
