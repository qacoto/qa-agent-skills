---
name: allure-reporting
description: "Generación, publicación y diagnóstico de reportes Allure para proyectos de automatización mobile Appium Java, con gestión segura de evidencias y soporte para ejecución local, CI/CD y paralelismo."
---

# Allure Reporting

## Propósito

Configurar, generar, publicar, interpretar y diagnosticar reportes Allure en proyectos de automatización mobile con Appium y Java.

Esta skill se enfoca exclusivamente en reporting y evidencias de ejecución.

El contexto específico del proyecto debe obtenerse de:

* `AGENTS.md`;
* `pom.xml`;
* configuración Cucumber;
* configuración CI/CD;
* estructura existente del repositorio.

No asumir rutas, nombres de módulos, plataforma, pipeline o sistema externo de gestión de pruebas sin revisar primero el proyecto.

# Principios

Allure debe utilizarse como capa de reporting y diagnóstico de ejecuciones.

El flujo conceptual es:

```text
Ejecución
    ↓
Resultados Allure
    ↓
Generación del reporte
    ↓
Visualización / Publicación
```

Los resultados son la fuente utilizada para construir el reporte.

El reporte HTML generado debe considerarse un artefacto regenerable.

No modificar la lógica funcional de las pruebas únicamente para mejorar la presentación del reporte.

# Integración

Antes de modificar la integración Allure:

1. Revisar `pom.xml`.
2. Revisar versión de Cucumber JVM.
3. Revisar runner/configuración Cucumber.
4. Revisar hooks.
5. Revisar ubicación actual de resultados.
6. Revisar configuración CI/CD.
7. Revisar `AGENTS.md`.

Preservar la integración existente cuando sea válida.

No introducir una segunda estrategia de reporting sin necesidad.

# Cucumber JVM

Cuando el proyecto utilice Cucumber JVM, utilizar la integración Allure compatible con la versión instalada.

Por ejemplo, para Cucumber 7 puede utilizarse:

```text
io.qameta.allure:allure-cucumber7-jvm
```

y el adapter correspondiente:

```text
io.qameta.allure.cucumber7jvm.AllureCucumber7Jvm
```

No asumir una versión concreta sin revisar las dependencias del proyecto.

La configuración puede realizarse desde Maven, runner u otro mecanismo soportado por la arquitectura existente.

Evitar registrar el mismo adapter múltiples veces.

# Resultados

La ubicación de los resultados debe obtenerse de la configuración del proyecto.

Una ubicación habitual en proyectos Maven es:

```text
target/allure-results
```

pero no debe asumirse como universal.

En proyectos multi-módulo puede existir, por ejemplo:

```text
runner/target/allure-results
```

La ruta real debe determinarse inspeccionando el proyecto.

# Reporte Generado

Una ubicación habitual para el reporte generado es:

```text
target/allure-report
```

El reporte debe considerarse regenerable a partir de los resultados.

No versionar directorios generados como:

```text
target/
allure-results/
allure-report/
```

salvo requerimiento explícito del repositorio.

# Evidencias

Adjuntar evidencias que ayuden a diagnosticar fallos.

Ejemplos:

* screenshots;
* logs relevantes;
* stacktrace;
* plataforma;
* dispositivo cuando sea útil;
* ambiente;
* escenario;
* tags relevantes;
* datos necesarios para reproducir el problema;
* page source cuando aporte información diagnóstica.

Evitar evidencias redundantes que dificulten analizar el reporte.

# Seguridad De Evidencias

Nunca adjuntar intencionalmente:

* passwords;
* access tokens;
* refresh tokens;
* API keys;
* secretos;
* cookies de autenticación;
* credenciales;
* headers sensibles;
* información personal innecesaria.

Cuando los logs puedan contener información sensible, sanitizarlos antes de adjuntarlos.

No asumir que un reporte Allure es privado únicamente porque se genera dentro del pipeline.

# Screenshots

Capturar screenshots automáticamente cuando un escenario falle, siempre que exista una sesión válida de Appium.

Preferir captura centralizada mediante hooks o componentes de reporting.

Ejemplo conceptual:

```java
@After
public void afterScenario(Scenario scenario) {
    if (scenario.isFailed()) {
        evidenceManager.attachScreenshot();
    }
}
```

Evitar repetir lógica de screenshots en cada Step Definition.

No intentar capturar screenshot si el driver no existe o la sesión ya finalizó.

El orden de los hooks debe garantizar que la evidencia se capture antes de cerrar el driver.

# Logs

Adjuntar logs cuando aporten información para determinar la causa del fallo.

Priorizar:

* error principal;
* excepción;
* stacktrace relevante;
* información del escenario;
* estado de plataforma/dispositivo cuando sea necesario.

Evitar adjuntar logs masivos sin filtrado cuando no aporten valor diagnóstico.

# Pasos Allure

Los pasos reportados deben ser descriptivos y representar acciones relevantes.

Cuando el proyecto utilice:

```java
Allure.step(...)
```

o:

```java
@Step
```

utilizarlos para mejorar la comprensión del reporte, no para duplicar cada operación interna.

Evitar reportes excesivamente verbosos con pasos técnicos como:

```text
findElement
click
sendKeys
wait
```

cuando no aporten información funcional.

# Metadata

Cuando sea útil, incluir metadata de ejecución como:

* plataforma;
* ambiente;
* versión de aplicación;
* dispositivo;
* versión del sistema operativo;
* suite;
* build;
* branch;
* información relevante de CI.

No hardcodear estos valores.

Obtenerlos de la configuración o contexto de ejecución.

# Limpieza De Resultados

Evitar mezclar resultados pertenecientes a ejecuciones independientes.

Antes de iniciar una ejecución limpia, eliminar o aislar resultados anteriores según la estrategia del proyecto.

Ejemplo habitual:

```bash
rm -rf target/allure-results
rm -rf target/allure-report
```

En proyectos multi-módulo, utilizar las rutas reales correspondientes.

No ejecutar comandos destructivos sobre rutas sin verificar primero su ubicación.

En CI/CD, preferir workspaces limpios o directorios de resultados aislados por ejecución.

# Generación Local

Cuando Allure Commandline esté disponible, pueden utilizarse comandos como:

```bash
allure generate target/allure-results -o target/allure-report --clean
```

Para visualizar un reporte generado:

```bash
allure open target/allure-report
```

También puede utilizarse:

```bash
allure serve target/allure-results
```

Las rutas deben adaptarse a la estructura real del proyecto.

Si el proyecto utiliza el plugin Maven de Allure, respetar los comandos definidos por dicha configuración.

# CI/CD

La integración CI/CD debe consumir los resultados generados por la ejecución.

Modelo general:

```text
Test execution
      ↓
allure-results
      ↓
CI/CD reporting integration
      ↓
Allure report
```

No asumir Jenkins, GitHub Actions, GitLab CI, Bitbucket Pipelines u otra plataforma específica.

Antes de modificar un pipeline:

1. Revisar cómo se ejecutan los tests.
2. Identificar dónde se generan los resultados.
3. Identificar qué ruta consume el reporter.
4. Confirmar que existen resultados antes de publicar.
5. Preservar evidencias incluso cuando la suite falle cuando la plataforma CI lo permita.

Utilizar paths relativos al workspace cuando sea posible.

# Artefactos CI/CD

Cuando el pipeline publique artefactos, preservar los resultados necesarios para diagnóstico.

Dependiendo de la arquitectura pueden publicarse:

```text
allure-results
allure-report
screenshots
logs
```

La fuente primaria para regenerar Allure son los resultados.

No asumir que el reporte HTML generado sustituye los resultados originales.

# Paralelismo

Las ejecuciones concurrentes deben evitar colisiones entre resultados.

Cuando Android, iOS u otros dispositivos se ejecuten simultáneamente, utilizar aislamiento adecuado.

Ejemplos:

```text
allure-results/android
allure-results/ios
```

o:

```text
allure-results-android
allure-results-ios
```

La estrategia concreta debe definirse según el pipeline.

Posteriormente los resultados pueden mantenerse separados o combinarse de forma controlada si representan una misma ejecución lógica.

No permitir que procesos concurrentes limpien o sobrescriban el directorio utilizado por otra ejecución.

# Historial

Si el proyecto utiliza funcionalidades históricas de Allure, preservar los archivos requeridos según la estrategia de publicación.

No confundir:

```text
resultados viejos mezclados accidentalmente
```

con:

```text
historial Allure gestionado intencionalmente
```

La limpieza de resultados no debe destruir mecanismos de historial configurados deliberadamente por CI/CD.

# Diagnóstico

## Allure muestra 0 tests

Validar:

* existencia del directorio de resultados;
* existencia de archivos de resultados;
* adapter configurado;
* versión compatible;
* ejecución real del runner;
* path utilizado para generar/publicar el reporte;
* configuración Maven/Cucumber.

## Aparecen resultados de ejecuciones anteriores

Validar:

* limpieza de resultados;
* reutilización del workspace;
* rutas compartidas;
* ejecución paralela;
* configuración de generación del reporte.

## Faltan screenshots

Validar:

* hook de fallo;
* estado del driver;
* orden de hooks;
* captura antes de `quit`;
* creación correcta del attachment.

## El reporte no abre correctamente

No asumir que abrir directamente:

```text
index.html
```

mediante `file://` funcionará en todos los casos.

Preferir:

```bash
allure open
```

o servir el reporte mediante un servidor compatible.

## CI/CD no publica resultados

Validar:

* ejecución de tests;
* generación efectiva de `allure-results`;
* path configurado;
* permisos;
* configuración del reporter;
* ejecución de los pasos de publicación incluso ante fallos de tests cuando corresponda.

# Relación Con Otras Herramientas

Allure es una herramienta de reporting.

Puede convivir con herramientas externas de:

* gestión de pruebas;
* trazabilidad;
* gestión de incidencias;
* observabilidad;
* CI/CD.

No asumir una herramienta específica.

No modificar Allure para solucionar un problema perteneciente a otra integración sin identificar primero la causa.

# Qué No Hacer

* No hardcodear paths específicos de una máquina.
* No asumir una plataforma CI/CD concreta.
* No mezclar resultados de ejecuciones independientes.
* No publicar resultados antiguos accidentalmente.
* No adjuntar secretos.
* No capturar screenshots después de cerrar el driver.
* No duplicar attachments innecesariamente.
* No modificar el comportamiento funcional para mejorar el reporte.
* No asumir versiones de Allure/Cucumber.
* No registrar adapters duplicados.
* No borrar resultados de otra ejecución paralela.
* No modificar pipelines sin revisar primero la configuración existente.

# Contexto Específico Del Proyecto

La siguiente información debe obtenerse del proyecto consumidor:

```text
- versión de Allure;
- versión de Cucumber;
- adapter utilizado;
- ubicación de allure-results;
- ubicación de allure-report;
- módulos Maven;
- hooks;
- EvidenceManager o equivalente;
- estrategia de screenshots;
- logs;
- metadata;
- CI/CD;
- estrategia de paralelismo;
- estrategia de historial.
```

Esta skill define el estándar de reporting Allure para proyectos Appium Java sin depender de nombres, rutas, plataformas o infraestructura específica de un proyecto concreto.
