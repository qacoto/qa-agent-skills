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
function install(a){let id=a.find(x=>!x.startsWith("--"));if(!id)fail("Uso: qa-skills install <tipo-proyecto-o-skill>");let r=clone(repoArg(a));try{let p=profiles(r).find(x=>x.id===id);if(p){for(const x of p.config.agent||[])copy(r,path.join("agents",x));for(const x of p.config.skills||[])copy(r,path.join("skills",x));for(const x of p.config.rules||[]){let rp=path.join("rules",x);if(!fs.existsSync(path.join(r,".agents",rp))&&fs.existsSync(path.join(r,".agents",rp+".md")))rp+=".md";copy(r,rp)}fs.mkdirSync(path.dirname(META),{recursive:true});fs.writeFileSync(META,JSON.stringify({projectType:id,agent:p.config.agent||[],skills:p.config.skills||[],rules:p.config.rules||[]},null,2)+"\n");console.log(`Tipo de proyecto instalado: ${id}`)}else{let sk=skills(r).find(s=>s.id===id||s.rel===id||s.category+"/"+s.id===id);if(!sk)fail(`No encontrado: ${id} (busca en proyectos y skills)`);copy(r,sk.rel);fs.mkdirSync(path.dirname(META),{recursive:true});fs.writeFileSync(META,JSON.stringify({skill:sk.id,category:sk.category},null,2)+"\n");console.log(`Skill instalada: ${sk.category}/${sk.id}`)}}finally{fs.rmSync(r,{recursive:true,force:true})}}
function update(a){if(!fs.existsSync(META))fail("No hay instalación ejecuta qa-skills install <tipo-proyecto> primero.");let m=JSON.parse(fs.readFileSync(META)),r=clone(repoArg(a));try{for(const x of [...(m.agent||[]),...(m.skills||[]),...(m.rules||[])]){let top=x.includes("/")?x.split("/")[0]:"agents";copy(r,path.join(top,x));}console.log(`Actualizado: ${m.projectType}`)}finally{fs.rmSync(r,{recursive:true,force:true})}}
function detect(){let p=fs.existsSync("package.json")?JSON.parse(fs.readFileSync("package.json")):{};let d={...(p.dependencies||{}),...(p.devDependencies||{})};let c=!!d.cypress||fs.existsSync("cypress.config.js")||fs.existsSync("cypress.config.ts"),g=!!d["@badeball/cypress-cucumber-preprocessor"]||!!d["cypress-cucumber-preprocessor"],m=fs.existsSync("pom.xml");if(m)return"mobile-appium-java";if(c&&g)return"cypress-web-cucumber";if(c)return"cypress-web";return"unknown"}

function scanPackageJson(){
  let pkg={exists:false,name:"",description:"",scripts:{},dependencies:{},devDependencies:{}};
  try{let raw=fs.readFileSync("package.json","utf8");pkg={...JSON.parse(raw),exists:true};}catch(e){}
  return pkg;
}

function scanPomXml(){
  let pom={exists:false,groupId:"",artifactId:"",dependencies:[]};
  try{
    let raw=fs.readFileSync("pom.xml","utf8");
    let gid=raw.match(/<groupId>([^<]+)<\/groupId>/);
    let aid=raw.match(/<artifactId>([^<]+)<\/artifactId>/);
    let deps=raw.match(/<dependency>[\s\S]*?<\/dependency>/g)||[];
    pom={exists:true,groupId:gid?gid[1]:"",artifactId:aid?aid[1]:"",dependencies:deps.map(d=>{
      let g=d.match(/<groupId>([^<]+)<\/groupId>/);
      let a=d.match(/<artifactId>([^<]+)<\/artifactId>/);
      return g&&a?{groupId:g[1],artifactId:a[1]}:null;
    }).filter(Boolean)};
  }catch(e){}
  return pom;
}

function scanStructure(dir,depth=0,maxDepth=2){
  let result="";
  try{
    let items=fs.readdirSync(dir,{withFileTypes:true});
    items=items.filter(i=>![".git","node_modules",".DS_Store","dist","build","target",".next",".nuxt"].includes(i.name));
    items.sort((a,b)=>{
      if(a.isDirectory()&&!b.isDirectory())return -1;
      if(!a.isDirectory()&&b.isDirectory())return 1;
      return a.name.localeCompare(b.name);
    });
    for(let i of items){
      if(depth>=maxDepth)break;
      let prefix="  ".repeat(depth);
      if(i.isDirectory()){
        result+=prefix+i.name+"/\n";
        let sub=scanStructure(path.join(dir,i.name),depth+1,maxDepth);
        if(sub)result+=sub;
      }else{
        result+=prefix+i.name+"\n";
      }
    }
  }catch(e){}
  return result;
}

function detectConventions(){
  let conv={testPattern:"",pageObjectPattern:"",fixturePattern:"",hasCustomCommands:false,hasStepDefs:false};
  try{
    let cypressDir=fs.existsSync("cypress");
    if(cypressDir){
      let e2eDir=fs.existsSync("cypress/e2e")||fs.existsSync("cypress/integration");
      conv.testPattern=e2eDir?"*.cy.js / *.feature":"*.spec.js";
      conv.fixturePattern=fs.existsSync("cypress/fixtures")?"cypress/fixtures/*.json":"No encontrado";
      conv.hasCustomCommands=fs.existsSync("cypress/support/commands.js")||fs.existsSync("cypress/support/commands.ts");
      conv.hasStepDefs=fs.existsSync("cypress/support/step_definitions")||fs.existsSync("cypress/support/steps");
    }
    let srcDir=fs.existsSync("src");
    if(srcDir){
      let pageObjects=fs.readdirSync("src",{recursive:true}).filter(f=>f.toString().includes("Page"));
      conv.pageObjectPattern=pageObjects.length>0?"src/**/[Nombre]Page.js":"No encontrado";
    }
  }catch(e){}
  return conv;
}

function scanEnvFiles(){
  let env={hasEnv:false,hasEnvExample:false,hasGitignoreEnv:false,variables:[]};
  try{
    env.hasEnv=fs.existsSync(".env");
    env.hasEnvExample=fs.existsSync(".env.example")||fs.existsSync(".env.template");
    if(fs.existsSync(".gitignore")){
      let gitignore=fs.readFileSync(".gitignore","utf8");
      env.hasGitignoreEnv=gitignore.includes(".env");
    }
    if(env.hasEnv){
      let content=fs.readFileSync(".env","utf8");
      env.variables=content.split("\n").filter(l=>l&&!l.startsWith("#")).map(l=>l.split("=")[0].trim());
    }
    if(env.hasEnvExample){
      let content=fs.readFileSync(".env.example","utf8")||fs.readFileSync(".env.template","utf8");
      env.variables=content.split("\n").filter(l=>l&&!l.startsWith("#")).map(l=>l.split("=")[0].trim());
    }
  }catch(e){}
  return env;
}

function scanCiCd(){
  let ci={hasGithub:false,hasGitlab:false,hasJenkins:false,hasCirlce:false,workflows:[]};
  try{
    ci.hasGithub=fs.existsSync(".github/workflows");
    ci.hasGitlab=fs.existsSync(".gitlab-ci.yml");
    ci.hasJenkins=fs.existsSync("Jenkinsfile");
    ci.hasCirlce=fs.existsSync(".circleci/config.yml");
    if(ci.hasGithub){
      let workflows=fs.readdirSync(".github/workflows").filter(f=>f.endsWith(".yml")||f.endsWith(".yaml"));
      ci.workflows=workflows.map(w=>w.replace(/\.(yml|yaml)$/,""));
    }
  }catch(e){}
  return ci;
}

function scanFixtures(){
  let fixtures={locations:[],hasBuilders:false,hasFactories:false,dataFiles:[]};
  try{
    let fixtureDirs=["cypress/fixtures","src/fixtures","fixtures","test/fixtures","__fixtures__","test-data"];
    fixtureDirs.forEach(d=>{
      if(fs.existsSync(d)){
        fixtures.locations.push(d);
        let files=fs.readdirSync(d).filter(f=>f.endsWith(".json")||f.endsWith(".js")||f.endsWith(".ts"));
        fixtures.dataFiles.push(...files.map(f=>d+"/"+f));
      }
    });
    fixtures.hasBuilders=fs.existsSync("builders")||fs.existsSync("src/builders");
    fixtures.hasFactories=fs.existsSync("factories")||fs.existsSync("src/factories");
  }catch(e){}
  return fixtures;
}

function detectExternalDeps(){
  let deps={apis:[],databases:[],services:[]};
  try{
    let env=scanEnvFiles();
    env.variables.forEach(v=>{
      if(v.toUpperCase().includes("API")||v.toUpperCase().includes("URL"))deps.apis.push(v);
      if(v.toUpperCase().includes("DB")||v.toUpperCase().includes("DATABASE")||v.toUpperCase().includes("MONGO"))deps.databases.push(v);
    });
  }catch(e){}
  return deps;
}

function init(a){
  let r=clone(repoArg(a));
  try{
    let type=fs.existsSync(META)?JSON.parse(fs.readFileSync(META)).projectType:detect();
    let p=profiles(r).find(x=>x.id===type);
    
    let pkg=scanPackageJson();
    let pom=scanPomXml();
    let env=scanEnvFiles();
    let ci=scanCiCd();
    let fixtures=scanFixtures();
    let conv=detectConventions();
    let deps=detectExternalDeps();
    
    let projectName=pkg.exists?(pkg.name||path.basename(ROOT)):pom.exists?pom.artifactId:path.basename(ROOT);
    let description=pkg.exists?(pkg.description||""):pom.exists?"Proyecto Java/Maven":"";
    let framework=type.startsWith("cypress")?"Cypress":type==="mobile-appium-java"?"Appium + Java + Maven + Cucumber":"Desconocido";
    let language=type==="mobile-appium-java"?"Java":"JavaScript/TypeScript";
    let pkgManager=type==="mobile-appium-java"?"Maven":"npm";
    
    let tree=scanStructure(ROOT,0,2);
    
    let testScripts=[];
    if(pkg.exists&&pkg.scripts){
      Object.entries(pkg.scripts).forEach(([k,v])=>{
        if(k.includes("test")||k.includes("cypress")||k.includes("e2e")){
          testScripts.push({name:k,command:v});
        }
      });
    }
    
    let allDeps=pkg.exists?{...(pkg.dependencies||{}),...(pkg.devDependencies||{})}:{};
    let hasCypress=!!allDeps.cypress||fs.existsSync("cypress.config.js")||fs.existsSync("cypress.config.ts");
    let hasCucumber=!!allDeps["@badeball/cypress-cucumber-preprocessor"];
    let hasMocha=!!allDeps.mocha||!!allDeps["@types/mocha"];
    let hasJest=!!allDeps.jest;
    let hasPlaywright=!!allDeps["@playwright/test"];
    let hasAllure=!!allDeps["allure-commandline"]||!!allDeps["allure-js-commons"];
    let hasMochawesome=!!allDeps.mochawesome;
    let hasPrettier=!!allDeps.prettier;
    let hasEslint=!!allDeps.eslint;
    let hasTypescript=!!allDeps.typescript||!!allDeps["ts-node"];
    
    let envTable="";
    if(env.variables.length>0){
      env.variables.forEach(v=>{envTable+=`| \`${v}\` | Configurado en .env | Ver .env.example |\n`;});
    }else{
      envTable=`| \`API_URL\` | URL base de la API | \`http://localhost:3000\` |\n| \`TEST_USER\` | Usuario de prueba | \`test@example.com\` |`;
    }
    
    let scriptsTable="";
    if(testScripts.length>0){
      testScripts.forEach(s=>{scriptsTable+=`| \`${s.name}\` | \`${s.command}\` |\n`;});
    }else if(type==="mobile-appium-java"){
      scriptsTable=`| \`test\` | \`mvn test\` |\n| \`test:headed\` | \`mvn test -Dheaded=true\` |`;
    }else{
      scriptsTable=`| \`test\` | \`npx cypress run\` |\n| \`test:headed\` | \`npx cypress open\` |`;
    }
    
    let frameworksList=[];
    if(hasCypress)frameworksList.push("- **Cypress**: framework de testing E2E");
    if(hasCucumber)frameworksList.push("- **Cucumber**: BDD con Gherkin");
    if(hasMocha)frameworksList.push("- **Mocha**: runner de tests");
    if(hasJest)frameworksList.push("- **Jest**: framework de testing");
    if(hasPlaywright)frameworksList.push("- **Playwright**: testing multi-navegador");
    if(hasMochawesome)frameworksList.push("- **Mochawesome**: reportes HTML");
    if(hasAllure)frameworksList.push("- **Allure Report**: reportes con evidencias");
    if(hasPrettier)frameworksList.push("- **Prettier**: formateo de código");
    if(hasEslint)frameworksList.push("- **ESLint**: análisis estático");
    if(hasTypescript)frameworksList.push("- **TypeScript**: tipado estático");
    if(type==="mobile-appium-java")frameworksList=["- **Appium**: automatización mobile","- **Maven**: gestión de dependencias","- **TestNG/JUnit**: framework de testing Java","- **Allure Report**: reportes con evidencias"];
    if(frameworksList.length===0)frameworksList=["- [Configurar frameworks]"];
    
    let ciSection="";
    if(ci.hasGithub){
      ciSection="### GitHub Actions\n\n";
      if(ci.workflows.length>0){
        ci.workflows.forEach(w=>{ciSection+=`- \`.github/workflows/${w}.yml\`\n`;});
      }else{
        ciSection+="- workflows detectados en `.github/workflows/`\n";
      }
    }
    if(ci.hasGitlab)ciSection+="### GitLab CI\n\n- `.gitlab-ci.yml`\n";
    if(ci.hasJenkins)ciSection+="### Jenkins\n\n- `Jenkinsfile`\n";
    if(!ciSection)ciSection="**No se detectó configuración de CI/CD**\n\n> Agrega la documentación de tu pipeline aquí.";
    
    let fixtureSection="";
    if(fixtures.locations.length>0){
      fixtureSection="### Ubicaciones Detectadas\n\n";
      fixtures.locations.forEach(l=>{fixtureSection+=`- \`${l}/\`\n`;});
      if(fixtures.dataFiles.length>0){
        fixtureSection+="\n### Archivos de Datos\n\n";
        fixtures.dataFiles.slice(0,10).forEach(f=>{fixtureSection+=`- \`${f}\`\n`;});
        if(fixtures.dataFiles.length>10)fixtureSection+=`- ... y ${fixtures.dataFiles.length-10} más\n`;
      }
    }else{
      fixtureSection="**No se detectaron fixtures**\n\n> Crea la carpeta \`fixtures/\` o \`cypress/fixtures/\` para datos de prueba.";
    }
    
    let convSection="";
    if(conv.testPattern)convSection+=`- **Patrón de tests**: \`${conv.testPattern}\`\n`;
    if(conv.pageObjectPattern)convSection+=`- **Page Objects**: \`${conv.pageObjectPattern}\`\n`;
    if(conv.fixturePattern)convSection+=`- **Fixtures**: \`${conv.fixturePattern}\`\n`;
    if(conv.hasCustomCommands)convSection+="- **Custom Commands**: detectados en \`cypress/support/commands.js\`\n";
    if(conv.hasStepDefs)convSection+="- **Step Definitions**: detectados en \`cypress/support/step_definitions/\`\n";
    if(!convSection)convSection="- [Documentar convenciones del proyecto]";

    let md=`# AGENTS.md

> Generado automáticamente por \`qa-skills init\` el ${new Date().toISOString().split('T')[0]}. Este archivo se actualiza con datos reales del proyecto.

---

## Contexto del Proyecto

- **Nombre**: ${projectName}
- **Descripción**: ${description||"[Agregar descripción del proyecto]"}
- **Tipo de proyecto**: ${type}
- **Entorno**: [Producción / Staging / Desarrollo]

---

## Stack Tecnológico

- **Framework principal**: ${framework}
- **Lenguaje**: ${language}
- **Gestor de dependencias**: ${pkgManager}${hasTypescript?" + TypeScript":""}
${deps.databases.length>0?"- **Base de datos**: "+deps.databases.join(", "):"- **Base de datos**: [No detectada]"}

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

${pkg.scripts&&pkg.scripts.dev?"# Ejecutar la aplicación\nnpm run dev\n":pkg.scripts&&pkg.scripts.start?"# Ejecutar la aplicación\nnpm run start\n":"# Ejecutar la aplicación (configurar script en package.json)\n# npm run dev\n"}
\`\`\`

---

## Cómo Ejecutar Tests

\`\`\`bash
${scriptsTable.split("\n").filter(s=>s.includes("|")).map(s=>{
  let parts=s.split("|").filter(p=>p.trim());
  if(parts.length>=3)return `# ${parts[1].trim().replace(/\\\`/g,"")}\n${parts[2].trim().replace(/\\\`/g,"")}`;
  return"";
}).filter(Boolean).join("\n\n")}
\`\`\`

---

## Configuración de Ambientes

${env.hasEnv||env.hasEnvExample?`${env.hasEnv?"**Archivo \`.env\` detectado**": "**Archivo \`.env.example\` detectado**"}
${env.hasGitignoreEnv?"✅ `.env` está en `.gitignore`":"⚠️ **ADVERTENCIA**: `.env` NO está en `.gitignore` - agregalo por seguridad"}

### Variables Detectadas

| Variable | Descripción | Ubicación |
|----------|-------------|-----------|
${envTable}
`:"**No se detectó archivo \`.env\`**\n\n> Crea un archivo \`.env.example\` con las variables necesarias."}

---

## Estrategia de Testing

### Tipos de Pruebas

| Tipo | Cobertura | Herramienta |
|------|-----------|-------------|
| E2E | Flujos de usuario completos | ${hasCypress?"Cypress":hasPlaywright?"Playwright":"[Configurar]"} |
| API | Endpoints REST | ${hasCypress?"cy.api() / cy.request()":"[Configurar]"} |
| BDD | Criterios de aceptación | ${hasCucumber?"Cucumber + Gherkin":"[No configurado]"} |
| Unitarias | Funciones aisladas | ${hasJest?"Jest":"[Configurar]"} |

### Criterios de Aceptación

- [ ] Tests deterministas y repetibles
- [ ] Sin \`sleep\` fijos: usar esperas explícitas
- [ ] Datos de prueba en fixtures, sin hardcodear
- [ ] Aserciones verifican resultados, no pasos intermedios

---

## Frameworks Utilizados

${frameworksList.join("\n")}

---

## Convenciones del Proyecto

${convSection}

### Arquitectura

- Separación estricta ELD (Ejecución / Lógica / Datos)
- POM (Page Object Model) obligatorio para UI
- Aserciones sobre resultados, no sobre pasos intermedios

---

## Patrones Existentes

<!-- Documenta los patrones de diseño ya implementados en tu proyecto -->

${conv.hasCustomCommands?"- **Custom Commands**: detectados en \`cypress/support/commands.js\`":"- **Page Object Model**: [Describir cómo se aplica]"}
${conv.hasStepDefs?"- **Step Definitions**: detectados en \`cypress/support/step_definitions/\`":"- **Builder Pattern**: [Si se usa para datos de prueba]"}
- **Factory Pattern**: [Si se usa para crear objetos de prueba]

---

## Reglas Específicas de QA

1. **Determinismo**: cada prueba produce el mismo resultado ante el mismo estado.
2. **Independencia**: cada prueba prepara y limpia su propio estado.
3. **Aserciones de resultado**: verificar comportamiento observable, no implementación.
4. **Datos de prueba**: en fixtures/builders, nunca hardcodeados en specs.
5. **Reportería**: evidencias obligatorias en fallo (screenshots, videos, logs).

---

## Datos de Prueba

### Gestión de Datos Detectada

${fixtureSection}

### Estrategia Recomendada

- Fixtures versionados en control de versiones
- Builders/Factories para generación dinámica
- Datos negativos explícitos para validación de inputs
- Datos boundary para límites

---

## Dependencias Externas

${deps.apis.length>0?`### APIs Detectadas

| Variable | Ubicación |
|----------|-----------|
${deps.apis.map(d=>`| \`${d}\` | .env |`).join("\n")}
`:"### APIs\n\n> Documenta las APIs externas que consume tu proyecto"}

${deps.databases.length>0?`### Base de Datos Detectada

| Variable | Ubicación |
|----------|-----------|
${deps.databases.map(d=>`| \`${d}\` | .env |`).join("\n")}
`:"### Base de Datos\n\n> Documenta las bases de datos que utiliza tu proyecto"}

---

## CI/CD

${ciSection}

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
function help(){console.log(`QA Agent Skills CLI\n\nqa-skills list\nqa-skills install <tipo-proyecto|skill>\nqa-skills update\nqa-skills init\n\nOpcional: --repo <git-url>`)}
let [cmd,...args]=process.argv.slice(2);switch(cmd){case"list":list(args);break;case"install":install(args);break;case"update":update(args);break;case"init":init(args);break;default:help()}
