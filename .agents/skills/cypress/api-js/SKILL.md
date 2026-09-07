---
name: api-js
description: "Diseña suites Cypress API en JavaScript con ELD, testData positivos y negativos, Cypress._.each y comandos reutilizables de negocio."
---

# Cypress API JS

## Propósito

Organizar pruebas HTTP con Cypress y JavaScript sin imponer librerías ni comportamientos que el proyecto consumidor no utiliza. La skill coordina Execution, Logic y Data; delega los requests a comandos API y mantiene las aserciones observables en los specs.

## Reglas

- Lee primero `AGENTS.md`, `cypress.config.js`, los specs, fixtures y comandos existentes.
- Aplica ELD con las rutas ya adoptadas por el proyecto. Si no existe una convención, usa:
  - **Execution**: `cypress/e2e/apis/<servicio>/<recurso>/*.cy.js`.
  - **Logic**: `cypress/support/commands/apis/*.js`.
  - **Data**: `cypress/fixtures/testdata/apis/<servicio>/<recurso>/*.json`.
- Declara los datos como `const testData = require(...)` y recorre matrices con `Cypress._.each`.
- Separa casos positivos y negativos en `testData.positivos` y `testData.negativos` cuando ese patrón exista en el repositorio.
- Invoca comandos de negocio desde el spec; no construyas `cy.api()` o `cy.request()` directamente en Execution.
- Usa `failOnStatusCode: false` en Logic para que 4xx/5xx lleguen a las aserciones del caso negativo.
- Valida al menos status, formato y contenido relevante. Agrega estructura, tipos, headers o tiempos sólo cuando sean parte del comportamiento esperado.
- No presupongas JSON Schema, OpenAPI, Pact, autenticación, base de datos ni builders. Úsalos únicamente si `AGENTS.md` y el código del consumidor confirman que existen.
- No conviertas una validación Chai de estructura en “contract testing”. Son estrategias distintas.

## Estructura recomendada

```text
cypress/
  e2e/
    apis/
      orders/
        get-orders.cy.js              # Execution
  fixtures/
    testdata/
      apis/
        orders/
          get-orders.json             # Data
  support/
    commands/
      apis/
        orders.js                     # Logic
    e2e.js
```

## Implementación

Datos de prueba:

```json
{
  "positivos": [
    {
      "descripcion": "lista órdenes existentes",
      "query": { "page": 1 },
      "status": 200,
      "formato": "json"
    }
  ],
  "negativos": [
    {
      "descripcion": "rechaza un identificador inválido",
      "query": { "orderId": "INVALID" },
      "status": 400,
      "formato": "json",
      "errorCode": "INVALID_ORDER_ID"
    }
  ]
}
```

Spec data-driven:

```javascript
const testData = require("../../../fixtures/testdata/apis/orders/get-orders.json");

describe("GET orders", () => {
  describe("Casos positivos", () => {
    Cypress._.each(testData.positivos, (testCase) => {
      it(testCase.descripcion, () => {
        cy.step("Consultar órdenes");
        cy.getOrders(testCase.query).then((response) => {
          cy.validateStatus(response, testCase.status);
          cy.validateFormat(response, testCase.formato);
          expect(response.body).to.be.an("object");
          expect(response.body.data).to.be.an("array");
        });
      });
    });
  });

  describe("Casos negativos", () => {
    Cypress._.each(testData.negativos, (testCase) => {
      it(testCase.descripcion, () => {
        cy.getOrders(testCase.query).then((response) => {
          cy.validateStatus(response, testCase.status);
          cy.validateFormat(response, testCase.formato);
          expect(response.body.code).to.eq(testCase.errorCode);
        });
      });
    });
  });
});
```

El comando `cy.getOrders` pertenece a `support/commands/apis`; consulta `cypress/api-commands` para su implementación. Los helpers `validateStatus` y `validateFormat` deben reutilizarse si el consumidor ya los tiene; consulta `cypress/response-validation` para un fallback compatible.

## Anti-patrones prohibidos

- Agregar AJV, JSON Schema o Pact sólo porque la prueba valida campos del body.
- Inventar login, tokens, headers o casos 401/403 sin evidencia en el proyecto o la API documentada.
- Escribir URLs, credenciales, payloads extensos o requests directamente en el spec.
- Sustituir `testData` y `Cypress._.each` por casos duplicados cuando son la convención del consumidor.
- Crear dependencias de orden entre tests o usar datos producidos por otro spec.
- Afirmar únicamente el status en un caso positivo sin inspeccionar la respuesta útil.

## Contexto Específico del Proyecto

<!--
LLM_CONTEXT_START

Project-specific facts belong in the consuming project's AGENTS.md.

LLM_CONTEXT_END
-->
