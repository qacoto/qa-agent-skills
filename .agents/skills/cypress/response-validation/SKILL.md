---
name: response-validation
description: "Valida status, formato, estructura, tipos y valores de respuestas Cypress con helpers existentes y aserciones Chai explícitas."
---

# Validación de respuestas Cypress API

## Propósito

Aplicar validaciones legibles y proporcionales al comportamiento de cada endpoint. Esta skill prioriza helpers compartidos para status y formato, más aserciones Chai explícitas para estructura, tipos y reglas de negocio.

## Reglas

- Reutiliza helpers existentes como `cy.validateStatus` y `cy.validateFormat` antes de crear alternativas.
- En positivos, valida status, formato y el contenido significativo del body; agrega headers o duración cuando formen parte del requisito.
- En negativos, valida el status y la forma real del error sin asumir un modelo universal.
- Mantén en `testData` los valores esperados que cambian por caso.
- Usa Chai para estructura y tipos: `have.all.keys`, `include.all.keys`, `be.a`, `be.an`, `match` y comparaciones de negocio.
- Usa `all.keys` sólo cuando el contrato observado sea cerrado; usa `include.all.keys` si la API admite campos adicionales.
- No llames “contrato” o “schema validation” a una colección de aserciones inline.
- Agrega una librería de schema sólo si el consumidor ya la utiliza o su `AGENTS.md` lo exige.

## Estructura recomendada

```text
cypress/
  e2e/apis/orders/get-orders.cy.js
  fixtures/testdata/apis/orders/get-orders.json
  support/commands/validations.js
```

## Implementación

Helpers reutilizables:

```javascript
// cypress/support/commands/validations.js
Cypress.Commands.add("validateStatus", (response, expectedStatus) => {
  expect(response.status, "HTTP status").to.eq(expectedStatus);
});

Cypress.Commands.add("validateFormat", (response, expectedFormat) => {
  if (expectedFormat === "json") {
    expect(response.headers["content-type"]).to.include("application/json");
    expect(response.body).to.satisfy(
      (body) => body !== null && typeof body === "object",
      "response body is JSON-compatible"
    );
  }
});
```

Validación positiva en el spec:

```javascript
cy.getOrders(testCase.query).then((response) => {
  cy.validateStatus(response, testCase.status);
  cy.validateFormat(response, testCase.formato);

  expect(response.body).to.include.all.keys("data", "pagination");
  expect(response.body.data).to.be.an("array");
  expect(response.body.pagination.page).to.be.a("number");

  Cypress._.each(response.body.data, (order) => {
    expect(order).to.include.all.keys("id", "status", "items");
    expect(order.id).to.be.a("string").and.not.be.empty;
    expect(order.status).to.be.oneOf(testCase.allowedStatuses);
    expect(order.items).to.be.an("array");
  });
});
```

Validación negativa basada en los datos del caso:

```javascript
cy.getOrders(testCase.query).then((response) => {
  cy.validateStatus(response, testCase.status);
  cy.validateFormat(response, testCase.formato);
  expect(response.body).to.include.all.keys("code", "message");
  expect(response.body.code).to.eq(testCase.errorCode);
  expect(response.body.message).to.be.a("string").and.not.be.empty;
});
```

## Anti-patrones prohibidos

- Introducir AJV, Zod, Pact u otra herramienta sin evidencia de uso o una decisión explícita del consumidor.
- Validar sólo `response.status` en casos positivos.
- Copiar una estructura esperada genérica a endpoints con respuestas diferentes.
- Usar `all.keys` cuando campos compatibles pueden agregarse legalmente.
- Hardcodear valores variables en el spec en lugar de expresarlos en `testData`.
- Transformar helpers de aserción en comandos que además hacen requests.

## Contexto Específico del Proyecto

<!--
LLM_CONTEXT_START

Project-specific facts belong in the consuming project's AGENTS.md.

LLM_CONTEXT_END
-->
