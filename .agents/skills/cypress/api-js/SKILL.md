---
name: api-js
description: "Testing de API con Cypress en JavaScript y cy.api()/cy.request(): arquitectura ELD, validación de contratos con JSON Schema, autenticación reutilizable y casos negativos."
---

# Cypress API JS

## Propósito

Validar servicios HTTP (estado, headers, body y contratos) con Cypress en JavaScript, aplicando la separación Ejecución / Lógica / Datos y reportería Mochawesome.

## Reglas

- Aplica ELD a nivel API:
  - **Logic**: clientes/servicios que encapsulan endpoints (`OrderApi.get(id)`).
  - **Data**: builders/fixtures de payloads; nunca payloads literales dentro del spec.
  - **Execution**: specs que invocan el cliente y asertan el resultado.
- Usa `cy.api()` cuando el proyecto lo tenga configurado (imprime request/response en el runner); si no, usa `cy.request()`.
- Nunca hardcodees credenciales ni tokens: resuélvelos vía `Cypress.env()` o `cy.session()`/login por API.
- Casos negativos: desactiva la falla automática con `failOnStatusCode: false` y aserta explícitamente el código esperado.
- Valida contratos: cada endpoint cubierto debe validar schema JSON (AJV) además de las reglas de negocio.

## Estructura recomendada

```text
cypress/
  e2e/api/orders.spec.js      # Execution
  services/
    OrderApi.js               # Logic: cliente del endpoint
    auth.js                   # Lógica de sesión/token
  fixtures/
    order-payloads.json       # Data estática
  support/
    schema/
      order.schema.json       # Contrato JSON Schema
```

## Implementación

### Cliente de servicio (capa Logic)

```javascript
// cypress/services/OrderApi.js
class OrderApi {
  create(payload) {
    return cy.api({
      method: "POST",
      url: "/api/v1/orders",
      body: payload
    });
  }

  getById(id, failOnStatusCode = true) {
    return cy.request({
      method: "GET",
      url: `/api/v1/orders/${id}`,
      failOnStatusCode
    });
  }
}

export default new OrderApi();
```

### Spec (capa Execution)

```javascript
import OrderApi from "../services/OrderApi";
import { buildOrder } from "../builders/orderBuilder";
import orderSchema from "../support/schema/order.schema.json";

it("crea una orden válida", () => {
  const payload = buildOrder({ items: [{ sku: "SKU-1", qty: 2 }] });

  OrderApi.create(payload).then((res) => {
    expect(res.status).to.eq(201);
    cy.wrap(res.body).should("satisfy", (body) => ajv.validate(orderSchema, body));
    expect(res.body.total).to.eq(payload.expectedTotal);
  });
});

it("rechaza una orden sin ítems", () => {
  const payload = buildOrder({ items: [] });

  OrderApi.create(payload).then((res) => {
    expect(res.status).to.eq(400);
    expect(res.body.error.code).to.eq("EMPTY_ORDER");
  });
});
```

### Autenticación reutilizable

- Prefiere login por API en `before` o custom command con `cy.session()` para cachear la sesión entre tests:

```javascript
Cypress.Commands.add("apiLogin", (user) =>
  cy.session(user.email, () => {
    cy.request("POST", "/api/auth/login", user).its("body.token").as("token");
  })
);
```

### Validación de contratos

- Mantén un JSON Schema por endpoint versionado junto al proyecto.
- Si existe contrato OpenAPI/Swagger, genera los schemas desde ahí en lugar de duplicarlos a mano.

### Reportería

- Configura Mochawesome según `reporting/mochawesome`; incluye en el nombre del test endpoint + caso para trazabilidad directa en el reporte HTML.

## Anti-patrones prohibidos

- Specs con URLs crudas y payloads literales repetidos.
- Aserciones solo sobre el código HTTP sin validar el cuerpo/contrato.
- Dependencia entre specs (una prueba crea el recurso que consume otra).

## Contexto Específico del Proyecto

<!--
LLM_CONTEXT_START

Project-specific facts belong in the consuming project's AGENTS.md.

LLM_CONTEXT_END
-->
