"use client";

import { useState } from "react";
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // 生成文件名
  const generateFileName = (extension: string) => {
    const sanitizedName = reportData.name.replace(/[\\/:*?"<>|]/g, "");
    const sanitizedDate = reportData.date.replace(/[\\/:*?"<>|]/g, "");
    return `${sanitizedName}_${sanitizedDate}.${extension}`;
  };

  // 生成 PDF
  const generatePDF = async (download: boolean = true) => {
    setIsGenerating(true);
    try {
      const element = document.getElementById("report-preview-content");
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
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
      
      pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio);

      if (download) {
        pdf.save(generateFileName("pdf"));
      } else {
        const pdfBlob = pdf.output("blob");
        const url = URL.createObjectURL(pdfBlob);
        setPreviewUrl(url);
      }
    } catch (error) {
      console.error("PDF 生成失败:", error);
      alert("PDF 生成失败，请重试");
    } finally {
      setIsGenerating(false);
    }
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
            ...reportData.tasks.split("\n").map(line => 
              new Paragraph({ children: [new TextRun(line)], spacing: { after: 100 } })
            ),
            new Paragraph({ children: [], spacing: { after: 200 } }),
            new Paragraph({
              children: [
                new TextRun({ text: "主要成果：", bold: true }),
              ],
              spacing: { after: 100 },
            }),
            ...reportData.achievements.split("\n").map(line => 
              new Paragraph({ children: [new TextRun(line)], spacing: { after: 100 } })
            ),
            // 水质数据指标
            new Paragraph({
              children: [
                new TextRun({ text: "二、水质数据指标", bold: true, size: 28 }),
              ],
              spacing: { before: 400, after: 200 },
            }),
            ...reportData.dataMetrics.split("\n").map(line => 
              new Paragraph({ children: [new TextRun(line)], spacing: { after: 100 } })
            ),
            // 问题与解决
            new Paragraph({
              children: [
                new TextRun({ text: "三、问题与解决", bold: true, size: 28 }),
              ],
              spacing: { before: 400, after: 200 },
            }),
            ...reportData.issues.split("\n").map(line => 
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
            ...reportData.collaboration.split("\n").map(line => 
              new Paragraph({ children: [new TextRun(line)], spacing: { after: 100 } })
            ),
            new Paragraph({ children: [], spacing: { after: 200 } }),
            new Paragraph({
              children: [
                new TextRun({ text: "学习成长：", bold: true }),
              ],
              spacing: { after: 100 },
            }),
            ...reportData.learning.split("\n").map(line => 
              new Paragraph({ children: [new TextRun(line)], spacing: { after: 100 } })
            ),
            // 下周计划
            new Paragraph({
              children: [
                new TextRun({ text: "五、下周计划", bold: true, size: 28 }),
              ],
              spacing: { before: 400, after: 200 },
            }),
            ...reportData.nextWeek.split("\n").map(line => 
              new Paragraph({ children: [new TextRun(line)], spacing: { after: 100 } })
            ),
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, generateFileName("docx"));
    } catch (error) {
      console.error("Word 生成失败:", error);
      alert("Word 生成失败，请重试");
    } finally {
      setIsGenerating(false);
    }
  };

  // 格式化内容，将文本转换为 JSX
  const formatContent = (text: string) => {
    if (!text) return null;
    return text.split("\n").map((line, index) => (
      <p key={index} style={{ marginBottom: "8px", lineHeight: "1.8" }}>
        {line}
      </p>
    ));
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(0, 0, 0, 0.8)",
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
              fontSize: "20px",
            }}
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
          {previewUrl ? (
            <iframe
              src={previewUrl}
              style={{
                width: "100%",
                height: "500px",
                border: "none",
                borderRadius: "8px",
              }}
            />
          ) : (
            <div
              id="report-preview-content"
              style={{
                backgroundColor: "white",
                color: "black",
                padding: "40px",
                borderRadius: "8px",
                maxWidth: "800px",
                margin: "0 auto",
                fontSize: "14px",
                lineHeight: "1.8",
              }}
            >
              <h1 style={{ textAlign: "center", fontSize: "24px", marginBottom: "10px" }}>
                运营周报
              </h1>
              <p style={{ textAlign: "center", marginBottom: "30px" }}>
                {reportData.name} | {reportData.date}
              </p>

              <h2 style={{ fontSize: "18px", borderBottom: "2px solid #333", paddingBottom: "8px", marginTop: "24px" }}>
                一、本周运营工作
              </h2>
              <h3 style={{ fontSize: "15px", marginTop: "16px" }}>关键任务</h3>
              {formatContent(reportData.tasks)}
              <h3 style={{ fontSize: "15px", marginTop: "16px" }}>主要成果</h3>
              {formatContent(reportData.achievements)}

              <h2 style={{ fontSize: "18px", borderBottom: "2px solid #333", paddingBottom: "8px", marginTop: "24px" }}>
                二、水质数据指标
              </h2>
              {formatContent(reportData.dataMetrics)}

              <h2 style={{ fontSize: "18px", borderBottom: "2px solid #333", paddingBottom: "8px", marginTop: "24px" }}>
                三、问题与解决
              </h2>
              {formatContent(reportData.issues)}

              <h2 style={{ fontSize: "18px", borderBottom: "2px solid #333", paddingBottom: "8px", marginTop: "24px" }}>
                四、团队协作
              </h2>
              <h3 style={{ fontSize: "15px", marginTop: "16px" }}>协作配合</h3>
              {formatContent(reportData.collaboration)}
              <h3 style={{ fontSize: "15px", marginTop: "16px" }}>学习成长</h3>
              {formatContent(reportData.learning)}

              <h2 style={{ fontSize: "18px", borderBottom: "2px solid #333", paddingBottom: "8px", marginTop: "24px" }}>
                五、下周计划
              </h2>
              {formatContent(reportData.nextWeek)}
            </div>
          )}
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
            onClick={() => generatePDF(false)}
            disabled={isGenerating}
            style={{
              padding: "10px 20px",
              backgroundColor: "#374151",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: isGenerating ? "not-allowed" : "pointer",
              opacity: isGenerating ? 0.6 : 1,
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            预览 PDF
          </button>
          <button
            onClick={() => generatePDF(true)}
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
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            下载 PDF
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
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            下载 Word
          </button>
        </div>
      </div>
    </div>
  );
}
