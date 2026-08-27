---
name: best-practices
description: Buenas prácticas generales de QA y automatización: arquitectura ELD, POM obligatorio en UI, determinismo, independencia, reportería estándar (Mochawesome/Allure) y aserciones de resultado.
---

# Best Practices

## Propósito

Principios transversales que todo proyecto de automatización del equipo debe respetar independientemente del stack.

## Arquitectura estándar: Ejecución / Lógica / Datos (ELD)

- **Execution**: specs, features y step definitions. Contienen escenarios, orquestación y aserciones. Legibles por sí mismos.
- **Logic**: Page Objects, Screen Objects, clientes API y servicios. Reutilizan acciones técnicas y de negocio. Sin aserciones ni datos literales.
- **Data**: fixtures, builders, factories y generación dinámica. Ningún dato de prueba hardcodeado en Execution o Logic.

## Reglas

- **Preguntar antes de desarrollar**: **OBLIGATORIO** preguntar y confirmar con el usuario antes de implementar cualquier cambio. No asumir comportamiento, no inventar funcionalidad no solicitada, no hardcodear valores sin confirmación.
- **No inventar ni hardcodear**: si no existe documentación o instrucción explícita sobre cómo implementar algo, **PREGUNTAR** al usuario antes de proceder. No crear mocks, datos, endpoints o comportamiento no especificado.
- **POM obligatorio** para toda prueba UI (Web y Mobile). Ver `general/design-patterns`.
- **Reportería estándar obligatoria**:
  - Cypress (Web/API/BDD): **Mochawesome** → `reporting/mochawesome`.
  - Mobile Appium Java: **Allure Report** → `reporting/allure`.
- **Determinismo**: cada prueba produce el mismo resultado ante el mismo estado. Sin aleatoriedad sin semilla, sin dependencia de hora del día ni de datos externos volátiles.
- **Independencia**: cada prueba prepara su propio estado (API/seed/fixtures) y lo limpia si aplica. El orden de ejecución no debe afectar resultados.
- **Sincronización por condición**: prohibidos los `sleep` fijos (`cy.wait(ms)` arbitrarios, `Thread.sleep()`); usa esperas explícitas/eventuales.
- **Aserciones de resultado**: verifica comportamiento observable (estado final, respuesta del sistema), no pasos intermedios ni detalles de implementación.
- **Balance DRY/DAMP**: DRY estricto en Logic y Data; DAMP (legible aunque repita algo) en Execution.
- Sigue el `AGENTS.md` del proyecto; los hechos específicos viven ahí, no en las skills compartidas.

## Checklist antes de abrir PR

- [ ] Se preguntó y confirmó el alcance con el usuario antes de implementar.
- [ ] Tests deterministas y pasan repetidamente (mínimo 2 corridas locales).
- [ ] Sin sleeps fijos ni timeouts inflados para "arreglar" flakiness.
- [ ] Selectores/locators estables encapsulados en Page/Screen Objects.
- [ ] Datos de prueba en fixtures/builders, sin credenciales hardcodeadas.
- [ ] Aserciones verifican resultado esperado, incluidos casos negativos donde aplique.
- [ ] Reporter configurado y adjuntando evidencias (screenshots/videos/attachments).
- [ ] No se inventó ni hardcodeó nada no especificado por el usuario.

## Contexto Específico del Proyecto

<!--
LLM_CONTEXT_START

Project-specific facts belong in the consuming project's AGENTS.md.

LLM_CONTEXT_END
-->
