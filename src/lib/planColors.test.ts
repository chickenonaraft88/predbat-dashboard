import { describe, expect, it } from 'vitest'

import { isLightColor, textColorForBg } from './planColors'

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
