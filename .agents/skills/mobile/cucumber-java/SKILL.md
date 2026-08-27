---
name: cucumber-java
description: Cucumber JVM para mobile con Java: step definitions finos delegando a Screen Objects, inyección de dependencias con PicoContainer y hooks con evidencias hacia Allure.
---

# Cucumber Java (Mobile)

## Propósito

BDD con Cucumber-JVM sobre Appium/Maven: features de negocio, steps finos sobre Screen Objects (POM) y hooks que garantizan ciclo de vida del driver y evidencias en Allure.

## Reglas

- Step definitions **finos**: delegan en Screen Objects o servicios; máximo 1–3 líneas útiles. Sin `driver.findElement()` ni waits dentro de los steps.
- Comparte estado entre steps mediante **inyección de dependencias** (PicoContainer o Guice) con clases de contexto pequeñas y tipadas. Prohibido estado estático mutable global.
- Los hooks gestionan el driver:
  - `@Before`: inicializa driver vía `DriverManager`, prepara datos si aplica.
  - `@After`: cierra sesión (`DriverManager.quit()`) y adjunta screenshot + logs a **Allure** cuando el escenario falla.
- Un step = una acción/resultado de negocio reutilizable; pasos duplicados casi idénticos se refactorizan con parámetros o Step Parameter Types.
- Tags consistentes con el pipeline (`@smoke`, `@regression`, `@android`, `@ios`) y usados desde Maven/JUnit para filtrar.

## Estructura recomendada

```text
src/test/java/
  runners/CucumberTestRunner.java   # @CucumberOptions: glue, tags, plugin allure
  steps/
    LoginSteps.java
    CheckoutSteps.java
  context/
    ScenarioContext.java            # estado inyectado por PicoContainer
  pages/                            # Screen Objects (ver mobile/appium-java)
src/test/resources/features/login.feature
```

## Implementación

### Feature declarativa (ver general/bdd)

```gherkin
Feature: Login móvil
  Scenario: Credenciales inválidas muestran error
    Given el usuario está en la pantalla de login
    When inicia sesión con credenciales inválidas
    Then ve el mensaje "Usuario o contraseña incorrectos"
```

### Steps finos con PicoContainer

```java
public class LoginSteps {

    private final LoginScreen loginScreen;
    private final UserDataBuilder userData;

    // PicoContainer inyecta constructor con dependencias
    public LoginSteps(LoginScreen loginScreen) {
        this.loginScreen = loginScreen;
    }

    @Dado("el usuario está en la pantalla de login")
    public void usuarioEnLogin() {
        loginScreen.open();
    }

    @Cuando("inicia sesión con credenciales inválidas")
    public void loginInvalido() {
        loginScreen.loginAs(UserData.invalid());
    }

    @Entonces("ve el mensaje {string}")
    public void veMensaje(String esperado) {
        loginScreen.assertErrorMessage(esperado);
    }
}
```

### Hooks con evidencia a Allure

```java
public class DriverHooks {

    @Before(order = 0)
    public void setUp(Scenario scenario) {
        DriverManager.getDriver();
        Allure.step("Sesión iniciada para: " + scenario.getName());
    }

    @After(order = 0)
    public void tearDown(Scenario scenario) {
        if (scenario.isFailed()) {
            byte[] shot = ((TakesScreenshot) DriverManager.getDriver())
                .getScreenshotAs(OutputType.BYTES);
            Allure.getLifecycle().addAttachment("fallo", "image/png", "png", shot);
        }
        DriverManager.quit();
    }
}
```

### Runner

```java
@RunWith(Cucumber.class)
@CucumberOptions(
    glue = {"steps", "hooks"},
    plugin = {"io.qameta.allure.cucumber7jvm.AllureCucumber7Jvm"},
    tags = "@regression"
)
public class CucumberTestRunner {}
```

## Anti-patrones prohibidos

- Steps con aserciones inline largas en vez de métodos del Screen Object.
- Campos `static` compartidos para pasar datos entre steps/clases.
- Screenshots manuales repetidos en cada step en vez del hook centralizado.

## Contexto Específico del Proyecto

<!--
LLM_CONTEXT_START

Project-specific facts belong in the consuming project's AGENTS.md.

LLM_CONTEXT_END
-->
