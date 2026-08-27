---
name: allure
description: Allure Report como reporter estándar para proyectos mobile Appium Java: dependencias Maven, attachments de evidencias, anotaciones de organización y generación del reporte.
---

# Allure Report

## Propósito

Operar **Allure Report**, el reporter estándar obligatorio para proyectos mobile (Appium + Java + Cucumber): resultados estructurados, evidencias adjuntas y reporte publicado en CI.

## Reglas

- Toda ejecución mobile genera `target/allure-results` mediante el plugin `allure-cucumber7-jvm` (ver `mobile/maven`).
- Evidencias obligatorias ante fallo: screenshot de la pantalla y logcat/console; se adjuntan desde el hook `@After` centralizado (ver `mobile/cucumber-java`), nunca manualmente en cada step.
- Organiza el reporte con anotaciones Allure (`@Epic`, `@Feature`, `@Story`, `@Severity`, `@Step`) alineadas al backlog (épica/historia) cuando aplique.
- `target/allure-results` debe publicarse siempre como artefacto de CI, aunque la suite falle.
- Allure aplica a proyectos Java/JVM. Para Cypress usar Mochawesome (ver `reporting/mochawesome`).

## Implementación

### Plugin Cucumber (runner)

```java
@RunWith(Cucumber.class)
@CucumberOptions(
    glue = {"steps", "hooks"},
    plugin = {
        "io.qameta.allure.cucumber7jvm.AllureCucumber7Jvm"
        // NO agregar también json/html aquí: Allure es el reporte canónico
    },
    tags = "@regression"
)
public class CucumberTestRunner {}
```

### Attachments en fallo (hook)

```java
@After(order = 0)
public void tearDown(Scenario scenario) {
    if (scenario.isFailed()) {
        byte[] shot = ((TakesScreenshot) DriverManager.getDriver())
            .getScreenshotAs(OutputType.BYTES);
        Allure.getLifecycle().addAttachment("screenshot-fallo", "image/png", "png", shot);
        Allure.addAttachment("logcat", "text/plain",
            DriverManager.getLogs(), "txt");
    }
    DriverManager.quit();
}
```

### Anotaciones de organización

```java
@Epic("Checkout")
@Feature("Pago con tarjeta")
public class CheckoutSteps {

    @Story("Pago aprobado")
    @Severity(SeverityLevel.CRITICAL)
    @Cuando("inicia el checkout con una tarjeta aprobada")
    public void checkoutAprobado() { /* delega en Screen Objects */ }
}
```

### Metadatos del entorno

Escribe `target/allure-results/environment.properties` durante la ejecución para poblar el widget Environment:

```properties
Platform=Android
Device=Pixel_6_API_34
AppVersion=3.4.1
Environment=qa
AppiumServer=http://127.0.0.1:4723
```

### Comandos

```bash
mvn clean test                 # ejecuta y deja target/allure-results
mvn allure:report              # genera site con el reporte (target/site/allure-maven)
mvn allure:serve               # genera y abre localmente (no usar como fuente de CI)
allure generate target/allure-results --clean -o target/allure-report
```

## Anti-patrones prohibidos

- Adjuntar screenshots en cada step "por si acaso": infla el reporte; solo hook central + steps clave.
- Duplicar reporters (Allure + JUnit XML + HTML propio) sin necesidad documentada.
- Perder `allure-results` en CI al fallar la suite (configura publicación con condición `always()`).
- Commitear `target/allure-*` (va en `.gitignore`).

## Contexto Específico del Proyecto

<!--
LLM_CONTEXT_START

Project-specific facts belong in the consuming project's AGENTS.md.

LLM_CONTEXT_END
-->
