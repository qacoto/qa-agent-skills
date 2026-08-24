---
name: debugging
description: Diagnóstico de fallos con causa raíz: reproducir, clasificar, inspeccionar evidencias (Mochawesome/Allure) y corregir sin enmascarar flakiness.
---

# Debugging

## Propósito

Flujo sistemático para diagnosticar fallos de automatización, distinguir bugs de producto de problemas del propio framework y corregir siempre la causa raíz.

## Reglas

- Prohibido "arreglar" un fallo subiendo timeouts, agregando sleeps o deshabilitando el test sin ticket que lo documente.
- Toda corrección debe explicar la causa raíz; si no puedes explicarla, no está resuelto.
- Los artefactos son la primera fuente de verdad: revisa reporte, screenshots, video y logs antes de teorizar.
- Clasifica el fallo antes de actuar (ver abajo) y comunica la clasificación en el ticket/PR.

## Flujo de diagnóstico

1. **Reproducir**: ejecuta el caso aislado localmente. Si no falla aislado pero sí en suite → sospecha dependencia de estado entre pruebas.
2. **Clasificar**:
   - **Bug de producto**: el sistema se comporta mal según requerimiento → bug report con evidencia.
   - **Test defectuoso**: locator frágil, aserción incorrecta, dato contaminado → corrige la prueba.
   - **Entorno/infraestructura**: caída de servicio, timeout de red, dispositivo ocupado → documenta y coordina, no modifiques la prueba.
   - **Datos obsoletos**: fixture/seed desactualizado respecto a reglas nuevas → actualiza capa Data.
3. **Inspeccionar artefactos**:
   - Cypress: reporte HTML de **Mochawesome**, screenshots/videos en fallo, consola del runner, `cy.intercept()` para ver payloads reales.
   - Mobile: reporte **Allure** con attachments (screenshots, logcat), estado del dispositivo/emulador.
4. **Corregir causa raíz**: ajusta locator/espera por condición/dato/código de producto según clasificación.
5. **Verificar**: repite la prueba varias veces (mínimo 3 corridas locales) y confirma estabilidad.

## Señales típicas y su causa

| Síntoma | Causa probable |
| :--- | :--- |
| Falla solo en CI | Paralelismo, datos compartidos, resolución/distinta del viewport |
| Falla intermitente en un paso de UI | Sincronización por tiempo en vez de condición |
| Falla tras cambio de backend | Contrato/schema desactualizado |
| Timeout en primer test de la suite | Sesión/login no cacheado, cold start |

## Anti-patrones prohibidos

- Aumentar `defaultCommandTimeout` global para ocultar una carrera.
- `cy.wait(fijo)` / `Thread.sleep()` recién agregados frente a un fallo.
- Marcar tests como `skip` permanente sin issue de seguimiento.
- Reintentar infinitamente hasta que pase ("retry until green") sin análisis.

## Contexto Específico del Proyecto

<!--
LLM_CONTEXT_START

Project-specific facts belong in the consuming project's AGENTS.md.

LLM_CONTEXT_END
-->
