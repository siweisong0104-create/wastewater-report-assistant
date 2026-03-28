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
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isGeneratingWord, setIsGeneratingWord] = useState(false);

  // 生成文件名
  const generateFileName = (extension: string) => {
    const sanitizedName = reportData.name.replace(/[\\/:*?"<>|]/g, "") || "周报";
    const sanitizedDate = reportData.date.replace(/[\\/:*?"<>|]/g, "") || "未命名";
    return `${sanitizedName}_${sanitizedDate}.${extension}`;
  };

  // 获取最终内容
  const getFinalContent = () => {
    if (reportData.content && reportData.content.trim().length > 50) {
      return reportData.content;
    }
    return null;
  };

  // 解析 Markdown 为 HTML
  const parseMarkdownToHTML = (content: string) => {
    let html = content
      .replace(/^# (.*$)/gim, '<h1 style="font-size:20px;text-align:center;margin:10px 0;font-weight:bold;">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 style="font-size:14px;margin:12px 0 6px 0;font-weight:bold;border-bottom:1px solid #333;padding-bottom:3px;">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 style="font-size:12px;margin:8px 0 4px 0;font-weight:bold;">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
    return html;
  };

  // 生成 PDF
  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const element = document.getElementById("report-export-content");
      if (!element) {
        alert("预览内容不存在");
        return;
      }

      // 等待渲染完成
      await new Promise(resolve => setTimeout(resolve, 300));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 800,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      
      const pdfWidth = 210; // A4 width in mm
      const pdfHeight = 297; // A4 height in mm
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = pdfWidth / imgWidth;
      const scaledHeight = imgHeight * ratio;

      // 如果内容超过一页，需要分页
      let heightLeft = scaledHeight;
      let position = 0;
      let page = 0;

      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, scaledHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0 && page < 20) {
        page++;
        position = -page * pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, scaledHeight);
        heightLeft -= pdfHeight;
      }

      // 下载
      const blob = pdf.output("blob");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = generateFileName("pdf");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error("PDF 生成失败:", error);
      alert("PDF 生成失败: " + (error as Error).message);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // 生成 Word
  const generateWord = async () => {
    setIsGeneratingWord(true);
    try {
      const content = getFinalContent();
      let children: any[] = [];

      if (content) {
        // 解析 AI 生成的内容
        const lines = content.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) {
            children.push(new Paragraph({ spacing: { after: 100 } }));
            continue;
          }

          if (trimmed.startsWith('# ')) {
            children.push(new Paragraph({
              children: [new TextRun({ text: trimmed.replace('# ', ''), bold: true, size: 28 })],
              alignment: AlignmentType.CENTER,
              spacing: { after: 150 },
            }));
          } else if (trimmed.startsWith('## ')) {
            children.push(new Paragraph({
              children: [new TextRun({ text: trimmed.replace('## ', ''), bold: true, size: 22 })],
              spacing: { before: 150, after: 80 },
            }));
          } else if (trimmed.startsWith('### ')) {
            children.push(new Paragraph({
              children: [new TextRun({ text: trimmed.replace('### ', ''), bold: true, size: 20 })],
              spacing: { before: 100, after: 60 },
            }));
          } else {
            // 普通文本，移除加粗标记
            const cleanText = trimmed.replace(/\*\*/g, '');
            children.push(new Paragraph({
              children: [new TextRun({ text: cleanText, size: 21 })],
              spacing: { after: 60 },
            }));
          }
        }
      } else {
        // 使用表单数据
        children = [
          new Paragraph({
            children: [new TextRun({ text: `运营周报 - ${reportData.name}`, bold: true, size: 28 })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 150 },
          }),
          new Paragraph({
            children: [new TextRun({ text: `日期：${reportData.date}`, size: 21 })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          }),
          new Paragraph({ children: [new TextRun({ text: "一、本周运营工作", bold: true, size: 22 })], spacing: { before: 150, after: 80 } }),
          new Paragraph({ children: [new TextRun({ text: reportData.tasks || "（未填写）", size: 21 })], spacing: { after: 60 } }),
          new Paragraph({ children: [new TextRun({ text: "二、水质数据指标", bold: true, size: 22 })], spacing: { before: 150, after: 80 } }),
          new Paragraph({ children: [new TextRun({ text: reportData.dataMetrics || "（未填写）", size: 21 })], spacing: { after: 60 } }),
          new Paragraph({ children: [new TextRun({ text: "三、问题与解决", bold: true, size: 22 })], spacing: { before: 150, after: 80 } }),
          new Paragraph({ children: [new TextRun({ text: reportData.issues || "（未填写）", size: 21 })], spacing: { after: 60 } }),
          new Paragraph({ children: [new TextRun({ text: "四、下周计划", bold: true, size: 22 })], spacing: { before: 150, after: 80 } }),
          new Paragraph({ children: [new TextRun({ text: reportData.nextWeek || "（未填写）", size: 21 })], spacing: { after: 60 } }),
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
      
    } catch (error) {
      console.error("Word 生成失败:", error);
      alert("Word 生成失败: " + (error as Error).message);
    } finally {
      setIsGeneratingWord(false);
    }
  };

  const aiContent = getFinalContent();

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(0, 0, 0, 0.95)",
      zIndex: 100,
      display: "flex",
      flexDirection: "column",
    }}>
      {/* 顶部 */}
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
            padding: "6px 14px",
            borderRadius: "6px",
          }}
        >
          关闭
        </button>
      </div>

      {/* 预览区域 */}
      <div style={{
        flex: 1,
        overflow: "auto",
        padding: "16px",
        backgroundColor: "#1a1d24",
        display: "flex",
        justifyContent: "center",
      }}>
        <div
          id="report-export-content"
          style={{
            width: "210mm",
            minHeight: "297mm",
            backgroundColor: "white",
            padding: "20mm",
            boxSizing: "border-box",
            fontFamily: "'SimSun', '宋体', serif",
            fontSize: "11pt",
            lineHeight: "1.6",
            color: "black",
            boxShadow: "0 0 20px rgba(0,0,0,0.5)",
          }}
          dangerouslySetInnerHTML={{
            __html: aiContent 
              ? parseMarkdownToHTML(aiContent)
              : `
                <h1 style="font-size:20px;text-align:center;margin:10px 0;font-weight:bold;">运营周报</h1>
                <p style="text-align:center;margin:5px 0;font-size:11pt;">${reportData.name} | ${reportData.date}</p>
                <h2 style="font-size:14px;margin:12px 0 6px 0;font-weight:bold;border-bottom:1px solid #333;padding-bottom:3px;">一、本周运营工作</h2>
                <p style="margin:5px 0;"><strong>关键任务：</strong>${reportData.tasks || "（未填写）"}</p>
                <p style="margin:5px 0;"><strong>主要成果：</strong>${reportData.achievements || "（未填写）"}</p>
                <h2 style="font-size:14px;margin:12px 0 6px 0;font-weight:bold;border-bottom:1px solid #333;padding-bottom:3px;">二、水质数据指标</h2>
                <p style="margin:5px 0;">${reportData.dataMetrics || "（未填写）"}</p>
                <h2 style="font-size:14px;margin:12px 0 6px 0;font-weight:bold;border-bottom:1px solid #333;padding-bottom:3px;">三、问题与解决</h2>
                <p style="margin:5px 0;">${reportData.issues || "（未填写）"}</p>
                <h2 style="font-size:14px;margin:12px 0 6px 0;font-weight:bold;border-bottom:1px solid #333;padding-bottom:3px;">四、团队协作</h2>
                <p style="margin:5px 0;"><strong>协作配合：</strong>${reportData.collaboration || "（未填写）"}</p>
                <p style="margin:5px 0;"><strong>学习成长：</strong>${reportData.learning || "（未填写）"}</p>
                <h2 style="font-size:14px;margin:12px 0 6px 0;font-weight:bold;border-bottom:1px solid #333;padding-bottom:3px;">五、下周计划</h2>
                <p style="margin:5px 0;">${reportData.nextWeek || "（未填写）"}</p>
              `
          }}
        />
      </div>

      {/* 底部按钮 */}
      <div style={{
        padding: "12px 16px",
        backgroundColor: "#111318",
        borderTop: "1px solid #2a2e3a",
        display: "flex",
        gap: "12px",
        justifyContent: "center",
        flexWrap: "wrap",
      }}>
        <button
          onClick={generatePDF}
          disabled={isGeneratingPDF}
          style={{
            padding: "10px 28px",
            backgroundColor: isGeneratingPDF ? "#666" : "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: isGeneratingPDF ? "not-allowed" : "pointer",
            fontSize: "14px",
            fontWeight: "bold",
          }}
        >
          {isGeneratingPDF ? "生成中..." : "⬇️ 下载 PDF"}
        </button>
        <button
          onClick={generateWord}
          disabled={isGeneratingWord}
          style={{
            padding: "10px 28px",
            backgroundColor: isGeneratingWord ? "#666" : "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: isGeneratingWord ? "not-allowed" : "pointer",
            fontSize: "14px",
            fontWeight: "bold",
          }}
        >
          {isGeneratingWord ? "生成中..." : "⬇️ 下载 Word"}
        </button>
      </div>
    </div>
  );
}
