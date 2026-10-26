/// <reference types="cypress" />

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

  it('should search for multiple cities and display weather (data-driven)', () => {
    // Login first
    cy.get('input[type="text"]').first().type('testuser');
    cy.get('input[type="password"]').type('password123');
    cy.contains('button', 'Login').click();

    // Wait for weather UI to load
    cy.contains('Weather Board').should('be.visible');

    // Load cities fixture
    cy.fixture('cities').then((data) => {
      data.cities.forEach((city: { name: string }) => {
        // Search for each city
        cy.get('input[placeholder="Search for any City"]').clear().type(city.name);
        cy.get('img[alt=""]').click(); // Click search icon

        // Verify weather data appears for this city
        cy.contains(city.name).should('be.visible');
        cy.get('.temperature').should('be.visible');
        cy.get('.weather-icon').should('be.visible');

        // Wait a moment before next search
        cy.wait(500);
      });
    });
  });

  it('should add a favourite and view it in favourites list', () => {
    cy.get('input[type="text"]').first().type('testuser');
    cy.get('input[type="password"]').type('password123');
    cy.contains('button', 'Login').click();

    cy.contains('Weather Board').should('be.visible');

    cy.get('input[placeholder="Search for any City"]').type('Paris');
    cy.get('img[alt=""]').click();
    cy.contains('Paris').should('be.visible');

    // add to favourites (the heart button, not the "Show Favourites" toggle)
    cy.get('button[aria-label="Favourite"]').click(); 

    // view favourites
    cy.contains('Show Favourites').click();
    cy.contains('Favourite Cities').should('be.visible');
    cy.contains('Paris').should('be.visible');
  });

  it('should logout and return to the login page', () => {
    cy.get('input[type="text"]').first().type('testuser');
    cy.get('input[type="password"]').type('password123');
    cy.contains('button', 'Login').click();

    cy.contains('Weather Board').should('be.visible');

    cy.contains('Logout').click();

    cy.contains('button', 'Login').should('be.visible');
    cy.get('.search-bar').should('not.exist');
  });

});