# UAC System Capacity & Care Load Analytics — Streamlit Dashboard

Interactive dashboard for monitoring the CBP → HHS Unaccompanied Alien
Children (UAC) care pipeline. `app.py` is the **only Python file in this
project** — it contains both the dashboard and the data pipeline (as a CLI
mode), so there's a single source of truth for the data-cleaning and
feature-engineering logic.

## Quick start — dashboard

```bash
cd dashboard
pip install -r requirements.txt
streamlit run app.py
```

The app will open at `http://localhost:8501`.

## Quick start — regenerate the static CSVs (no UI)

```bash
python app.py --export [output_dir]     # default output_dir: data
```

Runs the exact same ingestion/validation/feature-engineering pipeline used
by the dashboard and writes `uac_clean.csv` + `data_quality_log.csv` to
`output_dir`. This never runs when you use `streamlit run app.py` — it only
triggers on the explicit `--export` argument.

## Data

The app is deployment-proof: the source dataset is embedded directly inside
`app.py` (gzip-compressed) as a guaranteed fallback, so it will render even
if a hosting platform (e.g. Streamlit Community Cloud pulling from GitHub)
ends up with a different folder layout than expected, or the CSV wasn't
committed. On top of that fallback, the app also:

1. Looks for an on-disk CSV at `data/HHS_Unaccompanied_Alien_Children_Program.csv`
   (or a few nearby locations, then a broader recursive search) — if found,
   this on-disk copy takes priority over the embedded data.
2. Offers a **"Replace data"** file uploader in the sidebar, so you can swap
   in a newer export at any time without touching the code or redeploying.

The sidebar always shows a "Source:" caption telling you which of the three
(embedded / on-disk / uploaded) is currently active.

To permanently refresh the bundled data, replace
`data/HHS_Unaccompanied_Alien_Children_Program.csv` with a new export using
the same column layout:

```
Date, Children apprehended and placed in CBP custody*, Children in CBP custody,
Children transferred out of CBP custody, Children in HHS Care, Children discharged from HHS Care
```

## Modules

- **KPI Summary Cards** — Total Children Under Care, Net Intake Pressure,
  Care Load Volatility Index, Backlog Accumulation Rate, Discharge Offset Ratio.
- **System Load Overview** — total system load with 7/14/30-day rolling averages.
- **CBP vs HHS Load Comparison** — stacked area chart + composition donut.
- **Net Intake & Backlog Trends** — daily/weekly/monthly net intake bars with
  7-day rolling average, colored by accumulation (red) vs relief (blue).
- **Filtered data table** — downloadable CSV of the current selection.
- **Data quality log** — reporting gaps and logical-inconsistency flags for the selected range.

## Controls (sidebar)

- Date range selector
- Time granularity: Daily / Weekly / Monthly
- Metric toggles for the overview chart
- Rolling-average overlay toggle

## Notes

- Reporting gaps in the source file are made explicit (`is_reported` flag);
  stock variables (custody, care) are forward-filled across gaps, flow
  variables (intake/transfers/discharges) are treated as zero-activity on
  unreported days rather than fabricated.
- This is an analytics prototype for the Unified Mentor / HHS project brief.
  It is not an official HHS system and should not be used for operational
  decision-making without validation against the authoritative source system.
