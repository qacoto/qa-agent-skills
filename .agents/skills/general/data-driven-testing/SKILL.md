---
name: data-driven-testing
description: "Pruebas basadas en datos: parametrización, fixtures externos, generación dinámica y separación datos de prueba de la lógica de ejecución."
---

# Data-Driven Testing

## Propósito

Separar los datos de prueba de la lógica de ejecución para mejorar la mantenibilidad, reutilización y cobertura de escenarios con múltiples combinaciones de entrada.

## Reglas

- **Datos externos**: usar archivos JSON, CSV o YAML para conjuntos de datos.
- **Builders/Factories**: generar datos dinámicamente con variación controlada.
- **Parametrización**: usar Scenario Outline (BDD) o dataTable para ejecutar el mismo escenario con múltiples datos.
- **Datos negativos**: incluir explícitamente casos de error, vacíos, límites y inválidos.
- **Fixtures versionados**: los datos de prueba se versionan junto con el código.
- **Separación**: nunca mezclar datos hardcodeados en la lógica de ejecución.
- **Limpieza**: cada conjunto de datos debe ser autocontenido y no depender de estado previo.

## Implementación

### Cypress (Web/API)

```javascript
// fixtures/users.json
{
  "validUsers": [
    { "email": "admin@test.com", "password": "Admin123!", "role": "admin" },
    { "email": "user@test.com", "password": "User123!", "role": "user" }
  ],
  "invalidUsers": [
    { "email": "", "password": "Pass123!", "expected": "Email requerido" },
    { "email": "bad@", "password": "Pass123!", "expected": "Email inválido" },
    { "email": "user@test.com", "password": "", "expected": "Password requerido" }
  ]
}

// e2e/login/data-driven.cy.js
describe('Login - Pruebas Data-Driven', () => {
  beforeEach(() => {
    cy.fixture('users').as('users');
  });

  it('debe permitir login con credenciales válidas', function () {
    this.users.validUsers.forEach((user) => {
      cy.login(user.email, user.password);
      cy.get('.dashboard').should('be.visible');
      cy.logout();
    });
  });

  it('debe rechazar credenciales inválidas', function () {
    this.users.invalidUsers.forEach((user) => {
      cy.login(user.email, user.password);
      cy.get('.error-message').should('contain', user.expected);
    });
  });
});

// support/commands.js - Builder para datos dinámicos
Cypress.Commands.add('generateUser', (overrides = {}) => {
  const timestamp = Date.now();
  return {
    email: `user${timestamp}@test.com`,
    password: 'Test1234!',
    name: `Usuario ${timestamp}`,
    ...overrides
  };
});
```

### Cucumber (BDD)

```gherkin
# features/login.feature
Feature: Login
  Scenario Outline: Login con diferentes credenciales
    Given el usuario está en la página de login
    When ingresa email "<email>" y password "<password>"
    Then debe mostrar "<resultado>"

    Examples:
      | email            | password   | resultado          |
      | admin@test.com   | Admin123!  | Dashboard visible  |
      | user@test.com    | User123!   | Dashboard visible  |
      |                  | Pass123!   | Email requerido    |
      | bad@             | Pass123!   | Email inválido     |
      | user@test.com    |            | Password requerido |
```

```java
// step definitions - Appium Java
@When("ingresa email {string} y password {string}")
public void ingresaCredenciales(String email, String password) {
    loginPage.enterEmail(email);
    loginPage.enterPassword(password);
    loginPage.clickLogin();
}
```

### Appium Java (Mobile)

```java
// data/TestData.java
public class TestData {
    public static Object[][] loginData() {
        return new Object[][] {
            {"admin@test.com", "Admin123!", true},
            {"user@test.com", "User123!", true},
            {"", "Pass123!", false},
            {"bad@", "Pass123!", false},
            {"user@test.com", "", false}
        };
    }
}

// tests/LoginTest.java
@Test(dataProvider = "loginData")
public void testLogin(String email, String password, boolean expectedSuccess) {
    loginPage.enterEmail(email);
    loginPage.enterPassword(password);
    loginPage.clickLogin();
    
    if (expectedSuccess) {
        assertThat(dashboardPage.isVisible()).isTrue();
    } else {
        assertThat(errorMessagePage.isVisible()).isTrue();
    }
}

@DataProvider(name = "loginData")
public Object[][] loginData() {
    return TestData.loginData();
}
```

## Patrones de Datos

### Fixtures Estáticos
```json
// fixtures/products.json - datos predefinidos
[
  { "id": 1, "name": "Producto A", "price": 100 },
  { "id": 2, "name": "Producto B", "price": 200 }
]
```

### Generación Dinámica
```javascript
// Generador con Faker o similar
function generateProduct() {
  return {
    name: `Producto ${Date.now()}`,
    price: Math.floor(Math.random() * 1000),
    sku: `SKU-${Math.random().toString(36).substr(2, 9)}`
  };
}
```

### Datos Negativos Sistemáticos
```json
{
  "boundaryTests": [
    { "field": "age", "value": -1, "expected": "inválido" },
    { "field": "age", "value": 0, "expected": "inválido" },
    { "field": "age", "value": 150, "expected": "inválido" },
    { "field": "email", "value": "sin_arroba", "expected": "inválido" }
  ]
}
```

## Anti-patrones

- **NO** hardcodear datos de prueba directamente en los specs/features.
- **NO** mezclar datos positivos y negativos en el mismo fixture sin organizar.
- **NO** asumir que los datos de un test persisten para otro: cada test debe preparar su estado.
- **NO** usar datos volátiles (hora actual, random sin semilla) sin control.
- **NO** olvidar versionar los fixtures junto con los tests.
- **NO** crear fixtures gigantes sin necesidad: ser conciso y relevante.

## Checklist Data-Driven

- [ ] Datos en archivos externos (JSON/CSV/YAML).
- [ ] Builders/Factories para generación dinámica.
- [ ] Escenarios parametrizados con Scenario Outline o dataTable.
- [ ] Casos negativos y boundary explícitos.
- [ ] Fixtures versionados en control de versiones.
- [ ] Cada test es autocontenido con sus datos.
- [ ] Sin datos hardcodeados en execution layer.

## Contexto Específico del Proyecto

<!--
LLM_CONTEXT_START

Project-specific facts belong in the consuming project's AGENTS.md.

LLM_CONTEXT_END
-->
