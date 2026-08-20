# QA Agent Skills

Repositorio central de skills para agentes de QA.

## Arquitectura

```text
.agents/
├── skills/
│   ├── general/
│   │   ├── design-patterns/
│   │   ├── best-practices/
│   │   └── gitflow/
│   │
│   ├── automation/
│   │   ├── cypress/
│   │   └── appium-java/
│   │
│   └── testing/
│       ├── frontend/
│       ├── backend/
│       └── mobile/
│
├── agents/
└── instructions/
```

## CLI

La CLI tiene solamente tres comandos, más la versión:

```bash
qa-skills list
qa-skills install <skill>
qa-skills update
qa-skills --version
```

### Listar

```bash
qa-skills list
```

Muestra todas las skills disponibles en el repositorio central.

### Instalar

```bash
qa-skills install cypress
```

También se pueden instalar varias:

```bash
qa-skills install cypress frontend gitflow
```

Las skills se copian al proyecto consumidor dentro de:

```text
.agents/skills/
```

Funciona en cualquier tipo de proyecto (Cypress/Node, Java, mobile, etc.),
ya que solo se copian carpetas Markdown. Por ejemplo, en un proyecto Cypress:

```bash
qa-skills install cypress frontend gitflow
```

En un proyecto Java:

```bash
qa-skills install appium-java backend gitflow
```

### Consumo por agentes

Las skills instaladas en `.agents/skills/` son detectadas automáticamente por
agentes de IA (opencode, Claude Code, etc.) cuando trabajan en ese proyecto.
Cada skill es una carpeta con su `SKILL.md`:

```text
.agents/skills/automation/cypress/SKILL.md
```

El agente carga la skill cuando la tarea coincide con su descripción, de modo
que las reglas de QA viajan con el proyecto y no dependen del contexto de cada
agente.

### Actualizar

```bash
qa-skills update
```

Actualiza solamente las skills que ya existen localmente.

Si el repositorio central tiene una skill nueva, `update` NO la instala.

## Prerrequisitos

- Node.js >= 18
- Git (la CLI clona el repositorio central en segundo plano)

La CLI se necesita únicamente en el momento de instalar. Los proyectos
consumidores no requieren Node en runtime: las skills son solo carpetas
Markdown dentro de `.agents/skills/`.

## Instalar la CLI

```bash
npm install -g git+https://github.com/qacoto/qa-agent-skills.git
```

Luego:

```bash
qa-skills list
```

Para ver la versión:

```bash
qa-skills --version
```

## Probar localmente

Desde este repositorio:

```bash
npm install -g .
```

Desde otro proyecto, apuntando a una ruta local del repositorio central:

**Windows**

```bash
qa-skills list --repo file:///C:/Users/<tu-usuario>/Desktop/qa-agent-skills
```

**Linux/macOS**

```bash
qa-skills list --repo file:///ruta/absoluta/qa-agent-skills
```

Instalar:

```bash
qa-skills install cypress --repo file:///C:/Users/<tu-usuario>/Desktop/qa-agent-skills
```

Actualizar:

```bash
qa-skills update --repo file:///C:/Users/<tu-usuario>/Desktop/qa-agent-skills
```

También se puede cambiar el repositorio por defecto con la variable de entorno
`QA_SKILLS_REPO_URL`.

## Comportamiento de update

Si el proyecto tiene:

```text
.agents/skills/
├── automation/cypress/
└── testing/frontend/
```

y el repositorio central agrega:

```text
testing/api/
```

al ejecutar:

```bash
qa-skills update
```

solo se actualizarán:

```text
automation/cypress/
testing/frontend/
```

`testing/api/` no será instalada.

## Agregar skills

Para agregar una skill nueva solo hay que crear:

```text
.agents/skills/<categoria>/<nombre>/SKILL.md
```

Hacer commit y push.

La CLI la detectará automáticamente.
