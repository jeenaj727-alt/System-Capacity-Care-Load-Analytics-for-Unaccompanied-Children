"""
System Capacity & Care Load Analytics for Unaccompanied Children
Streamlit Dashboard + Data Pipeline — HHS / CBP UAC Program
(single file: covers both the interactive dashboard and the CLI data pipeline)

Run the dashboard:
    pip install -r requirements.txt
    streamlit run app.py

Regenerate the static reference CSVs (uac_clean.csv, data_quality_log.csv)
without launching the UI:
    python app.py --export [output_dir]      # default output_dir: data

Data loading is deployment-proof: the source CSV is embedded directly in
this file (compressed) as a guaranteed fallback, so the app always renders
even if the repo layout on the hosting platform doesn't match the folder
structure below. If a copy of the CSV exists on disk at one of a few
common locations, that on-disk copy is used instead (so refreshing the data
is as simple as replacing the file). A manual upload option in the sidebar
can also override both.
"""
import base64
import gzip
import io
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

st.set_page_config(
    page_title="UAC System Capacity & Care Load Analytics",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ----------------------------------------------------------------------------
# Embedded fallback data (gzip + base64 of the original HHS export). This
# guarantees the app never hard-fails due to a missing file path on whatever
# platform it's deployed to.
# ----------------------------------------------------------------------------
_EMBEDDED_CSV_B64 = (
    "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"
    "/ts//j/oyu+cwIAAAA=="
)

def _embedded_csv_bytes():
    return gzip.decompress(base64.b64decode(_EMBEDDED_CSV_B64))

FILENAME = "HHS_Unaccompanied_Alien_Children_Program.csv"

# ----------------------------------------------------------------------------
# Data loading & feature engineering
# ----------------------------------------------------------------------------
COLS = {
    "Date": "date",
    "Children apprehended and placed in CBP custody*": "cbp_intake",
    "Children in CBP custody": "cbp_custody",
    "Children transferred out of CBP custody": "cbp_transfers_out",
    "Children in HHS Care": "hhs_care",
    "Children discharged from HHS Care": "hhs_discharged",
}

def _find_on_disk():
    """Search a handful of likely locations, then fall back to a broader
    recursive search from the repo root, so the app works regardless of
    how the folder structure was committed/deployed."""
    here = Path(__file__).resolve().parent
    candidates = [
        here / "data" / FILENAME,
        here / FILENAME,
        here.parent / "data" / FILENAME,
        here.parent / "uploads" / FILENAME,
        here.parent / FILENAME,
    ]
    for p in candidates:
        if p.exists():
            return p
    # Broader search: walk up to 3 parent levels and glob for the filename.
    root = here
    for _ in range(3):
        root = root.parent
        try:
            hits = list(root.rglob(FILENAME))
        except (PermissionError, OSError):
            hits = []
        if hits:
            return hits[0]
    return None

@st.cache_data
def load_data(uploaded_bytes: bytes = None):
    source_note = ""
    if uploaded_bytes is not None:
        raw_bytes = uploaded_bytes
        source_note = "uploaded file"
    else:
        disk_path = _find_on_disk()
        if disk_path is not None:
            raw_bytes = disk_path.read_bytes()
            source_note = f"on-disk file ({disk_path})"
        else:
            raw_bytes = _embedded_csv_bytes()
            source_note = "bundled default dataset"

    df = pd.read_csv(io.BytesIO(raw_bytes))
    df = df.rename(columns=lambda c: COLS.get(c.strip(), c.strip()))
    df = df.dropna(subset=["date"])
    df = df[df["date"].astype(str).str.strip() != ""]
    for c in ["cbp_intake", "cbp_custody", "cbp_transfers_out", "hhs_care", "hhs_discharged"]:
        df[c] = df[c].astype(str).str.replace(",", "", regex=False).str.strip()
        df[c] = pd.to_numeric(df[c], errors="coerce")
    df["date"] = pd.to_datetime(df["date"], format="%B %d, %Y", errors="coerce")
    df = df.dropna(subset=["date"]).sort_values("date").drop_duplicates(subset="date", keep="last")

    full_range = pd.date_range(df["date"].min(), df["date"].max(), freq="D")
    full = pd.DataFrame({"date": full_range})
    merged = full.merge(df, on="date", how="left")
    merged["is_reported"] = merged["cbp_intake"].notna()

    merged["cbp_custody"] = merged["cbp_custody"].ffill()
    merged["hhs_care"] = merged["hhs_care"].ffill()
    for c in ["cbp_intake", "cbp_transfers_out", "hhs_discharged"]:
        merged[c] = merged[c].fillna(0)

    merged["total_system_load"] = merged["cbp_custody"] + merged["hhs_care"]
    merged["net_daily_intake"] = merged["cbp_transfers_out"] - merged["hhs_discharged"]
    merged["care_load_growth_rate_pct"] = merged["total_system_load"].pct_change() * 100

    merged["net_intake_positive"] = (merged["net_daily_intake"] > 0).astype(int)
    merged["backlog_streak"] = (
        merged["net_intake_positive"]
        .groupby((merged["net_intake_positive"] != merged["net_intake_positive"].shift()).cumsum())
        .cumcount() + 1
    ) * merged["net_intake_positive"]

    for w in [7, 14, 30]:
        merged[f"total_load_ma_{w}"] = merged["total_system_load"].rolling(w, min_periods=1).mean()
    merged["hhs_care_volatility_7d"] = merged["hhs_care"].pct_change().rolling(7, min_periods=2).std() * 100
    merged["discharge_offset_ratio"] = np.where(
        merged["cbp_transfers_out"] > 0,
        merged["hhs_discharged"] / merged["cbp_transfers_out"],
        np.nan,
    )
    merged["year"] = merged["date"].dt.year
    merged["month"] = merged["date"].dt.to_period("M").astype(str)
    merged.attrs["source_note"] = source_note
    return merged

def validate_quality(merged: pd.DataFrame) -> pd.DataFrame:
    """Flag logical inconsistencies without dropping data (transparency, not
    silent fixing). Operates on the already-loaded/engineered frame — safe
    because forward-filled values only ever apply to *unreported* days,
    which are independently flagged via `is_reported` below."""
    log = pd.DataFrame({"date": merged["date"]})
    log["missing_report"] = ~merged["is_reported"]
    log["transfers_exceed_custody"] = merged["cbp_transfers_out"] > merged["cbp_custody"]
    log["discharges_exceed_hhs_care"] = merged["hhs_discharged"] > merged["hhs_care"]
    log["negative_values"] = (
        merged[["cbp_intake", "cbp_custody", "cbp_transfers_out", "hhs_care", "hhs_discharged"]] < 0
    ).any(axis=1)
    log = log[
        log["missing_report"] | log["transfers_exceed_custody"]
        | log["discharges_exceed_hhs_care"] | log["negative_values"]
    ]
    return log

# ----------------------------------------------------------------------------
# CLI export mode — regenerates the static reference CSVs (uac_clean.csv,
# data_quality_log.csv) on disk without launching the dashboard UI.
#
#   python app.py --export [output_dir]     (default output_dir: data)
#
# This is the ONE Python file for the whole project: `streamlit run app.py`
# launches the dashboard as usual; `python app.py --export ...` runs the
# same data pipeline as a plain script. The guard below only triggers on
# an explicit "--export" argument, so `streamlit run app.py` (which passes
# no such argument) always falls straight through to the dashboard.
# ----------------------------------------------------------------------------
def export_clean_data(output_dir="data"):
    merged = load_data(None)
    quality_log = validate_quality(merged)
    out_dir = Path(output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    clean_path = out_dir / "uac_clean.csv"
    log_path = out_dir / "data_quality_log.csv"
    merged.to_csv(clean_path, index=False)
    quality_log.to_csv(log_path, index=False)
    print(f"Rows: {len(merged)}  |  Date range: {merged['date'].min().date()} to {merged['date'].max().date()}")
    print(f"Reported days: {int(merged['is_reported'].sum())}  |  "
          f"Unreported (gap) days: {int((~merged['is_reported']).sum())}")
    print(f"Quality flags logged: {len(quality_log)} -> {log_path}")
    print(f"Clean dataset written -> {clean_path}")

if __name__ == "__main__" and len(sys.argv) > 1 and sys.argv[1] == "--export":
    export_clean_data(sys.argv[2] if len(sys.argv) > 2 else "data")
    sys.exit(0)

# ----------------------------------------------------------------------------
# Sidebar — controls
# ----------------------------------------------------------------------------
st.sidebar.title("📊 Controls")

st.sidebar.markdown("**Data source**")
_uploaded_file = st.sidebar.file_uploader(
    "Replace data (optional CSV upload)",
    type=["csv"],
    help="Uses the bundled dataset by default. Upload a CSV with the same "
         "columns to override it for this session.",
)
df = load_data(_uploaded_file.getvalue() if _uploaded_file is not None else None)
reported = df[df["is_reported"]].copy()
st.sidebar.caption(f"Source: {df.attrs.get('source_note', 'unknown')}")
st.sidebar.markdown("---")

min_d, max_d = reported["date"].min().date(), reported["date"].max().date()
date_range = st.sidebar.date_input(
    "Date range", value=(min_d, max_d), min_value=min_d, max_value=max_d
)
if isinstance(date_range, tuple) and len(date_range) == 2:
    start_d, end_d = date_range
else:
    start_d, end_d = min_d, max_d

granularity = st.sidebar.radio("Time granularity", ["Daily", "Weekly", "Monthly"], index=0)

metric_options = {
    "Total System Load": "total_system_load",
    "CBP Custody": "cbp_custody",
    "HHS Care": "hhs_care",
    "Net Daily Intake": "net_daily_intake",
    "Care Load Growth Rate (%)": "care_load_growth_rate_pct",
    "Volatility Index (7d)": "hhs_care_volatility_7d",
}
chosen_metrics = st.sidebar.multiselect(
    "Metrics to plot", list(metric_options.keys()), default=["Total System Load"]
)

show_ma = st.sidebar.checkbox("Overlay 7/14/30-day rolling averages", value=True)
st.sidebar.markdown("---")
st.sidebar.caption(
    "Data source: HHS Unaccompanied Alien Children Program daily operational report. "
    f"{len(reported)} reported days between {min_d} and {max_d}."
)

mask = (reported["date"].dt.date >= start_d) & (reported["date"].dt.date <= end_d)
f = reported.loc[mask].copy()

if granularity == "Weekly":
    agg = f.set_index("date").resample("W").agg({
        "cbp_intake": "sum", "cbp_custody": "mean", "cbp_transfers_out": "sum",
        "hhs_care": "mean", "hhs_discharged": "sum", "total_system_load": "mean",
        "net_daily_intake": "sum", "care_load_growth_rate_pct": "mean",
        "hhs_care_volatility_7d": "mean",
    }).reset_index()
elif granularity == "Monthly":
    agg = f.set_index("date").resample("MS").agg({
        "cbp_intake": "sum", "cbp_custody": "mean", "cbp_transfers_out": "sum",
        "hhs_care": "mean", "hhs_discharged": "sum", "total_system_load": "mean",
        "net_daily_intake": "sum", "care_load_growth_rate_pct": "mean",
        "hhs_care_volatility_7d": "mean",
    }).reset_index()
else:
    agg = f

# ----------------------------------------------------------------------------
# Header
# ----------------------------------------------------------------------------
st.title("System Capacity & Care Load Analytics")
st.caption("Unaccompanied Children (UAC) Program — CBP ➜ HHS Care Pipeline")

# ----------------------------------------------------------------------------
# KPI Summary Cards
# ----------------------------------------------------------------------------
latest = f.sort_values("date").iloc[-1]
prev_week = f.sort_values("date").iloc[-8] if len(f) > 8 else f.sort_values("date").iloc[0]

total_load = latest["total_system_load"]
load_delta = total_load - prev_week["total_system_load"]

net_pressure_7d = f.sort_values("date").tail(7)["net_daily_intake"].sum()
volatility = f["hhs_care_volatility_7d"].tail(30).mean()
backlog_days = int((f["backlog_streak"] > 0).sum())
discharge_ratio = f["discharge_offset_ratio"].tail(30).mean()

k1, k2, k3, k4, k5 = st.columns(5)
k1.metric("Total Children Under Care", f"{int(total_load):,}", f"{load_delta:+,.0f} vs 7d ago")
k2.metric("Net Intake Pressure (7d sum)", f"{net_pressure_7d:+,.0f}",
          help="Positive = system loading up (inflow > outflow); negative = relieving")
k3.metric("Care Load Volatility Index", f"{volatility:.2f}%" if pd.notna(volatility) else "n/a",
          help="30-day average of 7-day rolling std. dev. of % change in HHS care load")
k4.metric("Backlog Accumulation (days)", f"{backlog_days}",
          help="Days in selected range with sustained positive net intake")
k5.metric("Discharge Offset Ratio (30d avg)", f"{discharge_ratio:.2f}" if pd.notna(discharge_ratio) else "n/a",
          help="Discharges ÷ Transfers-in. >1 = system relieving load, <1 = system accumulating load")

st.markdown("---")

# ----------------------------------------------------------------------------
# System Load Overview Pane
# ----------------------------------------------------------------------------
st.subheader("System Load Overview")

fig = go.Figure()
for label in chosen_metrics:
    col = metric_options[label]
    fig.add_trace(go.Scatter(x=agg["date"], y=agg[col], mode="lines", name=label))
    if show_ma and col == "total_system_load" and granularity == "Daily":
        for w, dash in zip([7, 14, 30], ["dot", "dash", "solid"]):
            ma_col = f"total_load_ma_{w}"
            if ma_col in f.columns:
                fig.add_trace(go.Scatter(
                    x=f["date"], y=f[ma_col], mode="lines",
                    name=f"{w}-day MA", line=dict(dash=dash, width=1.5)
                ))
fig.update_layout(
    height=440, margin=dict(l=10, r=10, t=30, b=10),
    legend=dict(orientation="h", yanchor="bottom", y=1.02),
    xaxis_title=None, yaxis_title="Children",
)
st.plotly_chart(fig, use_container_width=True)

# ----------------------------------------------------------------------------
# CBP vs HHS Load Comparison
# ----------------------------------------------------------------------------
st.subheader("CBP vs. HHS Load Comparison")
c1, c2 = st.columns([2, 1])
with c1:
    fig2 = go.Figure()
    fig2.add_trace(go.Scatter(x=agg["date"], y=agg["cbp_custody"], mode="lines", name="CBP Custody",
                               stackgroup="one", line=dict(width=0.5)))
    fig2.add_trace(go.Scatter(x=agg["date"], y=agg["hhs_care"], mode="lines", name="HHS Care",
                               stackgroup="one", line=dict(width=0.5)))
    fig2.update_layout(height=380, margin=dict(l=10, r=10, t=10, b=10),
                        legend=dict(orientation="h", yanchor="bottom", y=1.02))
    st.plotly_chart(fig2, use_container_width=True)
with c2:
    share_cbp = (f["cbp_custody"].sum() / (f["cbp_custody"].sum() + f["hhs_care"].sum())) * 100
    share_hhs = 100 - share_cbp
    fig3 = px.pie(values=[share_cbp, share_hhs], names=["CBP Custody", "HHS Care"],
                   hole=0.55, color_discrete_sequence=["#c99a2e", "#2f6fed"])
    fig3.update_layout(height=380, margin=dict(l=10, r=10, t=10, b=10), showlegend=True)
    st.plotly_chart(fig3, use_container_width=True)
    st.caption("Share of cumulative custody-days over the selected period.")

# ----------------------------------------------------------------------------
# Net Intake & Backlog Trends
# ----------------------------------------------------------------------------
st.subheader("Net Intake & Backlog Trends")
fig4 = go.Figure()
colors = ["#c0392b" if v > 0 else "#2f6fed" for v in agg["net_daily_intake"]]
fig4.add_trace(go.Bar(x=agg["date"], y=agg["net_daily_intake"], marker_color=colors, name="Net daily intake"))
if granularity == "Daily":
    fig4.add_trace(go.Scatter(x=f["date"], y=f["net_daily_intake"].rolling(7, min_periods=1).mean(),
                               mode="lines", name="7-day MA", line=dict(color="#1b2a4a", width=2)))
fig4.add_hline(y=0, line_color="black", line_width=1)
fig4.update_layout(height=380, margin=dict(l=10, r=10, t=10, b=10),
                    legend=dict(orientation="h", yanchor="bottom", y=1.02),
                    yaxis_title="Net children / period")
st.plotly_chart(fig4, use_container_width=True)
st.caption("Red bars = net inflow to HHS care (accumulation); blue bars = net outflow (relief).")

# ----------------------------------------------------------------------------
# KPI Summary detail table
# ----------------------------------------------------------------------------
st.subheader("KPI Summary")
kpi_table = pd.DataFrame({
    "KPI": [
        "Total Children Under Care",
        "Net Intake Pressure",
        "Care Load Volatility Index",
        "Backlog Accumulation Rate",
        "Discharge Offset Ratio",
    ],
    "Description": [
        "System-wide responsibility (CBP custody + HHS care), current snapshot",
        "Inflow vs. outflow imbalance over the selected window",
        "Stability of the HHS care system (7-day rolling volatility, %)",
        "Share of selected days with sustained positive net intake",
        "Ability to relieve load: discharges ÷ transfers-in",
    ],
    "Current Value": [
        f"{int(total_load):,}",
        f"{net_pressure_7d:+,.0f} (7d)",
        f"{volatility:.2f}%" if pd.notna(volatility) else "n/a",
        f"{backlog_days} / {len(f)} days ({backlog_days/max(len(f),1)*100:.0f}%)",
        f"{discharge_ratio:.2f}" if pd.notna(discharge_ratio) else "n/a",
    ],
})
st.dataframe(kpi_table, use_container_width=True, hide_index=True)

# ----------------------------------------------------------------------------
# Raw / filtered data
# ----------------------------------------------------------------------------
with st.expander("View filtered data table"):
    st.dataframe(
        f[["date", "cbp_intake", "cbp_custody", "cbp_transfers_out", "hhs_care",
           "hhs_discharged", "total_system_load", "net_daily_intake"]].sort_values("date", ascending=False),
        use_container_width=True, hide_index=True,
    )
    st.download_button(
        "Download filtered data as CSV",
        f.to_csv(index=False).encode("utf-8"),
        file_name="uac_filtered_data.csv",
        mime="text/csv",
    )

with st.expander("Data quality log (reporting gaps & logical flags)"):
    quality_log = validate_quality(df)
    ql_mask = (quality_log["date"].dt.date >= start_d) & (quality_log["date"].dt.date <= end_d)
    st.dataframe(quality_log.loc[ql_mask].sort_values("date", ascending=False),
                 use_container_width=True, hide_index=True)
    st.caption(
        f"{len(quality_log.loc[ql_mask])} flagged day-records in the selected range "
        "(missing report, transfers exceeding custody, discharges exceeding HHS care, or negative values)."
    )

st.markdown("---")
st.caption(
    "System Capacity & Care Load Analytics for Unaccompanied Children · "
    "Built for Unified Mentor / U.S. Department of Health and Human Services · "
    "Analytics prototype — not an official HHS system."
)
