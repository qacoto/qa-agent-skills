---
name: cucumber-java
description: "Integración de Cucumber JVM con automatización mobile Java, manteniendo Step Definitions finos, contexto por escenario, separación respecto de Appium y hooks para el ciclo de ejecución."
---

# Cucumber Java Mobile

## Objetivo

Implementar y mantener la capa Cucumber JVM de proyectos de automatización mobile basados en Java.

Esta skill complementa las reglas generales de BDD/Gherkin del proyecto y se enfoca únicamente en la integración entre:

```text
Feature
   ↓
Step Definition Java
   ↓
Screen Object / Flow / Helper
   ↓
Framework Mobile
   ↓
Appium
```

Las reglas generales de redacción de Features, Scenarios, Backgrounds y Scenario Outlines deben obtenerse de la skill general de BDD/Cucumber correspondiente.

## Principios

Los Step Definitions son una capa de traducción entre Gherkin y la automatización.

Deben mantenerse:

* pequeños;
* reutilizables;
* legibles;
* sin detalles de Appium;
* sin locators;
* sin waits explícitos;
* sin lógica de negocio compleja.

No utilizar Step Definitions como Page Objects.

# Step Definitions Java

Utilizar las anotaciones de Cucumber JVM correspondientes al lenguaje configurado por el proyecto.

Ejemplo:

```java
import io.cucumber.java.en.Given;
import io.cucumber.java.en.When;
import io.cucumber.java.en.Then;

public class LoginSteps {

    private final LoginScreen loginScreen;

    public LoginSteps(LoginScreen loginScreen) {
        this.loginScreen = loginScreen;
    }

    @Given("the user is on the login screen")
    public void userIsOnLoginScreen() {
        loginScreen.open();
    }

    @When("the user logs in with valid credentials")
    public void loginWithValidCredentials() {
        loginScreen.loginWithValidCredentials();
    }

    @Then("the home screen is displayed")
    public void homeIsDisplayed() {
        loginScreen.assertHomeDisplayed();
    }
}
```

Cuando el proyecto utiliza keywords localizadas, respetar la convención existente.

# Delegación

Los steps deben delegar las operaciones de automatización.

Preferir:

```java
loginScreen.login(email, password);
```

Evitar:

```java
driver.findElement(...).click();
driver.findElement(...).sendKeys(...);
```

También evitar dentro del Step Definition:

* XPath;
* accessibility IDs;
* coordenadas;
* `WebDriverWait`;
* `Thread.sleep`;
* comandos Appium;
* manejo directo de elementos.

La interacción con Appium debe quedar encapsulada en la capa mobile correspondiente.

# Responsabilidades

Un Step Definition puede:

* recibir parámetros de Cucumber;
* transformar parámetros simples;
* leer o actualizar contexto del escenario;
* llamar Screen Objects;
* llamar Flows;
* llamar Helpers o Services;
* delegar assertions.

No debe implementar flujos completos de UI línea por línea.

# Reutilización

Antes de crear un Step Definition:

1. Buscar definiciones existentes.
2. Revisar expresiones similares.
3. Evaluar parametrización.
4. Revisar Parameter Types existentes.
5. Confirmar que no genere expresiones ambiguas.

Preferir:

```java
@When("el usuario selecciona {string}")
public void seleccionarOpcion(String opcion) {
    menuScreen.select(opcion);
}
```

cuando diferentes valores representan realmente la misma acción.

No generalizar steps hasta volverlos difíciles de comprender.

# Contexto Entre Steps

El estado compartido debe pertenecer al escenario.

Preferir dependency injection o un objeto de contexto por escenario.

Cuando el proyecto utilice PicoContainer:

```java
public class CheckoutSteps {

    private final ScenarioContext context;

    public CheckoutSteps(ScenarioContext context) {
        this.context = context;
    }
}
```

PicoContainer no debe considerarse obligatorio si el proyecto utiliza otro mecanismo compatible.

También pueden utilizarse:

* Guice;
* Spring;
* objetos de contexto propios;
* otros mecanismos de inyección soportados por Cucumber JVM.

Evitar:

```java
public static String userId;
public static String token;
```

para compartir estado entre steps.

El estado mutable global puede provocar contaminación entre escenarios y problemas en ejecuciones paralelas.

# Hooks

Utilizar hooks de Cucumber para comportamiento transversal del ciclo de ejecución.

Ejemplo:

```java
import io.cucumber.java.Before;
import io.cucumber.java.After;
import io.cucumber.java.Scenario;

public class ExecutionHooks {

    @Before
    public void beforeScenario(Scenario scenario) {
        // inicialización transversal
    }

    @After
    public void afterScenario(Scenario scenario) {
        // evidencias y liberación de recursos
    }
}
```

Los hooks pueden gestionar, según la arquitectura:

* inicialización del driver;
* limpieza;
* cierre del driver;
* fixtures;
* contexto;
* screenshots;
* logs;
* evidencias.

No utilizar hooks para ocultar acciones funcionales necesarias para comprender el escenario.

# Driver

El ciclo de vida del driver debe controlarse mediante la abstracción definida por el framework.

Ejemplo conceptual:

```text
Hook
  ↓
DriverManager / DriverFactory
  ↓
AndroidDriver / IOSDriver
```

Evitar crear instancias de `AndroidDriver` o `IOSDriver` directamente desde Step Definitions.

La estrategia concreta de creación y cierre del driver pertenece al framework mobile del proyecto.

# Evidencias

Cuando el proyecto utilice Allure, las evidencias de fallo deben centralizarse preferentemente en hooks o componentes de reporting.

Por ejemplo:

```java
@After
public void afterScenario(Scenario scenario) {
    if (scenario.isFailed()) {
        evidenceManager.attachScreenshot();
        evidenceManager.attachLogs();
    }
}
```

Evitar repetir lógica de screenshots en cada Step Definition.

La implementación concreta de Allure debe seguir la skill o configuración de reporting del proyecto.

# Cucumber Y Allure

Cuando el proyecto utilice Allure Cucumber JVM, configurar el plugin correspondiente en el runner o configuración equivalente.

Ejemplo para Cucumber 7:

```text
io.qameta.allure.cucumber7jvm.AllureCucumber7Jvm
```

La versión exacta debe coincidir con las dependencias del proyecto.

No asumir una versión sin revisar el `pom.xml`.

# Runner

Cucumber JVM puede ejecutarse mediante la integración definida por el proyecto, por ejemplo:

* JUnit;
* JUnit Platform;
* TestNG.

No imponer un runner concreto si el repositorio utiliza otro.

Respetar siempre la configuración existente.

# Tags

Para ejecución desde Maven/Cucumber JVM, preferir los mecanismos soportados por la versión utilizada.

Ejemplo:

```bash
-Dcucumber.filter.tags="@regression"
```

La convención de tags pertenece al proyecto consumidor.

No inventar:

* tags funcionales;
* IDs Jira;
* IDs Xray;
* tags de plataforma;

sin revisar primero la configuración y documentación del proyecto.

# Scenario Context

Mantener el contexto pequeño y orientado a datos que realmente deben compartirse entre steps.

Ejemplo:

```java
public class ScenarioContext {

    private String createdUserId;
    private String generatedEmail;

    public String getCreatedUserId() {
        return createdUserId;
    }

    public void setCreatedUserId(String createdUserId) {
        this.createdUserId = createdUserId;
    }
}
```

No convertir `ScenarioContext` en un contenedor global de todas las dependencias del framework.

# Ejecución Paralela

Toda implementación nueva debe considerar que los escenarios pueden ejecutarse en paralelo.

Evitar:

* estado estático mutable;
* drivers globales compartidos;
* datos temporales compartidos sin aislamiento;
* archivos temporales con nombres fijos cuando puedan colisionar.

El driver y el contexto deben estar aislados según la estrategia de ejecución definida por el proyecto.

# Antes De Modificar

Antes de crear o modificar código Cucumber Java:

1. Revisar los Step Definitions existentes.
2. Revisar los Screen Objects relacionados.
3. Revisar hooks existentes.
4. Revisar el mecanismo de contexto o dependency injection.
5. Revisar el runner.
6. Revisar `pom.xml`.
7. Revisar versiones de Cucumber JVM.
8. Revisar configuración de reporting.
9. Revisar convenciones definidas en `AGENTS.md`.

No asumir que todos los proyectos utilizan la misma implementación.

# Qué No Hacer

* No llamar Appium directamente desde Step Definitions.
* No utilizar `driver.findElement()` en steps.
* No introducir locators en steps.
* No utilizar `Thread.sleep`.
* No mantener estado mutable global mediante `static`.
* No duplicar Step Definitions.
* No crear drivers desde los Step Definitions.
* No implementar flujos completos dentro de los steps.
* No repetir lógica de evidencias en cada step.
* No asumir PicoContainer si el proyecto utiliza otra solución.
* No asumir JUnit si el proyecto utiliza TestNG u otra integración.
* No asumir Allure si el proyecto utiliza otro sistema de reporting.
* No inventar convenciones propias del proyecto.

# Contexto Específico Del Proyecto

Los siguientes elementos deben obtenerse del `AGENTS.md`, `pom.xml` y código existente:

```text
- estructura de módulos;
- ubicación de Features;
- ubicación de Step Definitions;
- package Java;
- versión de Cucumber JVM;
- JUnit/TestNG;
- mecanismo de dependency injection;
- DriverManager/DriverFactory;
- Screen Objects;
- reporting;
- tags;
- Jira/Xray;
- plataformas;
- estrategia de ejecución paralela.
```

Esta skill define cómo integrar correctamente Cucumber JVM dentro de una arquitectura mobile Java sin acoplarla a un proyecto concreto.
