---
name: mobile-automation
description: "Skill principal para desarrollar, modificar y revisar automatización mobile Appium Java, preservando arquitectura, reutilización, compatibilidad Android/iOS, estabilidad y separación de responsabilidades."
---

# Mobile Automation

## Propósito

Guiar el desarrollo, modificación y revisión de automatización mobile dentro del perfil `mobile-appium-java`.

Esta es la skill de coordinación principal del perfil.

Define:

* flujo de trabajo;
* separación de responsabilidades;
* arquitectura esperada;
* criterios de reutilización;
* compatibilidad Android/iOS;
* reglas de decisión;
* integración con skills especializadas.

Los detalles técnicos específicos deben delegarse a las skills correspondientes.

El contexto concreto del proyecto debe obtenerse de `AGENTS.md`, configuración y código existente.

# Principio Principal

Preservar la arquitectura y comportamiento existente antes de introducir nuevas abstracciones.

Antes de crear código nuevo:

```text
Buscar
  ↓
Entender
  ↓
Reutilizar
  ↓
Extender
  ↓
Crear solo si es necesario
```

No introducir una segunda forma de resolver un problema que el framework ya resuelve correctamente.

# Flujo De Trabajo

## Antes De Modificar

1. Leer `AGENTS.md`.
2. Identificar los módulos y responsabilidades del proyecto.
3. Buscar implementación existente relacionada.
4. Buscar métodos reutilizables.
5. Identificar Screen/Page Objects involucrados.
6. Identificar Step Definitions relacionados cuando use Cucumber.
7. Revisar helpers, actions, flows y servicios existentes.
8. Identificar cómo se gestiona el driver.
9. Evaluar impacto Android/iOS.
10. Revisar datos y precondiciones.
11. Revisar impacto en escenarios existentes.
12. Identificar el comando de validación correspondiente.

No modificar archivos antes de entender la ruta de ejecución afectada.

## Después De Modificar

Indicar:

* archivos modificados;
* comportamiento cambiado;
* reutilización realizada;
* plataformas afectadas;
* validación ejecutada;
* comando utilizado;
* riesgos o pendientes.

Si no fue posible validar algo, indicarlo explícitamente.

# Arquitectura Esperada

El perfil debe preservar una separación similar a:

```text
Feature
   ↓
Step Definition
   ↓
Screen / Page / Flow
   ↓
Mobile Actions / Helpers
   ↓
Driver abstraction
   ↓
Appium
```

No todos los proyectos necesitan exactamente los mismos nombres de clases.

Las abstracciones concretas deben obtenerse del repositorio.

# Regla De Capas

No saltar capas sin una razón técnica justificada.

En particular:

```text
Step Definition
      ✕
   AppiumDriver
```

debe evitarse.

Preferir:

```text
Step Definition
      ↓
Screen / Flow
      ↓
Mobile Actions
      ↓
Driver
```

# Screen / Page Objects

Para este perfil, Screen/Page Object es el patrón estándar de encapsulación de UI.

Por defecto, los proyectos nuevos deben utilizar Appium PageFactory de acuerdo con la skill `mobile/appium-java`.

Los Screen/Page Objects deben:

* concentrar locators;
* encapsular interacciones de pantalla;
* exponer métodos funcionales reutilizables;
* utilizar actions/helpers existentes;
* encapsular diferencias de plataforma;
* mantener sincronización cerca de la interacción correspondiente.

Evitar:

* locators duplicados;
* métodos equivalentes con nombres distintos;
* acceso directo desde tests;
* lógica de negocio compleja;
* sleeps;
* flujos excesivamente grandes cuando corresponden a otra capa.

Si un proyecto existente utiliza una arquitectura estable diferente, preservar compatibilidad salvo que se solicite una migración.

# Mobile Actions / Helpers

Operaciones técnicas repetitivas deben centralizarse cuando el framework tenga una capa para ello.

Ejemplos:

```text
tap
type
clear
waitUntilVisible
waitUntilClickable
scroll
swipe
hideKeyboard
getText
isDisplayed
```

Antes de crear un helper nuevo:

1. Buscar uno existente.
2. Revisar si puede extenderse.
3. Evitar duplicar comportamiento.
4. Mantener una única responsabilidad.

# Step Definitions

Cuando el proyecto utilice Cucumber, los Step Definitions deben actuar como capa de traducción entre Gherkin y automatización.

Deben:

* ser pequeños;
* delegar;
* recibir parámetros;
* utilizar contexto de escenario cuando corresponda;
* conservar lenguaje funcional.

No deben:

* usar Appium directamente;
* contener locators;
* contener waits;
* implementar flujos completos;
* mantener estado global mutable.

Para reglas detalladas utilizar `mobile/cucumber-java`.

# Locators

Utilizar identificadores estables y mantenibles.

Prioridad general:

1. identificadores de accesibilidad estables;
2. IDs nativos estables;
3. estrategias específicas de plataforma;
4. XPath únicamente cuando no exista una alternativa razonable.

No utilizar XPath absoluto.

No depender innecesariamente de índices.

Antes de cambiar un locator, confirmar que el problema sea realmente el locator.

Para detalles utilizar `mobile/appium-java` y `mobile/appium-debugging`.

# Sincronización

Toda sincronización debe basarse en condiciones observables.

Preferir:

```text
elemento visible
elemento interactuable
loader desaparecido
pantalla lista
estado esperado alcanzado
```

No utilizar:

```java
Thread.sleep(...)
```

Nunca resolver un problema de sincronización agregando sleeps arbitrarios.

No aumentar timeouts sin evidencia.

# Android E iOS

El perfil debe soportar Android e iOS cuando el proyecto lo requiera.

Cuando el comportamiento funcional sea común:

* reutilizar flujo;
* encapsular diferencias técnicas;
* evitar duplicar escenarios innecesariamente.

Cuando las plataformas necesiten implementaciones distintas:

```text
mismo comportamiento funcional
        ↓
abstracción común
        ↓
implementación Android / iOS
```

No propagar condicionales de plataforma por Step Definitions o tests si pueden encapsularse en la capa mobile.

# PageFactory

Para proyectos nuevos de este perfil, Appium PageFactory es el estándar esperado.

Utilizar según corresponda:

```java
@AndroidFindBy(...)
@iOSXCUITFindBy(...)
```

y anotaciones equivalentes soportadas.

No mezclar PageFactory con una segunda estrategia de locators dentro del mismo proyecto sin una razón técnica justificada.

Los proyectos existentes con una estrategia diferente y estable pueden conservarla.

# Driver

Toda sesión Appium debe gestionarse desde la abstracción central del framework.

Ejemplo:

```text
DriverManager
      ↓
DriverFactory
      ↓
AndroidDriver / IOSDriver
```

No crear sesiones Appium directamente desde:

* Step Definitions;
* tests;
* Screen Objects.

Cuando exista paralelismo, garantizar aislamiento de driver según la estrategia del proyecto.

Para detalles utilizar `mobile/appium-java`.

# Estado Y Datos

Los escenarios deben ser independientes siempre que sea posible.

Priorizar:

* datos controlados;
* setup explícito;
* cleanup;
* contexto aislado;
* recursos independientes en paralelismo.

No depender del orden de ejecución.

No compartir estado mutable global entre escenarios.

# Reutilización

Antes de crear cualquier elemento:

* buscar Screen existente;
* buscar método existente;
* buscar Step Definition existente;
* buscar helper/action existente;
* buscar fixture;
* buscar flow;
* buscar servicio.

Orden recomendado:

```text
Reutilizar
    ↓
Parametrizar
    ↓
Extender
    ↓
Refactorizar
    ↓
Crear
```

No duplicar funcionalidad únicamente para evitar modificar una abstracción existente.

# Compatibilidad

Todo cambio debe evaluar impacto sobre:

* escenarios existentes;
* Android;
* iOS;
* ejecución individual;
* suite;
* paralelismo;
* reporting;
* CI/CD.

No asumir que un cambio local es aislado sin revisar usos del método o componente afectado.

# Fallas Funcionales

No modificar automatización únicamente para hacer pasar un escenario cuando la aplicación no cumple el comportamiento esperado.

Si el comportamiento real difiere del esperado:

1. conservar la intención funcional;
2. recopilar evidencia;
3. determinar si es un defecto;
4. evitar debilitar assertions.

No convertir un bug funcional en una “corrección” del test.

# Cambios Mínimos

Preferir el cambio mínimo que resuelva la causa real.

Evitar refactors no relacionados durante una corrección puntual.

Si el cambio requiere una modificación arquitectónica mayor:

* justificarla;
* evaluar impacto;
* mantener compatibilidad;
* validar escenarios relacionados.

# Reglas De Decisión

Cuando la tarea corresponda principalmente a otra especialidad, apoyarse en la skill específica.

```text
Problema Appium / UI / driver
→ mobile/appium-debugging

Test intermitente
→ mobile/flaky-test-analysis

Implementación Cucumber JVM
→ mobile/cucumber-java

Screens, locators, gestures, waits
→ mobile/appium-java

Build, profiles, Maven lifecycle
→ mobile/maven

Allure / evidencias / reporting
→ mobile/allure-reporting

Debugging general
→ general/debugging

Git / branch / commit / PR
→ general/gitflow
```

La skill especializada complementa esta skill principal; no reemplaza las reglas arquitectónicas del perfil.

# Uso De Skills

No aplicar mecánicamente todas las skills a cada tarea.

Utilizar únicamente las necesarias según el cambio.

Ejemplo:

```text
Modificar un locator
→ mobile-automation
→ mobile/appium-java

Analizar un test intermitente
→ mobile-automation
→ general/debugging
→ mobile/appium-debugging
→ mobile/flaky-test-analysis

Crear un Step Definition
→ mobile-automation
→ mobile/cucumber-java
```

# Configuración

No hardcodear configuración específica del entorno.

Obtener desde la configuración central del proyecto:

* plataforma;
* Appium server;
* app path;
* dispositivo;
* entorno;
* timeouts;
* credenciales;
* capabilities.

Para proyectos nuevos, seguir las properties estándar definidas por el perfil y la skill Maven.

# Reporting

Los fallos deben conservar evidencia suficiente para diagnóstico.

No implementar lógica de reporting repetida dentro de Screens o Step Definitions.

Utilizar la abstracción o hooks definidos por el proyecto.

Para detalles usar `mobile/allure-reporting`.

# Paralelismo

Toda implementación nueva debe considerar potencial ejecución paralela.

Evitar:

* drivers globales compartidos;
* usuarios mutables compartidos;
* archivos temporales con nombres fijos;
* puertos conflictivos;
* resultados compartidos sin aislamiento;
* estado estático mutable.

La estrategia concreta debe respetar el framework existente.

# Validación

Después de una modificación, validar al nivel mínimo suficiente.

Orden orientativo:

```text
compilación
     ↓
escenario afectado
     ↓
escenarios relacionados
     ↓
suite relevante
```

No ejecutar suites completas innecesariamente cuando una validación más pequeña permita detectar primero errores básicos.

Utilizar los comandos canónicos documentados por el proyecto.

Para este perfil, Maven `verify` es el lifecycle esperado cuando la configuración del proyecto esté preparada para ello.

# Revisión De Código

Durante una revisión, verificar:

* respeto de capas;
* reutilización;
* ausencia de `Thread.sleep`;
* locators estables;
* ausencia de Appium directo en Steps;
* ausencia de estado global mutable;
* compatibilidad Android/iOS;
* configuración externa;
* cleanup;
* impacto sobre paralelismo;
* evidencias suficientes;
* ausencia de secretos.

No limitar la revisión únicamente a que el código compile.

# Qué No Hacer

* No romper escenarios existentes sin analizar impacto.
* No llamar Appium directamente desde Step Definitions.
* No agregar lógica de negocio en Steps.
* No utilizar `Thread.sleep`.
* No crear drivers fuera de su capa.
* No duplicar locators o helpers.
* No hardcodear rutas personales.
* No hardcodear dispositivos o URLs.
* No compartir estado mutable global.
* No introducir XPath absoluto.
* No aumentar timeouts sin evidencia.
* No agregar retries para ocultar fallos.
* No cambiar assertions para ocultar bugs.
* No introducir una arquitectura paralela a la existente sin justificación.
* No modificar CI/CD, reporting o integraciones externas sin analizar impacto.

# Contexto Específico Del Proyecto

La siguiente información debe obtenerse del proyecto consumidor:

```text
- estructura de módulos;
- package Java;
- Screen/Page Objects;
- PageFactory;
- DriverManager/DriverFactory;
- MobileActions/helpers;
- Cucumber runner;
- hooks;
- configuración Maven;
- properties;
- plataformas;
- dispositivos;
- datos;
- reporting;
- CI/CD;
- comandos canónicos;
- estrategia de paralelismo.
```

Esta skill define el estándar de desarrollo y mantenimiento del perfil `mobile-appium-java` sin depender de nombres, módulos, productos, rutas o infraestructura específica de una aplicación concreta.
