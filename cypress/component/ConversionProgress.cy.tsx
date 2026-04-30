import { ConversionProgress } from '../../src/components/ConversionProgress/ConversionProgress'

describe('ConversionProgress', () => {
  it('shows "Reading email…" label in parsing state', () => {
    cy.mount(<ConversionProgress status="parsing" />)
    cy.contains('Reading email…').should('be.visible')
  })

  it('shows "Converting to PDF…" label in converting state', () => {
    cy.mount(<ConversionProgress status="converting" />)
    cy.contains('Converting to PDF…').should('be.visible')
  })

  it('renders the spinner elements', () => {
    cy.mount(<ConversionProgress status="parsing" />)
    cy.get('[class*="spinnerRing"]').should('exist')
    cy.get('[class*="spinnerDot"]').should('exist')
  })
})
