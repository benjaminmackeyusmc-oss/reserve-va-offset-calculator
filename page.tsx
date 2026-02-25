"use client";

import { useMemo, useState } from "react";
import { estimateOffset } from "@rvo/calc-engine";

function n2(v: number) {
  if (!Number.isFinite(v)) return "";
  return String(v);
}

export default function Page() {
  const [vaMonthly, setVaMonthly] = useState(0);
  const [milMonthlyBasePay, setMilMonthlyBasePay] = useState(0);
  const [utaCount, setUtaCount] = useState(48);
  const [activeDutyDays, setActiveDutyDays] = useState(14);

  const result = useMemo(() => {
    try {
      if (vaMonthly <= 0 || milMonthlyBasePay <= 0) return null;
      return estimateOffset({
        vaMonthly,
        milMonthlyBasePay,
        utaCount: Math.max(0, Math.floor(utaCount)),
        activeDutyDays: Math.max(0, Math.floor(activeDutyDays))
      });
    } catch {
      return null;
    }
  }, [vaMonthly, milMonthlyBasePay, utaCount, activeDutyDays]);

  return (
    <div className="container">
      <h1>Reserve VA Offset Calculator</h1>
      <div className="small">
        Estimates using: VA daily = VA monthly ÷ 30 and waiver days = UTAs + active duty days.
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
            <div className="small">Enter the exact amount from your VA app/letter.</div>
          </div>

          <div>
            <label>Military monthly base pay ($)</label>
            <input
              inputMode="decimal"
              value={n2(milMonthlyBasePay)}
              onChange={(e) => setMilMonthlyBasePay(Number(e.target.value))}
              placeholder="e.g., 3815.40"
            />
            <div className="small">Base pay only (not BAH/BAS).</div>
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
      </div>

      <div className="card">
        <h2>Results</h2>
        {!result ? (
          <div className="small">Enter VA monthly and Military monthly base pay to see results.</div>
        ) : (
          <>
            <div className="row">
              <div>
                <div className="small">VA daily</div>
                <div className="badge">${result.vaDaily.toFixed(2)} / day</div>
              </div>
              <div>
                <div className="small">Military daily (base)</div>
                <div className="badge">${result.milDaily.toFixed(2)} / day</div>
              </div>
              <div>
                <div className="small">Waiver days</div>
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
              Disclaimer: estimate only; verify with VA/DFAS. Not legal advice.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
