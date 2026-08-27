/**
 * Colour helpers for the plan table's state and rate cells.
 *
 * Predbat publishes `state_color` / `state2_color` / `rate_color_import` /
 * `rate_color_export` per row (`output.py`'s `publish_html_plan`, roughly
 * lines 1259-1438) using a fixed palette (Chrg green #3AEE85, HoldChrg cyan
 * #34DBEB, FrzChrg light grey #EEEEEE, Exp/HoldExp yellow #FFFF00, FrzExp
 * grey #AAAAAA, idle/demand white #FFFFFF; import rate blue/green/yellow/red,
 * export rate grey/blue/yellow/red). We render those colours verbatim as
 * cell backgrounds rather than re-deriving the thresholds client-side, so
 * the dashboard always matches whatever the server currently computes.
 */

/** True if `hex` is light enough that dark text reads better on it than light text. */
export function isLightColor(hex: string): boolean {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!match) return true
  const value = parseInt(match[1], 16)
  const r = (value >> 16) & 0xff
  const g = (value >> 8) & 0xff
  const b = value & 0xff
  // Perceived-brightness weighting (ITU-R BT.601).
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6
}

/** Picks a legible text colour for a given cell background, ignoring page theme. */
export function textColorForBg(hex: string | null | undefined): string {
  if (!hex) return 'inherit'
  return isLightColor(hex) ? '#111827' : '#f8fafc'
}
