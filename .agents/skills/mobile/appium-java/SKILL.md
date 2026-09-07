---
name: appium-java
description: "Automatización mobile con Appium y Java mediante Screen/Page Objects, gestión centralizada del driver, acciones y esperas reutilizables, locators estables y soporte para Android/iOS."
---

# Appium Java

## Propósito

Implementar y mantener automatización de aplicaciones Android e iOS con Appium y Java, preservando separación de responsabilidades, estabilidad, reutilización y compatibilidad con ejecución paralela cuando corresponda.

Esta skill se enfoca en la capa mobile.

El contexto específico del proyecto debe obtenerse de `AGENTS.md`, configuración y código existente.

No asumir:

* estructura de módulos;
* versión concreta de Appium;
* sistema de reporting;
* mecanismo de dependency injection;
* estrategia de paralelismo;
* nombres de DriverManager o wrappers;
* plataforma única.

# Arquitectura

Mantener separación entre:

```text
Test / Step Definition
        ↓
Screen / Page / Flow
        ↓
Mobile Actions / Helpers
        ↓
Driver abstraction
        ↓
Appium
```

Los tests y Step Definitions no deben interactuar directamente con Appium cuando existe una capa mobile que pueda encapsular la operación.

# Screen Objects

Cada pantalla o componente funcional importante debe representarse mediante una abstracción reutilizable.

Puede utilizarse:

* Screen Object;
* Page Object;
* Component Object;
* Flow Object;

según la arquitectura existente.

Los Screens deben encapsular:

* elementos;
* interacción con elementos;
* comportamiento propio de la pantalla;
* sincronización necesaria para operar sobre ella.

No deben contener lógica de negocio ajena a la UI.

## PageFactory

Para este perfil, Appium PageFactory es la estrategia estándar por defecto para Screen/Page Objects.

Usar `@AndroidFindBy`, `@iOSXCUITFindBy`, `@FindBy` y la inicialización definida por el framework del proyecto.

Si un proyecto consumidor ya tiene una arquitectura distinta, establecida y explícita, preservar compatibilidad y no introducir una migración a PageFactory salvo que se solicite.

Ejemplo:

```java
public class LoginScreen {

    @AndroidFindBy(accessibility = "username")
    @iOSXCUITFindBy(accessibility = "username")
    private WebElement usernameField;

    @AndroidFindBy(accessibility = "login-button")
    @iOSXCUITFindBy(accessibility = "login-button")
    private WebElement loginButton;

    public void login(String username) {
        actions.type(usernameField, username);
        actions.tap(loginButton);
    }
}
```

# Driver

La creación y destrucción de sesiones Appium debe estar centralizada.

Ejemplo conceptual:

```text
DriverManager
      ↓
DriverFactory
      ↓
AndroidDriver / IOSDriver
```

No crear drivers directamente desde:

* tests;
* Step Definitions;
* Screen Objects.

Preferir:

```java
DriverManager.getDriver();
```

o la abstracción equivalente definida por el proyecto.

# Paralelismo

Cuando el proyecto soporte ejecución paralela, cada ejecución debe tener una sesión de driver aislada.

Una estrategia habitual en Java es:

```java
private static final ThreadLocal<AppiumDriver> DRIVER =
    new ThreadLocal<>();
```

pero debe respetarse la estrategia definida por el framework.

Nunca compartir una instancia mutable de driver entre ejecuciones paralelas.

Evitar también estado global mutable asociado a:

* plataforma;
* usuario;
* dispositivo;
* escenario;
* datos temporales.

# Configuración

Capabilities, dispositivos, plataforma, aplicaciones, URLs y entorno deben obtenerse de configuración externa.

Ejemplos:

```text
-Dmobile.platform=android
-Dmobile.driver.url=http://127.0.0.1:4723/
-Dandroid.app.path=/path/to/app.apk
-Dios.app.path=/path/to/app.app
-Denv=qa
```

o:

```text
environment variables
properties
yaml
json
CI variables
```

No hardcodear configuración de ejecución dentro de Screens o tests.

Especialmente evitar hardcodear:

* UDID;
* URL de Appium;
* rutas personales;
* device name;
* app path;
* credenciales;
* environment.

# Locators

Priorizar locators estables y orientados a accesibilidad.

Orden orientativo:

1. accessibility identifier estable;
2. resource-id / id estable;
3. identificadores nativos equivalentes;
4. estrategias específicas de plataforma;
5. XPath únicamente cuando no exista alternativa razonable.

La estrategia concreta depende de la aplicación y plataforma.

No utilizar XPath absoluto generado desde la jerarquía completa.

Ejemplo a evitar:

```text
/hierarchy/android.widget.FrameLayout[1]/...
```

Cuando un elemento carezca de identificador estable y esto comprometa la automatización, considerar solicitar un accessibility identifier o test identifier al equipo de desarrollo.

# Android E iOS

Cuando el comportamiento funcional sea común, mantener una abstracción compartida siempre que sea razonable.

Ejemplo con PageFactory:

```java
@AndroidFindBy(accessibility = "login-button")
@iOSXCUITFindBy(accessibility = "login-button")
private WebElement loginButton;
```

Cuando las plataformas requieran comportamientos significativamente diferentes, encapsular la diferencia dentro de la capa mobile.

Evitar propagar condicionales como:

```java
if (platform.equals("android")) {
    ...
} else {
    ...
}
```

por tests y Step Definitions.

# Mobile Actions

Centralizar operaciones repetitivas en una capa de acciones cuando el framework la tenga o cuando la duplicación lo justifique.

Ejemplos:

```text
tap
type
clear
waitUntilVisible
waitUntilClickable
scroll
swipe
longPress
hideKeyboard
getText
isDisplayed
```

Modelo recomendado:

```text
Screen
   ↓
MobileActions
   ↓
AppiumDriver
```

Esto evita repetir lógica técnica entre Screens.

# Esperas

Utilizar sincronización explícita basada en condiciones.

Preferir:

```text
elemento visible
elemento clickable
elemento presente
pantalla cargada
estado esperado
```

sobre esperas temporales arbitrarias.

Evitar:

```java
Thread.sleep(5000);
```

No combinar indiscriminadamente implicit waits elevados con explicit waits.

Los timeouts deben estar centralizados o configurables cuando sea posible.

# Gestos

Encapsular gestos mobile en Screens o utilidades reutilizables.

Ejemplos:

* swipe;
* scroll;
* long press;
* drag and drop;
* tap por posición cuando sea estrictamente necesario.

Preferir APIs compatibles con la versión actual de Appium.

No introducir implementaciones inline repetidas en tests o steps.

Las estrategias específicas de Android o iOS deben permanecer dentro de la capa mobile.

# Coordenadas

Evitar coordenadas cuando exista un locator estable.

Cuando sean necesarias por limitaciones reales de la aplicación o plataforma:

* encapsularlas;
* calcularlas relativamente al elemento o viewport cuando sea posible;
* documentar la razón;
* evitar valores mágicos distribuidos por el código.

# Ciclo De Vida De La Aplicación

Las operaciones como:

```text
activateApp
terminateApp
reset
background
reinstall
```

deben realizarse mediante abstracciones reutilizables.

La elección entre conservar o limpiar estado debe estar definida por la estrategia de ejecución del proyecto.

No asumir `noReset` o `fullReset` globalmente.

# Datos Y Precondiciones

Cuando una precondición pueda prepararse de forma más estable mediante APIs, servicios o fixtures, evaluar esa alternativa en lugar de realizar navegación UI innecesaria.

Sin embargo, no saltarse por API o deep link el comportamiento que constituye el objetivo del escenario.

# Evidencias

La captura de evidencias debe centralizarse.

Ejemplos:

* screenshots;
* page source;
* logs;
* información del dispositivo.

Evitar repetir screenshots manuales en cada test o step.

Si el proyecto utiliza Allure u otro reporter, delegar la implementación específica a su configuración o skill correspondiente.

# Antes De Crear Código

Antes de implementar una nueva interacción:

1. Revisar Screen Objects existentes.
2. Buscar locators reutilizables.
3. Buscar acciones equivalentes en wrappers/helpers.
4. Revisar estrategia de waits.
5. Revisar diferencias Android/iOS.
6. Revisar DriverManager/DriverFactory.
7. Revisar configuración existente.
8. Revisar convenciones en `AGENTS.md`.

Priorizar reutilización sobre creación de nuevas abstracciones.

# Anti-patrones

No:

* utilizar `driver.findElement()` directamente desde tests o Step Definitions;
* crear drivers fuera de la capa responsable;
* utilizar `Thread.sleep`;
* utilizar XPath absolutos;
* duplicar gestos y waits;
* hardcodear capabilities;
* hardcodear rutas locales;
* compartir drivers entre ejecuciones paralelas;
* introducir lógica de negocio compleja en Screens;
* propagar detalles específicos Android/iOS hacia tests;
* utilizar coordenadas cuando existe un locator estable;
* duplicar helpers existentes.

# Contexto Específico Del Proyecto

La siguiente información debe obtenerse del proyecto consumidor:

```text
- versión de Java;
- versión de Appium;
- versión del Appium Java Client;
- arquitectura de módulos;
- Screen/Page Object strategy;
- PageFactory si aplica;
- DriverManager/DriverFactory;
- wrappers y MobileActions;
- timeouts;
- capabilities;
- plataformas;
- dispositivos;
- reporting;
- estrategia de paralelismo;
- rutas de aplicaciones;
- configuración CI/CD.
```

Esta skill no debe asumir valores específicos para ninguno de estos elementos.
