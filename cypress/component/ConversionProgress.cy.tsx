import { ConversionProgress } from '../../src/components/ConversionProgress/ConversionProgress'

describe('ConversionProgress', () => {
  it('shows reading email title in parsing state', () => {
    cy.mount(<ConversionProgress status="parsing" />)
    cy.contains('Reading email…').should('be.visible')
  })

  it('shows all three step labels in parsing state', () => {
    cy.mount(<ConversionProgress status="parsing" />)
    cy.contains('Parse email')
    cy.contains('Convert to PDF')
    cy.contains('Preview ready')
  })

  it('shows converting title in converting state', () => {
    cy.mount(<ConversionProgress status="converting" />)
    cy.contains('Converting to PDF…').should('be.visible')
  })

  it('shows the spinner ring and dot', () => {
    cy.mount(<ConversionProgress status="parsing" />)
    cy.get('[class*="spinnerRing"]').should('exist')
    cy.get('[class*="spinnerDot"]').should('exist')
  })

  it('has two step connector lines', () => {
    cy.mount(<ConversionProgress status="parsing" />)
    cy.get('[class*="stepLine"]').should('have.length', 2)
  })
})
