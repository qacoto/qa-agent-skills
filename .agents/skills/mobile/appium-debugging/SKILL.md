---
name: appium-debugging
description: "Diagnóstico sistemático de fallos en automatización mobile Appium Java, diferenciando problemas de automatización, aplicación, backend, datos y ambiente antes de modificar código."
---

# Appium Debugging

## Propósito

Diagnosticar y resolver fallos específicos de automatización mobile con Appium y Java identificando la causa raíz antes de modificar el framework o los tests.

Esta skill complementa `general/debugging` y las skills de Appium Java, Cucumber Java, Maven y reporting del perfil mobile.

El proceso general de diagnóstico, clasificación de fallos, manejo de hipótesis y validación pertenece a `general/debugging`. Esta skill agrega criterios específicos de Appium/mobile.

El contexto específico del proyecto debe obtenerse de:

* `AGENTS.md`;
* configuración Appium;
* Screen/Page Objects;
* DriverManager;
* logs;
* reporting;
* CI/CD;
* código existente.

No asumir:

* rutas de reportes;
* nombres de módulos;
* nombres de logs;
* dispositivos concretos;
* apps concretas;
* estructura Maven concreta;
* locators específicos;
* comportamiento funcional de un producto determinado.

# Principio Principal

No modificar código de automatización hasta determinar si el fallo pertenece realmente a la automatización.

Un test fallido no implica automáticamente un error en el test.

Antes de corregirlo, determinar qué capa está fallando.

# Clasificación Inicial

Clasificar el fallo en una de estas categorías.

## Automatización

Ejemplos:

* locator incorrecto;
* wait insuficiente o mal diseñado;
* stale element;
* contexto incorrecto;
* error en Screen/Page Object;
* mala sincronización;
* estado compartido incorrectamente;
* driver mal gestionado.

## Aplicación

Ejemplos:

* comportamiento funcional incorrecto;
* pantalla inesperada;
* botón que no responde;
* validación faltante;
* elemento que debería existir pero no aparece;
* estado visual incorrecto.

## Backend

Ejemplos:

* respuesta lenta;
* servicio caído;
* error HTTP;
* datos no generados;
* inconsistencia entre servicios.

## Datos

Ejemplos:

* usuario en estado incorrecto;
* datos compartidos entre escenarios;
* dato vencido;
* estado residual de una ejecución previa;
* fixture incorrecto;
* datos no disponibles.

## Ambiente

Ejemplos:

* Appium no disponible;
* driver Appium incorrecto;
* emulator/simulator apagado;
* dispositivo desconectado;
* puerto ocupado;
* permisos faltantes;
* aplicación incorrecta instalada;
* red;
* certificados;
* build incorrecta.

# Flujo De Diagnóstico

Seguir preferentemente este orden:

```text
Fallo
  ↓
Clasificar
  ↓
Revisar evidencia
  ↓
Reproducir
  ↓
Confirmar causa
  ↓
Proponer cambio mínimo
  ↓
Validar
```

No empezar modificando locators o waits por intuición.

# Evidencia Mínima

Revisar según corresponda:

* stacktrace real;
* screenshot de fallo;
* logs de ejecución;
* logs Appium;
* reporte Allure u otro reporter;
* page source;
* estado real de la aplicación;
* Screen/Page Object implicado;
* capabilities activas;
* contexto Appium actual;
* plataforma;
* dispositivo;
* versión de aplicación;
* entorno;
* comando ejecutado.

Las rutas concretas deben obtenerse del proyecto.

# Reproducción

Antes de modificar código, intentar reproducir el fallo cuando sea razonable.

Determinar si el fallo:

* ocurre siempre;
* ocurre solo en una plataforma;
* ocurre solo en un dispositivo;
* ocurre únicamente en suite;
* pasa de forma aislada;
* depende de datos;
* depende del orden;
* es intermitente.

Esta información ayuda a distinguir errores funcionales de problemas de aislamiento o sincronización.

# NoSuchElementException

Posibles causas:

* locator incorrecto;
* elemento aún no renderizado;
* pantalla incorrecta;
* loader activo;
* contexto incorrecto;
* elemento fuera del viewport;
* componente diferente entre plataformas;
* locator desactualizado.

Validar:

* screenshot;
* page source;
* Appium Inspector;
* Screen Object;
* contexto actual;
* estado funcional;
* estrategia de espera.

No reemplazar inmediatamente un locator estable por XPath.

# TimeoutException

Un timeout indica que una condición esperada no se cumplió dentro del tiempo definido.

No asumir automáticamente que necesita un timeout mayor.

Posibles causas:

* elemento nunca aparece;
* condición incorrecta;
* backend lento;
* loader bloqueando;
* navegación fallida;
* precondición incompleta;
* pantalla inesperada;
* app congelada;
* locator incorrecto.

Validar primero qué condición se estaba esperando.

Aumentar el timeout únicamente si existe evidencia de que la condición es correcta y el tiempo actual es insuficiente por una razón válida.

# StaleElementReferenceException

Posibles causas:

* reconstrucción de pantalla;
* refresh;
* lista dinámica;
* navegación;
* cambio de DOM/árbol nativo;
* elemento almacenado antes de una actualización.

Preferir:

* volver a localizar el elemento;
* esperar estado estable;
* evitar conservar referencias innecesariamente;
* encapsular reintentos de localización cuando la arquitectura lo justifique.

No agregar retries indiscriminados.

# ElementNotInteractableException

Posibles causas:

* elemento no visible;
* elemento disabled;
* teclado abierto;
* overlay;
* modal;
* animación;
* elemento fuera del viewport;
* locator apunta al contenedor y no al control interactivo real.

Validar:

* `displayed`;
* `enabled`;
* bounds;
* jerarquía;
* teclado;
* overlays;
* elemento real que recibe interacción.

# ElementClickIntercepted / Tap Bloqueado

Posibles causas:

* modal;
* snackbar;
* loader;
* overlay;
* animación;
* elemento parcialmente cubierto;
* transición incompleta.

Validar la causa visual antes de usar taps por coordenadas.

Las coordenadas deben ser fallback, no primera solución.

# Contextos Appium

Cuando la aplicación utilice contenido híbrido, validar el contexto actual.

Ejemplos:

```text
NATIVE_APP
WEBVIEW_...
```

Un locator puede ser correcto y aun así fallar si el driver está en el contexto equivocado.

Antes de cambiar el locator, revisar:

* context handles disponibles;
* contexto actual;
* momento de cambio entre native/webview.

# Android E iOS

Ante un fallo exclusivo de una plataforma, comparar:

* jerarquía;
* locator;
* comportamiento visual;
* permisos;
* teclado;
* animaciones;
* componentes nativos;
* tiempos de renderizado;
* capabilities específicas.

No forzar que Android e iOS utilicen exactamente la misma implementación cuando la UI nativa requiere estrategias diferentes.

La diferencia debe quedar encapsulada en la capa mobile.

# Appium Inspector

Utilizar Appium Inspector como herramienta de diagnóstico para:

* revisar jerarquía;
* validar accessibility identifiers;
* analizar atributos;
* comprobar bounds;
* revisar elementos dinámicos;
* comparar Android/iOS.

No asumir que el locator generado automáticamente por Inspector es la mejor opción.

Priorizar estabilidad y mantenibilidad.

# Locators

Antes de cambiar un locator:

1. Revisar el locator actual.
2. Confirmar que el elemento realmente existe.
3. Revisar atributos disponibles.
4. Comparar entre ejecuciones.
5. Revisar si existe identificador estable.
6. Evaluar impacto del cambio.

Priorizar, cuando estén disponibles:

* accessibility identifiers;
* IDs estables;
* locators nativos mantenibles.

Evitar XPath absoluto.

# Teclado

Cuando el teclado interfiera con una interacción:

* validar primero que efectivamente esté visible;
* utilizar la abstracción de teclado definida por el framework;
* hacer tap fuera del teclado cuando sea apropiado;
* utilizar métodos compatibles con la plataforma.

No agregar `Thread.sleep` para esperar que el teclado desaparezca.

No distribuir lógica de teclado repetida entre tests.

# Waits

Utilizar esperas explícitas y condiciones funcionales.

Preferir:

```text
visible
clickable
present
invisible
pantalla lista
loader desaparecido
estado funcional alcanzado
```

Evitar:

```java
Thread.sleep(...)
```

Nunca solucionar sincronización agregando sleeps arbitrarios.

Si el framework tiene una capa central de waits, reutilizarla.

# Retries

Los retries no deben utilizarse para ocultar problemas estructurales.

No usar retry para:

* locator inestable;
* mala sincronización;
* bug funcional;
* datos contaminados;
* dependencia entre escenarios.

Puede utilizarse retry ante una condición externa transitoria demostrada, siempre que:

* exista evidencia;
* el número de intentos sea limitado;
* exista condición de salida;
* el motivo quede documentado;
* el retry no esconda una falla real.

# Fallos Solo En Suite

Si un escenario pasa aislado pero falla dentro de una suite, investigar especialmente:

* estado compartido;
* driver compartido;
* datos contaminados;
* cleanup incompleto;
* orden de ejecución;
* variables estáticas;
* archivos temporales;
* sesión previa;
* paralelismo.

No asumir que el problema es simplemente “flakiness”.

# Fallos Intermitentes

Para fallos intermitentes, buscar patrones:

* plataforma;
* dispositivo;
* hora;
* carga;
* endpoint;
* pantalla;
* locator;
* animación;
* ejecución paralela;
* uso de datos compartidos.

Comparar ejecuciones exitosas y fallidas.

No realizar cambios basados únicamente en una ejecución aislada si la causa no está clara.

# Driver Y Sesión

Ante errores de sesión, revisar:

* existencia del driver;
* estado de la sesión;
* creación correcta;
* cierre prematuro;
* puertos;
* capabilities;
* Appium server;
* drivers instalados;
* dispositivo conectado.

Ejemplos de síntomas:

* invalid session id;
* session not created;
* connection refused;
* device not found.

No modificar Screen Objects para solucionar un problema de infraestructura.

# Ambiente

Antes de atribuir un fallo al código, validar:

* Appium server activo;
* versión Appium compatible;
* driver Android/iOS instalado;
* dispositivo disponible;
* aplicación instalada;
* build correcta;
* variables de entorno;
* puertos;
* permisos;
* conectividad.

El comando concreto depende del entorno y debe obtenerse de la documentación del proyecto.

# Evidencias Y Reporting

Cuando exista integración Allure u otro reporter, utilizarla para reconstruir qué ocurrió.

Revisar:

* último paso ejecutado;
* screenshot;
* stacktrace;
* attachments;
* duración;
* metadata;
* plataforma;
* logs asociados.

No modificar reporting para ocultar un problema funcional o de automatización.

# Cambio Mínimo

Una vez confirmada la causa raíz, proponer el cambio mínimo necesario.

Ejemplos:

```text
Locator incorrecto
→ corregir locator

Wait incorrecto
→ corregir condición de espera

Elemento dinámico
→ relocalizar después del refresh

Bug funcional
→ reportar bug, no modificar expected result

Dato contaminado
→ corregir setup/cleanup

Ambiente incorrecto
→ corregir configuración
```

Evitar refactors grandes durante una investigación de fallo salvo que sean necesarios para resolver la causa raíz.

# Validación

Después del cambio:

1. Ejecutar el escenario afectado.
2. Validar el resultado.
3. Ejecutar escenarios relacionados cuando corresponda.
4. Validar en la plataforma afectada.
5. Revisar que no se hayan introducido regresiones.

Usar el comando canónico definido por `AGENTS.md` o la skill Maven.

# Resultado Esperado Del Diagnóstico

Al finalizar un análisis, comunicar:

* síntoma;
* clasificación;
* causa probable;
* causa raíz confirmada si existe;
* evidencia utilizada;
* cambio propuesto;
* archivos afectados;
* riesgo;
* validación realizada o comando recomendado.

Separar claramente hechos confirmados de hipótesis.

# Qué No Hacer

* No usar `Thread.sleep`.
* No modificar automatización antes de revisar la causa.
* No reemplazar IDs estables por XPath sin justificación.
* No usar XPath absoluto.
* No agregar retries para hacer pasar un test.
* No aumentar timeouts arbitrariamente.
* No cambiar assertions para ocultar un bug.
* No presentar hipótesis como hechos.
* No duplicar helpers existentes.
* No introducir lógica específica Android/iOS en los Step Definitions.
* No utilizar coordenadas como primera estrategia.
* No corregir un problema de infraestructura desde un Screen Object.
* No depender del orden de ejecución para solucionar un fallo.

# Contexto Específico Del Proyecto

La siguiente información debe obtenerse del proyecto consumidor:

```text
- rutas de logs;
- rutas de reportes;
- estructura Maven;
- comandos de ejecución;
- versión Appium;
- drivers instalados;
- DriverManager;
- Screen/Page Objects;
- wrappers;
- estrategia de waits;
- locators;
- dispositivos;
- capabilities;
- reporting;
- CI/CD;
- estrategia de datos;
- paralelismo.
```

Esta skill define un proceso general de diagnóstico para proyectos Appium Java sin depender de comportamiento, rutas, datos o componentes específicos de una aplicación concreta.
