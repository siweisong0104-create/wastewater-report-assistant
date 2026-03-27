import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";

// 智谱 AI (GLM) 配置
const ZHIPU_API_KEY = "93604840704d45e2817d7424febd00af.gc0SraT8mkTxAg7o";

// 内联 authOptions（避免导入问题）
const authOptions = {
  providers: [],
  secret: "kX9mP2vQ7wL4nR8jY5tB1cF6hD3sA0eG",
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("=== Generate Report API called ===");

  // 简化：只检查 cookie 是否存在
  const cookie = req.headers.cookie;
  console.log("Cookie present:", cookie ? "YES" : "NO");

  if (!cookie || !cookie.includes("next-auth.session-token")) {
    console.log("No session cookie found");
    return res.status(401).json({ error: "Unauthorized - no session" });
  }

  const { name, date, tasks, achievements, issues, nextWeek, dataMetrics, collaboration, learning, tone } = req.body;
  console.log("Request body:", { name, date, tasks, achievements, tone });

  // 处理日期格式，将YYYYMMDD格式转换为自然语言格式
  let displayDate = date;
  if (date && /^\d{8}$/.test(date)) {
    // 处理8位数字日期格式 如：20260109
    const year = date.substring(0, 4);
    const month = parseInt(date.substring(4, 6));
    const day = parseInt(date.substring(6, 8));
    const weekNum = Math.ceil(day / 7);
    displayDate = `${year}年${month}月第${weekNum}周`;
  }

  const toneInstruction = tone === "formal"
    ? `【正式专业风格要求】
- 使用规范的污水运营行业术语
- 数据准确，表述严谨客观
- 结构清晰，层次分明
- 体现专业性和责任心
- 符合环保行业报告规范`
    : `【轻松活泼风格要求】
- 语言亲切自然，易于理解
- 适当加入积极的工作态度表达
- 保持专业性同时增加可读性`;

  const prompt = `你是一位资深的污水处理设施运营专家，擅长撰写规范的运营周报。请根据以下信息，生成一份可以直接提交给主管领导的污水站运营周报。

${toneInstruction}

【周报基本信息】
- 报告人：${name || "（未填写）"}
- 报告周期：${displayDate || "（未填写）"}

【周报结构要求】
必须包含以下章节：

1. **本周运营概况**（100-150字）
   - 概括本周整体运营情况和核心工作
   - 突出水质达标情况和关键指标

2. **关键运营任务完成情况**
   - 详细描述设备维护、工艺操作等任务
   - 使用数据支撑工作成果
   - 突出贡献和亮点

3. **水质指标与运行数据**
   - 列出关键水质指标（COD、氨氮、总磷等）
   - 进出水数据对比和去除率
   - 处理量、设备运行率等运营数据

4. **设备运行情况与问题处理**
   - 设备运行状态总结
   - 故障/异常情况描述及处理措施
   - 预防性维护完成情况

5. **安全环保与协作配合**
   - 安全生产情况
   - 环保检查配合情况
   - 跨部门协作支持工作

6. **技能提升与学习总结**
   - 新技术、新规程学习情况
   - 操作技能提升
   - 培训参与情况

7. **下周工作计划**
   - 设备维护保养计划
   - 工艺优化调整计划
   - 重点任务安排

8. **需协调支持事项**
   - 需要领导决策的事项
   - 需要其他部门配合的工作
   - 资源需求建议

【输入信息】

**本周关键运营任务**：
${tasks || "（未填写）"}

**主要运营成果**：
${achievements || "（未填写）"}

**水质与运行数据**：
${dataMetrics || "（未填写）"}

**设备问题与解决措施**：
${issues || "（未填写）"}

**团队协作与配合**：
${collaboration || "（未填写）"}

**学习成长**：
${learning || "（未填写）"}

**下周工作安排**：
${nextWeek || "（未填写）"}

【输出要求】
1. 使用Markdown格式，层级清晰
2. 周报标题格式：污水站运营周报 - [报告人姓名] - [年月周格式，如：2026年1月第2周]
3. 如果日期是8位数字格式（如20260109），必须在标题中转换为"XXXX年X月第X周"的自然语言格式
4. 每个章节都要有实质性内容
5. 突出水质达标情况和环保合规性
6. 体现污水运营的专业性和责任心
7. 字数控制在800-1200字左右

请生成污水站运营周报：`;

  try {
    console.log("Calling Zhipu AI API...");
    const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ZHIPU_API_KEY}`,
      },
      body: JSON.stringify({
        model: "glm-4-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    console.log("Zhipu AI response status:", response.status);
    const data = await response.json();
    console.log("Zhipu AI response:", JSON.stringify(data, null, 2));

    const report = data?.choices?.[0]?.message?.content || data?.error?.message || "生成失败，请重试";
    return res.status(200).json({ report });
  } catch (error) {
    console.error("Zhipu AI error:", error);
    return res.status(500).json({ error: "AI 服务异常" });
  }
}
