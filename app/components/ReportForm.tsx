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

// 🎯 趣味测试数据 - 恰到好处的幽默，自然融入专业内容
const testData = {
  names: [
    "王建国", "李大炮", "张铁柱", "赵富贵", "刘二狗", "孙大壮",
    "周小波", "吴师傅", "郑大明白", "马大哈", "陈老实", "杨勤奋"
  ],
  
  tasks: [
    "本周对格栅机进行了例行维护，清理出的杂物中居然发现了一只完好的手机壳，看来我们的格栅过滤效果确实不错",
    "完成了曝气系统的全面检修，更换了15个老化曝气头。拆下来的旧曝气头已经服役三年，算是功成身退了",
    "优化了加药系统的投加曲线，现在药剂投加比我的减肥计划还要精准——该多的时候绝不少，该少的时候绝不多",
    "处理了进水突发的色度异常事件，通过调整工艺参数成功化解，这次应变速度比外卖小哥找地址还快",
    "对污泥脱水机进行了深度保养，清理出来的积泥足足装了两桶，看来这段时间的污泥产量相当可观",
    "完成了在线监测仪的季度校准，所有仪表数据偏差都在允许范围内，比我的血压还要稳定"
  ],
  
  achievements: [
    "本周出水COD稳定在42mg/L以下，氨氮和总磷全部达标。水质这么好，连化验室的锦鲤都游得更欢了",
    "设备完好率99.1%，故障停机时间仅1.5小时。这稳定性比我坚持早睡早起还要可靠",
    "药剂单耗环比下降8%，在不牺牲处理效果的前提下实现了降本增效，可谓是既要马儿跑又要马儿少吃草",
    "成功避免了两次潜在的工艺异常，提前预判、及时处理，把问题扼杀在萌芽状态，这防患于未然的能力堪比天气预报",
    "本周处理量达到31000吨，创下本月新高。机器运转顺畅，出水清澈见底，颇有那种'问渠那得清如许'的意境",
    "通过优化排泥周期，污泥沉降性能明显改善，SV30指数稳定在20%左右，泥水分离效果堪称教科书级别"
  ],
  
  dataMetrics: [
    "本周累计处理水量：31,500吨，日均4500吨。按照每人每天用水150升计算，相当于服务了21万人",
    "进水COD 320mg/L，出水42mg/L，去除率86.9%。这组数据如果放在考试成绩里，妥妥的A+",
    "氨氮去除率91.5%，总磷去除率88.2%，均优于设计标准。各项指标就像交响乐团一样和谐统一",
    "曝气池DO均值3.2mg/L，污泥龄12天，F/M比0.12，工艺参数控制得恰到好处，不多不少",
    "设备综合效率(OEE) 94.5%，其中可用率99.1%，性能效率95.3%，质量合格率100%，三要素齐头并进",
    "吨水电耗0.28kWh，相比上月下降5%，节能效果显著。省下的电费够全站喝一个月下午茶了"
  ],
  
  issues: [
    "2#鼓风机出现异常振动，经检查发现是轴承磨损所致。及时更换后恢复正常，这轴承也算是鞠躬尽瘁了",
    "进水PH值出现过两次短时波动，通过加大中和剂投加量及时缓冲，没让生化系统受到惊吓",
    "污泥泵出现间歇性堵塞，拆开一看原来是几片树叶在作怪。格栅以后得更加留意这些'漏网之鱼'",
    "加药计量泵隔膜老化导致投加量不稳，更换新泵头后如丝般顺滑，精准度堪比实验室滴定管",
    "中控室空调制冷效果下降，在热浪来袭之前及时维修完毕，保住了我们的工作环境这块'净土'"
  ],
  
  collaboration: [
    "配合第三方检测机构完成季度取样，准备充分、配合默契，顺利通过了这次'突击考试'",
    "协助维修班组完成年度设备大修，分工明确、配合得当，提前半天完成了既定任务",
    "对两位新来的实习生进行了系统培训，从工艺流程到操作规程倾囊相授，希望他们早日独当一面",
    "参加了公司组织的安全生产会议，认真学习了最新的事故案例，安全生产这根弦时刻不能松",
    "与化验室密切配合，及时沟通水质异常情况，形成了良好的信息反馈机制，堪称跨部门协作的典范"
  ],
  
  learning: [
    "研读了《城镇污水处理厂运行维护及安全技术规程》2024版的新增条款，更新了自己的知识储备",
    "学习了污泥厌氧消化工艺的原理与应用，虽然本站暂未采用，但多了解总是有益无害",
    "参加了在线监测设备厂家组织的技术培训，掌握了新款仪表的维护要点，技能树上又长出了一片新叶",
    "了解了碳中和背景下的污水处理行业新趋势，深感肩上的责任重大，也更加坚定了做好本职工作的决心"
  ],
  
  nextWeek: [
    "计划对生化池进行全面巡检，重点观察曝气均匀性和污泥性状，确保工艺运行状态良好",
    "准备更换3#沉淀池的刮泥机链条，新链条已到货，就等时机成熟进行更换",
    "开展一次针对性的应急演练，模拟进水COD突增场景，检验大家的实战应变能力",
    "整理上半年的运行数据，为下半年制定更科学的运行策略提供数据支撑",
    "申请参加下月举办的污水处理技术交流会，向同行学习先进经验，开阔眼界"
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

  // 一键填充测试数据
  const fillTestData = () => {
    const randomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
    
    // 随机选择年月周
    const year = new Date().getFullYear();
    const month = Math.floor(Math.random() * 12) + 1;
    const week = Math.floor(Math.random() * 4) + 1;
    
    setSelectedYear(year);
    setSelectedMonth(month);
    
    setForm({
      name: randomItem(testData.names),
      date: `${year}年${month}月第${week}周`,
      tasks: randomItem(testData.tasks),
      achievements: randomItem(testData.achievements),
      issues: randomItem(testData.issues),
      dataMetrics: randomItem(testData.dataMetrics),
      collaboration: randomItem(testData.collaboration),
      learning: randomItem(testData.learning),
      nextWeek: randomItem(testData.nextWeek),
      tone: "professional"
    });
  };

  // 监听测试填充事件
  useEffect(() => {
    const handleFillTestData = () => {
      fillTestData();
    };
    window.addEventListener('fillTestData' as any, handleFillTestData);
    return () => window.removeEventListener('fillTestData' as any, handleFillTestData);
  }, []);

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
