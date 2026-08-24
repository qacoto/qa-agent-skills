---
name: test-design
description: Diseño de pruebas basado en riesgo y técnicas formales: partición de equivalencia, valores límite, tablas de decisión, priorización y estrategia de datos de prueba.
---

# Test Design

## Propósito

Diseñar suites pequeñas, efectivas y mantenibles mediante técnicas formales de diseño de pruebas y priorización por riesgo.

## Reglas

- Diseña primero, automatiza después: define casos con técnicas antes de escribir código.
- Una prueba valida **un comportamiento**; si necesitas "y también" en el nombre, son dos pruebas.
- Prioriza por riesgo:
  - **P0**: flujos críticos de negocio (checkout, login, pagos).
  - **P1**: funcionalidad principal y regresión estable.
  - **P2**: bordes, accesibilidad, cosmética.
- Cubre siempre positivo + negativo + límites en funcionalidades P0/P1.
- La cobertura se mide por riesgo cubierto, no por cantidad de tests.

## Técnicas

### Partición de Equivalencia (EP)

Agrupa entradas equivalentes y representa cada clase con un caso:

| Campo | Clase válida | Clases inválidas |
| :--- | :--- | :--- |
| Edad | 18–65 | <18, >65, no numérico |

### Valores Límite (BVA)

Prueba los bordes de cada partición: `17, 18, 65, 66`, strings vacíos, `0`, `-1`, máximo permitido ±1.

### Tablas de Decisión

Para reglas combinadas (ej.: cupón + método de pago + usuario nuevo), enumera combinaciones relevantes y reduce reglas duplicadas.

### Transición de Estados

Modela entidades con ciclo de vida (orden: creada→pagada→enviada) y prueba transiciones válidas e inválidas.

## Estrategia de datos de prueba

- **Fixtures** para datos estables y compartidos (usuarios tipo, configuraciones).
- **Builders/Factories** para variaciones sobre un default (ver `general/design-patterns`).
- **Generación dinámica** (Faker o equivalente) para unicidad (emails, RUTs), cuidando el determinismo cuando el test lo requiera.
- Nunca dependas de registros preexistentes que otros procesos pueden modificar; crea tu propio estado vía API/seed.

## Aplicación en automatización

- Parametriza con Scenario Outline / data-driven tests las combinaciones de EP/BVA.
- Etiqueta por prioridad (`@smoke` ≈ P0, `@regression`) para pipelines por capas.
- Documenta supuestos y casos fuera de alcance en el `AGENTS.md` del proyecto.

## Contexto Específico del Proyecto

<!--
LLM_CONTEXT_START

Project-specific facts belong in the consuming project's AGENTS.md.

LLM_CONTEXT_END
-->
