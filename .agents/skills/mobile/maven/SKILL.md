---
name: maven
description: "Convenciones Maven para proyectos de automatización mobile Java: builds reproducibles, gestión centralizada de versiones, configuración por properties/perfiles, ejecución de tests y compatibilidad con CI/CD."
---

# Maven Mobile Java

## Propósito

Configurar y mantener builds Maven reproducibles para proyectos de automatización mobile Appium Java.

Esta skill se enfoca en:

* estructura y mantenimiento del `pom.xml`;
* gestión de dependencias;
* plugins;
* properties;
* perfiles;
* ejecución de tests;
* integración con CI/CD;
* proyectos multi-módulo.

Para el perfil `mobile-appium-java`, el estándar esperado es:

* Java 17 o superior;
* Maven como herramienta de build;
* Appium Java Client;
* Cucumber JVM;
* JUnit o TestNG según el runner del proyecto;
* Allure cuando el perfil o proyecto lo utilice.

Las decisiones específicas de Appium, Cucumber, Allure u otras herramientas deben respetar las skills y convenciones correspondientes del proyecto.

Si un proyecto consumidor ya tiene una convención distinta, establecida y explícita, preservar compatibilidad y no migrar properties, perfiles, dependencias o lifecycle solo para ajustarlos al estándar.

# Gestión De Versiones

Las versiones deben estar controladas explícitamente mediante alguno de estos mecanismos:

* `<properties>`;
* `<dependencyManagement>`;
* BOM;
* parent POM;
* pluginManagement.

Evitar dependencias o plugins cuya versión quede determinada de forma accidental o no controlada.

No duplicar versiones en múltiples módulos cuando puedan centralizarse.

Preferir:

```xml
<properties>
    <java.version>17</java.version>
    <cucumber.version>...</cucumber.version>
    <appium.version>...</appium.version>
</properties>
```

o gestión equivalente mediante BOM/parent.

# Dependencias

Antes de agregar una dependencia:

1. Revisar si ya existe en el parent POM.
2. Revisar `dependencyManagement`.
3. Revisar módulos hermanos.
4. Confirmar que sea necesaria.
5. Evitar duplicados con distintas versiones.

Para este perfil, las dependencias base esperadas son:

```text
io.appium:java-client
io.cucumber:cucumber-java
io.qameta.allure:allure-cucumber7-jvm
```

y la integración de runner que use el proyecto:

```text
JUnit
JUnit Platform
TestNG
```

`allure-cucumber7-jvm` aplica cuando el perfil o proyecto utilice Allure.

No asumir una integración de runner específica sin revisar el proyecto.

# Scope

Asignar scopes correctamente.

Ejemplos:

```xml
<scope>test</scope>
```

para librerías utilizadas únicamente por automatización cuando corresponda.

No mover dependencias a scope `compile` sin necesidad.

# Java

La versión estándar del perfil es Java 17 o superior.

La versión de Java debe configurarse de forma centralizada y consistente con el entorno de CI.

Preferir `maven.compiler.release` cuando la configuración del proyecto lo permita.

Ejemplo:

```xml
<properties>
    <maven.compiler.release>17</maven.compiler.release>
</properties>
```

Si un proyecto consumidor existente define explícitamente otra versión soportada, preservar compatibilidad salvo que se solicite la migración.

# System Properties

Los parámetros variables de ejecución deben llegar desde configuración externa.

Para este perfil, las properties recomendadas son:

Ejemplos:

```bash
-Dmobile.platform=android
-Dmobile.driver.url=http://127.0.0.1:4723/
-Dandroid.app.path=/path/to/app.apk
-Dios.app.path=/path/to/app.app
-Denv=qa
-Ddevice=emulator
```

Las propiedades deben ser leídas desde una capa central de configuración.

No hardcodear valores específicos de ejecución dentro del código.

Si el proyecto ya usa nombres distintos, como `-Dplatform` o `-Dappium.url`, no renombrarlos sin revisar impacto en código, runners y CI.

# Tags Cucumber

Cuando el proyecto utilice Cucumber JVM directamente, preferir las properties soportadas por la versión instalada.

Ejemplo habitual:

```bash
-Dcucumber.filter.tags="@smoke"
```

Si el proyecto define una property propia como:

```bash
-Dtags="@smoke"
```

debe existir una capa explícita que la traduzca o consuma.

No inventar aliases de properties sin revisar el framework.

# Maven Profiles

Utilizar perfiles cuando representen configuraciones coherentes y reutilizables.

Ejemplos posibles:

```text
android
ios
qa
staging
ci
xray
```

No crear perfiles para cada combinación imaginable si las diferencias pueden resolverse mediante properties.

Evitar perfiles con demasiada lógica oculta.

El comando de ejecución debe seguir siendo fácil de comprender.

# Surefire Y Failsafe

Utilizar el plugin correspondiente al ciclo de vida definido por el proyecto.

## Surefire

Normalmente ejecuta tests durante:

```text
test
```

Ejemplo:

```bash
mvn test
```

## Failsafe

Normalmente se utiliza para:

```text
integration-test
verify
```

Ejemplo:

```bash
mvn verify
```

No cambiar de Surefire a Failsafe o viceversa sin revisar runners, nombres de clases, lifecycle y configuración CI existente.

# Configuración De Plugins

Las versiones de plugins deben estar controladas mediante:

* `<plugins>`;
* `<pluginManagement>`;
* parent POM.

Evitar configuraciones duplicadas entre módulos.

Cuando una configuración aplique a todos los módulos, preferir centralizarla en el parent.

# Proyectos Multi-Módulo

En proyectos Maven multi-módulo, respetar la responsabilidad de cada módulo.

Ejemplo conceptual:

```text
parent
 ├── commons
 ├── mobile
 └── runner
```

El parent debe concentrar configuración común cuando sea razonable.

Los módulos deben declarar únicamente dependencias específicas de su responsabilidad.

Evitar dependencias circulares.

# Ejecución Multi-Módulo

Cuando sea necesario ejecutar un módulo junto con sus dependencias:

```bash
mvn -pl runner -am test
```

o:

```bash
mvn -pl runner -am verify
```

según el lifecycle configurado.

Los comandos canónicos deben documentarse en `AGENTS.md` o documentación del proyecto.

# Reporting

La configuración de reporting debe respetar la herramienta utilizada por el proyecto.

Si utiliza Allure, consultar la skill correspondiente.

No asumir:

* plugin concreto;
* ruta de resultados;
* versión;
* uso obligatorio de AspectJ;
* comando de publicación.

Maven debe integrar correctamente el reporter según la arquitectura definida, sin duplicar responsabilidades de hooks, runners o pipeline.

# Allure

Cuando el perfil o proyecto utilice Allure, pueden existir dependencias o plugins como:

```text
allure-cucumber7-jvm
allure-maven
aspectjweaver
```

`allure-cucumber7-jvm` es la integración esperada para Cucumber JVM 7 con Allure.

Los plugins y dependencias auxiliares deben agregarse únicamente si la integración real del proyecto los requiere.

No duplicar configuración entre Maven y runners sin necesidad.

# CI/CD

Los comandos ejecutados localmente deben ser reproducibles en CI.

Evitar pasos manuales obligatorios.

La configuración debe permitir parametrizar:

* plataforma mediante `-Dmobile.platform`;
* entorno;
* tags;
* dispositivo;
* Appium server mediante `-Dmobile.driver.url`;
* ruta de app Android mediante `-Dandroid.app.path`;
* ruta de app iOS mediante `-Dios.app.path`;
* reporting;
* integraciones externas.

Los artefactos generados deben publicarse según la estrategia definida por el pipeline.

# Artefactos

No commitear directorios generados por Maven, como:

```text
target/
```

salvo requerimiento explícito del repositorio.

Mantener `.gitignore` consistente.

# Comandos

No asumir un comando universal.

Antes de definir o modificar el comando canónico:

1. Revisar módulos.
2. Revisar plugins.
3. Revisar perfiles.
4. Revisar runners.
5. Revisar CI.
6. Revisar `AGENTS.md`.

Ejemplos:

```bash
mvn clean test
```

```bash
mvn clean verify
```

```bash
mvn -pl runner -am verify
```

# Actualización De Dependencias

Actualizar dependencias de forma controlada.

Antes de subir una versión:

* revisar breaking changes;
* revisar compatibilidad entre Appium Java Client y Selenium;
* revisar compatibilidad de Cucumber;
* ejecutar la suite relevante;
* validar CI.

Preferir cambios de dependencias aislados cuando sea posible.

# Qué No Hacer

* No hardcodear entornos o dispositivos en el `pom.xml` sin necesidad.
* No duplicar versiones entre módulos.
* No agregar dependencias sin revisar `dependencyManagement`.
* No asumir Surefire cuando el proyecto usa Failsafe.
* No asumir JUnit cuando el proyecto usa TestNG u otra integración.
* No inventar properties propias sin implementación.
* No mezclar configuración específica de Appium dentro de módulos no relacionados.
* No introducir perfiles innecesarios.
* No depender de pasos manuales para reproducir el build.
* No commitear `target/`.
* No modificar comandos canónicos sin revisar CI/CD.

# Contexto Específico Del Proyecto

La siguiente información debe obtenerse del proyecto consumidor:

```text
- versión de Java;
- estructura Maven;
- módulos;
- parent POM;
- dependencyManagement;
- versiones de Appium/Cucumber;
- runner;
- Surefire/Failsafe;
- profiles;
- system properties;
- properties mobile (`mobile.platform`, `mobile.driver.url`, `android.app.path`, `ios.app.path`);
- reporting;
- CI/CD;
- comandos canónicos.
```

Esta skill define el estándar Maven esperado para automatización mobile Appium Java, preservando compatibilidad cuando un proyecto consumidor ya tenga convenciones distintas y explícitas.
