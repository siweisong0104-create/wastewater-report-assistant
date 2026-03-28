"use client";

import { useState, useEffect, useRef } from "react";
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
  const [pdfDataUrl, setPdfDataUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pdfCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // 获取最终内容
  const getFinalContent = () => {
    if (reportData.content && reportData.content.trim().length > 50) {
      return reportData.content;
    }
    return null;
  };

  // 解析 Markdown 为 HTML - 优化排版
  const parseMarkdownToHTML = (content: string) => {
    let html = content
      .replace(/^# (.*$)/gim, '<h1 style="font-size:22px;text-align:center;margin:16px 0 20px 0;font-weight:bold;color:#000;">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 style="font-size:16px;margin:20px 0 12px 0;font-weight:bold;color:#000;border-bottom:2px solid #333;padding-bottom:4px;">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 style="font-size:14px;margin:16px 0 8px 0;font-weight:bold;color:#000;">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#000;">$1</strong>')
      .replace(/\n/g, '<br style="line-height:1.8;"/>');
    return html;
  };

  // 生成 PDF 并返回 Data URL
  const generatePDF = async (): Promise<string | null> => {
    setError(null);
    const element = document.getElementById("a4-content");
    if (!element) {
      setError("找不到预览内容");
      return null;
    }

    try {
      // 等待字体渲染
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 创建canvas，使用较高清晰度
      const canvas = await html2canvas(element, {
        scale: 2, // 高清
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        allowTaint: true,
        foreignObjectRendering: false,
      });

      // 保存canvas供PDF预览使用
      pdfCanvasRef.current = canvas;
      
      // 创建PDF
      const pdf = new jsPDF({
        unit: "mm",
        format: "a4",
        orientation: "portrait",
        compress: true,
      });

      const pdfWidth = 210;
      const pdfHeight = 297;
      
      // 计算分页
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / (imgWidth * 0.264), pdfHeight / (imgHeight * 0.264));
      
      // 直接按PDF尺寸添加
      const imgData = canvas.toDataURL("image/png", 1.0);
      
      // 单页PDF（如果内容超出会自动裁剪，但通常A4内容应该在一页内）
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, (imgHeight * pdfWidth) / imgWidth);

      // 返回 Data URL 用于预览
      return pdf.output("datauristring");
      
    } catch (err) {
      console.error("PDF生成错误:", err);
      setError("PDF生成失败: " + (err as Error).message);
      return null;
    }
  };

  // 切换到PDF预览
  const switchToPDF = async () => {
    if (activeTab === "pdf" && pdfDataUrl) return;
    
    setIsGenerating(true);
    setError(null);
    setActiveTab("pdf"); // 立即切换标签，显示加载状态
    
    const dataUrl = await generatePDF();
    if (dataUrl) {
      setPdfDataUrl(dataUrl);
    }
    
    setIsGenerating(false);
  };

  // 下载 PDF
  const downloadPDF = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      let dataUrl = pdfDataUrl;
      
      // 如果没有生成过，先生成
      if (!dataUrl) {
        dataUrl = await generatePDF();
      }
      
      if (dataUrl) {
        const link = document.createElement("a");
        link.href = dataUrl;
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
          {isGenerating && activeTab === "pdf" ? "⏳ 生成中..." : "🔍 PDF预览"}
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
          // PDF 预览 - 使用 object 标签替代 iframe
          <div style={{
            display: "flex",
            justifyContent: "center",
            minHeight: "100%",
          }}>
            {pdfDataUrl ? (
              <object
                data={pdfDataUrl}
                type="application/pdf"
                style={{
                  width: "100%",
                  maxWidth: "794px",
                  height: "100%",
                  minHeight: "600px",
                  border: "none",
                  backgroundColor: "white",
                }}
              >
                <div style={{
                  padding: "40px",
                  textAlign: "center",
                  color: "#666",
                }}>
                  <p>您的浏览器不支持PDF预览</p>
                  <button
                    onClick={downloadPDF}
                    style={{
                      marginTop: "16px",
                      padding: "10px 20px",
                      backgroundColor: "#06b6d4",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    直接下载PDF
                  </button>
                </div>
              </object>
            ) : (
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "#6b7280",
                fontSize: "16px",
                gap: "16px",
              }}>
                {isGenerating ? (
                  <>
                    <div style={{
                      width: "40px",
                      height: "40px",
                      border: "4px solid #374151",
                      borderTop: "4px solid #06b6d4",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }} />
                    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                    <span>正在生成PDF预览...</span>
                  </>
                ) : (
                  <>
                    <span>点击上方按钮生成PDF预览</span>
                    <button
                      onClick={switchToPDF}
                      style={{
                        padding: "10px 24px",
                        backgroundColor: "#06b6d4",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "14px",
                      }}
                    >
                      生成PDF预览
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          // HTML 预览（A4纸张）- 优化排版
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
                padding: "20mm",
                backgroundColor: "white",
                boxSizing: "border-box",
                fontFamily: "'SimSun', '宋体', 'Noto Sans SC', sans-serif",
                fontSize: "14pt", // 增大字体
                lineHeight: "1.8", // 增加行距
                color: "#000",
                boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
              }}
              dangerouslySetInnerHTML={{
                __html: aiContent 
                  ? parseMarkdownToHTML(aiContent)
                  : `
                    <h1 style="font-size:22px;text-align:center;margin:16px 0 20px 0;font-weight:bold;color:#000;">运营周报</h1>
                    <p style="text-align:center;margin:8px 0;font-size:14pt;color:#000;">${reportData.name} | ${reportData.date}</p>
                    <h2 style="font-size:16px;margin:24px 0 12px 0;font-weight:bold;color:#000;border-bottom:2px solid #333;padding-bottom:4px;">一、本周运营工作</h2>
                    <p style="margin:12px 0;line-height:1.8;color:#000;"><strong>关键任务：</strong>${reportData.tasks || "（未填写）"}</p>
                    <p style="margin:12px 0;line-height:1.8;color:#000;"><strong>主要成果：</strong>${reportData.achievements || "（未填写）"}</p>
                    <h2 style="font-size:16px;margin:24px 0 12px 0;font-weight:bold;color:#000;border-bottom:2px solid #333;padding-bottom:4px;">二、水质数据指标</h2>
                    <p style="margin:12px 0;line-height:1.8;color:#000;">${reportData.dataMetrics || "（未填写）"}</p>
                    <h2 style="font-size:16px;margin:24px 0 12px 0;font-weight:bold;color:#000;border-bottom:2px solid #333;padding-bottom:4px;">三、问题与解决</h2>
                    <p style="margin:12px 0;line-height:1.8;color:#000;">${reportData.issues || "（未填写）"}</p>
                    <h2 style="font-size:16px;margin:24px 0 12px 0;font-weight:bold;color:#000;border-bottom:2px solid #333;padding-bottom:4px;">四、团队协作</h2>
                    <p style="margin:12px 0;line-height:1.8;color:#000;"><strong>协作配合：</strong>${reportData.collaboration || "（未填写）"}</p>
                    <p style="margin:12px 0;line-height:1.8;color:#000;"><strong>学习成长：</strong>${reportData.learning || "（未填写）"}</p>
                    <h2 style="font-size:16px;margin:24px 0 12px 0;font-weight:bold;color:#000;border-bottom:2px solid #333;padding-bottom:4px;">五、下周计划</h2>
                    <p style="margin:12px 0;line-height:1.8;color:#000;">${reportData.nextWeek || "（未填写）"}</p>
                  `
              }}
            />
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
