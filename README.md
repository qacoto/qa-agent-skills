# QA Agent Skills CLI

Herramienta y distribución centralizada de agentes, habilidades (_skills_), reglas y perfiles de proyectos de automatización de QA para equipos de ingeniería de calidad.

## Descripción General

`@qa-team/qa-agent-skills` proporciona una interfaz de línea de comandos (CLI) que permite empaquetar, instalar y actualizar estándares de automatización de pruebas y contextos para agentes de IA en cualquier proyecto consumidora.

> Guía interna para mantener y extender este repositorio: [CONTRIBUTING.md](CONTRIBUTING.md).

### Arquitectura del Proyecto

El ecosistema está compuesto por 4 pilares fundamentales:

1. **Agentes (`.agents/agents/`)**: Roles especializados (ej. especialista en Cypress Web, especialista en Appium Java) que guían el comportamiento del asistente de IA.
2. **Habilidades (`.agents/skills/`)**: Conocimiento técnico reutilizable y mejores prácticas de automatización (ej. Page Object Model obligatorio para UI, separación ELD, Cypress, Appium, Cucumber).
3. **Reglas (`.agents/rules/`)**: Normas transversales de codificación, estándares de pruebas y principios generales.
4. **Perfiles de Proyecto (`projects/`)**: Composiciones predefinidas que combinan agentes, habilidades y reglas según el tipo de proyecto de automatización.

---

## Requisitos Previos y Dependencias

Para consumir e instalar la CLI de `qa-skills`, el entorno debe contar con:

- **Node.js**: Versión 18.0.0 o superior.
- **Git**: Instalado y accesible en el `PATH` del sistema.
- **NPM**: Incluido nativamente con Node.js.

---

## Instalación Global

La herramienta se distribuye desde la rama estable (`master`) del repositorio Git centralizado. Para instalarla globalmente en tu equipo:

```bash
npm install -g git+https://github.com/qacoto/qa-agent-skills.git
```

---

## Uso y Comandos de la CLI

La CLI ofrece cuatro comandos principales para gestionar perfiles y actualizar el contexto de los agentes de QA en tus proyectos:

### 1. `qa-skills list`

Lista todos los perfiles de proyectos y habilidades disponibles en el repositorio central.

**Ejemplo de salida en consola:**

```text
Tipos de proyecto disponibles:

  cypress-api
  cypress-api-microservices
  cypress-web
  cypress-web-cucumber
  mobile-appium-java

Skills disponibles:

CYPRESS
  api-commands
  api-js
  core
  cucumber-js
  oracle-state
  response-validation
  web-js

GENERAL
  bdd
  best-practices
  data-driven-testing
  debugging
  design-patterns
  gitflow
  security-testing
  test-design

MOBILE
  allure-reporting
  appium-debugging
  appium-java
  cucumber-java
  flaky-test-analysis
  maven
  mobile-automation

REPORTING
  allure
  mochawesome
```

---

### 2. `qa-skills install <project-type>`

Instala los agentes, habilidades y reglas correspondientes al perfil seleccionado en la carpeta `.agents/` del proyecto actual y registra la configuración en `.agents/.qa-project.json`.

**Ejemplo de ejecución y salida:**

```bash
qa-skills install cypress-web
```

**Salida en consola:**

```text
Tipo de proyecto instalado: cypress-web
```

---

### 3. `qa-skills init`

Genera o actualiza el archivo `AGENTS.md` en la raíz del proyecto. `AGENTS.md` sirve como punto de entrada de contexto determinista para los agentes de IA, con secciones reservadas para especificar reglas y particularidades del proyecto consumidor.

**Ejemplo de ejecución y salida:**

```bash
qa-skills init
```

**Salida en consola:**

```text
Generated: AGENTS.md
```

**Estructura generada en `AGENTS.md`:**

```markdown
# AGENTS.md

> Generado automáticamente por `qa-skills init`. Actualiza este archivo con la información específica de tu proyecto.

---

## Contexto del Proyecto
- Nombre del proyecto
- Descripción
- Tipo de proyecto
- Entorno

## Stack Tecnológico
- Framework principal
- Lenguaje
- Gestor de dependencias
- Base de datos
- Servicios externos

## Estructura del Repositorio
- Árbol de directorios
- Arquitectura ELD

## Cómo Ejecutar el Proyecto
- Comandos de instalación
- Comandos de ejecución

## Cómo Ejecutar Tests
- Comandos de testing
- Modos de ejecución

## Configuración de Ambientes
- Variables de entorno
- Archivos de configuración

## Estrategia de Testing
- Tipos de pruebas
- Criterios de aceptación

## Frameworks Utilizados
- Lista de frameworks

## Convenciones del Proyecto
- Nomenclatura
- Convenciones de código

## Patrones Existentes
- Documentación de patrones

## Reglas Específicas de QA
- Reglas y estándares

## Datos de Prueba
- Tipos de datos
- Gestión de datos

## Dependencias Externas
- Servicios dependientes
- APIs Mock

## CI/CD
- Pipeline
- Comandos CI

## Reglas para el Agente
- Instrucciones para el agente de IA
...
```

---

### 4. `qa-skills update`

Actualiza únicamente los componentes ya instalados en el proyecto consumidor trayendo la última versión publicada en el repositorio central, respetando la configuración previa en `.agents/.qa-project.json`.

**Ejemplo de ejecución y salida:**

```bash
qa-skills update
```

**Salida en consola:**

```text
Actualizado: cypress-web
```

---

## Perfiles Disponibles

| Perfil                      | Tecnologías / Enfoque                                                   | Reporter    |
| :-------------------------- | :---------------------------------------------------------------------- | :---------- |
| `cypress-web`               | Cypress + JavaScript + Page Object Model (POM)                          | Mochawesome |
| `cypress-api`               | Cypress API + ELD + `testData` + comandos reutilizables                 | Mochawesome |
| `cypress-api-microservices` | Cypress API + ELD + comandos API + validación de responses + Oracle DB | Mochawesome |
| `cypress-web-cucumber`      | Cypress + Cucumber (BDD) + POM                                          | Mochawesome |
| `mobile-appium-java`        | Appium + Java + Maven + Cucumber + POM                                  | Allure      |
