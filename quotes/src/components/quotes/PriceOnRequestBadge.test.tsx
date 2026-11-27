/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import PriceOnRequestBadge from './PriceOnRequestBadge'

describe('PriceOnRequestBadge', () => {
  afterEach(cleanup)

  it('renders with a stable test id', () => {
    render(<PriceOnRequestBadge />)

    expect(screen.getByTestId('quote-price-on-request')).toBeTruthy()
  })
})
