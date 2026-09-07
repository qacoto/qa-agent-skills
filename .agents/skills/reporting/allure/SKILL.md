---
name: allure
description: "Allure Report como reporter general para proyectos de automatización: resultados estructurados, evidencias, metadata, generación de reportes y publicación en CI/CD."
---

# Allure Report

## Propósito

Operar **Allure Report** como herramienta general de reporting para proyectos de automatización: resultados estructurados, evidencias adjuntas, metadata y reporte publicado en CI/CD.

Preservar compatibilidad cuando un proyecto consumidor ya tenga una integración Allure válida, explícita y establecida.

## Reglas

- Toda ejecución que use Allure debe generar resultados mediante el adapter compatible con el framework del proyecto.
- Evidencias ante fallo deben adjuntarse desde hooks, fixtures o componentes centralizados de reporting, evitando duplicación manual en cada step.
- Organiza el reporte con anotaciones Allure (`@Epic`, `@Feature`, `@Story`, `@Severity`, `@Step`) alineadas al backlog (épica/historia) cuando aplique.
- Los resultados Allure deben publicarse como artefacto de CI cuando el proyecto los utilice, aunque la suite falle.
- Para reglas específicas de Appium Java mobile, usar `mobile/allure-reporting`.

No migrar versiones, adapters, rutas de resultados o runners si el proyecto ya define otra integración compatible, salvo que se solicite explícitamente.

## Implementación

### Adapter Cucumber JVM

Este es solo un ejemplo para Cucumber JVM 7 con JUnit 4. Respetar el runner real del proyecto.

```java
@RunWith(Cucumber.class)
@CucumberOptions(
    glue = {"steps", "hooks"},
    plugin = {
        "io.qameta.allure.cucumber7jvm.AllureCucumber7Jvm"
    },
    tags = "@regression"
)
public class CucumberTestRunner {}
```

Evitar reporters duplicados salvo que exista una necesidad concreta y documentada, como integración con Xray, post-procesamiento o requisitos del CI.

### Attachments en fallo

```java
@After(order = 0)
public void tearDown(Scenario scenario) {
    try {
        if (scenario.isFailed()) {
            evidenceManager.attachFailureEvidence();
        }
    } finally {
        executionManager.close();
    }
}
```

### Anotaciones de organización

```java
@Epic("Checkout")
@Feature("Pago con tarjeta")
public class CheckoutSteps {

    @Story("Pago aprobado")
    @Severity(SeverityLevel.CRITICAL)
    @When("inicia el checkout con una tarjeta aprobada")
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
mvn clean test                 # ejecuta tests según configuración del proyecto
mvn allure:report              # genera site con el reporte (target/site/allure-maven)
mvn allure:serve               # genera y abre localmente (no usar como fuente de CI)
allure generate target/allure-results --clean -o target/allure-report
```

## Anti-patrones prohibidos

- Adjuntar screenshots en cada step "por si acaso": infla el reporte; solo hook central + steps clave.
- Duplicar reporters sin necesidad documentada, como Xray, post-procesamiento o requisitos de CI.
- Perder `allure-results` en CI al fallar la suite (configura publicación con condición `always()`).
- Commitear `target/allure-*` (va en `.gitignore`).

## Contexto Específico del Proyecto

<!--
LLM_CONTEXT_START

Project-specific facts belong in the consuming project's AGENTS.md.

LLM_CONTEXT_END
-->
