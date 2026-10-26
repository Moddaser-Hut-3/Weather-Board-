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
  });

  it('Should reject login with wrong password', () => {
    // set up intercept BEFORE making the request
    cy.intercept('POST', '**/api/auth/login').as('loginAttempt');

    // Try to login with wrong password
    cy.get('input[type="text"]').first().type('testuser');
    cy.get('input[type="password"]').type('wrongpassword');
    cy.contains('button', 'Login').click();

    // wait for the failed login
    cy.wait('@loginAttempt').then((interception) => {
        expect(interception.response?.statusCode).to.equal(401);
    });

    // changed: Check for search bar NOT visible instead of Weather Board
    cy.get('.search-bar').should('not.exist');

    // verify an error message appears (or login button still visible)
    cy.contains('button', 'Login').should('be.visible');
  });

});