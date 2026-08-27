---
name: cucumber-js
description: Cypress + Cucumber JavaScript (@badeball/cypress-cucumber-preprocessor): features legibles, step definitions finos delegando a Page Objects, tags y reportería Mochawesome.
---

# Cypress Cucumber JS

## Propósito

BDD con Cypress en JavaScript: escenarios Gherkin orientados al negocio, pasos finos que delegan en la capa Logic/POM y trazabilidad clara en el reporte Mochawesome.

## Reglas

- Step definitions **finos**: máximo 1–3 líneas que delegan en Page Objects o servicios. Cero selectores, cero `cy.get()` crudos, cero lógica de negocio dentro del step.
- Gherkin libre de detalles de implementación (sin IDs de botones, rutas ni endpoints). Ver `general/bdd`.
- Comparte estado entre steps vía contexto del World o alias de Cypress; evita variables globales mutables que contaminan escenarios paralelos.
- Usa tags para filtrar ejecuciones (`@smoke`, `@regression`, `@api`) y mantenlos consistentes con el pipeline del proyecto.
- Sigue el `AGENTS.md` del proyecto; mantén sus hechos específicos fuera de esta skill.

## Estructura recomendada

```text
cypress/
  e2e/
    features/          # archivos .feature (Gherkin)
    step_definitions/  # un archivo por feature o dominio
  pages/               # Page Objects (capa Logic)
  fixtures/            # datos (capa Data)
cypress.config.js      # preprocessor + reporter Mochawesome
```

## Implementación

### Feature declarativa (ver `general/bdd`)

```gherkin
Feature: Checkout
  Como cliente
  Quiero completar la compra de mi carrito

  Scenario: Compra exitosa con tarjeta
    Given el usuario tiene productos en el carrito
    When completa el checkout con una tarjeta aprobada
    Then ve la confirmación de compra
```

### Steps finos delegando en POM

```javascript
import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
import CartPage from "../../pages/CartPage";
import CheckoutPage from "../../pages/CheckoutPage";
import payments from "../../fixtures/payments";

Given("el usuario tiene productos en el carrito", () => {
  CartPage.seedAndVisitWithItems();
});

When("completa el checkout con una tarjeta aprobada", () => {
  CheckoutPage.completeCheckout(payments.approvedCard);
});

Then("ve la confirmación de compra", () => {
  CheckoutPage.assertOrderConfirmation();
});
```

### Data tables y Scenario Outline

```gherkin
Scenario Outline: Descuentos por cupón
  When aplica el cupón "<coupon>"
  Then ve un descuento de "<discount>"

  Examples:
    | coupon  | discount |
    | QA10    | 10%      |
    | BLACK25 | 25%      |
```

### Configuración del preprocessor

```javascript
// cypress.config.js (fragmento)
const browserify = require("@badeball/cypress-cucumber-preprocessor/browserify");

async function setupNodeEvents(on, config) {
  await browserify.default(on, config);
  return config;
}
```

### Reporte

- Cada escenario aparece como test individual en Mochawesome; usa `scenarioName` limpio y tags coherentes para filtrar resultados en CI.

## Anti-patrones prohibidos

- Steps con aserciones largas inline en vez de métodos de aserción del Page Object.
- `Background` que no aplica a todos los escenarios del archivo (ver `general/bdd`).
- Reutilizar un step con semántica distinta según el escenario.

## Contexto Específico del Proyecto

<!--
LLM_CONTEXT_START

Project-specific facts belong in the consuming project's AGENTS.md.

LLM_CONTEXT_END
-->
