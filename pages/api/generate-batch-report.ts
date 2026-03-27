import { NextApiRequest, NextApiResponse } from "next";

const ZHIPU_API_KEY = "93604840704d45e2817d7424febd00af.gc0SraT8mkTxAg7o";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("=== Batch Generate Report API called ===");

  const cookie = req.headers.cookie;
  if (!cookie || !cookie.includes("next-auth.session-token")) {
    return res.status(401).json({ error: "Unauthorized - no session" });
  }

  const { name, weekLabel, mainTasks, keyAchievements, tone, historyData, weekIndex, totalWeeks } = req.body;

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

  // 构建历史记录参考文本
  const historyReference = historyData && historyData.length > 0
    ? `\n【参考历史周报风格】\n${historyData.map((h: string, i: number) => `历史记录${i + 1}：${h.substring(0, 200)}...`).join("\n")}`
    : "";

  // 根据周索引生成略有不同的内容，避免所有周报完全一样
  const weekVariation = totalWeeks > 1 
    ? `\n【内容差异化要求】\n这是批量生成的第${weekIndex + 1}周（共${totalWeeks}周），请根据时间顺序，适当调整内容的侧重点：
- 第1周：侧重任务启动和准备工作
- 中间周：侧重任务执行和过程管理  
- 最后一周：侧重成果总结和下阶段计划`
    : "";

  const prompt = `你是一位资深的污水处理设施运营专家，擅长撰写规范的运营周报。请根据以下信息，生成${weekLabel}的污水站运营周报。

${toneInstruction}

【周报基本信息】
- 报告人：${name}
- 报告周期：${weekLabel}

【本周期主要工作任务】
${mainTasks}

${keyAchievements ? `【关键成果】\n${keyAchievements}\n` : ""}

【周报结构要求】
必须包含以下章节：

1. **本周运营概况**（80-120字）
   - 概括本周整体运营情况
   - 突出水质达标情况

2. **关键运营任务完成情况**
   - 详细描述设备维护、工艺操作等任务
   - 使用数据支撑工作成果

3. **水质指标与运行数据**
   - 列出关键水质指标（COD、氨氮、总磷等）
   - 进出水数据对比和去除率
   - 处理量、设备运行率等运营数据

4. **设备运行情况与问题处理**
   - 设备运行状态总结
   - 故障/异常情况描述及处理措施

5. **安全环保与协作配合**
   - 安全生产情况
   - 环保检查配合情况

6. **技能提升与学习总结**（简要）

7. **下周工作计划**（简要）

【输出要求】
1. 使用Markdown格式，层级清晰
2. 周报标题格式：污水站运营周报 - [报告人姓名] - [年月周]
3. 每个章节都要有实质性内容
4. 突出水质达标情况和环保合规性
5. 字数控制在600-900字左右
${historyReference}
${weekVariation}

请生成${weekLabel}的污水站运营周报：`;

  try {
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
        max_tokens: 1200,
      }),
    });

    const data = await response.json();
    const report = data?.choices?.[0]?.message?.content || data?.error?.message || "生成失败，请重试";
    
    return res.status(200).json({ report });
  } catch (error) {
    console.error("Batch generate error:", error);
    return res.status(500).json({ error: "AI 服务异常" });
  }
}
