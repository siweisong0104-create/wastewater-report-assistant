"use client";

import { useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Document, Paragraph, TextRun, Packer, AlignmentType } from "docx";

interface ReportData {
  name: string;
  date: string;
  tasks: string;
  achievements: string;
  dataMetrics: string;
  issues: string;
  collaboration: string;
  learning: string;
  nextWeek: string;
  tone: string;
  content?: string;
}

interface ReportExportProps {
  reportData: ReportData;
  onClose: () => void;
}

export default function ReportExport({ reportData, onClose }: ReportExportProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取最终内容
  const getFinalContent = () => {
    if (reportData.content && reportData.content.trim().length > 50) {
      return reportData.content;
    }
    return null;
  };

  // 解析 Markdown 为 HTML - 紧凑排版
  const parseMarkdownToHTML = (content: string) => {
    let html = content
      .replace(/^# (.*$)/gim, '<h1 style="font-size:20px;text-align:center;margin:12px 0 16px 0;font-weight:bold;color:#000;">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 style="font-size:15px;margin:16px 0 8px 0;font-weight:bold;color:#000;">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 style="font-size:13px;margin:12px 0 6px 0;font-weight:bold;color:#000;">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#000;">$1</strong>')
      .replace(/\n/g, '<br style="line-height:1.5;"/>');
    return html;
  };

  // 生成文件名
  const generateFileName = (extension: string) => {
    const sanitizedName = reportData.name.replace(/[\\/:*?"<>|]/g, "") || "周报";
    const sanitizedDate = reportData.date.replace(/[\\/:*?"<>|]/g, "") || "未命名";
    return `${sanitizedName}_${sanitizedDate}.${extension}`;
  };

  // 下载 PDF - 简化版，避免移动端兼容性问题
  const downloadPDF = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const element = document.getElementById("a4-content");
      if (!element) {
        throw new Error("找不到预览内容");
      }

      // 等待字体渲染
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // 创建canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        allowTaint: true,
      });

      // 创建PDF
      const pdf = new jsPDF({
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      });

      const pdfWidth = 210;
      const pdfHeight = 297;
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / (imgWidth * 0.264), pdfHeight / (imgHeight * 0.264));
      
      const imgData = canvas.toDataURL("image/png", 0.95);
      
      // 计算是否需要分页
      const scaledHeight = (imgHeight * pdfWidth) / imgWidth;
      
      if (scaledHeight <= pdfHeight) {
        // 单页
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, scaledHeight);
      } else {
        // 多页
        let heightLeft = scaledHeight;
        let position = 0;
        let pageCount = 0;
        
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, scaledHeight);
        heightLeft -= pdfHeight;
        
        while (heightLeft > 0 && pageCount < 5) {
          pageCount++;
          position = -pageCount * pdfHeight;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, position, pdfWidth, scaledHeight);
          heightLeft -= pdfHeight;
        }
      }

      // 保存
      pdf.save(generateFileName("pdf"));
      
    } catch (err) {
      console.error("PDF生成错误:", err);
      setError("PDF生成失败，请重试或使用Word格式下载");
    } finally {
      setIsGenerating(false);
    }
  };

  // 生成 Word
  const generateWord = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const content = getFinalContent();
      let children: any[] = [];

      if (content) {
        const lines = content.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) {
            children.push(new Paragraph({ spacing: { after: 120 } }));
            continue;
          }

          if (trimmed.startsWith('# ')) {
            children.push(new Paragraph({
              children: [new TextRun({ text: trimmed.replace('# ', ''), bold: true, size: 32 })],
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
            }));
          } else if (trimmed.startsWith('## ')) {
            children.push(new Paragraph({
              children: [new TextRun({ text: trimmed.replace('## ', ''), bold: true, size: 28 })],
              spacing: { before: 200, after: 100 },
            }));
          } else if (trimmed.startsWith('### ')) {
            children.push(new Paragraph({
              children: [new TextRun({ text: trimmed.replace('### ', ''), bold: true, size: 24 })],
              spacing: { before: 120, after: 60 },
            }));
          } else {
            const cleanText = trimmed.replace(/\*\*/g, '');
            children.push(new Paragraph({
              children: [new TextRun({ text: cleanText, size: 24 })],
              spacing: { after: 80, line: 360 },
            }));
          }
        }
      } else {
        children = [
          new Paragraph({
            children: [new TextRun({ text: `运营周报 - ${reportData.name}`, bold: true, size: 32 })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [new TextRun({ text: `日期：${reportData.date}`, size: 24 })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          }),
          new Paragraph({ children: [new TextRun({ text: "一、本周运营工作", bold: true, size: 28 })], spacing: { before: 200, after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: reportData.tasks || "（未填写）", size: 24 })], spacing: { after: 80, line: 360 } }),
          new Paragraph({ children: [new TextRun({ text: "二、水质数据指标", bold: true, size: 28 })], spacing: { before: 200, after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: reportData.dataMetrics || "（未填写）", size: 24 })], spacing: { after: 80, line: 360 } }),
        ];
      }

      const doc = new Document({ sections: [{ children }] });
      const blob = await Packer.toBlob(doc);
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = generateFileName("docx");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (err) {
      setError("Word生成失败: " + (err as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const aiContent = getFinalContent();

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "#0a0c10",
      zIndex: 100,
      display: "flex",
      flexDirection: "column",
    }}>
      {/* 顶部导航 */}
      <div style={{
        padding: "12px 16px",
        backgroundColor: "#111318",
        borderBottom: "1px solid #2a2e3a",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <h2 style={{ color: "white", fontSize: "15px", margin: 0 }}>
          周报导出 - {reportData.name}
        </h2>
        <button
          onClick={onClose}
          style={{
            background: "#ef4444",
            border: "none",
            color: "white",
            cursor: "pointer",
            fontSize: "13px",
            padding: "6px 16px",
            borderRadius: "6px",
          }}
        >
          关闭
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div style={{
          padding: "10px 16px",
          backgroundColor: "#ef4444",
          color: "white",
          fontSize: "13px",
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* 内容区域 - 只有文档预览 */}
      <div style={{
        flex: 1,
        overflow: "auto",
        padding: "20px",
        backgroundColor: "#1a1d24",
      }}>
        <div style={{
          display: "flex",
          justifyContent: "center",
          minHeight: "100%",
        }}>
          <div
            id="a4-content"
            style={{
              width: "210mm",
              minHeight: "297mm",
              padding: "15mm",
              backgroundColor: "white",
              boxSizing: "border-box",
              fontFamily: "'SimSun', 'Noto Sans SC', 'Microsoft YaHei', sans-serif",
              fontSize: "12pt",
              lineHeight: "1.5",
              color: "#000",
              boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
            }}
            dangerouslySetInnerHTML={{
              __html: aiContent 
                ? parseMarkdownToHTML(aiContent)
                : `
                  <h1 style="font-size:20px;text-align:center;margin:12px 0 16px 0;font-weight:bold;color:#000;">运营周报</h1>
                  <p style="text-align:center;margin:6px 0;font-size:12pt;color:#000;">${reportData.name} | ${reportData.date}</p>
                  <h2 style="font-size:15px;margin:16px 0 8px 0;font-weight:bold;color:#000;">一、本周运营工作</h2>
                  <p style="margin:8px 0;line-height:1.5;color:#000;"><strong>关键任务：</strong>${reportData.tasks || "（未填写）"}</p>
                  <p style="margin:8px 0;line-height:1.5;color:#000;"><strong>主要成果：</strong>${reportData.achievements || "（未填写）"}</p>
                  <h2 style="font-size:15px;margin:16px 0 8px 0;font-weight:bold;color:#000;">二、水质数据指标</h2>
                  <p style="margin:8px 0;line-height:1.5;color:#000;">${reportData.dataMetrics || "（未填写）"}</p>
                  <h2 style="font-size:15px;margin:16px 0 8px 0;font-weight:bold;color:#000;">三、问题与解决</h2>
                  <p style="margin:8px 0;line-height:1.5;color:#000;">${reportData.issues || "（未填写）"}</p>
                  <h2 style="font-size:15px;margin:16px 0 8px 0;font-weight:bold;color:#000;">四、团队协作</h2>
                  <p style="margin:8px 0;line-height:1.5;color:#000;"><strong>协作配合：</strong>${reportData.collaboration || "（未填写）"}</p>
                  <p style="margin:8px 0;line-height:1.5;color:#000;"><strong>学习成长：</strong>${reportData.learning || "（未填写）"}</p>
                  <h2 style="font-size:15px;margin:16px 0 8px 0;font-weight:bold;color:#000;">五、下周计划</h2>
                  <p style="margin:8px 0;line-height:1.5;color:#000;">${reportData.nextWeek || "（未填写）"}</p>
                `
            }}
          />
        </div>
      </div>

      {/* 底部按钮 */}
      <div style={{
        padding: "16px",
        backgroundColor: "#111318",
        borderTop: "1px solid #2a2e3a",
        display: "flex",
        gap: "12px",
        justifyContent: "center",
      }}>
        <button
          onClick={downloadPDF}
          disabled={isGenerating}
          style={{
            padding: "12px 32px",
            backgroundColor: isGenerating ? "#666" : "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: isGenerating ? "not-allowed" : "pointer",
            fontSize: "15px",
            fontWeight: "bold",
          }}
        >
          {isGenerating ? "生成中..." : "⬇️ 下载 PDF"}
        </button>
        <button
          onClick={generateWord}
          disabled={isGenerating}
          style={{
            padding: "12px 32px",
            backgroundColor: isGenerating ? "#666" : "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: isGenerating ? "not-allowed" : "pointer",
            fontSize: "15px",
            fontWeight: "bold",
          }}
        >
          {isGenerating ? "生成中..." : "⬇️ 下载 Word"}
        </button>
      </div>
    </div>
  );
}
