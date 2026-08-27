---
name: gitflow
description: "Convenciones GitFlow para QA: ramas enfocadas, Conventional Commits y pull requests revisables con evidencia de ejecución."
---

# Gitflow

## Propósito

Convenciones de branching, commits y pull requests que mantienen el repositorio estable y las contribuciones de automatización revisables.

## Ramas

Modelo GitFlow del equipo:

- **`master`**: código estable. Solo recibe merges aprobados desde `develop` vía PR. Es la rama que consumen producción y herramientas distribuidas desde el repo.
- **`develop`**: rama de integración. Acumula los cambios aprobados antes de liberarse a `master`.
- **Ramas de desarrollo**: atómicas, siempre desprendidas de `develop`, con prefijo por tipo:
  - `feature/<tema>` — nueva funcionalidad de automatización.
  - `fix/<tema>` — corrección de prueba o bug.
  - `test/<tema>` — cambios exclusivos de pruebas.
  - `chore/<tema>` — mantenimiento, dependencias, configuración.

Reglas de flujo:

- Una rama = un objetivo atómico. Si describís la rama con "y", divídela.
- Los cambios avanzan por PR de la rama más baja a la más alta: `feature/*` → `develop` → `master`. Nada llega a `master` sin pasar por `develop`.
- **Prohibido comitear directamente a `master`**; `develop` tampoco recibe pushes directos, solo PRs revisados.
- Mantén tu rama sincronizada con `develop` mediante rebases pequeños; evita ramas de larga vida (>5 días).

## Commits

- Atómicos y con mensaje en formato **Conventional Commits**:
  - `feat:` nuevo escenario/página/skill.
  - `fix:` corrección de locator, aserción o flakiness.
  - `test:` nuevos o modificados casos de prueba.
  - `refactor:` mejora interna sin cambiar comportamiento.
  - `chore:` dependencias, CI, configuración.
- Ejemplos:

```text
feat(checkout): agrega Page Object de checkout con cupones
fix(cart): reemplaza wait fijo por espera de respuesta de red
test(login): cubre credenciales inválidas con datos dinámicos
```

- Sin secretos ni tokens en commits; revisa el diff antes de pushear.

## Pull Requests

- Dirección obligatoria: rama de desarrollo → `develop`, y `develop` → `master` cuando se libera.
- Alcance pequeño y revisable (< ~400 líneas cambiadas cuando sea posible).
- Descripción incluye:
  - Qué y por qué (referencia al ticket/story).
  - Evidencia de ejecución: extracto del reporte Mochawesome/Allure o salida del runner.
  - Checklist: determinismo verificado, sin sleeps, POM respetado, reporter intacto.
- Un PR no debe mezclar refactor + feature grande; separa el refactor previo en su propio PR.
- El revisor verifica legibilidad del spec (Execution) más que detalles internos de Logic/Data.
- Resuelve conversaciones antes del merge; squash o merge según convención del proyecto destino.

## Contexto Específico del Proyecto

<!--
LLM_CONTEXT_START

Project-specific facts belong in the consuming project's AGENTS.md.

LLM_CONTEXT_END
-->
