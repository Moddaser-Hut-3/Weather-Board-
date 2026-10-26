describe('Authentication', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should login with valid credentials and show weather UI', () => {
    // Find the login input and type username
    cy.get('input[type="text"]').first().type('testuser');

    // Find the password input and type password
    cy.get('input[type="password"]').type('password123');

    cy.contains('button', 'Login').click();

    // Wait for the app to load and show the weather card
    cy.contains('Weather Board').should('be.visible');
    cy.get('.search-bar').should('be.visible');
  });
});