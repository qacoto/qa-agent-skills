---
name: core
description: Prácticas centrales de Cypress en JavaScript: configuración centralizada, custom commands vs Page Objects, asincronía con alias, sincronización con cy.intercept() y reportería Mochawesome.
---

# Cypress Core

## Propósito

Establecer la base común de Cypress para todos los proyectos JavaScript (Web, API y BDD): configuración centralizada, reutilización de acciones, sincronización determinista y reportería estándar con Mochawesome.

## Reglas

- Sigue el `AGENTS.md` del proyecto cuando exista y conserva sus hechos específicos ahí, nunca en esta skill compartida.
- Mantén la separación Ejecución / Lógica / Datos (ELD): los specs ejecutan y asertan; la lógica vive en Page Objects o clientes; los datos viven en fixtures/builders.
- Para UI usa obligatoriamente Page Object Model (ver `general/design-patterns`). Los custom commands son complemento, no reemplazo del POM.
- Nunca hardcodees credenciales ni tokens: usa variables de entorno (`Cypress.env`) o proveedores de secretos.
- Prohibido `cy.wait(ms)` fijo para sincronizar la app: usa esperas por condición (`cy.intercept()` + `cy.wait('@alias')`, aserciones de visibilidad).
- Prohibido `async/await` nativo sobre comandos de Cypress: los comandos son asíncronos y se encadenan con `.then()` o alias (`cy.get().as()`).

## Implementación

### Configuración centralizada (`cypress.config.js`)

- Define `baseUrl`, `viewport`, `retries`, `defaultCommandTimeout` y el reporter en un único punto.
- Diferencia entornos con `env` y sobrescribe en CI: `cypress run --env environment=staging`.
- Reporter estándar: **Mochawesome** (ver `reporting/mochawesome`):

```javascript
const { defineConfig } = require("cypress");

module.exports = defineConfig({
  baseUrl: process.env.BASE_URL,
  retries: { runMode: 2, openMode: 0 },
  reporter: "mochawesome",
  reporterOptions: {
    overwrite: false,
    html: false,
    json: true,
    reportDir: "cypress/results"
  },
  env: {
    apiUrl: "https://api.example.com"
  }
});
```

### Custom Commands vs Page Objects

| Necesidad | Solución |
| :--- | :--- |
| Acción de negocio sobre una página/pantalla | Método en Page Object (capa Logic) |
| Utilidad técnica transversal sin estado de página (login por API, seed de datos) | Custom Command en `support/commands.js` |
| Transformación de datos de prueba | Builder/factory en capa Data |

### Sincronización determinista

```javascript
// Bien: esperar a que la red responda antes de asertar
cy.intercept("GET", "/api/orders").as("getOrders");
cy.visit("/orders");
cy.wait("@getOrders").its("response.statusCode").should("eq", 200);

// Mal: espera arbitraria que oculta condiciones de carrera
cy.visit("/orders");
cy.wait(5000);
```

### Diagnóstico de fallos

- Usa `cy.log()` y mensajes de aserción descriptivos (`should("have.text", expected)` en vez de comparaciones manuales).
- Asegura screenshots automáticos en fallo (`screenshotOnRunFailure: true`) para alimentar el reporte Mochawesome.

## Contexto Específico del Proyecto

<!--
LLM_CONTEXT_START

Project-specific facts belong in the consuming project's AGENTS.md.

LLM_CONTEXT_END
-->
