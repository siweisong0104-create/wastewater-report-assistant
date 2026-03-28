import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";

// 智谱 AI (GLM) 配置
const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY || "93604840704d45e2817d7424febd00af.gc0SraT8mkTxAg7o";

// 内联 authOptions（避免导入问题）
const authOptions = {
  providers: [],
  secret: process.env.NEXTAUTH_SECRET || "kX9mP2vQ7wL4nR8jY5tB1cF6hD3sA0eG",
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
  console.log("Request body:", { name, date, tone });

  // 处理日期格式
  let displayDate = date;
  if (date && /^\d{8}$/.test(date)) {
    const year = date.substring(0, 4);
    const month = parseInt(date.substring(4, 6));
    const day = parseInt(date.substring(6, 8));
    const weekNum = Math.ceil(day / 7);
    displayDate = `${year}年${month}月第${weekNum}周`;
  }

  const toneInstruction = tone === "formal"
    ? `【正式专业风格要求】
- 使用规范的污水运营行业术语，如"生化处理工艺"、"曝气系统"、"污泥浓度(MLSS)"、"化学需氧量(COD)"、"氨氮(NH3-N)"、"总磷(TP)"等
- 数据准确，表述严谨客观，使用专业数据支撑论述
- 体现环保合规意识和安全生产责任心
- 符合《城镇污水处理厂运行维护及安全技术规程》等行业规范`
    : `【务实简洁风格要求】
- 语言简洁明了，避免冗余
- 突出重点工作和关键数据
- 保持专业性同时注重实用性`;

  const prompt = `你是一位资深的污水处理设施运营专家，拥有10年以上污水站运营管理经验。你需要根据以下关键信息，撰写一份专业的运营周报。

【重要说明】
用户提供的只是工作要点和关键数据，你需要：
1. **扩写和丰富**：将简单的要点扩展成完整的专业描述
2. **数据分析和解读**：不仅列出数据，还要分析数据背后的意义（如"COD去除率较前周提升X%，表明生化系统运行良好"）
3. **专业术语运用**：使用污水处理行业标准术语和专业表达
4. **逻辑连贯**：各部分内容要有内在联系，形成完整的运营 narrative
5. **体现专业性**：展现对工艺原理、设备运维、环保法规的深入理解

${toneInstruction}

【报告人信息】
- 姓名：${name || "（请填写姓名）"}
- 报告周期：${displayDate || "（请填写日期）"}

【用户提供的原始信息】

1. 本周关键任务：
${tasks || "（请补充任务内容）"}

2. 主要运营成果：
${achievements || "（请补充成果内容）"}

3. 水质与运行数据：
${dataMetrics || "（请补充数据内容）"}

4. 设备问题与解决措施：
${issues || "（请补充问题内容）"}

5. 团队协作与配合：
${collaboration || "（请补充协作内容）"}

6. 学习成长：
${learning || "（请补充学习内容）"}

7. 下周工作安排：
${nextWeek || "（请补充计划内容）"}

【输出格式要求】

请按以下结构输出周报（使用Markdown格式）：

# 污水站运营周报
**报告人：** ${name || "（请填写）"} | **报告周期：** ${displayDate || "（请填写）"}

---

## 一、本周运营概况
撰写100-150字的整体概述，包括：
- 本周整体运营状态评价（稳定/良好/需关注）
- 核心工作完成情况总结
- 关键指标达标情况
- **不要简单罗列，要有分析和评价**

## 二、关键运营任务完成情况
基于用户提供的任务信息，扩写为专业的任务完成描述：
- 每项任务的具体执行过程和工艺原理
- 采用的技术措施和操作规范
- 任务完成的质量评价
- 对整体运行的贡献分析

## 三、水质指标与运行数据分析
基于用户提供的数据，进行专业分析：
- 进出水主要指标对比（COD、氨氮、总磷等）
- 去除率计算和达标情况评价
- 处理量、设备负荷率等运营数据分析
- **数据异常分析**：如有波动，分析可能原因

## 四、设备运行与问题处理
基于用户提供的问题信息：
- 设备整体运行状态评估
- 故障/异常现象的详细描述
- 根本原因分析（机械磨损/工艺波动/操作不当等）
- 采取的处理措施和修复效果
- 预防性维护建议

## 五、安全环保与协作配合
基于协作信息，扩写为：
- 安全生产制度执行情况
- 环保检查配合及整改情况
- 跨部门协作的具体工作内容
- 团队协作中的亮点和改进点

## 六、技能提升与学习总结
基于学习信息：
- 学习内容与实际工作的关联
- 知识技能的应用转化
- 个人专业成长总结

## 七、下周工作计划
基于计划信息，制定具体可执行的计划：
- 设备维护计划（具体设备、维护内容、预期效果）
- 工艺优化措施
- 重点工作的时间节点安排

## 八、需协调支持事项
- 需要领导决策或协调的事项
- 资源需求（人员/设备/资金）
- 其他部门配合需求

---

【写作要求】
1. **不要简单复述用户输入**，要将要点扩展为完整的段落
2. **增加专业分析和评价**，体现运营专家的专业视角
3. **数据要有解读**，说明数据反映的运行状态
4. **使用行业标准术语**，避免口语化表达
5. **字数800-1500字**，确保内容充实
6. **逻辑清晰，层次分明**，各部分之间有过渡衔接

请开始撰写周报：`;

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
        temperature: 0.8,
        max_tokens: 2500,
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
