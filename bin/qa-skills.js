#!/usr/bin/env node
const fs=require("fs"), os=require("os"), path=require("path");
const {execFileSync}=require("child_process");
const ROOT=process.cwd();
const DEFAULT_REPO=process.env.QA_SKILLS_REPO_URL||"https://github.com/qacoto/qa-agent-skills.git";
const META=path.join(ROOT,".agents",".qa-project.json");

function fail(m){console.error(`\nError: ${m}\n`);process.exit(1)}
function git(args){try{return execFileSync("git",args,{cwd:ROOT,encoding:"utf8",stdio:["ignore","pipe","pipe"]}).trim()}catch(e){fail(String(e.stderr||e.message).trim())}}
function repoArg(a){let i=a.indexOf("--repo");return i>=0&&a[i+1]?a[i+1]:DEFAULT_REPO}
function clone(repo){let t=fs.mkdtempSync(path.join(os.tmpdir(),"qa-skills-"));git(["clone","--depth","1",repo,t]);return t}
function yaml(f){let r={},cur=null;for(const raw of fs.readFileSync(f,"utf8").split(/\r?\n/)){let l=raw.trimEnd();if(!l.trim()||l.trim().startsWith("#"))continue;let s=l.match(/^([A-Za-z0-9_-]+):\s*(.*)$/),x=l.match(/^\s{2}-\s+(.+)$/);if(s){r[s[1]]=s[2]?s[2].replace(/^['"]|['"]$/g,""):[];cur=s[2]?null:s[1]}else if(x&&cur)r[cur].push(x[1].replace(/^['"]|['"]$/g,""))}return r}
function profiles(repo){let d=path.join(repo,"projects");return fs.existsSync(d)?fs.readdirSync(d,{withFileTypes:true}).filter(x=>x.isDirectory()).map(x=>{let f=path.join(d,x.name,"project.yml");return fs.existsSync(f)?{id:x.name,config:yaml(f)}:null}).filter(Boolean):[]}
function skills(repo){let d=path.join(repo,".agents","skills"),out=[];if(!fs.existsSync(d))fail("El repositorio no tiene .agents/skills");for(const c of fs.readdirSync(d,{withFileTypes:true}).filter(x=>x.isDirectory()))for(const s of fs.readdirSync(path.join(d,c.name),{withFileTypes:true}).filter(x=>x.isDirectory()))if(fs.existsSync(path.join(d,c.name,s.name,"SKILL.md")))out.push({id:s.name,category:c.name,rel:path.join("skills",c.name,s.name)});return out.sort((a,b)=>(a.category+"/"+a.id).localeCompare(b.category+"/"+b.id))}
function copy(repo,rel){let src=path.join(repo,".agents",rel),dst=path.join(ROOT,".agents",rel);if(!fs.existsSync(src))fail(`Componente no encontrado: .agents/${rel}`);fs.rmSync(dst,{recursive:true,force:true});fs.mkdirSync(path.dirname(dst),{recursive:true});fs.cpSync(src,dst,{recursive:true})}
function list(a){let r=clone(repoArg(a));try{console.log("\nTipos de proyecto disponibles:\n");profiles(r).forEach(x=>console.log("  "+x.id));console.log("\nSkills disponibles:");let c;for(const s of skills(r)){if(s.category!==c){c=s.category;console.log("\n"+c.toUpperCase())}console.log("  "+s.id)}console.log()}finally{fs.rmSync(r,{recursive:true,force:true})}}
function install(a){let id=a.find(x=>!x.startsWith("--"));if(!id)fail("Uso: qa-skills install <tipo-proyecto>");let r=clone(repoArg(a));try{let p=profiles(r).find(x=>x.id===id);if(!p)fail(`Tipo de proyecto no encontrado: ${id}`);for(const x of p.config.agent||[])copy(r,path.join("agents",x));for(const x of p.config.skills||[])copy(r,path.join("skills",x));for(const x of p.config.rules||[])copy(r,path.join("rules",x));fs.mkdirSync(path.dirname(META),{recursive:true});fs.writeFileSync(META,JSON.stringify({projectType:id,agent:p.config.agent||[],skills:p.config.skills||[],rules:p.config.rules||[]},null,2)+"\n");console.log(`Tipo de proyecto instalado: ${id}`)}finally{fs.rmSync(r,{recursive:true,force:true})}}
function update(a){if(!fs.existsSync(META))fail("No hay instalación ejecuta qa-skills install <tipo-proyecto> primero.");let m=JSON.parse(fs.readFileSync(META)),r=clone(repoArg(a));try{for(const x of [...(m.agent||[]),...(m.skills||[]),...(m.rules||[])]){let top=x.includes("/")?x.split("/")[0]:"agents";copy(r,path.join(top,x));}console.log(`Actualizado: ${m.projectType}`)}finally{fs.rmSync(r,{recursive:true,force:true})}}
function detect(){let p=fs.existsSync("package.json")?JSON.parse(fs.readFileSync("package.json")):{};let d={...(p.dependencies||{}),...(p.devDependencies||{})};let c=!!d.cypress||fs.existsSync("cypress.config.js")||fs.existsSync("cypress.config.ts"),g=!!d["@badeball/cypress-cucumber-preprocessor"]||!!d["cypress-cucumber-preprocessor"],m=fs.existsSync("pom.xml");if(m)return"mobile-appium-java";if(c&&g)return"cypress-web-cucumber";if(c)return"cypress-web";return"unknown"}
function init(a){let r=clone(repoArg(a));try{let type=fs.existsSync(META)?JSON.parse(fs.readFileSync(META)).projectType:detect(),p=profiles(r).find(x=>x.id===type),tree=fs.readdirSync(ROOT).filter(x=>![".git","node_modules"].includes(x)).sort().map(x=>"  "+x).join("\n");let framework=type.startsWith("cypress")?"Cypress":type==="mobile-appium-java"?"Appium + Java + Maven + Cucumber":"Desconocido";let md=`# AGENTS.md

> Generado automáticamente por \`qa-skills init\`. Actualiza este archivo con la información específica de tu proyecto.

---

## Contexto del Proyecto

- **Nombre**: [Nombre del proyecto]
- **Descripción**: [Breve descripción del propósito del proyecto]
- **Tipo de proyecto**: ${type}
- **Entorno**: [Producción / Staging / Desarrollo]

---

## Stack Tecnológico

- **Framework principal**: ${framework}
- **Lenguaje**: ${type==="mobile-appium-java"?"Java":"JavaScript"}
- **Gestor de dependencias**: ${type==="mobile-appium-java"?"Maven":"npm"}
- **Base de datos**: [PostgreSQL / MongoDB / MySQL / No aplica]
- **Servicios externos**: [APIs, microservicios, etc.]

---

## Estructura del Repositorio

\`\`\`text
${tree}
\`\`\`

### Arquitectura ELD (Ejecución / Lógica / Datos)

- **Capa de Ejecución**: specs, features y step definitions. Contienen escenarios, orquestación y aserciones.
- **Capa de Lógica**: Page Objects, Screen Objects, clientes API y servicios. Reutilizan acciones técnicas y de negocio.
- **Capa de Datos**: fixtures, builders, factories y generación dinámica de datos de prueba.

---

## Cómo Ejecutar el Proyecto

\`\`\`bash
# Instalar dependencias
${type==="mobile-appium-java"?"mvn clean install":"npm install"}

# Ejecutar la aplicación (si aplica)
${type==="mobile-appium-java"?"mvn spring-boot:run":"npm run dev"}
\`\`\`

---

## Cómo Ejecutar Tests

\`\`\`bash
# Ejecutar todos los tests
${type==="mobile-appium-java"?"mvn test":type==="cypress-web-cucumber"?"npx cypress run":"npx cypress run"}

# Ejecutar suite específica
${type==="mobile-appium-java"?"mvn test -Dtest=NombreTest":type.startsWith("cypress")?"npx cypress run --spec cypress/e2e/ruta/archivo.cy.js":"npm test"}

# Ejecutar en modo headed (visual)
${type==="mobile-appium-java"?"mvn test -Dheaded=true":"npx cypress open"}

# Ver reporte generado
${type==="mobile-appium-java"?"allure serve target/allure-results":"npx mochawesome-report-cli cypress/reports/*.json"}
\`\`\`

---

## Configuración de Ambientes

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| \`API_URL\` | URL base de la API | \`http://localhost:3000\` |
| \`DB_HOST\` | Host de base de datos | \`localhost\` |
| \`TEST_USER\` | Usuario de prueba | \`test@example.com\` |
| \`TEST_PASS\` | Contraseña de prueba | \`[CONFIGURAR]\` |

**Archivo de configuración**: \`.env\` (no commitear credenciales reales)

---

## Estrategia de Testing

### Tipos de Pruebas

| Tipo | Cobertura | Herramienta |
|------|-----------|-------------|
| Unitarias | Funciones aisladas | Jest / JUnit |
| Integración | Flujos completos | Cypress / Appium |
| E2E | Usuario final | Cypress / Appium |
| API | Endpoints | cy.api() / RestAssured |

### Criterios de Aceptación

- [ ] Tests unitarios con cobertura mínima del 80%
- [ ] Tests E2E para flujos críticos del negocio
- [ ] Validación de inputs y casos negativos
- [ ] Verificación de seguridad básica

---

## Frameworks Utilizados

${type.startsWith("cypress")?`- **Cypress**: framework de testing E2E para web
- **Mochawesome**: generación de reportes HTML
- **@badeball/cypress-cucumber-preprocessor**: integración Cucumber (si aplica)`:`- **Appium**: automatización mobile multiplataforma
- **TestNG**: framework de testing Java
- **Maven**: gestión de dependencias y build
- **Allure Report**: generación de reportes con evidencias`}

---

## Convenciones del Proyecto

### Nomenclatura

- **Archivos de test**: \`[nombre].cy.js\` (Cypress) o \`[Nombre]Test.java\` (Java)
- **Page Objects**: \`[Nombre]Page.js\` / \`[Nombre]Page.java\`
- **Fixtures**: \`[nombre].json\` en carpeta \`fixtures/\`

### Código

- Separación estricta ELD (Ejecución / Lógica / Datos)
- POM (Page Object Model) obligatorio para UI
- Aserciones sobre resultados, no sobre pasos intermedios
- Sin \`sleep\` fijos: usar esperas explícitas

---

## Patrones Existentes

<!-- Documenta los patrones de diseño ya implementados en tu proyecto -->

- **Page Object Model**: [Descripción de cómo se aplica]
- **Builder Pattern**: [Si se usa para construir datos de prueba]
- **Factory Pattern**: [Si se usa para crear objetos de prueba]
- **Custom Commands**: [Comandos personalizados en Cypress]

---

## Reglas Específicas de QA

1. **Determinismo**: cada prueba produce el mismo resultado ante el mismo estado.
2. **Independencia**: cada prueba prepara y limpia su propio estado.
3. **Aserciones de resultado**: verificar comportamiento observable, no implementación.
4. **Datos de prueba**: en fixtures/builders, nunca hardcodeados en specs.
5. **Reportería**: evidencias obligatorias en fallo (screenshots, videos, logs).

---

## Datos dePrueba

### Tipos de Datos

| Tipo | Ubicación | Ejemplo |
|------|-----------|---------|
| Fixtures estáticos | \`cypress/fixtures/\` | \`users.json\`, \`products.json\` |
| Generación dinámica | \`support/\` | \`generateUser()\`, \`createProduct()\` |
| Builders | \`builders/\` | \`UserBuilder\`, \`ProductBuilder\` |

### Gestión de Datos

- Datos negativos explícitos para validación de inputs
- Datos boundary para límites
- Datos de usuario por rol (admin, user, guest)
- Versionado de fixtures en control de versiones

---

## Dependencias Externas

### Servicios Dependientes

| Servicio | URL | Autenticación |
|----------|-----|---------------|
| API Principal | [URL] | Bearer Token |
| Base de Datos | [HOST:PORT] | User/Pass |
| Servicio de Mail | [URL] | API Key |

### APIs Mock

- [Documentar mocks configurados si aplica]

---

## CI/CD

### Pipeline

\`\`\`yaml
# Ejemplo de pipeline
stages:
  - install
  - lint
  - test-unit
  - test-integration
  - test-e2e
  - report
\`\`\`

### Comandos CI

\`\`\`bash
# Instalación
npm ci

# Lint
npm run lint

# Tests
npm run test:ci

# Reporte
npm run report:merge
\`\`\`

---

## Reglas para el Agente

<!-- LLM_CONTEXT_START -->
1. **PREGUNTA ANTES DE IMPLEMENTAR**: Confirma con el usuario el alcance, enfoque y detalles antes de escribir cualquier código. No asumir, no inventar, no hardcodear.
2. Lee este archivo completo antes de implementar cualquier cambio.
3. Sigue las convenciones y patrones documentados aquí.
4. Preserva la arquitectura ELD (Ejecución / Lógica / Datos).
5. No inventes comportamiento no documentado ni hardcodees valores sin confirmación.
6. Mantén la separación entre capas.
7. Usa los frameworks y herramientas ya configurados.
8. Verifica que los tests pasen antes de confirmar cambios.
9. Documenta cualquier nueva convención o patrón agregado.
<!-- LLM_CONTEXT_END -->
`;
fs.writeFileSync("AGENTS.md",md);console.log("Generado: AGENTS.md")}finally{fs.rmSync(r,{recursive:true,force:true})}}
function help(){console.log(`QA Agent Skills CLI\n\nqa-skills list\nqa-skills install <tipo-proyecto>\nqa-skills update\nqa-skills init\n\nOpcional: --repo <git-url>`)}
let [cmd,...args]=process.argv.slice(2);switch(cmd){case"list":list(args);break;case"install":install(args);break;case"update":update(args);break;case"init":init(args);break;default:help()}
