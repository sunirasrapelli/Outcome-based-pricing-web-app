
/*
  Calculator logic (mirrors the Excel formulas from v2.3).

  Key principle: do NOT invent new logic.
  This file implements the exact computations and guard conditions.

  All rates are expressed as decimals:
  - 40% is 0.40
  - 1.33% is 0.0133
*/

function excelRound(value, decimals){
  if (value === "" || value === null || value === undefined || Number.isNaN(value)) return "";
  const d = Math.max(0, decimals|0);
  const p = Math.pow(10, d);
  // Excel ROUND is "half away from zero"
  const n = Number(value);
  const scaled = n * p;
  const rounded = (scaled >= 0) ? Math.round(scaled) : -Math.round(-scaled);
  return rounded / p;
}

function safeDiv(a,b){
  if (a === "" || a === null || b === "" || b === null || b === 0) return "";
  return a / b;
}

export const OUTCOME_OPTIONS = [
  "Registered leads",
  "Qualified leads",
  "Enrolled leads",
  "Conversions",
  "Applications started",
  "KYC completed",
  "Policies issued",
];

export const INPUT_METHODS = ["Percentages","Absolute"];

export function defaultState(){
  return {
    meta: {
      id: null, // filled when saved
      name: "",
      updatedAt: null,
      createdAt: null,
    },
    inputs: {
      totalLeads: 1500000,
      inputMethod: "Percentages",
      outcomeName: "Registered leads",

      connectedRatePct: 0.40,     // percent mode
      connectedLeadsAbs: "",      // absolute mode

      humanOutcomeRatePct: 0.0133,// percent mode (of connected)
      humanOutcomeAbs: "",        // absolute mode (#)

      aiVsHuman: 1.20,
      ahtMins: 2,
      aiPricePerMin: 2.5,

      // "If client suggests an outcome price"
      proposedOutcomePrice: 50,

      // Human team optional
      salaryPerAgent: 15000,
      numAgents: 25,
      humanOutcomePerMonth: 666,
      targetOutcome: 4000,

      aiMinutesAvailable: 1000000, // fixed in sheet
    }
  };
}

export function compute(state){
  const i = state.inputs;

  // D24 Connected leads (auto)
  const connectedLeads = (i.inputMethod === "Percentages")
    ? (i.totalLeads === "" ? "" : i.totalLeads * i.connectedRatePct)
    : i.connectedLeadsAbs;

  // D25 Connected rate (auto)
  const connectedRateAuto = (i.inputMethod === "Percentages")
    ? i.connectedRatePct
    : (i.totalLeads === 0 || i.totalLeads === "" ? "" : i.connectedLeadsAbs / i.totalLeads);

  // D26 Human outcome count (auto)
  const humanOutcomeCount = (i.inputMethod === "Percentages")
    ? (connectedLeads === "" ? "" : connectedLeads * i.humanOutcomeRatePct)
    : i.humanOutcomeAbs;

  // D27 Human outcome rate (auto)
  const humanOutcomeRateAuto = (connectedLeads === "" || connectedLeads === 0) ? "" : humanOutcomeCount / connectedLeads;

  // D28 AI outcome rate (auto) = human rate * aiVsHuman
  const aiOutcomeRateAuto = (humanOutcomeRateAuto === "") ? "" : humanOutcomeRateAuto * i.aiVsHuman;

  // D29 AI outcome count (auto) = connected leads * ai rate
  const aiOutcomeCount = (connectedLeads === "") ? "" : connectedLeads * aiOutcomeRateAuto;

  // D30 AI talk time (mins) = connected leads * AHT
  const aiTalkTimeMins = (connectedLeads === "") ? "" : connectedLeads * i.ahtMins;

  // D31 AI spend (₹) = ROUND(aiTalkTimeMins * pricePerMin, 2)
  const aiSpend = (aiTalkTimeMins === "") ? "" : excelRound(aiTalkTimeMins * i.aiPricePerMin, 2);

  // D32 Breakeven outcome price (₹) = ROUND(aiSpend / aiOutcomeCount, 2)
  const breakevenOutcomePrice = (aiOutcomeCount === "" || aiOutcomeCount === 0) ? "" : excelRound(aiSpend / aiOutcomeCount, 2);

  // G16 AI outcome rate needed = ROUND( aiSpend / (connectedLeads * proposedPrice), 6)
  const aiOutcomeRateNeeded = (i.proposedOutcomePrice === "" || connectedLeads === "" || connectedLeads === 0)
    ? ""
    : excelRound(aiSpend / (connectedLeads * i.proposedOutcomePrice), 6);

  // G17 AI vs Human needed = ROUND( aiOutcomeRateNeeded / humanOutcomeRateAuto, 6)
  const aiVsHumanNeeded = (aiOutcomeRateNeeded === "" || humanOutcomeRateAuto === "" || humanOutcomeRateAuto === 0)
    ? ""
    : excelRound(aiOutcomeRateNeeded / humanOutcomeRateAuto, 6);

  // G18 Risk label
  const riskLabel = (aiVsHumanNeeded === "") ? "" : (aiVsHumanNeeded > 1 ? "Risky (>100%)" : "OK");

  // Human vs AI section
  // G39 AI outcome rate (from above) = aiOutcomeRateAuto
  const aiOutcomeRateForTarget = aiOutcomeRateAuto;

  // G40 Calls needed to hit target = targetOutcome / aiOutcomeRateForTarget
  const callsNeededToHitTarget = (aiOutcomeRateForTarget === "" || aiOutcomeRateForTarget === 0) ? "" : i.targetOutcome / aiOutcomeRateForTarget;

  // G41 AI spend to hit target = ROUND(callsNeeded * aht * pricePerMin, 2)
  const aiSpendToHitTarget = (callsNeededToHitTarget === "") ? "" : excelRound(callsNeededToHitTarget * i.ahtMins * i.aiPricePerMin, 2);

  // G43 Months for AI to finish = callsNeeded * aht / aiMinutesAvailable
  const monthsForAI = (i.aiMinutesAvailable === 0 || i.aiMinutesAvailable === "" || callsNeededToHitTarget === "") ? "" : (callsNeededToHitTarget * i.ahtMins) / i.aiMinutesAvailable;

  // D44 Months to hit target (human) = targetOutcome / humanOutcomePerMonth
  const monthsForHuman = (i.humanOutcomePerMonth === 0 || i.humanOutcomePerMonth === "") ? "" : i.targetOutcome / i.humanOutcomePerMonth;

  // D45 Total human cost = ROUND(monthsForHuman * salaryPerAgent * numAgents, 2)
  const totalHumanCost = (monthsForHuman === "") ? "" : excelRound(monthsForHuman * i.salaryPerAgent * i.numAgents, 2);

  // Scenario table factors (B49:B55)
  const factors = [0.10,0.25,0.50,0.60,0.75,0.90,1.00];
  const scenarios = factors.map(f=>{
    const aiRate = (humanOutcomeRateAuto === "") ? "" : humanOutcomeRateAuto * f;
    const aiCount = (connectedLeads === "") ? "" : connectedLeads * aiRate;
    const outcomeRevenue = (aiCount === "" || i.proposedOutcomePrice === "") ? "" : excelRound(aiCount * i.proposedOutcomePrice, 2);
    const perMinRevenue = (aiSpend === "") ? "" : aiSpend;
    let better = "";
    if (outcomeRevenue !== "" && perMinRevenue !== ""){
      if (outcomeRevenue > perMinRevenue) better = "Outcome-based";
      else if (outcomeRevenue < perMinRevenue) better = "Per-minute";
      else better = "Same";
    }
    return { factor:f, aiRate, aiCount, outcomeRevenue, perMinRevenue, better };
  });

  return {
    outputs: {
      connectedLeads,
      connectedRateAuto,
      humanOutcomeCount,
      humanOutcomeRateAuto,
      aiOutcomeRateAuto,
      aiOutcomeCount,
      aiTalkTimeMins,
      aiSpend,
      breakevenOutcomePrice,

      aiOutcomeRateNeeded,
      aiVsHumanNeeded,
      riskLabel,

      callsNeededToHitTarget,
      aiSpendToHitTarget,
      monthsForAI,
      monthsForHuman,
      totalHumanCost,
    },
    scenarios
  };
}
