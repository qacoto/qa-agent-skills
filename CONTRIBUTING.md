# Contribución Interna

Guía para el equipo que mantiene este repositorio. No es documentación pública: asume que ya conoces las convenciones de QA del equipo y explica solo cómo funciona y cómo extender este repo.

## Estructura del repositorio

| Ruta | Contenido |
| :--- | :--- |
| `.agents/skills/<categoría>/<skill>/SKILL.md` | Conocimiento técnico reutilizable (Cypress, Mobile, Reporting, General...) |
| `.agents/agents/<rol>/AGENT.md` | Roles especializados que guían al agente de IA |
| `.agents/rules/<norma>.md` | Reglas transversales aplicables a todos los proyectos |
| `projects/<perfil>/project.yml` | Composición de agente + skills + reglas por tipo de proyecto |
| `bin/qa-skills.js` | CLI (`list`, `install`, `update`, `init`) |

Agregar una categoría nueva (ej. `playwright/`, `restassured/`) no requiere cambios en la CLI: basta crear la carpeta dentro de `.agents/skills/`.

---

## Cómo agregar una skill

1. Ubicación obligatoria: `.agents/skills/<categoría>/<nombre>/SKILL.md`.
2. Frontmatter requerido:
   - `name`: idéntico al nombre de la carpeta.
   - `description`: una línea clara que diga **qué** cubre y **cuándo** usarla; es lo que el agente lee para decidir si carga la skill.
3. Secciones mínimas del cuerpo: `Propósito`, `Reglas`, `Implementación` y la sección reservada `Contexto Específico del Proyecto`.

### Convenciones de contenido

- Español consistente en todo el repositorio.
- Aplicar siempre: separación Ejecución / Lógica / Datos (ELD), POM obligatorio para UI, reportería estándar por stack (Mochawesome para Cypress, Allure para Appium Java).
- Incluir ejemplos de código ejecutables y una sección de anti-patrones prohibidos cuando aplique.
- No incluir hechos específicos de un proyecto consumidor: eso vive en su propio `AGENTS.md`.

### Marcadores de contexto (no remover)

Toda skill termina con el bloque reservado que usa `qa-skills init`. Debe conservarse tal cual:

```markdown
## Contexto Específico del Proyecto

<!--
LLM_CONTEXT_START

Project-specific facts belong in the consuming project's AGENTS.md.

LLM_CONTEXT_END
-->
```

---

## Cómo agregar un agente o regla

**Agente**: `.agents/agents/<rol>/AGENT.md` con formato mínimo:

```markdown
# nombre-del-agente

## Role
Especialidad y responsabilidad en 1–2 líneas.

## Constraints

- Read project `AGENTS.md` before implementation.
- Prefer existing project conventions.
- Do not invent undocumented behavior.
```

**Regla**: `.agents/rules/<norma>.md`, listas cortas de reglas transversales sin detalles de framework.

---

## Perfiles (`projects/<tipo>/project.yml`)

El parser de YAML de la CLI es intencionalmente simple. Formato soportado:

```yaml
name: cypress-web
agent:
  - cypress-web-agent
skills:
  - general/best-practices
  - cypress/core
instructions:
  - general
```

Restricciones del parser:

- Solo claves de primer nivel (`name`, `agent`, `skills`, `rules`) y listas con dos espacios de sangría + `- item`.
- Sin claves anidadas, sin comentarios inline, sin tabs.
- La composición es explícita: cada perfil lista todos sus componentes aunque se repitan entre perfiles. No inventar mecanismos tipo `extends`.
- Todo componente referenciado debe existir en `.agents/`; una referencia rota falla recién en el proyecto consumidor.
- Si agregas un perfil nuevo, actualiza también la tabla de perfiles del `README.md`.

---

## Proceso de publicación

Ramas del repositorio:

- **`master`**: código estable. Es la rama **default** del repo y la única que la CLI clona e instala.
- **`develop`**: rama de integración de cambios.
- **Ramas de desarrollo**: atómicas, siempre desprendidas de `develop` (`feature/<tema>`, `fix/<tema>`, `chore/<tema>`).

Flujo obligatorio (siempre PR de la rama más baja a la más alta):

1. Crea una rama atómica desde `develop`.
2. Abre PR de tu rama hacia `develop` y consigue review.
3. Cuando `develop` integra un conjunto estable listo para consumirse: bump de versión en `package.json` (semver: patch = fix de contenido, minor = nueva skill/perfil, major = cambio incompatible) en su propia rama/PR, y luego PR de `develop` → `master`.
4. **Prohibido comitear directamente a `master`**; tampoco se pushea directo a `develop`. Nada llega a `master` sin pasar por `develop`.
5. Los consumidores reciben los cambios al mergear a `master`, vía `qa-skills update`; los proyectos nuevos con `qa-skills install <tipo>`.

---

## Verificación antes de mergear

Con la CLI ya instalada globalmente, prueba tus cambios contra un clon de tu rama:

```bash
# Clonar tu rama a una carpeta temporal
git clone -b <tu-rama> https://github.com/qacoto/qa-agent-skills.git "$env:TEMP\qa-skills-pr"

# Verificar que el perfil y las skills nuevas aparecen
qa-skills list --repo file:///RUTA/ABSOLUTA/temp/qa-skills-pr

# Instalar el perfil afectado en un proyecto de prueba
cd ruta/de/proyecto/de/prueba
qa-skills install cypress-web --repo file:///RUTA/ABSOLUTA/temp/qa-skills-pr
qa-skills init --repo file:///RUTA/ABSOLUTA/temp/qa-skills-pr
```

Checklist antes del merge:

- [ ] El frontmatter de toda skill nueva tiene `name` = carpeta y `description` accionable.
- [ ] Los marcadores `LLM_CONTEXT_START/END` están intactos.
- [ ] El perfil afectado parsea bien (aparece completo en `qa-skills list --repo ...`).
- [ ] Se probó `install` + `init` en un proyecto limpio y el `AGENTS.md` generado lista los componentes esperados.
- [ ] `package.json` con bump de versión (en el PR de liberación hacia `master`).
- [ ] La rama salió de `develop`, es atómica y el PR apunta a la rama correcta (`develop`, o `master` solo si es liberación).
