import {
  DESIGN_OPTIONS,
  FEATURES,
  PROJECT_TYPES,
  TIMELINE_OPTIONS,
  type DesignId,
  type FeatureId,
  type ProjectTypeId,
  type ScaleId,
  type TimelineId,
} from "./pricing"

export type EstimatorSelections = {
  type: ProjectTypeId | null
  scale: ScaleId | null
  features: FeatureId[]
  design: DesignId
  timeline: TimelineId
}

export const EMPTY_SELECTIONS: EstimatorSelections = {
  type: null,
  scale: null,
  features: [],
  design: "template",
  timeline: "standard",
}

export type EstimateLine = { label: string; min: number; max: number }

export type Estimate = {
  min: number
  max: number
  weeksMin: number
  weeksMax: number
  lines: EstimateLine[]
}

const roundTo = (value: number, step: number) => Math.round(value / step) * step

export function calculateEstimate(selections: EstimatorSelections): Estimate | null {
  const type = PROJECT_TYPES.find((t) => t.id === selections.type)
  if (!type) return null
  const scale = type.scales.find((s) => s.id === selections.scale) ?? type.scales[0]

  const lines: EstimateLine[] = [{ label: `${type.label} · ${scale.label}`, min: scale.min, max: scale.max }]
  let min = scale.min
  let max = scale.max
  let extraWeeks = 0

  for (const id of selections.features) {
    if (!type.features.includes(id)) continue
    const feature = FEATURES[id]
    lines.push({ label: feature.label, min: feature.min, max: feature.max })
    min += feature.min
    max += feature.max
    extraWeeks += feature.weeks
  }

  let multiplier = 1
  if (type.hasDesign) {
    const design = DESIGN_OPTIONS.find((d) => d.id === selections.design) ?? DESIGN_OPTIONS[0]
    multiplier *= design.multiplier
    extraWeeks += design.extraWeeks
    if (design.multiplier !== 1) {
      lines.push({
        label: design.label,
        min: min * (design.multiplier - 1),
        max: max * (design.multiplier - 1),
      })
    }
  }

  const timeline = TIMELINE_OPTIONS.find((t) => t.id === selections.timeline) ?? TIMELINE_OPTIONS[1]
  if (timeline.multiplier !== 1) {
    const base = multiplier
    lines.push({
      label: `${timeline.label} timeline`,
      min: min * base * (timeline.multiplier - 1),
      max: max * base * (timeline.multiplier - 1),
    })
  }
  multiplier *= timeline.multiplier

  const weeksMin = Math.max(1, Math.round((scale.weeks[0] + extraWeeks * 0.6) * timeline.weeksFactor))
  const weeksMax = Math.max(weeksMin, Math.round((scale.weeks[1] + extraWeeks) * timeline.weeksFactor))

  return {
    min: roundTo(min * multiplier, 50_000),
    max: roundTo(max * multiplier, 50_000),
    weeksMin,
    weeksMax,
    lines: lines.map((line) => ({ ...line, min: roundTo(line.min, 10_000), max: roundTo(line.max, 10_000) })),
  }
}

const fullFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 })

export function formatTZS(value: number) {
  return `TZS ${fullFormatter.format(value)}`
}

/** Short form for tight spaces, e.g. "1.5M" or "850K" */
export function formatCompactTZS(value: number) {
  if (value >= 1_000_000) {
    // One decimal at most, so 10,250,000 shows as "10.3M" rather than a misleading "10M"
    return `${Math.round((value / 1_000_000) * 10) / 10}M`
  }
  return `${Math.round(value / 1_000)}K`
}
