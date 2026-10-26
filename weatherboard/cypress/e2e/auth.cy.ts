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

  it('should search for a city and display weather', () => {
    // Login first
    cy.get('input[type="text"]').first().type('testuser');
    cy.get('input[type="password"]').type('password123');
    cy.contains('button', 'Login').click();

    cy.contains('Weather Board').should('be.visible');

    cy.get('input[placeholder="Search for any City"]').type('London');
    cy.get('img[alt=""]').click();

    // Wait for weather data to appear
    cy.contains('London').should('be.visible'); 
    cy.get('.temperature').should('be.visible');
    cy.get('.weather-icon').should('be.visible');
  })

});