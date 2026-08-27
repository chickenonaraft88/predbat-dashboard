import { describe, expect, it } from 'vitest'

import { cellBackground, isLightColor, textColorForBg } from './planColors'

describe('planColors', () => {
  it.each([
    ['#3AEE85', true], // Chrg green
    ['#34DBEB', true], // HoldChrg cyan
    ['#EEEEEE', true], // FrzChrg light grey
    ['#FFFF00', true], // Exp/HoldExp yellow
    ['#AAAAAA', true], // FrzExp grey
    ['#FFFFFF', true], // idle white
  ])('treats %s as a light background', (hex, expected) => {
    expect(isLightColor(hex)).toBe(expected)
  })

  it('falls back to true for an unparsable colour', () => {
    expect(isLightColor('not-a-colour')).toBe(true)
  })

  it('picks a dark text colour for light backgrounds', () => {
    expect(textColorForBg('#FFFFFF')).toBe('#111827')
  })

  it('returns inherit when no colour is given', () => {
    expect(textColorForBg(null)).toBe('inherit')
    expect(textColorForBg(undefined)).toBe('inherit')
  })
})

describe('cellBackground', () => {
  it('returns the colour verbatim in light mode', () => {
    expect(cellBackground('#FFFFFF', false)).toBe('#FFFFFF')
    expect(cellBackground('#3AEE85', false)).toBe('#3AEE85')
  })

  it.each([
    ['#FFFFFF', 'idle white'],
    ['#EEEEEE', 'FrzChrg light grey'],
  ])('swaps near-white %s (%s) for a dark surface tone in dark mode', (hex) => {
    expect(cellBackground(hex, true)).toBe('#1e293b')
  })

  it.each([
    ['#3AEE85', 'Chrg green'],
    ['#34DBEB', 'HoldChrg cyan'],
    ['#FFFF00', 'Exp/HoldExp yellow'],
    ['#AAAAAA', 'FrzExp grey'],
  ])('leaves meaningfully-coloured %s (%s) verbatim in dark mode', (hex) => {
    expect(cellBackground(hex, true)).toBe(hex)
  })

  it('returns undefined when no colour is given', () => {
    expect(cellBackground(null, true)).toBeUndefined()
    expect(cellBackground(undefined, false)).toBeUndefined()
  })
})
