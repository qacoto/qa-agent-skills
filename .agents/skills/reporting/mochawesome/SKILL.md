---
name: mochawesome
description: "Configura Mochawesome en Cypress respetando el reporter ya instalado, componiendo setupNodeEvents y preservando evidencias y tasks del proyecto."
---

# Mochawesome

## Propósito

Generar reportes legibles de Cypress con la variante de Mochawesome que el proyecto consumidor ya utiliza. La configuración debe integrarse con los plugins, tasks y convenciones existentes sin reemplazarlos.

## Reglas

- Inspecciona `package.json`, `cypress.config.js` y el support file antes de modificar reportería.
- Si existe `cypress-mochawesome-reporter`, usa su plugin y su registro de support; no lo reemplaces por el reporter raw.
- Si existe `mochawesome` raw, conserva su estrategia actual. Agrega `mochawesome-merge` y `marge` sólo si el proyecto necesita consolidar múltiples JSON.
- No instales simultáneamente ambas variantes sin una razón documentada.
- Compón `setupNodeEvents`; preserva tasks DB, preprocessors y otros listeners existentes.
- Conserva screenshots de fallos y publica el directorio de reportes como artefacto de CI.
- Usa `cy.step()` o la utilidad de pasos que el consumidor ya tenga para reflejar acciones de negocio.
- Evita registrar secrets, tokens, credenciales, connection strings o payloads sensibles.

## Estructura recomendada

```text
cypress/
  e2e/apis/**/*.cy.js
  support/e2e.js
  screenshots/
  reports/
cypress.config.js
package.json
```

## Implementación

Configuración con `cypress-mochawesome-reporter` y composición de otros eventos:

```javascript
// cypress.config.js
const { defineConfig } = require("cypress");

module.exports = defineConfig({
  screenshotOnRunFailure: true,
  reporter: "cypress-mochawesome-reporter",
  reporterOptions: {
    reportDir: "cypress/reports",
    charts: true,
    embeddedScreenshots: true,
    inlineAssets: true,
    overwrite: false
  },
  e2e: {
    setupNodeEvents(on, config) {
      require("cypress-mochawesome-reporter/plugin")(on);

      on("task", {
        safeLog(message) {
          console.log(String(message));
          return null;
        }
      });

      return config;
    }
  }
});
```

```javascript
// cypress/support/e2e.js
require("cypress-mochawesome-reporter/register");
require("./commands/apis");
```

Trazabilidad desde un spec data-driven:

```javascript
Cypress._.each(testData.positivos, (testCase) => {
  it(testCase.descripcion, () => {
    cy.step("Consultar el endpoint");
    cy.getOrders(testCase.query).then((response) => {
      cy.step("Validar la respuesta");
      cy.validateStatus(response, testCase.status);
    });
  });
});
```

Para un proyecto que ya usa `mochawesome` raw y necesita consolidación paralela:

```javascript
module.exports = defineConfig({
  reporter: "mochawesome",
  reporterOptions: {
    reportDir: "cypress/results",
    overwrite: false,
    html: false,
    json: true
  }
});
```

```bash
npx mochawesome-merge "cypress/results/*.json" -o cypress/results/mochawesome.json
npx marge cypress/results/mochawesome.json --reportDir cypress/results --inline
```

## Anti-patrones prohibidos

- Reemplazar todo `setupNodeEvents` para registrar el reporter.
- Instalar paquetes de merge cuando el plugin ya genera el reporte requerido.
- Mezclar resultados de ejecuciones distintas en un mismo HTML.
- Publicar sólo datos crudos cuando el pipeline requiere un reporte navegable.
- Imprimir configuración sensible o cuerpos con secretos en logs y reportes.
- Forzar Mochawesome fuera de Cypress/Mocha.

## Contexto Específico del Proyecto

<!--
LLM_CONTEXT_START

Project-specific facts belong in the consuming project's AGENTS.md.

LLM_CONTEXT_END
-->
