"use client";

import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Document, Paragraph, TextRun, Packer, AlignmentType } from "docx";
import { saveAs } from "file-saver";

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
  content?: string; // AI生成的完整周报内容
}

interface ReportExportProps {
  reportData: ReportData;
  onClose: () => void;
}

export default function ReportExport({ reportData, onClose }: ReportExportProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "pdf">("preview");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // 生成文件名
  const generateFileName = (extension: string) => {
    const sanitizedName = reportData.name.replace(/[\\/:*?"<>|]/g, "") || "周报";
    const sanitizedDate = reportData.date.replace(/[\\/:*?"<>|]/g, "") || "未命名";
    return `${sanitizedName}_${sanitizedDate}.${extension}`;
  };

  // 获取最终内容（优先使用AI生成的内容）
  const getFinalContent = () => {
    if (reportData.content && reportData.content.trim().length > 100) {
      return reportData.content;
    }
    return null;
  };

  // 将AI生成的Markdown内容转换为纯文本段落
  const parseMarkdownContent = (content: string) => {
    const lines = content.split('\n');
    const elements: JSX.Element[] = [];
    let key = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      if (!trimmedLine) {
        elements.push(<div key={key++} style={{ height: "8px" }} />);
        continue;
      }

      // 处理标题
      if (trimmedLine.startsWith('# ')) {
        elements.push(
          <h1 key={key++} style={{ fontSize: "22px", fontWeight: "bold", textAlign: "center", margin: "20px 0" }}>
            {trimmedLine.replace('# ', '')}
          </h1>
        );
      } else if (trimmedLine.startsWith('## ')) {
        elements.push(
          <h2 key={key++} style={{ fontSize: "16px", fontWeight: "bold", margin: "16px 0 8px 0", borderBottom: "1px solid #333", paddingBottom: "4px" }}>
            {trimmedLine.replace('## ', '')}
          </h2>
        );
      } else if (trimmedLine.startsWith('### ')) {
        elements.push(
          <h3 key={key++} style={{ fontSize: "14px", fontWeight: "bold", margin: "12px 0 6px 0" }}>
            {trimmedLine.replace('### ', '')}
          </h3>
        );
      } else if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
        // 加粗段落
        elements.push(
          <p key={key++} style={{ fontWeight: "bold", margin: "8px 0" }}>
            {trimmedLine.replace(/\*\*/g, '')}
          </p>
        );
      } else {
        // 普通段落
        elements.push(
          <p key={key++} style={{ margin: "6px 0", lineHeight: "1.6" }}>
            {trimmedLine.replace(/\*\*/g, '')}
          </p>
        );
      }
    }

    return elements;
  };

  // 生成 PDF Blob
  const generatePDFBlob = async (): Promise<Blob | null> => {
    const element = document.getElementById("pdf-content");
    if (!element) return null;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      allowTaint: true,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    
    // 计算需要的页数
    const ratio = pdfWidth / imgWidth;
    const scaledHeight = imgHeight * ratio;
    let heightLeft = scaledHeight;
    let position = 0;
    let pageCount = 0;

    // 添加第一页
    pdf.addImage(imgData, "PNG", 0, position, pdfWidth, scaledHeight);
    heightLeft -= pdfHeight;

    // 如果内容超过一页，添加更多页面
    while (heightLeft > 0) {
      pageCount++;
      if (pageCount > 10) break; // 防止无限循环
      
      position = -pageCount * pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, scaledHeight);
      heightLeft -= pdfHeight;
    }

    return pdf.output("blob");
  };

  // 预览 PDF
  const previewPDF = async () => {
    setIsGenerating(true);
    try {
      const blob = await generatePDFBlob();
      if (blob) {
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
        setActiveTab("pdf");
      }
    } catch (error) {
      console.error("PDF 预览失败:", error);
      alert("PDF 预览失败，请重试");
    } finally {
      setIsGenerating(false);
    }
  };

  // 下载 PDF
  const downloadPDF = async () => {
    setIsGenerating(true);
    try {
      const blob = await generatePDFBlob();
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = generateFileName("pdf");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch (error) {
      console.error("PDF 下载失败:", error);
      alert("PDF 下载失败，请重试");
    } finally {
      setIsGenerating(false);
    }
  };

  // 下载 Word
  const downloadWord = async () => {
    setIsGenerating(true);
    try {
      const content = getFinalContent();
      let children: any[] = [];

      if (content) {
        // 使用AI生成的内容
        const lines = content.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) {
            children.push(new Paragraph({ spacing: { after: 100 } }));
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
              spacing: { before: 150, after: 80 },
            }));
          } else {
            children.push(new Paragraph({
              children: [new TextRun({ text: trimmed.replace(/\*\*/g, ''), size: 22 })],
              spacing: { after: 80 },
            }));
          }
        }
      } else {
        // 使用表单数据
        children = [
          new Paragraph({
            children: [new TextRun({ text: `运营周报 - ${reportData.name}`, bold: true, size: 32 })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [new TextRun({ text: `日期：${reportData.date}`, size: 24 })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Paragraph({ children: [new TextRun({ text: "一、本周运营工作", bold: true, size: 28 })], spacing: { before: 200, after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: reportData.tasks, size: 22 })], spacing: { after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "二、水质数据指标", bold: true, size: 28 })], spacing: { before: 200, after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: reportData.dataMetrics, size: 22 })], spacing: { after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "三、问题与解决", bold: true, size: 28 })], spacing: { before: 200, after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: reportData.issues, size: 22 })], spacing: { after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: "四、下周计划", bold: true, size: 28 })], spacing: { before: 200, after: 100 } }),
          new Paragraph({ children: [new TextRun({ text: reportData.nextWeek, size: 22 })], spacing: { after: 100 } }),
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
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error("Word 下载失败:", error);
      alert("Word 下载失败，请重试");
    } finally {
      setIsGenerating(false);
    }
  };

  const aiContent = getFinalContent();

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(0, 0, 0, 0.9)",
      zIndex: 100,
      display: "flex",
      flexDirection: "column",
    }}>
      {/* 顶部导航 */}
      <div style={{
        padding: "12px 20px",
        backgroundColor: "#111318",
        borderBottom: "1px solid #2a2e3a",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <h2 style={{ color: "white", fontSize: "16px", margin: 0 }}>
          周报导出 - {reportData.name} {reportData.date}
        </h2>
        <button
          onClick={onClose}
          style={{
            background: "#ef4444",
            border: "none",
            color: "white",
            cursor: "pointer",
            fontSize: "14px",
            padding: "6px 16px",
            borderRadius: "6px",
          }}
        >
          关闭
        </button>
      </div>

      {/* 标签切换 */}
      <div style={{
        display: "flex",
        gap: "2px",
        backgroundColor: "#1a1d24",
        padding: "10px 20px 0",
      }}>
        <button
          onClick={() => setActiveTab("preview")}
          style={{
            padding: "10px 24px",
            backgroundColor: activeTab === "preview" ? "#06b6d4" : "#374151",
            color: "white",
            border: "none",
            borderRadius: "8px 8px 0 0",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          📄 文档预览
        </button>
        <button
          onClick={previewPDF}
          disabled={isGenerating}
          style={{
            padding: "10px 24px",
            backgroundColor: activeTab === "pdf" ? "#ef4444" : "#374151",
            color: "white",
            border: "none",
            borderRadius: "8px 8px 0 0",
            cursor: isGenerating ? "not-allowed" : "pointer",
            fontSize: "14px",
            opacity: isGenerating ? 0.6 : 1,
          }}
        >
          {isGenerating && activeTab !== "pdf" ? "生成中..." : "🔍 PDF预览"}
        </button>
      </div>

      {/* 内容区域 */}
      <div style={{
        flex: 1,
        overflow: "auto",
        padding: "20px",
        backgroundColor: "#0a0c10",
      }}>
        {activeTab === "pdf" && pdfUrl ? (
          <iframe
            src={pdfUrl}
            style={{
              width: "100%",
              height: "100%",
              border: "none",
              backgroundColor: "#333",
            }}
          />
        ) : (
          <div style={{
            maxWidth: "800px",
            margin: "0 auto",
            backgroundColor: "white",
            padding: "40px",
            borderRadius: "8px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          }}>
            {aiContent ? (
              <div id="pdf-content" style={{ color: "black", fontFamily: "'SimSun', serif", fontSize: "14px" }}>
                {parseMarkdownContent(aiContent)}
              </div>
            ) : (
              <div id="pdf-content" style={{ color: "black", fontFamily: "'SimSun', serif" }}>
                <h1 style={{ textAlign: "center", fontSize: "24px" }}>运营周报</h1>
                <p style={{ textAlign: "center" }}>{reportData.name} | {reportData.date}</p>
                
                <h2>一、本周运营工作</h2>
                <h3>关键任务</h3>
                <p>{reportData.tasks}</p>
                <h3>主要成果</h3>
                <p>{reportData.achievements}</p>
                
                <h2>二、水质数据指标</h2>
                <p>{reportData.dataMetrics}</p>
                
                <h2>三、问题与解决</h2>
                <p>{reportData.issues}</p>
                
                <h2>四、团队协作</h2>
                <p>{reportData.collaboration}</p>
                <p>{reportData.learning}</p>
                
                <h2>五、下周计划</h2>
                <p>{reportData.nextWeek}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 底部按钮 */}
      <div style={{
        padding: "16px 20px",
        backgroundColor: "#111318",
        borderTop: "1px solid #2a2e3a",
        display: "flex",
        gap: "12px",
        justifyContent: "center",
        flexWrap: "wrap",
      }}>
        <button
          onClick={downloadPDF}
          disabled={isGenerating}
          style={{
            padding: "12px 32px",
            backgroundColor: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: isGenerating ? "not-allowed" : "pointer",
            opacity: isGenerating ? 0.6 : 1,
            fontSize: "15px",
            fontWeight: "bold",
          }}
        >
          {isGenerating ? "生成中..." : "⬇️ 下载 PDF"}
        </button>
        <button
          onClick={downloadWord}
          disabled={isGenerating}
          style={{
            padding: "12px 32px",
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: isGenerating ? "not-allowed" : "pointer",
            opacity: isGenerating ? 0.6 : 1,
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
