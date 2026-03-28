"use client";

import { useState, useRef } from "react";
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
  content?: string;
}

interface ReportExportProps {
  reportData: ReportData;
  onClose: () => void;
}

export default function ReportExport({ reportData, onClose }: ReportExportProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // 生成文件名
  const generateFileName = (extension: string) => {
    const sanitizedName = reportData.name.replace(/[\\/:*?"<>|]/g, "");
    const sanitizedDate = reportData.date.replace(/[\\/:*?"<>|]/g, "");
    return `${sanitizedName}_${sanitizedDate}.${extension}`;
  };

  // 生成 PDF 并下载
  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const element = document.getElementById("report-preview-content");
      if (!element) {
        alert("预览内容不存在，请重试");
        return;
      }

      // 等待图片加载
      await new Promise(resolve => setTimeout(resolve, 500));

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
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      let imgY = 10;
      
      // 计算是否需要分页
      const scaledHeight = imgHeight * ratio;
      let heightLeft = scaledHeight;
      let position = imgY;

      // 添加第一页
      pdf.addImage(imgData, "PNG", imgX, position, imgWidth * ratio, imgHeight * ratio);
      heightLeft -= (pdfHeight - 20);

      // 如果需要，添加更多页面
      while (heightLeft > 0) {
        position = heightLeft - scaledHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", imgX, position, imgWidth * ratio, imgHeight * ratio);
        heightLeft -= (pdfHeight - 20);
      }

      // 使用 Blob 方式下载，避免浏览器拦截
      const pdfBlob = pdf.output("blob");
      const blobUrl = URL.createObjectURL(pdfBlob);
      
      // 创建临时链接并点击
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = generateFileName("pdf");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 清理
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      
    } catch (error) {
      console.error("PDF 生成失败:", error);
      alert("PDF 生成失败，请重试。错误：" + (error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  // 显示 PDF 预览
  const showPDFPreview = () => {
    setShowPreview(true);
  };

  // 生成 Word 文档
  const generateWord = async () => {
    setIsGenerating(true);
    try {
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: `运营周报 - ${reportData.name}`, bold: true, size: 32 }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `日期：${reportData.date}`, size: 24 }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 600 },
            }),
            // 本周运营工作
            new Paragraph({
              children: [
                new TextRun({ text: "一、本周运营工作", bold: true, size: 28 }),
              ],
              spacing: { before: 200, after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "关键任务：", bold: true }),
              ],
              spacing: { after: 100 },
            }),
            ...reportData.tasks.split("\n").filter(line => line.trim()).map(line => 
              new Paragraph({ children: [new TextRun(line)], spacing: { after: 100 } })
            ),
            new Paragraph({ children: [], spacing: { after: 200 } }),
            new Paragraph({
              children: [
                new TextRun({ text: "主要成果：", bold: true }),
              ],
              spacing: { after: 100 },
            }),
            ...reportData.achievements.split("\n").filter(line => line.trim()).map(line => 
              new Paragraph({ children: [new TextRun(line)], spacing: { after: 100 } })
            ),
            // 水质数据指标
            new Paragraph({
              children: [
                new TextRun({ text: "二、水质数据指标", bold: true, size: 28 }),
              ],
              spacing: { before: 400, after: 200 },
            }),
            ...reportData.dataMetrics.split("\n").filter(line => line.trim()).map(line => 
              new Paragraph({ children: [new TextRun(line)], spacing: { after: 100 } })
            ),
            // 问题与解决
            new Paragraph({
              children: [
                new TextRun({ text: "三、问题与解决", bold: true, size: 28 }),
              ],
              spacing: { before: 400, after: 200 },
            }),
            ...reportData.issues.split("\n").filter(line => line.trim()).map(line => 
              new Paragraph({ children: [new TextRun(line)], spacing: { after: 100 } })
            ),
            // 团队协作
            new Paragraph({
              children: [
                new TextRun({ text: "四、团队协作", bold: true, size: 28 }),
              ],
              spacing: { before: 400, after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "协作配合：", bold: true }),
              ],
              spacing: { after: 100 },
            }),
            ...reportData.collaboration.split("\n").filter(line => line.trim()).map(line => 
              new Paragraph({ children: [new TextRun(line)], spacing: { after: 100 } })
            ),
            new Paragraph({ children: [], spacing: { after: 200 } }),
            new Paragraph({
              children: [
                new TextRun({ text: "学习成长：", bold: true }),
              ],
              spacing: { after: 100 },
            }),
            ...reportData.learning.split("\n").filter(line => line.trim()).map(line => 
              new Paragraph({ children: [new TextRun(line)], spacing: { after: 100 } })
            ),
            // 下周计划
            new Paragraph({
              children: [
                new TextRun({ text: "五、下周计划", bold: true, size: 28 }),
              ],
              spacing: { before: 400, after: 200 },
            }),
            ...reportData.nextWeek.split("\n").filter(line => line.trim()).map(line => 
              new Paragraph({ children: [new TextRun(line)], spacing: { after: 100 } })
            ),
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      
      // 使用 Blob 方式下载
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = generateFileName("docx");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      
    } catch (error) {
      console.error("Word 生成失败:", error);
      alert("Word 生成失败，请重试。错误：" + (error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  // 格式化内容
  const formatContent = (text: string) => {
    if (!text) return <p style={{ color: "#999", fontStyle: "italic" }}>（未填写）</p>;
    return text.split("\n").filter(line => line.trim()).map((line, index) => (
      <p key={index} style={{ marginBottom: "8px", lineHeight: "1.8" }}>
        {line}
      </p>
    ));
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(0, 0, 0, 0.85)",
      zIndex: 100,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
    }}>
      <div style={{
        backgroundColor: "#111318",
        border: "1px solid #2a2e3a",
        borderRadius: "12px",
        width: "100%",
        maxWidth: "900px",
        maxHeight: "90vh",
        display: "flex",
        flexDirection: "column",
      }}>
        {/* 头部 */}
        <div style={{
          padding: "16px 20px",
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
              background: "none",
              border: "none",
              color: "#6b7280",
              cursor: "pointer",
              fontSize: "24px",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "6px",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1f2937")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            ×
          </button>
        </div>

        {/* 预览区域 */}
        <div style={{
          flex: 1,
          overflow: "auto",
          padding: "20px",
          backgroundColor: "#0a0c10",
        }}>
          <div
            id="report-preview-content"
            ref={previewRef}
            style={{
              backgroundColor: "white",
              color: "black",
              padding: "40px",
              borderRadius: "8px",
              maxWidth: "800px",
              margin: "0 auto",
              fontSize: "14px",
              lineHeight: "1.8",
              fontFamily: "'SimSun', '宋体', serif",
            }}
          >
            <h1 style={{ textAlign: "center", fontSize: "24px", marginBottom: "10px", fontWeight: "bold" }}>
              运营周报
            </h1>
            <p style={{ textAlign: "center", marginBottom: "30px", fontSize: "14px" }}>
              {reportData.name} | {reportData.date}
            </p>

            <h2 style={{ fontSize: "18px", borderBottom: "2px solid #333", paddingBottom: "8px", marginTop: "24px", fontWeight: "bold" }}>
              一、本周运营工作
            </h2>
            <h3 style={{ fontSize: "15px", marginTop: "16px", fontWeight: "bold" }}>关键任务</h3>
            {formatContent(reportData.tasks)}
            <h3 style={{ fontSize: "15px", marginTop: "16px", fontWeight: "bold" }}>主要成果</h3>
            {formatContent(reportData.achievements)}

            <h2 style={{ fontSize: "18px", borderBottom: "2px solid #333", paddingBottom: "8px", marginTop: "24px", fontWeight: "bold" }}>
              二、水质数据指标
            </h2>
            {formatContent(reportData.dataMetrics)}

            <h2 style={{ fontSize: "18px", borderBottom: "2px solid #333", paddingBottom: "8px", marginTop: "24px", fontWeight: "bold" }}>
              三、问题与解决
            </h2>
            {formatContent(reportData.issues)}

            <h2 style={{ fontSize: "18px", borderBottom: "2px solid #333", paddingBottom: "8px", marginTop: "24px", fontWeight: "bold" }}>
              四、团队协作
            </h2>
            <h3 style={{ fontSize: "15px", marginTop: "16px", fontWeight: "bold" }}>协作配合</h3>
            {formatContent(reportData.collaboration)}
            <h3 style={{ fontSize: "15px", marginTop: "16px", fontWeight: "bold" }}>学习成长</h3>
            {formatContent(reportData.learning)}

            <h2 style={{ fontSize: "18px", borderBottom: "2px solid #333", paddingBottom: "8px", marginTop: "24px", fontWeight: "bold" }}>
              五、下周计划
            </h2>
            {formatContent(reportData.nextWeek)}
          </div>
        </div>

        {/* 底部按钮 */}
        <div style={{
          padding: "16px 20px",
          borderTop: "1px solid #2a2e3a",
          display: "flex",
          gap: "12px",
          justifyContent: "flex-end",
          flexWrap: "wrap",
        }}>
          <button
            onClick={generatePDF}
            disabled={isGenerating}
            style={{
              padding: "10px 20px",
              backgroundColor: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: isGenerating ? "not-allowed" : "pointer",
              opacity: isGenerating ? 0.6 : 1,
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontWeight: "500",
            }}
          >
            {isGenerating ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
                  <circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset="20" />
                </svg>
                生成中...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                下载 PDF
              </>
            )}
          </button>
          <button
            onClick={generateWord}
            disabled={isGenerating}
            style={{
              padding: "10px 20px",
              backgroundColor: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: isGenerating ? "not-allowed" : "pointer",
              opacity: isGenerating ? 0.6 : 1,
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontWeight: "500",
            }}
          >
            {isGenerating ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
                  <circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset="20" />
                </svg>
                生成中...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                下载 Word
              </>
            )}
          </button>
        </div>
      </div>
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
