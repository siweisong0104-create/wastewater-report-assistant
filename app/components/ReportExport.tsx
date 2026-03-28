"use client";

import { useState, useEffect } from "react";
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
  const [activeTab, setActiveTab] = useState<"html" | "pdf">("html");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      .replace(/^# (.*$)/gim, '<h1 style="font-size:18px;text-align:center;margin:8px 0;font-weight:bold;">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 style="font-size:13px;margin:10px 0 5px 0;font-weight:bold;border-bottom:1px solid #666;padding-bottom:2px;">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 style="font-size:12px;margin:6px 0 3px 0;font-weight:bold;">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
    return html;
  };

  // 生成 PDF Blob URL
  const generatePDFBlob = async (): Promise<string | null> => {
    setError(null);
    const element = document.getElementById("a4-content");
    if (!element) {
      setError("找不到预览内容");
      return null;
    }

    try {
      // 创建canvas，使用固定宽度确保一致
      const canvas = await html2canvas(element, {
        scale: 1.5, // 适中清晰度
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        width: 794, // 210mm at 96 DPI
        height: element.scrollHeight,
      });

      const imgData = canvas.toDataURL("image/png");
      
      // 创建PDF，标准A4
      const pdf = new jsPDF({
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      });

      const pdfWidth = 210;
      const pdfHeight = 297;
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // 计算缩放比例，使内容宽度等于PDF宽度
      const ratio = pdfWidth / (imgWidth / 3.779); // 转换像素到mm (96 DPI)
      const scaledHeight = (imgHeight / 3.779) * ratio;

      // 添加图片，自动分页
      let heightLeft = scaledHeight;
      let position = 0;
      let pageCount = 0;

      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, scaledHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 10 && pageCount < 10) { // 限制最多10页，避免无限循环
        pageCount++;
        position = -pageCount * pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, scaledHeight);
        heightLeft -= pdfHeight;
      }

      // 生成 blob URL
      const blob = pdf.output("blob");
      return URL.createObjectURL(blob);
      
    } catch (err) {
      console.error("PDF生成错误:", err);
      setError("PDF生成失败: " + (err as Error).message);
      return null;
    }
  };

  // 切换到PDF预览
  const switchToPDF = async () => {
    if (activeTab === "pdf" && pdfUrl) return; // 已经生成过
    
    setIsGenerating(true);
    setError(null);
    
    const url = await generatePDFBlob();
    if (url) {
      setPdfUrl(url);
      setActiveTab("pdf");
    }
    
    setIsGenerating(false);
  };

  // 下载 PDF
  const downloadPDF = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      let url = pdfUrl;
      
      // 如果没有生成过，先生成
      if (!url) {
        url = await generatePDFBlob();
      }
      
      if (url) {
        const link = document.createElement("a");
        link.href = url;
        link.download = generateFileName("pdf");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      setError("下载失败: " + (err as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  // 生成文件名
  const generateFileName = (extension: string) => {
    const sanitizedName = reportData.name.replace(/[\\/:*?"<>|]/g, "") || "周报";
    const sanitizedDate = reportData.date.replace(/[\\/:*?"<>|]/g, "") || "未命名";
    return `${sanitizedName}_${sanitizedDate}.${extension}`;
  };

  // 生成 Word
  const generateWord = async () => {
    setIsGenerating(true);
    try {
      const content = getFinalContent();
      let children: any[] = [];

      if (content) {
        const lines = content.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) {
            children.push(new Paragraph({ spacing: { after: 80 } }));
            continue;
          }

          if (trimmed.startsWith('# ')) {
            children.push(new Paragraph({
              children: [new TextRun({ text: trimmed.replace('# ', ''), bold: true, size: 28 })],
              alignment: AlignmentType.CENTER,
              spacing: { after: 120 },
            }));
          } else if (trimmed.startsWith('## ')) {
            children.push(new Paragraph({
              children: [new TextRun({ text: trimmed.replace('## ', ''), bold: true, size: 22 })],
              spacing: { before: 120, after: 60 },
            }));
          } else if (trimmed.startsWith('### ')) {
            children.push(new Paragraph({
              children: [new TextRun({ text: trimmed.replace('### ', ''), bold: true, size: 20 })],
              spacing: { before: 80, after: 40 },
            }));
          } else {
            const cleanText = trimmed.replace(/\*\*/g, '');
            children.push(new Paragraph({
              children: [new TextRun({ text: cleanText, size: 21 })],
              spacing: { after: 40 },
            }));
          }
        }
      } else {
        children = [
          new Paragraph({
            children: [new TextRun({ text: `运营周报 - ${reportData.name}`, bold: true, size: 28 })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
          }),
          new Paragraph({
            children: [new TextRun({ text: `日期：${reportData.date}`, size: 21 })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
          }),
          new Paragraph({ children: [new TextRun({ text: "一、本周运营工作", bold: true, size: 22 })], spacing: { before: 120, after: 60 } }),
          new Paragraph({ children: [new TextRun({ text: reportData.tasks || "（未填写）", size: 21 })], spacing: { after: 40 } }),
          new Paragraph({ children: [new TextRun({ text: "二、水质数据指标", bold: true, size: 22 })], spacing: { before: 120, after: 60 } }),
          new Paragraph({ children: [new TextRun({ text: reportData.dataMetrics || "（未填写）", size: 21 })], spacing: { after: 40 } }),
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

  // 清理PDF URL
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

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

      {/* 标签切换 */}
      <div style={{
        display: "flex",
        backgroundColor: "#1a1d24",
        padding: "12px 16px 0",
        gap: "8px",
      }}>
        <button
          onClick={() => setActiveTab("html")}
          style={{
            padding: "10px 24px",
            backgroundColor: activeTab === "html" ? "#06b6d4" : "#374151",
            color: "white",
            border: "none",
            borderRadius: "8px 8px 0 0",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: activeTab === "html" ? "bold" : "normal",
          }}
        >
          📄 文档预览
        </button>
        <button
          onClick={switchToPDF}
          disabled={isGenerating}
          style={{
            padding: "10px 24px",
            backgroundColor: activeTab === "pdf" ? "#ef4444" : "#374151",
            color: "white",
            border: "none",
            borderRadius: "8px 8px 0 0",
            cursor: isGenerating ? "not-allowed" : "pointer",
            fontSize: "14px",
            fontWeight: activeTab === "pdf" ? "bold" : "normal",
            opacity: isGenerating ? 0.7 : 1,
          }}
        >
          {isGenerating && activeTab !== "pdf" ? "⏳ 生成中..." : "🔍 PDF预览"}
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

      {/* 内容区域 */}
      <div style={{
        flex: 1,
        overflow: "auto",
        padding: "20px",
        backgroundColor: "#1a1d24",
      }}>
        {activeTab === "pdf" ? (
          // PDF 预览
          pdfUrl ? (
            <iframe
              src={pdfUrl}
              style={{
                width: "100%",
                height: "100%",
                minHeight: "500px",
                border: "none",
                backgroundColor: "#333",
              }}
              title="PDF Preview"
            />
          ) : (
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "#6b7280",
              fontSize: "16px",
            }}>
              {isGenerating ? "正在生成PDF预览..." : "点击上方按钮生成PDF预览"}
            </div>
          )
        ) : (
          // HTML 预览（A4纸张，缩放显示）
          <div style={{
            display: "flex",
            justifyContent: "center",
            minHeight: "100%",
          }}>
            <div style={{
              transform: "scale(0.85)",
              transformOrigin: "top center",
            }}>
              <div
                id="a4-content"
                style={{
                  width: "210mm",
                  minHeight: "297mm",
                  padding: "15mm",
                  backgroundColor: "white",
                  boxSizing: "border-box",
                  fontFamily: "'SimSun', '宋体', serif",
                  fontSize: "11pt",
                  lineHeight: "1.5",
                  color: "black",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
                }}
                dangerouslySetInnerHTML={{
                  __html: aiContent 
                    ? parseMarkdownToHTML(aiContent)
                    : `
                      <h1 style="font-size:18px;text-align:center;margin:8px 0;font-weight:bold;">运营周报</h1>
                      <p style="text-align:center;margin:4px 0;font-size:11pt;">${reportData.name} | ${reportData.date}</p>
                      <h2 style="font-size:13px;margin:10px 0 5px 0;font-weight:bold;border-bottom:1px solid #666;padding-bottom:2px;">一、本周运营工作</h2>
                      <p style="margin:4px 0;"><strong>关键任务：</strong>${reportData.tasks || "（未填写）"}</p>
                      <p style="margin:4px 0;"><strong>主要成果：</strong>${reportData.achievements || "（未填写）"}</p>
                      <h2 style="font-size:13px;margin:10px 0 5px 0;font-weight:bold;border-bottom:1px solid #666;padding-bottom:2px;">二、水质数据指标</h2>
                      <p style="margin:4px 0;">${reportData.dataMetrics || "（未填写）"}</p>
                      <h2 style="font-size:13px;margin:10px 0 5px 0;font-weight:bold;border-bottom:1px solid #666;padding-bottom:2px;">三、问题与解决</h2>
                      <p style="margin:4px 0;">${reportData.issues || "（未填写）"}</p>
                      <h2 style="font-size:13px;margin:10px 0 5px 0;font-weight:bold;border-bottom:1px solid #666;padding-bottom:2px;">四、团队协作</h2>
                      <p style="margin:4px 0;"><strong>协作配合：</strong>${reportData.collaboration || "（未填写）"}</p>
                      <p style="margin:4px 0;"><strong>学习成长：</strong>${reportData.learning || "（未填写）"}</p>
                      <h2 style="font-size:13px;margin:10px 0 5px 0;font-weight:bold;border-bottom:1px solid #666;padding-bottom:2px;">五、下周计划</h2>
                      <p style="margin:4px 0;">${reportData.nextWeek || "（未填写）"}</p>
                    `
                }}
              />
            </div>
          </div>
        )}
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
          {isGenerating && activeTab === "html" ? "生成中..." : "⬇️ 下载 PDF"}
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
