"use client";

import { useMemo, useState } from "react";
import { getDrillPay1UTA, type PayGrade } from "./lib/drillPay2026";

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function yearsBetween(pebdISO: string, asOf: Date): number | null {
  // expects YYYY-MM-DD
  const d = new Date(pebdISO + "T00:00:00");
  if (Number.isNaN(d.getTime())) return null;
  const ms = asOf.getTime() - d.getTime();
  if (ms < 0) return 0;
  return ms / (365.25 * 24 * 60 * 60 * 1000);
}

function n2(v: number) {
  if (!Number.isFinite(v)) return "";
  return String(v);
}

export default function Page() {
  // VA inputs
  const [vaMonthly, setVaMonthly] = useState(0);

  // Military inputs (dynamic)
  const [payGrade, setPayGrade] = useState<PayGrade>("E-4");
  const [pebd, setPebd] = useState(""); // YYYY-MM-DD
  const [yosOverride, setYosOverride] = useState<number | "">("");

  // Duty inputs
  const [utaCount, setUtaCount] = useState(48);
  const [activeDutyDays, setActiveDutyDays] = useState(14);

  const asOf = new Date();

  const yos = useMemo(() => {
    if (yosOverride !== "") return Math.max(0, Number(yosOverride));
    if (!pebd) return null;
    return yearsBetween(pebd, asOf);
  }, [pebd, yosOverride, asOf]);

  const mil = useMemo(() => {
    if (yos == null) return null;
    return getDrillPay1UTA(payGrade, yos);
  }, [payGrade, yos]);

  const result = useMemo(() => {
    if (!mil) return null;
    if (vaMonthly <= 0) return null;

    const waiverDays = Math.max(0, Math.floor(utaCount)) + Math.max(0, Math.floor(activeDutyDays));

    const vaDaily = vaMonthly / 30.0;

    // For this model, one VA “day” corresponds to one drill period (UTA) or one active duty day.
    // We use DFAS “1 Drill” pay as the base-pay equivalent per period/day.
    const milDaily = mil.utaPay;

    const vaRecoupmentEstimated = vaDaily * waiverDays;
    const milGrossEarnedEstimated = milDaily * waiverDays;
    const netAdvantageGross = milGrossEarnedEstimated - vaRecoupmentEstimated;

    const breakEvenVaMonthly = milDaily * 30.0;

    let recommendation: "TAKE_MIL_PAY" | "WAIVE_MIL_PAY" | "EITHER" = "EITHER";
    if (netAdvantageGross > 0.01) recommendation = "TAKE_MIL_PAY";
    else if (netAdvantageGross < -0.01) recommendation = "WAIVE_MIL_PAY";

    return {
      waiverDays,
      vaDaily: round2(vaDaily),
      milDaily: round2(milDaily),
      vaRecoupmentEstimated: round2(vaRecoupmentEstimated),
      milGrossEarnedEstimated: round2(milGrossEarnedEstimated),
      netAdvantageGross: round2(netAdvantageGross),
      recommendation,
      breakEvenVaMonthly: round2(breakEvenVaMonthly)
    };
  }, [mil, vaMonthly, utaCount, activeDutyDays]);

  const payGrades: PayGrade[] = [
    "E-1","E-2","E-3","E-4","E-5","E-6","E-7","E-8","E-9",
    "W-1","W-2","W-3","W-4","W-5",
    "O-1","O-2","O-3","O-4","O-5","O-6","O-7",
    "O-1E","O-2E","O-3E",
  ];

  return (
    <div className="container">
      <h1>Reserve VA Offset Calculator</h1>
      <div className="small">
        Military pay is derived from DFAS Reserve Component “1 Drill” pay tables (effective Jan 1, 2026). Base-pay only.
      </div>

      <div className="card">
        <h2>Inputs</h2>

        <div className="row">
          <div>
            <label>VA compensation per month ($)</label>
            <input
              inputMode="decimal"
              value={n2(vaMonthly)}
              onChange={(e) => setVaMonthly(Number(e.target.value))}
              placeholder="e.g., 1808.45"
            />
            <div className="small">Enter the exact monthly amount from the VA app/letter.</div>
          </div>

          <div>
            <label>Pay Grade</label>
            <select
              value={payGrade}
              onChange={(e) => setPayGrade(e.target.value as PayGrade)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #2a3a66", background: "#0b1220", color: "#e6edf3" }}
            >
              {payGrades.map(pg => <option key={pg} value={pg}>{pg}</option>)}
            </select>

            <div className="small">
              Uses DFAS “1 Drill” rate for your grade & creditable YOS.
            </div>
          </div>

          <div>
            <label>PEBD (YYYY-MM-DD)</label>
            <input
              inputMode="text"
              value={pebd}
              onChange={(e) => setPebd(e.target.value)}
              placeholder="e.g., 2019-09-16"
            />
            <div className="small">Optional if you use YOS override.</div>
          </div>

          <div>
            <label>Creditable years of service (override)</label>
            <input
              inputMode="decimal"
              value={yosOverride === "" ? "" : n2(Number(yosOverride))}
              onChange={(e) => {
                const v = e.target.value;
                setYosOverride(v === "" ? "" : Number(v));
              }}
              placeholder="e.g., 6.4"
            />
            <div className="small">Use this if PEBD isn’t clean (breaks in service, creditable adjustments).</div>
          </div>

          <div>
            <label>Paid UTAs (drill periods)</label>
            <input
              inputMode="numeric"
              value={n2(utaCount)}
              onChange={(e) => setUtaCount(Number(e.target.value))}
            />
          </div>

          <div>
            <label>Active duty days (AT/ADOS/etc.)</label>
            <input
              inputMode="numeric"
              value={n2(activeDutyDays)}
              onChange={(e) => setActiveDutyDays(Number(e.target.value))}
            />
          </div>
        </div>

        <div style={{ marginTop: 12 }} className="small">
          {yos == null ? (
            <>Enter PEBD or a YOS override to calculate drill pay.</>
          ) : (
            <>
              Creditable YOS (estimated): <b>{yos.toFixed(2)}</b> — table bucket: <b>{mil?.bucketLabel ?? "—"}</b>{" "}
              {mil?.warning ? <span style={{ display: "block", marginTop: 6 }}>⚠️ {mil.warning}</span> : null}
            </>
          )}
        </div>
      </div>

      <div className="card">
        <h2>Results</h2>
        {!result ? (
          <div className="small">Enter VA monthly + PEBD/YOS to see results.</div>
        ) : (
          <>
            <div className="row">
              <div>
                <div className="small">VA daily (VA monthly ÷ 30)</div>
                <div className="badge">${result.vaDaily.toFixed(2)} / day</div>
              </div>
              <div>
                <div className="small">Military pay per drill period (DFAS “1 Drill”)</div>
                <div className="badge">${result.milDaily.toFixed(2)} / UTA</div>
              </div>
              <div>
                <div className="small">Waiver “days” (UTAs + AD days)</div>
                <div className="badge">{result.waiverDays}</div>
              </div>
              <div>
                <div className="small">Break-even VA monthly</div>
                <div className="badge">${result.breakEvenVaMonthly.toFixed(2)} / mo</div>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <div className="small">Estimated VA recoupment</div>
              <div className="badge">${result.vaRecoupmentEstimated.toFixed(2)}</div>
            </div>

            <div style={{ marginTop: 12 }}>
              <div className="small">Estimated military gross earned (base pay only)</div>
              <div className="badge">${result.milGrossEarnedEstimated.toFixed(2)}</div>
            </div>

            <div style={{ marginTop: 12 }}>
              <div className="small">Net advantage (gross)</div>
              <div className="badge">${result.netAdvantageGross.toFixed(2)}</div>
            </div>

            <div style={{ marginTop: 12 }}>
              <div className="small">Recommendation</div>
              <div className="badge">
                {result.recommendation === "TAKE_MIL_PAY" && "Take military pay (VA will recoup later)"}
                {result.recommendation === "WAIVE_MIL_PAY" && "Waive military pay (keep VA for those days)"}
                {result.recommendation === "EITHER" && "Either (about break-even)"}
              </div>
            </div>

            <div style={{ marginTop: 12 }} className="small">
              Disclaimer: estimate only; base pay only; verify with VA/DFAS. Not legal or financial advice.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
