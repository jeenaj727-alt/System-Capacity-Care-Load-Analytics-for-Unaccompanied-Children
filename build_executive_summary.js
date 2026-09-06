const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, ShadingType, AlignmentType, ImageRun, Header, Footer, PageNumber,
} = require("docx");
const fs = require("fs");

const NAVY = "1B2A4A";
const GREY = "6B7280";
const LIGHT = "F2F4F8";
const bodyFont = "Calibri";

function h1(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { before: 320, after: 140 } });
}
function p(text) {
  return new Paragraph({ spacing: { after: 160, line: 276 }, children: [new TextRun({ text, font: bodyFont, size: 22 })] });
}
function bullet(text) {
  return new Paragraph({ text, bullet: { level: 0 }, spacing: { after: 80 } });
}
function caption(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { before: 60, after: 240 },
    children: [new TextRun({ text, italics: true, size: 18, color: "555555", font: bodyFont })],
  });
}
function image(path, w, h) {
  return new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { before: 100, after: 40 },
    children: [new ImageRun({ type: "png", data: fs.readFileSync(path), transformation: { width: w, height: h } })],
  });
}
function kpiCard(label, value, sub) {
  return new TableCell({
    width: { size: 20, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.CLEAR, fill: LIGHT },
    margins: { top: 160, bottom: 160, left: 120, right: 120 },
    children: [
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 },
        children: [new TextRun({ text: value, bold: true, size: 30, color: NAVY, font: bodyFont })] }),
      new Paragraph({ alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: label, size: 16, bold: true, font: bodyFont })] }),
      new Paragraph({ alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: sub, size: 14, color: GREY, font: bodyFont })] }),
    ],
  });
}

const doc = new Document({
  sections: [{
    properties: {
      page: { size: { width: 12240, height: 15840 }, margin: { top: 1260, bottom: 1260, left: 1350, right: 1350 } },
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: "Executive Summary — UAC Capacity Analytics", size: 16, color: GREY, font: bodyFont })],
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "Page ", size: 18, color: GREY, font: bodyFont }),
            new TextRun({ children: [PageNumber.CURRENT], size: 18, color: GREY, font: bodyFont }),
            new TextRun({ text: " of ", size: 18, color: GREY, font: bodyFont }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: GREY, font: bodyFont }),
          ],
        })],
      }),
    },
    children: [
      new Paragraph({ spacing: { after: 60 },
        children: [new TextRun({ text: "SYSTEM CAPACITY & CARE LOAD ANALYTICS", bold: true, size: 34, color: NAVY, font: bodyFont })] }),
      new Paragraph({ spacing: { after: 40 },
        children: [new TextRun({ text: "Unaccompanied Children (UAC) Program", size: 24, color: GREY, font: bodyFont })] }),
      new Paragraph({ spacing: { after: 300 },
        children: [new TextRun({ text: "Executive Summary  ·  Data Coverage: Jan 12, 2023 – Dec 21, 2025  ·  Prepared for HHS / Unified Mentor stakeholders", italics: true, size: 20, color: GREY, font: bodyFont })] }),

      h1("Purpose"),
      p("HHS currently lacks a centralized way to continuously monitor total care-system load, the balance between inflow and outflow, and periods of capacity stress across the CBP-to-HHS unaccompanied children (UAC) pipeline. This summary presents the key findings from a full analysis of 720 days of daily operational data (2023–2025) and the resulting KPI framework and dashboard now available to support proactive, data-driven decisions."),

      h1("Current System Snapshot"),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [1730, 1730, 1730, 1730, 1730],
        rows: [new TableRow({
          children: [
            kpiCard("Latest Total Load", "2,502", "children under care, 12/21/2025"),
            kpiCard("2023→2025 Change", "-71%", "avg. total system load"),
            kpiCard("Peak Load", "11,762", "Dec 20, 2023"),
            kpiCard("Avg. Volatility", "1.24%", "7-day rolling index"),
            kpiCard("Median Discharge Ratio", "1.28", "discharges ÷ transfers-in"),
          ],
        })],
      }),
      new Paragraph({ text: "", spacing: { after: 200 } }),

      h1("Key Findings"),
      bullet("System load has declined sharply and sustainably. Average total system load (CBP custody + HHS care) fell from ~8,847 (2023) to ~2,576 (2025) — a ~71% reduction — driven primarily by lower CBP intake (117.6/day avg. in 2023 vs. 13.0/day in 2025), not solely faster HHS discharge."),
      bullet("The sharpest relief window was Q1 2025. Monthly average total load dropped from ~5,080 (Jan 2025) to ~2,186 (Mar 2025) — a ~57% decline in two months — after which the system stabilized in a ~2,000–2,550 operating band."),
      bullet("The most acute historical stress was late 2023–early 2024, with total load twice exceeding 11,000 and CBP custody spiking to 531 children in a single day (Feb 4, 2024) — CBP-side surges are the leading indicator of acute strain."),
      bullet("Backlog accumulation is typically short-lived. Sustained positive net-intake streaks rarely exceed 4–5 consecutive days, indicating existing discharge/placement processes generally absorb normal week-to-week variation."),
      bullet("Operational volatility has stayed comparatively stable (~1.2% avg.) even as absolute system size changed dramatically — a favorable signal for scalable staffing and shelter-capacity models."),

      image("../charts/01_total_system_load.png", 560, 252),
      caption("Total system load, 2023–2025, with 30-day rolling average. The Q1 2025 step-down and subsequent stable, lower-volume period are clearly visible."),

      h1("Recommendations"),
      bullet("Adopt the five-KPI framework (Total Children Under Care, Net Intake Pressure, Care Load Volatility Index, Backlog Accumulation Rate, Discharge Offset Ratio) as a standing weekly capacity review."),
      bullet("Use the accompanying Streamlit dashboard for continuous, self-service monitoring with date-range, granularity, and metric filtering."),
      bullet("Set an early-warning threshold on Backlog Streak (e.g., flag any streak beyond 5 days, the historical maximum observed) and on Discharge Offset Ratio falling below 1.0 over a rolling window."),
      bullet("Treat CBP custody spikes as a leading indicator to trigger HHS shelter/staffing readiness reviews ahead of downstream load increases."),

      h1("Deliverables Provided"),
      bullet("Full research paper — detailed EDA, methodology, findings, and recommendations."),
      bullet("Interactive Streamlit dashboard — live KPI cards, trend charts, and filterable data export."),
      bullet("This executive summary — condensed briefing for policymakers and program leadership."),
    ],
  }],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("/home/claude/uac_project/docs/Executive_Summary_UAC_Capacity_Analytics.docx", buffer);
  console.log("Executive summary written.");
});
