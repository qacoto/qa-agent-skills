---
name: api-commands
description: "Encapsula endpoints Cypress en support/commands/apis con cy.api o cy.request, argumentos de negocio y failOnStatusCode false."
---

# Comandos API para Cypress

## Propósito

Implementar la capa Logic de una suite Cypress API mediante comandos de negocio pequeños y reutilizables. Cada comando concentra método, URL, headers, query y body; el spec conserva la selección de datos y las aserciones.

## Reglas

- Ubica los comandos en `cypress/support/commands/apis` o en la ruta equivalente ya existente.
- Nombra el comando por la operación de negocio, por ejemplo `getOrders`, `createOrder` o `cancelOrder`.
- Recibe argumentos de negocio y evita que el spec conozca la construcción de la URL.
- Usa `cy.api()` cuando el proyecto ya tenga ese comando instalado; de lo contrario conserva su cliente existente, normalmente `cy.request()`.
- Configura `failOnStatusCode: false` para poder validar explícitamente respuestas positivas y negativas.
- Resuelve base URLs y configuración por `Cypress.env()` o `cypress.config.js`; no agregues hosts internos al skill.
- Inyecta autenticación solamente si el proyecto consumidor la documenta. Un header funcional no debe describirse automáticamente como autenticación.
- Registra cada archivo de comandos una sola vez desde `cypress/support/e2e.js` o el entrypoint equivalente.
- Devuelve la chain de Cypress para que el spec pueda encadenar `.then()`.

## Estructura recomendada

```text
cypress/
  support/
    commands/
      apis/
        orders.js
        index.js
    e2e.js
```

## Implementación

```javascript
// cypress/support/commands/apis/orders.js
Cypress.Commands.add("getOrders", ({ orderId, page } = {}) => {
  const baseUrl = Cypress.env("ordersApiUrl");
  const query = {};

  if (orderId !== undefined) query.orderId = orderId;
  if (page !== undefined) query.page = page;

  return cy.api({
    method: "GET",
    url: `${baseUrl}/orders`,
    qs: query,
    failOnStatusCode: false
  });
});

Cypress.Commands.add("createOrder", ({ payload, userId }) => {
  const baseUrl = Cypress.env("ordersApiUrl");

  return cy.api({
    method: "POST",
    url: `${baseUrl}/orders`,
    headers: userId ? { "X-User-Id": userId } : {},
    body: payload,
    failOnStatusCode: false
  });
});
```

```javascript
// cypress/support/commands/apis/index.js
require("./orders");

// cypress/support/e2e.js
require("./commands/apis");
```

Consumo desde Execution:

```javascript
Cypress._.each(testData.positivos, (testCase) => {
  it(testCase.descripcion, () => {
    cy.getOrders(testCase.query).then((response) => {
      cy.validateStatus(response, testCase.status);
      expect(response.body.data).to.be.an("array");
    });
  });
});
```

## Anti-patrones prohibidos

- Repetir método, URL y headers en cada spec.
- Hacer aserciones de casos particulares dentro del comando de transporte.
- Hardcodear hosts, secretos, tokens o credenciales.
- Usar `failOnStatusCode: true` e impedir que los casos negativos aserten la respuesta.
- Introducir una clase `Service` paralela cuando el consumidor estandariza Logic con Cypress Commands.
- Ocultar datos dinámicos con estado global mutable.

## Contexto Específico del Proyecto

<!--
LLM_CONTEXT_START

Project-specific facts belong in the consuming project's AGENTS.md.

LLM_CONTEXT_END
-->
