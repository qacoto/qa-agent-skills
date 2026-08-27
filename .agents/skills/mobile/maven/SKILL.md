---
name: maven
description: "Convenciones Maven para proyectos mobile Appium Java: dependencias explícitas, perfiles por plataforma/entorno, Surefire/Failsafe, properties por CLI y generación del reporte Allure."
---

# Maven (Mobile)

## Propósito

Build reproducible para proyectos Appium + Java + Cucumber: pom.xml explícito, perfiles por plataforma/entorno y comandos únicos que integran ejecución y reporte Allure.

## Reglas

- Toda dependencia y plugin declara versión explícita (o via `dependencyManagement`/BOM); prohibido depender de versiones heredadas implícitas.
- Dependencias base esperadas en un proyecto mobile estándar:
  - `io.appium:java-client`
  - `io.cucumber:cucumber-java` + `cucumber-junit`
  - `io.qameta.allure:allure-cucumber7-jvm`
  - `org.aspectj:aspectjweaver` (requerido por Allure)
- Parámetros de ejecución por system properties (`-Dplatform`, `-Denv`, `-Dtags`) leídos desde un único punto (`config.properties`/`DriverFactory`), nunca hardcodeados.
- Perfiles para plataformas/entornos: `-Pandroid`, `-Pios`, `-Pstaging`.
- Comandos canónicos documentados en el `AGENTS.md` del proyecto y reproducibles en CI sin pasos manuales.

## Implementación

### Fragmento clave de pom.xml

```xml
<properties>
    <maven.compiler.source>17</maven.compiler.source>
    <maven.compiler.target>17</maven.compiler.target>
    <allure.version>2.25.0</allure.version>
</properties>

<dependencies>
    <dependency>
        <groupId>io.appium</groupId>
        <artifactId>java-client</artifactId>
        <version>9.0.0</version>
    </dependency>
    <dependency>
        <groupId>io.cucumber</groupId>
        <artifactId>cucumber-java</artifactId>
        <version>7.15.0</version>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>io.qameta.allure</groupId>
        <artifactId>allure-cucumber7-jvm</artifactId>
        <version>${allure.version}</version>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>org.aspectj</groupId>
        <artifactId>aspectjweaver</artifactId>
        <version>1.9.20</version>
        <scope>test</scope>
    </dependency>
</dependencies>

<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-surefire-plugin</artifactId>
            <version>3.2.5</version>
            <configuration>
                <argLine>-Dcucumber.plugin=io.qameta.allure.cucumber7jvm.AllureCucumber7Jvm</argLine>
                <systemPropertyVariables>
                    <platform>${platform}</platform>
                </systemPropertyVariables>
            </configuration>
        </plugin>
        <plugin>
            <groupId>io.qameta.allure</groupId>
            <artifactId>allure-maven</artifactId>
            <version>2.12.0</version>
        </plugin>
    </plugins>
</build>
```

### Perfiles

```xml
<profiles>
    <profile>
        <id>android</id>
        <activation><activeByDefault>true</activeByDefault></activation>
        <properties><platform>android</platform></properties>
    </profile>
    <profile>
        <id>ios</id>
        <properties><platform>ios</platform></properties>
    </profile>
</profiles>
```

### Comandos estándar

```bash
# Suite completa Android contra QA
mvn clean test -Denv=qa

# Solo smoke iOS
mvn clean test -Pios -Dtags="@smoke"

# Generar y servir el reporte Allure
mvn allure:report
mvn allure:serve   # abre el reporte localmente

# Directorio de resultados para CI: target/allure-results (artefacto obligatorio)
```

### Buenas prácticas adicionales

- `target/allure-results` debe publicarse como artefacto en CI aunque la suite falle (`always()` en post-steps).
- No commitear `target/`; mantener `.gitignore` al día.
- Versiones de dependencias se actualizan por PR dedicado (`chore/deps-*`), verificando suite verde.

## Contexto Específico del Proyecto

<!--
LLM_CONTEXT_START

Project-specific facts belong in the consuming project's AGENTS.md.

LLM_CONTEXT_END
-->
