---
name: flaky-test-analysis
description: "Análisis y estabilización de flaky tests en automatización mobile Appium Java, identificando causas de intermitencia en automatización, aplicación, datos, backend, ambiente y ejecución paralela."
---

# Flaky Test Analysis

## Propósito

Analizar escenarios de automatización mobile con Appium y Java que presentan resultados intermitentes, identificar la causa raíz y aplicar la estabilización mínima necesaria.

Esta skill complementa:

* debugging general;
* Appium debugging;
* Cucumber Java;
* reporting;
* configuración Maven y CI/CD.

No asumir rutas, aplicaciones, usuarios, plataformas CI, datos funcionales ni infraestructura específica del proyecto consumidor.

# Definición

Un flaky test es un test cuyo resultado puede cambiar entre ejecuciones equivalentes sin que exista un cambio relevante en el código o comportamiento esperado.

Puede manifestarse como un escenario que:

* pasa y falla entre ejecuciones;
* falla únicamente algunas veces;
* pasa aislado pero falla dentro de una suite;
* depende excesivamente del timing;
* depende de estado residual;
* depende de datos compartidos;
* depende de condiciones externas variables;
* se comporta diferente bajo paralelismo.

Regla crítica:

No declarar un test como flaky basándose únicamente en una ejecución fallida.

Una falla reproducible de forma consistente puede ser simplemente un defecto funcional, de automatización, datos o ambiente.

# Objetivo Del Análisis

El análisis debe responder:

```text
¿Es realmente flaky?
        ↓
¿Qué condición cambia entre ejecuciones?
        ↓
¿Cuál es la causa raíz?
        ↓
¿Cuál es el cambio mínimo para estabilizarlo?
```

No agregar sleeps, retries o timeouts mayores antes de responder esas preguntas.

# Clasificación De Causa

Clasificar el origen probable antes de modificar código.

## Automatización

Ejemplos:

* sincronización incorrecta;
* locator inestable;
* elemento dinámico;
* referencias stale;
* waits mal diseñados;
* estado compartido;
* driver compartido incorrectamente.

## Aplicación

Ejemplos:

* animación inconsistente;
* renderizado variable;
* comportamiento funcional intermitente;
* race condition;
* modal inesperado;
* estado UI incorrecto.

## Backend

Ejemplos:

* latencia variable;
* eventual consistency;
* servicios intermitentes;
* respuestas no determinísticas;
* disponibilidad temporal.

## Datos

Ejemplos:

* usuarios compartidos;
* datos modificados por otros escenarios;
* cleanup incompleto;
* estado residual;
* recursos reutilizados entre ejecuciones.

## Ambiente

Ejemplos:

* dispositivo lento;
* emulator/simulator saturado;
* red variable;
* Appium server inestable;
* falta de recursos;
* build incorrecta;
* permisos.

## Dependencia Entre Tests

Ejemplos:

```text
Scenario A modifica estado
        ↓
Scenario B asume estado anterior
```

o:

```text
Scenario A no limpia
        ↓
Scenario B falla según orden
```

# Causa Probable Vs Causa Raíz

Diferenciar siempre:

**Causa probable:** hipótesis respaldada por evidencia parcial.

**Causa raíz confirmada:** explicación validada mediante reproducción, comparación de ejecuciones o evidencia suficiente.

No presentar hipótesis como hechos.

# Estrategia De Reproducción

Cuando el costo de ejecución lo permita:

1. Ejecutar el escenario individualmente.
2. Repetirlo varias veces.
3. Ejecutarlo dentro de la suite relevante.
4. Comparar ejecuciones exitosas y fallidas.
5. Revisar qué escenarios se ejecutaron previamente si falla solo en suite.
6. Comparar plataformas cuando corresponda.
7. Comparar dispositivos o configuraciones.
8. Revisar datos y estado inicial.
9. Revisar condiciones externas.

El objetivo no es simplemente acumular ejecuciones, sino encontrar qué variable cambia.

# Evidencias

Revisar según corresponda:

* stacktrace;
* screenshots;
* reporte Allure u otro reporter;
* logs Appium;
* logs de aplicación;
* logs backend;
* page source;
* estado de la aplicación;
* capabilities;
* plataforma;
* dispositivo;
* versión de aplicación;
* entorno;
* datos de prueba;
* duración del escenario;
* orden de ejecución;
* ejecución paralela.

Las rutas concretas deben obtenerse del proyecto.

# Preguntas Iniciales

Antes de modificar código, responder cuando sea posible:

1. ¿El fallo es reproducible?
2. ¿Pasa y falla sin cambios?
3. ¿Falla solo en suite?
4. ¿Falla solo en ejecución paralela?
5. ¿Falla solo en una plataforma?
6. ¿Falla solo en un dispositivo o ambiente?
7. ¿Existe estado compartido?
8. ¿El escenario tiene cleanup?
9. ¿Otro test modifica sus datos?
10. ¿La evidencia muestra que el elemento realmente estaba disponible?
11. ¿El backend respondió de forma diferente?
12. ¿El timeout representa realmente el problema?

# Suite Vs Ejecución Individual

Si un escenario pasa individualmente pero falla dentro de una suite, priorizar la investigación de:

* estado compartido;
* cleanup incompleto;
* sesión persistida;
* orden;
* datos contaminados;
* variables estáticas;
* archivos compartidos;
* driver compartido;
* ejecución paralela;
* recursos backend reutilizados.

Este patrón suele indicar problemas de aislamiento más que problemas de locator.

No asumir automáticamente “Appium es inestable”.

# Paralelismo

Si el fallo aparece únicamente bajo ejecución paralela, revisar:

* driver aislado por ejecución;
* datos aislados;
* usuarios independientes;
* archivos temporales;
* puertos;
* directorios de resultados;
* estado backend compartido;
* recursos limitados del host.

No ejecutar simultáneamente pruebas destructivas sobre el mismo recurso salvo que el comportamiento esté diseñado para concurrencia.

# Datos Compartidos

Los datos mutables compartidos son una fuente frecuente de flakiness.

Ejemplos genéricos:

* una cuenta utilizada por varios escenarios;
* un registro actualizado por pruebas simultáneas;
* un recurso creado por un escenario y consumido por otro;
* un usuario cuyo estado persiste entre ejecuciones.

Preferir:

```text
Scenario
   ↓
datos propios
   ↓
cleanup propio
```

frente a:

```text
Suite
   ↓
mismo usuario/recurso para todos
```

Cuando no sea posible aislar completamente los datos, controlar explícitamente concurrencia y estado inicial.

# Sincronización

La sincronización debe estar basada en condiciones observables.

Preferir esperar:

* desaparición de loader;
* pantalla lista;
* elemento visible;
* elemento habilitado;
* estado backend disponible;
* transición completada.

Evitar esperas temporales arbitrarias.

No solucionar flakiness mediante:

```java
Thread.sleep(...)
```

# Timeouts

Aumentar un timeout únicamente cuando exista evidencia de que:

* la condición esperada es correcta;
* la operación puede tardar legítimamente más;
* el timeout actual es demasiado bajo.

Un timeout mayor no corrige:

* locator incorrecto;
* navegación fallida;
* backend roto;
* precondición incorrecta;
* elemento inexistente.

# Elementos Dinámicos

Cuando un elemento cambia después de refresh, navegación o re-render:

* volver a localizarlo;
* evitar conservar referencias antiguas;
* esperar estado estable;
* revisar listas dinámicas.

No capturar `StaleElementReferenceException` silenciosamente para continuar.

# Loaders, Animaciones Y Overlays

Ante fallos intermitentes de interacción, revisar:

* loaders;
* animaciones;
* modales;
* overlays;
* snackbars;
* teclado;
* transiciones.

Preferir esperar una condición real antes de interactuar.

No utilizar taps repetidos o coordenadas aleatorias como mecanismo de estabilización.

# Android

En Android, revisar especialmente:

* listas/recyclers;
* elementos fuera del viewport;
* teclado;
* permisos;
* animaciones;
* IDs duplicados;
* performance del emulator/device;
* recreación de Activities;
* cambios de jerarquía.

Aplicar estrategias específicas Android dentro de la capa mobile, no desde los tests.

# iOS

En iOS, revisar especialmente:

* accessibility identifiers;
* elementos envueltos por contenedores;
* keyboard;
* alerts;
* performance del simulator/device;
* jerarquías dinámicas;
* locators lentos;
* elementos no interactuables.

Cuando el control real carezca de un identificador estable, considerar solicitar al equipo de desarrollo un identificador de accesibilidad.

No convertir XPath complejo en la estrategia por defecto.

# Backend Y Eventual Consistency

Si el test depende de backend, diferenciar:

```text
UI lista
```

de:

```text
dato backend realmente disponible
```

Cuando exista eventual consistency, utilizar una espera o polling controlado sobre una condición válida si la arquitectura lo permite.

No usar retry ciego sobre el escenario completo para esconder retrasos de backend.

# Retries

Retry es una herramienta de último recurso, no una estrategia primaria de estabilidad.

No utilizar retry para ocultar:

* locator inestable;
* mala sincronización;
* dependencia entre tests;
* estado contaminado;
* bug funcional;
* cleanup incorrecto.

Puede justificarse ante condiciones externas realmente transitorias y demostradas.

En ese caso:

* limitar intentos;
* definir condición de salida;
* registrar el intento;
* conservar evidencia;
* documentar la razón.

# Priorización De Solución

Una vez confirmada la causa raíz, priorizar el cambio más cercano al origen.

Orden orientativo:

1. Corregir precondición o estado.
2. Aislar datos.
3. Eliminar dependencia entre tests.
4. Corregir locator.
5. Corregir sincronización.
6. Relocalizar elementos dinámicos.
7. Mejorar cleanup.
8. Ajustar timeout con evidencia.
9. Agregar retry solo ante condición externa demostrada.

No aplicar esta lista mecánicamente: la causa raíz determina la solución.

# No Debilitar La Prueba

No estabilizar un escenario mediante:

* eliminación de assertions;
* expected results más ambiguos;
* captura silenciosa de excepciones;
* continuar después de una precondición crítica fallida;
* `@ignore` permanente sin análisis;
* retry excesivo.

Una prueba estable pero incapaz de detectar el defecto esperado no es una mejora.

# CI/CD

Si el test falla únicamente en CI/CD, comparar con la ejecución local:

* recursos disponibles;
* dispositivo;
* versión de Appium;
* versión de driver;
* build;
* variables de entorno;
* ejecución paralela;
* timing;
* red;
* workspace;
* datos.

No asumir una plataforma CI concreta.

Los comandos y rutas deben obtenerse de la configuración del proyecto.

# Relación Con Otras Skills

Usar como apoyo:

```text
general/debugging
→ metodología general de causa raíz

mobile/appium-debugging
→ diagnóstico específico Appium

mobile/appium-java
→ arquitectura y prácticas de automatización

mobile/allure-reporting
→ evidencias/reporting

mobile/cucumber-java
→ implementación de steps y hooks
```

Esta skill debe concentrarse en **intermitencia y estabilización**, evitando duplicar documentación completa de esas otras áreas.

# Resultado Esperado

Un análisis de flaky test debe indicar:

* escenario afectado;
* plataforma/ambiente cuando sea relevante;
* patrón de intermitencia;
* evidencia revisada;
* causa probable;
* causa raíz confirmada si existe;
* factor que cambia entre ejecuciones;
* cambio mínimo propuesto;
* riesgo;
* validación realizada o recomendada.

Separar claramente hechos de hipótesis.

# Qué No Hacer

* No declarar flaky por una sola falla.
* No usar `Thread.sleep`.
* No aumentar timeouts sin evidencia.
* No agregar retries indiscriminadamente.
* No eliminar assertions.
* No cambiar expected results para hacer pasar el caso.
* No ignorar escenarios sin diagnóstico.
* No capturar excepciones silenciosamente.
* No depender del orden.
* No compartir datos mutables innecesariamente.
* No culpar automáticamente a Appium.
* No presentar hipótesis como hechos.

# Contexto Específico Del Proyecto

La siguiente información debe obtenerse del proyecto consumidor:

```text
- comandos de ejecución;
- suites;
- estrategia de paralelismo;
- datos de prueba;
- cleanup;
- dispositivos;
- plataformas;
- Appium server;
- drivers;
- rutas de logs;
- reporting;
- CI/CD;
- backend;
- timeouts;
- wrappers;
- estrategia de retries.
```

Esta skill define una metodología general para analizar y estabilizar flaky tests en proyectos mobile Appium Java sin depender de módulos, usuarios, datos, infraestructura o herramientas específicas de una aplicación.
