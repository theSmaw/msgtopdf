import { UploadError } from '../../src/components/UploadError/UploadError'

describe('UploadError', () => {
  it('shows the Conversion failed heading', () => {
    cy.mount(<UploadError message="Something went wrong." onRetry={cy.stub()} />)
    cy.contains('Conversion failed').should('be.visible')
  })

  it('renders the error message text', () => {
    cy.mount(<UploadError message="Invalid MSG format." onRetry={cy.stub()} />)
    cy.contains('Invalid MSG format.').should('be.visible')
  })

  it('calls onRetry when Try again is clicked', () => {
    const onRetry = cy.stub().as('onRetry')
    cy.mount(<UploadError message="Error." onRetry={onRetry} />)
    cy.contains('Try again').click()
    cy.get('@onRetry').should('have.been.calledOnce')
  })

  it('renders the error icon', () => {
    cy.mount(<UploadError message="Error." onRetry={cy.stub()} />)
    cy.get('svg').should('exist')
  })
})
