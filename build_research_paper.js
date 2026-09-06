const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle, AlignmentType, ImageRun, PageBreak,
  Header, Footer, PageNumber, NumberFormat, LevelFormat, convertInchesToTwip,
} = require("docx");
const fs = require("fs");

const NAVY = "1B2A4A";
const BLUE = "2F6FED";
const GOLD = "C99A2E";
const GREY = "6B7280";
const LIGHT = "F2F4F8";

const bodyFont = "Calibri";

function h1(text) {
  return new Paragraph({
    text, heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 160 },
  });
}
function h2(text) {
  return new Paragraph({
    text, heading: HeadingLevel.HEADING_2, spacing: { before: 280, after: 120 },
  });
}
function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 160, line: 276 },
    children: [new TextRun({ text, font: bodyFont, size: 22, ...opts })],
  });
}
function bullet(text) {
  return new Paragraph({
    text, bullet: { level: 0 }, spacing: { after: 80 },
    style: "bodyBullet",
  });
}
function caption(text) {
  return new Paragraph({
    spacing: { before: 60, after: 240 },
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text, italics: true, size: 18, color: "555555", font: bodyFont })],
  });
}
function image(path, widthPx, heightPx) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 40 },
    children: [
      new ImageRun({
        type: "png",
        data: fs.readFileSync(path),
        transformation: { width: widthPx, height: heightPx },
      }),
    ],
  });
}

function kpiTable(rows) {
  const header = new TableRow({
    tableHeader: true,
    children: ["KPI", "Description", "Value"].map(
      (t) =>
        new TableCell({
          width: { size: 33, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.CLEAR, fill: NAVY },
          children: [new Paragraph({ children: [new TextRun({ text: t, bold: true, color: "FFFFFF", size: 20, font: bodyFont })] })],
        })
    ),
  });
  const body = rows.map(
    (r, i) =>
      new TableRow({
        children: r.map(
          (t) =>
            new TableCell({
              shading: { type: ShadingType.CLEAR, fill: i % 2 === 0 ? "FFFFFF" : LIGHT },
              children: [new Paragraph({ children: [new TextRun({ text: t, size: 20, font: bodyFont })] })],
            })
        ),
      })
  );
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: [3000, 5500, 2000],
    rows: [header, ...body],
  });
}

function statTable(rows, colWidths) {
  const header = new TableRow({
    tableHeader: true,
    children: rows[0].map(
      (t) =>
        new TableCell({
          shading: { type: ShadingType.CLEAR, fill: NAVY },
          children: [new Paragraph({ children: [new TextRun({ text: t, bold: true, color: "FFFFFF", size: 20, font: bodyFont })] })],
        })
    ),
  });
  const body = rows.slice(1).map(
    (r, i) =>
      new TableRow({
        children: r.map(
          (t) =>
            new TableCell({
              shading: { type: ShadingType.CLEAR, fill: i % 2 === 0 ? "FFFFFF" : LIGHT },
              children: [new Paragraph({ children: [new TextRun({ text: t, size: 20, font: bodyFont })] })],
            })
        ),
      })
  );
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: colWidths,
    rows: [header, ...body],
  });
}

const doc = new Document({
  styles: {
    default: {
      document: { run: { font: bodyFont, size: 22 } },
    },
    paragraphStyles: [
      {
        id: "bodyBullet",
        name: "Body Bullet",
        basedOn: "Normal",
        run: { font: bodyFont, size: 22 },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: "default-bullets",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT }],
      },
    ],
  },
  sections: [
    // ---------------- TITLE PAGE ----------------
    {
      properties: {
        page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } },
      },
      children: [
        new Paragraph({ spacing: { before: 2200 }, alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "SYSTEM CAPACITY & CARE LOAD ANALYTICS", bold: true, size: 40, color: NAVY, font: bodyFont })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 },
          children: [new TextRun({ text: "FOR UNACCOMPANIED CHILDREN", bold: true, size: 40, color: NAVY, font: bodyFont })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 500 },
          children: [new TextRun({ text: "A Healthcare-Systems Analysis of the CBP → HHS UAC Care Pipeline, 2023–2025", size: 26, color: GREY, italics: true, font: bodyFont })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 1200 },
          children: [new TextRun({ text: "Research Paper", bold: true, size: 24, font: bodyFont })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 },
          children: [new TextRun({ text: "Prepared for: Unified Mentor / U.S. Department of Health and Human Services", size: 22, font: bodyFont })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 },
          children: [new TextRun({ text: "Program: Unaccompanied Alien Children (UAC) Program", size: 22, font: bodyFont })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 },
          children: [new TextRun({ text: "Data Coverage: January 12, 2023 – December 21, 2025", size: 22, font: bodyFont })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 2400 },
          children: [new TextRun({ text: "August 2026", size: 20, color: GREY, font: bodyFont })] }),
      ],
    },
    // ---------------- MAIN BODY ----------------
    {
      properties: {
        page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: "UAC System Capacity & Care Load Analytics", size: 16, color: GREY, font: bodyFont })],
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
        h1("1. Executive Overview"),
        p("The Unaccompanied Alien Children (UAC) Program moves children apprehended by U.S. Customs and Border Protection (CBP) through a federally mandated pipeline: initial CBP intake, transfer into Department of Health and Human Services (HHS) care, medical and welfare support, and eventual discharge to a vetted sponsor. This paper analyzes 720 days of reported daily operational data spanning January 12, 2023 through December 21, 2025 (with the underlying calendar reconstructed across 1,075 total days, including unreported gaps) to quantify system load, capacity stress, and the balance between inflow and outflow across the pipeline."),
        p("The headline finding is a sustained, large-scale de-escalation of system load. The average total system load (children simultaneously in CBP custody plus HHS care) fell from roughly 8,847 in 2023 to roughly 2,576 in 2025 — a reduction of about 71%. Within that multi-year decline, the data show one especially concentrated period of relief: total system load fell from a monthly average of about 5,080 in January 2025 to about 2,186 by March 2025, a decline of roughly 57% in two months. Since mid-2025 the system has stabilized in a much smaller, comparatively low-volatility operating range of roughly 2,000–2,550 children."),

        h1("2. Background and Objectives"),
        p("HHS currently lacks a centralized analytical framework to continuously assess total care-system load, the balance between inflow and outflow, capacity stress and relief periods, and the sustainability of care delivery over time. Absent such a framework, decision-making is reactive, which increases the risk of overcrowding, delayed care, and strain on healthcare infrastructure."),
        h2("2.1 Primary Objectives"),
        bullet("Quantify daily and cumulative care load across CBP and HHS."),
        bullet("Identify periods of capacity strain and relief."),
        bullet("Analyze the balance between intake, transfers, and discharges."),
        h2("2.2 Secondary Objectives"),
        bullet("Support healthcare staffing and shelter planning."),
        bullet("Improve situational awareness for policymakers."),
        bullet("Enable data-driven humanitarian response evaluation."),

        h1("3. Data and Methodology"),
        h2("3.1 Dataset"),
        p("The source dataset is HHS's daily operational export, containing six fields per reporting day: Date; Children apprehended and placed in CBP custody; Children in CBP custody; Children transferred out of CBP custody; Children in HHS Care; and Children discharged from HHS Care. The raw export contained 720 rows with a populated date after removing blank trailer rows."),
        h2("3.2 Data Ingestion & Structuring"),
        bullet("Parsed the Date field (e.g., \u201cDecember 21, 2025\u201d) to a proper datetime and removed thousands-separators from numeric fields (e.g., \u201c2,484\u201d \u2192 2484)."),
        bullet("Sorted records chronologically and de-duplicated any repeated report dates, keeping the latest entry."),
        bullet("Reindexed the series onto a complete daily calendar (1,075 calendar days between the first and last report) so that reporting gaps are explicit rather than silently skipped."),
        h2("3.3 Data Quality & Validation"),
        p("Of the 1,075 calendar days in range, 720 (67%) had a matching operational report; 355 days (33%) had no corresponding report and are flagged with an is_reported = False indicator rather than being interpolated as if they were observed. For unreported days, custody-level (\u201cstock\u201d) variables — CBP custody and HHS care — are forward-filled from the last known report, while flow variables (intake, transfers, discharges) are treated as zero rather than fabricated, since assuming no reported activity is the more defensible default than inventing flow counts. Two logical constraints were checked on every reported day: transfers-out of CBP custody should not exceed same-day CBP custody, and discharges from HHS care should not exceed same-day HHS care. Rows that failed either check, or that were missing, were written to a data-quality log (441 flagged day-records) for transparency rather than silently dropped or corrected, since day-to-day custody figures can legitimately reflect population turnover within the day."),

        h2("3.4 Derived Healthcare Capacity Metrics"),
        statTable([
          ["Metric", "Definition"],
          ["Total System Load", "CBP Custody + HHS Care (children simultaneously under federal responsibility)"],
          ["Net Daily Intake", "Transfers into HHS − Discharges from HHS (positive = system accumulating load)"],
          ["Care Load Growth Rate", "Day-over-day percentage change in Total System Load"],
          ["Backlog Streak", "Consecutive days of positive Net Daily Intake (sustained accumulation)"],
          ["Rolling Averages", "7-, 14-, and 30-day moving averages of Total System Load, for trend smoothing"],
          ["Care Load Volatility Index", "7-day rolling standard deviation of the day-over-day % change in HHS care"],
          ["Discharge Offset Ratio", "Discharges ÷ Transfers-in; >1 indicates the system is relieving load faster than it is filling"],
        ], [3200, 6300]),
        caption("Table 1. Derived healthcare-capacity metrics computed from the six raw operational fields."),

        h1("4. Findings"),
        h2("4.1 Total System Load Trend, 2023–2025"),
        image("../charts/01_total_system_load.png", 580, 261),
        caption("Figure 1. Total system load (CBP custody + HHS care), daily values and 30-day rolling average."),
        p("Total system load followed a multi-phase trajectory rather than a single steady trend. It rose from roughly 6,600 in January 2023 to two successive peaks near 11,200–11,800 — first around November 2023 and again around February 2024 — before beginning a sustained decline through the remainder of 2024. The most abrupt phase of relief occurred in the first quarter of 2025: the monthly average total load dropped from about 5,080 in January 2025 to about 2,186 by March 2025. From April 2025 onward the system has operated in a materially smaller and comparatively stable band, generally between roughly 2,000 and 2,550 children, versus a range that regularly exceeded 8,000–11,000 through 2023–2024."),
        statTable([
          ["Period", "Avg. Total System Load", "Avg. Daily CBP Intake"],
          ["2023", "8,847", "117.6"],
          ["2024", "7,320", "148.1"],
          ["2025", "2,576", "13.0"],
        ], [3000, 3300, 3200]),
        caption("Table 2. Year-over-year averages. 2025 load is roughly 71% below the 2023 average, alongside a comparable contraction in average daily CBP intake."),

        h2("4.2 CBP vs. HHS Load Composition"),
        image("../charts/02_cbp_vs_hhs_stacked.png", 580, 261),
        caption("Figure 2. Composition of total system load: CBP custody vs. HHS care."),
        p("Across the full observation window, HHS care load consistently accounts for the large majority of total system load, with CBP custody representing a comparatively small and more volatile share. This is structurally expected: HHS care durations (medical screening, sponsor vetting, placement) are materially longer than the short-duration CBP holding period, so at any snapshot in time far more children are in the HHS pipeline than in CBP custody. CBP custody nonetheless shows its own short, sharp spikes — including a single-day peak of 531 children in CBP custody on February 4, 2024 — indicating that intake surges can create acute short-term strain at the border-processing stage even while the broader HHS system trends downward."),

        h2("4.3 Net Intake & Backlog Dynamics"),
        image("../charts/03_net_daily_intake.png", 580, 261),
        caption("Figure 3. Net daily intake into HHS care (transfers-in minus discharges), with 7-day rolling average."),
        p("Net daily intake oscillates around zero for most of the series, consistent with a system that is broadly balancing inflow and outflow on a week-to-week basis even while the underlying stock (total load) trends up or down over longer horizons. Sustained backlog streaks — consecutive days of positive net intake — are generally short: across the reported period, the most common outcome is a single day or no accumulation at all, and streaks rarely extend past four to five consecutive days. This suggests the system self-corrects within about a week during normal operation, rather than exhibiting long unchecked accumulation runs; the larger swings in total system load visible in Figure 1 are therefore better explained by shifts in the average level of daily intake and discharge over months, not by extended backlog streaks over days."),

        h2("4.4 Year-over-Year Load Comparison"),
        image("../charts/04_yearly_avg_comparison.png", 400, 257),
        caption("Figure 4. Average daily CBP custody and HHS care load by year."),
        p("The year-over-year comparison isolates how much of the decline is attributable to each stage of the pipeline. Average CBP custody load fell from roughly 201 (2023) to roughly 33 (2025), while average HHS care load fell from roughly 8,646 to roughly 2,543 over the same span — both stages contracted by a similar proportion, indicating the de-escalation is systemic (driven by lower intake) rather than isolated to one stage of the pipeline."),

        h2("4.5 Care Load Volatility"),
        image("../charts/05_volatility_index.png", 580, 261),
        caption("Figure 5. Care Load Volatility Index — 7-day rolling standard deviation of day-over-day % change in HHS care."),
        p("Volatility (the Care Load Volatility Index) averages about 1.24% with a maximum of about 3.89% across the reported period, and does not show a strong secular trend of its own — periods of both high and low total load exhibit comparable day-to-day stability. This indicates that while the absolute size of the system has changed dramatically, the system's short-term operational predictability (how much day-to-day care load fluctuates as a percentage) has remained comparatively consistent, which is a favorable signal for staffing and shelter-capacity planning at any given operating scale."),

        h2("4.6 Discharge Offset Ratio"),
        image("../charts/06_discharge_offset_ratio.png", 400, 257),
        caption("Figure 6. Distribution of the Discharge Offset Ratio (discharges ÷ transfers-in)."),
        p("The median Discharge Offset Ratio across reported days is approximately 1.28, and the mean is approximately 2.01 (heavily influenced by a small number of high-ratio days where transfers-in were very low relative to discharges). A ratio consistently above 1 — as observed for the majority of days — indicates the HHS discharge process is generally keeping pace with, or outpacing, new transfers-in, which is consistent with the observed net decline in total system load over the analysis window."),

        h1("5. Capacity Stress & Relief Periods"),
        bullet("Highest-stress period: Late 2023 through early 2024, when total system load twice exceeded 11,000 children (peaking at 11,762 on December 20, 2023) and stayed above 10,000 for extended stretches — 71 reported days in the full series recorded a total system load above 10,000."),
        bullet("Sharpest relief period: January–March 2025, when the monthly average total system load fell by roughly 57% in two months (about 5,080 to about 2,186)."),
        bullet("Current steady-state: April 2025 – December 2025, operating in a materially lower and comparatively stable band (roughly 2,000–2,550), with 212 reported days across the series below 3,000 total system load, the great majority of them concentrated in this most recent period."),

        h1("6. Insights"),
        bullet("The 2023–2025 decline in system load is driven predominantly by a reduction in CBP intake volume (average daily intake fell from 117.6 in 2023 to 13.0 in 2025) rather than by an acceleration of HHS discharge processing alone — both stages of the pipeline contracted together."),
        bullet("Backlog accumulation, when it occurs, is typically short-lived (a handful of days), suggesting existing discharge and placement processes are structurally capable of absorbing normal week-to-week intake variation."),
        bullet("Short-term operational volatility has remained fairly stable across very different absolute load levels, implying that staffing/shelter models calibrated for percentage-based variability (rather than fixed headcounts) should transfer reasonably well across future changes in system size."),
        bullet("The most acute historical stress point (late 2023–early 2024) coincided with CBP custody spikes well above typical levels (e.g., 531 children in CBP custody on a single day), highlighting that border-side intake surges — not HHS-side processing — are the leading indicator of acute strain."),

        h1("7. Recommendations"),
        bullet("Institutionalize the KPI set (Total Children Under Care, Net Intake Pressure, Care Load Volatility Index, Backlog Accumulation Rate, Discharge Offset Ratio) as a standing weekly capacity-review dashboard rather than an ad hoc report."),
        bullet("Set tiered capacity-alert thresholds tied to Total System Load and Backlog Streak length (e.g., flag any streak exceeding 5 consecutive days as an early-warning signal, based on the historical maximum observed)."),
        bullet("Use CBP custody spikes as a leading indicator for HHS shelter and staffing readiness, given that CBP-side surges preceded the two largest system-load peaks in the observed data."),
        bullet("Maintain the reporting-gap flag (is_reported) as a first-class data-quality metric going forward, since roughly one in three calendar days in the current export lacked a matching operational report."),
        bullet("Continue monitoring the Discharge Offset Ratio as the primary indicator of the system's ability to relieve load; sustained readings below 1.0 over a rolling window should trigger a staffing/placement-capacity review."),

        h1("8. Limitations"),
        bullet("The dataset is a single aggregated daily export; it does not capture facility-level, regional, or age/demographic breakdowns that would allow finer-grained capacity planning."),
        bullet("Approximately one-third of calendar days in the analysis window have no corresponding report; forward-filling stock variables across these gaps is a reasonable approximation but is not equivalent to true daily observation."),
        bullet("The analysis is descriptive and diagnostic; it does not attempt to forecast future intake, which depends on external policy and migration factors outside the scope of this dataset."),

        h1("9. Conclusion"),
        p("This analysis translates six raw daily operational counts into a structured capacity-monitoring framework for the UAC care pipeline. Between 2023 and 2025, total system load declined by roughly 71% on average, with the steepest relief concentrated in the first quarter of 2025 and a stable, much smaller operating range since. The system's short-term volatility has remained comparatively consistent even as its absolute scale changed dramatically, and backlog accumulation has historically been short-lived. Adopting the KPI framework, threshold-based alerts, and the accompanying Streamlit dashboard as standing operational tools would give HHS continuous, proactive visibility into capacity stress and relief — directly addressing the reactive-decision-making gap identified in the problem statement."),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("/home/claude/uac_project/docs/Research_Paper_UAC_Capacity_Analytics.docx", buffer);
  console.log("Research paper written.");
});
