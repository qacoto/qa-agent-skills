---
name: bdd
description: Gherkin legible para el negocio con Given/When/Then declarativos, Background correcto, Scenario Outline y tags; sin detalles de implementación.
---

# BDD

## Propósito

Escribir features Gherkin que documenten comportamiento de negocio, sean mantenibles y mapeen limpiamente a step definitions finos sobre Page Objects.

## Reglas

- **Declarativo, no imperativo**: describe el resultado de negocio ("When completa el checkout"), no la coreografía de UI ("When hace click en botón X, llena campo Y, click en Z").
- Prohibido exponer en el Gherkin: selectores, IDs de elementos, endpoints, nombres de clases o detalles del framework.
- **Given** establece contexto conocido; **When** es la acción del actor; **Then** verifica el resultado observable. No asertas en Given ni actúes en Then.
- Un escenario = un comportamiento verificable. Título corto y descriptivo en lenguaje del negocio.
- `Background` solo con precondiciones que aplican a **todos** los escenarios del archivo; si algo aplica a algunos, va en cada escenario o en un Given propio.
- `Scenario Outline` + `Examples` para variaciones de datos; evita tablas gigantes que mezclan comportamientos distintos.
- Usa tags para trazabilidad y filtros de pipeline: `@smoke`, `@regression`, `@story-123`.
- El lenguaje de los features debe coincidir con el definido en el proyecto (español o inglés, consistente en todo el repositorio).

## Ejemplo correcto

```gherkin
Feature: Compra con tarjeta de crédito
  Como cliente registrado
  Quiero pagar mi carrito con tarjeta
  Para recibir mis productos

  Background:
    Given el usuario tiene sesión activa con productos en el carrito

  Scenario: Pago aprobado
    When inicia el checkout con una tarjeta aprobada
    Then recibe la confirmación de compra con número de orden

  Scenario: Pago rechazado
    When inicia el checkout con una tarjeta rechazada
    Then ve el mensaje de pago rechazado sin generar orden

  Scenario Outline: Descuento por cupón
    When aplica el cupón "<coupon>" durante el checkout
    Then el total refleja un descuento de "<discount>"

    Examples:
      | coupon  | discount |
      | QA10    | 10%      |
      | BLACK25 | 25%      |
```

## Ejemplo incorrecto (imperativo y acoplado a UI)

```gherkin
Scenario: Comprar
  Given estoy en la pagina "/cart"
  When hago click en "#checkout-btn"
  And escribo "4111111111111111" en el campo card_number
  And hago click en ".btn-pay"
  Then veo el div ".success-modal"
```

## Relación con la implementación

- Cada paso debe mapear a un step definition fino (ver `cypress/cucumber-js` o `mobile/cucumber-java`) que delega en Page/Screen Objects.
- Si escribir un paso obliga a detallar clicks internos, falta un método de negocio en el Page Object correspondiente.
- Reutiliza pasos existentes antes de crear variantes casi idénticas; pasos ambiguos con doble semántica están prohibidos.

## Contexto Específico del Proyecto

<!--
LLM_CONTEXT_START

Project-specific facts belong in the consuming project's AGENTS.md.

LLM_CONTEXT_END
-->
