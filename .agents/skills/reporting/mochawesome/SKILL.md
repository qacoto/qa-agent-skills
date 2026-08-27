---
name: mochawesome
description: "Mochawesome como reporter estándar para proyectos Cypress (Web y API): configuración, merge de resultados paralelos, evidencias en fallo y publicación como artefacto de CI."
---

# Mochawesome

## Propósito

Configurar y operar **Mochawesome**, el reporter estándar obligatorio para todos los proyectos Cypress (Web, API y BDD), generando reportes HTML consolidados con evidencias.

## Reglas

- Todo proyecto Cypress debe tener Mochawesome configurado en `cypress.config.js`; no se aceptan corridas sin reporte HTML consolidado.
- Generar JSON individual (`json: true`) y consolidar con `mochawesome-merge` + `marge`: es el flujo estándar para ejecuciones sharded/paralelas.
- Screenshots automáticos en fallo habilitados (`screenshotOnRunFailure: true`) y adjuntos al reporte.
- `cypress/results` (o directorio equivalente) publicarse como artefacto de CI incluso cuando la suite falla.
- Mochawesome aplica **exclusivamente** a ecosistemas JavaScript/Mocha. Para Appium Java usar Allure (ver `reporting/allure`); prohibido forzar Mochawesome fuera de Cypress/Mocha.

## Implementación

### Configuración base

```javascript
// cypress.config.js
module.exports = defineConfig({
  screenshotOnRunFailure: true,
  reporter: "mochawesome",
  reporterOptions: {
    overwrite: false,          // un JSON por spec
    html: false,               // HTML solo tras merge
    json: true,                // requerido para mochawesome-merge
    reportDir: "cypress/results",
    reportPageTitle: "QA Regression Suite"
  }
});
```

### Consolidación (local o CI)

```bash
npx cypress run

# Merge de los JSON generados y render final
npx mochawesome-merge "cypress/results/*.json" > cypress/results/mochawesome.json
npx marge cypress/results/mochawesome.json --reportDir cypress/results --inline
```

Script sugerido para `package.json`:

```json
{
  "scripts": {
    "test": "cypress run",
    "report:merge": "mochawesome-merge cypress/results/*.json > cypress/results/mochawesome.json",
    "report:html": "marge cypress/results/mochawesome.json -o cypress/results --inline",
    "test:report": "npm run test && npm run report:merge && npm run report:html"
  }
}
```

Dependencias dev: `mochawesome`, `mochawesome-merge`, `mochawesome-report-generator` (`marge`).

### Evidencias

- Screenshots en fallo quedan en `cypress/screenshots` y son referenciados por el HTML; conserva ambos artefactos juntos.
- Videos: útiles en CI; desactívalos en local si ralentizan (`video: false` por defecto en open mode).
- Nombra tests de forma trazable (`[P0] Checkout – pago aprobado`) para lectura directa del reporte.

### En proyectos Cucumber (BDD)

- Cada escenario aparece como test individual; mantén títulos Gherkin limpios porque son la cara visible del reporte.

## Anti-patrones prohibidos

- Sobrescribir JSON entre specs (`overwrite: true`) rompiendo el merge.
- Publicar solo el JSON sin HTML consolidado.
- Mezclar outputs de distintas corridas sin limpiar `cypress/results` previamente.

## Contexto Específico del Proyecto

<!--
LLM_CONTEXT_START

Project-specific facts belong in the consuming project's AGENTS.md.

LLM_CONTEXT_END
-->
