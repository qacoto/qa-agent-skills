---
name: appium-java
description: "Automatización mobile con Appium y Java: Screen/Page Objects obligatorios con PageFactory, DriverManager centralizado thread-safe, esperas explícitas e integración Allure."
---

# Appium Java

## Propósito

Automatización de apps móviles (Android/iOS) con Appium + Java aplicando Page Object Model obligatorio, gestión centralizada del driver, esperas explícitas y reportería Allure.

## Reglas

- **POM obligatorio**: cada pantalla es una clase con `@AndroidFindBy` / `@iOSXCUITFindBy` (PageFactory). Los tests/steps nunca usan `driver.findElement()` directamente.
- **Driver centralizado**: toda sesión se crea vía `DriverManager`/`DriverFactory` (singleton thread-safe con `ThreadLocal<AppiumDriver>`) para soportar ejecución paralela. Prohibido instanciar `AppiumDriver` en tests o screens.
- **Esperas explícitas** con `WebDriverWait` + `ExpectedConditions`. Prohibido `Thread.sleep()`.
- Estrategia de locators en orden de prioridad:
  1. `AppiumBy.accessibilityId()` (estable y accesible).
  2. `AppiumBy.id()` / `AppiumBy.name()` según plataforma.
  3. `@AndroidFindBys` / XPath solo como último recurso documentado.
- Capabilities y URLs del server se leen de propiedades/config centralizados (`-Dplatform=android -Denv=qa`), nunca hardcodeadas en clases.
- Reportería estándar: **Allure** (ver `reporting/allure`): anotaciones `@Epic/@Feature/@Story/@Severity` y attachments automáticos en fallo.

## Estructura recomendada

```text
src/main/java/app/
  driver/
    DriverManager.java     # ThreadLocal + ciclo de vida
    DriverFactory.java     # capacidades por plataforma
  pages/
    LoginScreen.java
    components/TopBar.java # Component Object
src/test/java/
  steps/ runners/ hooks/
src/test/resources/
  config.properties        # env, platform, appium server
```

## Implementación

### DriverManager thread-safe

```java
public class DriverManager {
    private static final ThreadLocal<AppiumDriver> DRIVER = new ThreadLocal<>();

    public static AppiumDriver getDriver() {
        if (DRIVER.get() == null) {
            DRIVER.set(DriverFactory.create());
        }
        return DRIVER.get();
    }

    public static void quit() {
        if (DRIVER.get() != null) {
            DRIVER.get().quit();
            DRIVER.remove();
        }
    }
}
```

### Screen Object con PageFactory

```java
public class LoginScreen {

    @AndroidFindBy(accessibility = "username")
    @iOSXCUITFindBy(accessibility = "username")
    private WebElement usernameField;

    @AndroidFindBy(accessibility = "login-button")
    private WebElement loginButton;

    @AndroidFindBy(id = "error-message")
    private WebElement errorMessage;

    public LoginScreen open() {
        WebDriverWait wait = new WebDriverWait(DriverManager.getDriver(), Duration.ofSeconds(15));
        wait.until(ExpectedConditions.visibilityOf(usernameField));
        return this;
    }

    public HomeScreen loginAs(UserData user) {
        usernameField.sendKeys(user.getUsername());
        loginButton.click();
        return new HomeScreen();
    }

    public String errorText() {
        WebDriverWait wait = new WebDriverWait(DriverManager.getDriver(), Duration.ofSeconds(10));
        wait.until(ExpectedConditions.visibilityOf(errorMessage));
        return errorMessage.getText();
    }
}
```

### Gestos y acciones (W3C Actions)

- Swipe/scroll/tap long encapsulados en métodos del Screen Object usando `PointerInput`/`Sequence` o utilidades propias; nunca inline en los tests.
- Scroll hasta elemento: `scrollIntoView` de UiSelector (Android) o `mobile: scroll` (iOS) dentro del screen correspondiente.

### Ciclo de vida de la app

- Define explícitamente `noReset`/`fullReset` por entorno en `config.properties`; los datos sembrados se gestionan por API/backend cuando sea posible.
- Deep links (`deep-link://...`) preferidos sobre navegación manual por UI para Given de contexto.

## Anti-patrones prohibidos

- Locators XPath absolutos (`/hierarchy/android.widget.Frame[0]/...`).
- Un driver global compartido sin ThreadLocal (rompe paralelismo).
- Waits implícitos globales combinados con explícitos (degradan determinismo).
- Lógica de negocio dentro de las Screens (eso vive en servicios/capa Logic).

## Contexto Específico del Proyecto

<!--
LLM_CONTEXT_START

Project-specific facts belong in the consuming project's AGENTS.md.

LLM_CONTEXT_END
-->
