---
name: design-patterns
description: "Patrones de diseño para automatización: Page Object Model obligatorio, Component Objects, Builder/Factory para datos e interfaces fluidas."
---

# Design Patterns

## Propósito

Patrones que garantizan mantenibilidad y reutilización en proyectos de automatización. El **Page Object Model (POM) es el patrón obligatorio** para toda prueba UI (Web y Mobile).

## Reglas

- **POM obligatorio**: toda página/pantalla interactuable tiene una clase Page/Screen Object. Los specs nunca acceden a selectores ni drivers directamente.
- Un Page Object expone **acciones y elementos**, no aserciones: las aserciones viven en Execution (specs/features).
- Componentes reutilizables (header, modal, tabla) se modelan como Component Objects dentro del POM, evitando duplicación entre páginas.
- Datos de prueba se construyen con Builder o Factory; nunca con literales repetidos en los tests.
- Prefiere composición sobre herencia profunda; jerarquías de POM de más de un nivel son señal de alerta.

## Page Object Model (POM)

### Qué pertenece a un Page Object

- Locators/selectores encapsulados.
- Acciones de usuario (`login()`, `addToCart()`), incluyendo navegación.
- Estado observable devuelto al spec (elementos, textos, flags) para que Execution aserte.

### Qué NO pertenece

- Aserciones (`.should()`, `expect`, JUnit asserts).
- Datos de prueba hardcodeados.
- Lógica condicional compleja de negocio (eso vive en la capa Logic de servicios si aplica).

### Ejemplo Web (Cypress)

```javascript
class LoginPage {
  elements = {
    user: () => cy.get("[data-cy=username]"),
    pass: () => cy.get("[data-cy=password]"),
    submit: () => cy.get("[data-cy=submit]")
  };

  login(credentials) {
    this.elements.user().type(credentials.username);
    this.elements.pass().type(credentials.password);
    this.elements.submit().click();
    return this;
  }
}
```

### Ejemplo Mobile (Appium Java)

```java
public class LoginScreen {
    @AndroidFindBy(accessibility = "username")
    private WebElement username;

    @AndroidFindBy(accessibility = "login-button")
    private WebElement loginButton;

    public HomeScreen loginAs(UserData user) {
        username.sendKeys(user.getUsername());
        loginButton.click();
        return new HomeScreen();
    }
}
```

## Component Object Model (COM)

Modela widgets repetidos como objetos independientes e inyéctalos/componlos desde las páginas:

```text
pages/
  CheckoutPage.js
  components/
    Header.js
    OrderSummary.js
```

## Builder / Factory (capa Data)

```javascript
// builders/orderBuilder.js
const defaults = { currency: "CLP", items: [], discount: 0 };

function buildOrder(overrides = {}) {
  return { ...defaults, ...overrides, id: crypto.randomUUID() };
}

const order = buildOrder({ items: [{ sku: "SKU-1", qty: 1 }] });
```

```java
// Java equivalente
Order order = OrderBuilder.anOrder()
    .withItem("SKU-1", 1)
    .withCurrency("CLP")
    .build();
```

## Interfaz fluida (method chaining)

Los métodos de Page/Screen Objects retornan `this` (o la siguiente pantalla) para flujos legibles:

```javascript
CheckoutPage.open()
  .fillShipping(address)
  .selectPayment("card")
  .confirm();
```

## Singleton / DriverFactory (Mobile)

Centraliza la creación del driver Appium (ver `mobile/appium-java`): una sola fábrica por ejecución, thread-safe para paralelismo.

## Anti-patrones prohibidos

- "God objects" con todos los selectores del sistema en una clase.
- Herencia de Page Objects encadenada para compartir locators (usa composición de componentes).
- Page Objects instanciados con estado global mutable compartido entre pruebas.

## Contexto Específico del Proyecto

<!--
LLM_CONTEXT_START

Project-specific facts belong in the consuming project's AGENTS.md.

LLM_CONTEXT_END
-->
