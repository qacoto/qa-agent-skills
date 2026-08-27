---
name: web-js
description: Automatización Web con Cypress en JavaScript: Page Object Model obligatorio, selectores estables, sincronización de UI e integración con Mochawesome.
---

# Cypress Web JS

## Propósito

Pruebas E2E de aplicaciones web con Cypress aplicando Page Object Model (POM) obligatorio, locators estables y sincronización determinista, con reportería Mochawesome.

## Reglas

- **POM obligatorio** para toda interacción UI: cada página o componente relevante tiene su clase en la capa Logic. Los specs no contienen `cy.get()`, ni selectores, ni lógica de navegación.
- Prioridad de selectores:
  1. Atributos estables dedicados a testing: `data-cy`, `data-testid`.
  2. Roles y atributos ARIA (`getByRole` cuando aplique).
  3. Texto visible estable (`contains`).
  4. CSS estructural solo como último recurso.
- Prohibido XPath salvo imposibilidad técnica documentada en el `AGENTS.md` del proyecto.
- Las clases POM **no asertan**: exponen acciones y devuelven elementos/estado; las aserciones `.should()` viven en el spec (Execution).
- Sincroniza por condición, nunca con `cy.wait(ms)` fijos (ver `cypress/core`).

## Estructura recomendada

```text
cypress/
  e2e/
    checkout.spec.js        # Execution: escenarios + aserciones
  pages/
    CartPage.js             # Logic: acciones de página
    components/Header.js    # Component Object reutilizable
  fixtures/
    users.json              # Data
  support/
    commands.js
```

## Implementación

### Page Object (capa Logic)

```javascript
// cypress/pages/CartPage.js
class CartPage {
  elements = {
    rows: () => cy.get("[data-cy=cart-row]"),
    checkoutBtn: () => cy.get("[data-cy=checkout]")
  };

  open() {
    cy.visit("/cart");
    return this;
  }

  removeItemBySku(sku) {
    this.elements.rows()
      .filter(`:has([data-cy=sku]:contains("${sku}"))`)
      .find("[data-cy=remove]").click();
    return this;
  }

  goToCheckout() {
    this.elements.checkoutBtn().click();
  }
}

export default new CartPage();
```

### Spec (capa Execution)

```javascript
import CartPage from "../pages/CartPage";

it("elimina un producto del carrito", () => {
  CartPage.open();
  CartPage.removeItemBySku("SKU-1");
  CartPage.elements.rows().should("have.length", 0);
});
```

### Manejo de asincronía en UI

- Spinners/modales: intercepta la llamada que dispara la carga y espera al alias antes de asertar.
- Elementos dinámicos: aserta visibilidad/habilitación con `.should()`; Cypress reintenta automáticamente.
- iframes: encapsula el acceso en el componente correspondiente; nunca lo esparzas por los specs.

### Reportería

- Configura Mochawesome según `reporting/mochawesome`; verifica que los screenshots en fallo queden adjuntos al reporte HTML consolidado.

## Anti-patrones prohibidos

- Specs con selectores crudos (`cy.get(".btn-primary").click()`).
- Page Objects con aserciones internas que ocultan el resultado al spec.
- Selectores por clase de estilos (`css-1x2y3z`) o posición absoluta (`:nth-child(7)`).

## Contexto Específico del Proyecto

<!--
LLM_CONTEXT_START

Project-specific facts belong in the consuming project's AGENTS.md.

LLM_CONTEXT_END
-->
