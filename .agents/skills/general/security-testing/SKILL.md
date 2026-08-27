---
name: security-testing
description: Pruebas de seguridad básicas: validación de inputs, autenticación, autorización, headers de seguridad y prevención de vulnerabilidades comunes (XSS, SQL Injection).
---

# Security Testing

## Propósito

Integrar verificaciones de seguridad en las pruebas automatizadas para detectar vulnerabilidades comunes antes de que lleguen a producción.

## Reglas

- **Validación de inputs**: verificar sanitización contra XSS, SQL Injection y command injection.
- **Headers de seguridad**: validar presencia de CSP, HSTS, X-Frame-Options, X-Content-Type-Options.
- **Autenticación**: probar login/logout, expiración de sesiones, tokens inválidos.
- **Autorización**: verificar acceso por roles, protecciones de rutas, vertical/horizontal privilege escalation.
- **Datos sensibles**: confirmar que no se exponen en URLs, logs, respuestas o storage del navegador.
- **CORS**: validar configuración de origin permitidos.
- **Cookies**: verificar flags HttpOnly, Secure, SameSite.
- **Variables de entorno y secretos**: **PROHIBIDO** leer, exponer o hardcodear variables de entorno generadas en archivos `.env` o sistemas de secretos (Vault, AWS Secrets Manager, etc.) en el código de pruebas. Usa únicamente variables de configuración de testing (`Cypress.env()`, `System.getenv()` en Java) que estén definidas exclusivamente para testing.

## Implementación

### Gestión Segura de Variables de Entorno

```javascript
// cypress.config.js - Configuración correcta
module.exports = defineConfig({
  env: {
    // Variables de testing únicamente - NUNCA usar credenciales reales de .env
    TEST_USER_EMAIL: 'test@example.com',
    TEST_USER_PASSWORD: 'TestPassword123!',
    API_URL: 'https://api.test.example.com'
  }
});

// ❌ PROHIBIDO - No leer de process.env que cargue .env de producción
// const API_URL = process.env.API_URL;

// ✅ CORRECTO - Usar Cypress.env() con variables de testing
cy.visit(Cypress.env('API_URL'));
```

```java
// src/test/resources/test.properties - Configuración correcta
test.api.url=https://api.test.example.com
test.user.email=test@example.com
test.user.password=TestPassword123!

// ❌ PROHIBIDO - No leer variables de Vault/AWS Secrets en tests
// String apiKey = System.getenv("PRODUCTION_API_KEY");

// ✅ CORRECTO - Usar propiedades de testing
String apiUrl = System.getProperty("test.api.url");
```

### Cypress (Web/API)

```javascript
// e2e/security/headers.cy.js
describe('Seguridad - Headers HTTP', () => {
  it('debe incluir headers de seguridad', () => {
    cy.visit('/');
    cy.request('/').then((response) => {
      expect(response.headers).to.have.property('x-content-type-options', 'nosniff');
      expect(response.headers).to.have.property('x-frame-options');
      expect(response.headers).to.have.property('strict-transport-security');
    });
  });
});

// e2e/security/xss.cy.js
describe('Seguridad - Prevención XSS', () => {
  it('debe sanitizar inputs maliciosos', () => {
    const xssPayload = '<script>alert("XSS")</script>';
    cy.get('#search-input').type(xssPayload);
    cy.get('#search-button').click();
    cy.get('#results').should('not.contain', '<script>');
  });
});

// e2e/security/auth.cy.js
describe('Seguridad - Autenticación', () => {
  it('debe rechazar tokens expirados', () => {
    cy.intercept('GET', '/api/**', {
      statusCode: 401,
      body: { error: 'Token expired' }
    }).as('authError');
    cy.visit('/dashboard');
    cy.wait('@authError');
    cy.url().should('include', '/login');
  });
});
```

### Appium Java (Mobile)

```java
@Test
public void testXssPrevention() {
    WebElement input = driver.findElement(By.id("search_input"));
    input.sendKeys("<script>alert('XSS')</script>");
    driver.findElement(By.id("search_button")).click();
    
    WebElement results = driver.findElement(By.id("results"));
    String text = results.getText();
    assertThat(text).doesNotContain("<script>");
}

@Test
public void testUnauthorizedAccess() {
    // Intentar acceder sin token
    driver.get("https://app.example.com/dashboard");
    String currentUrl = driver.getCurrentUrl();
    assertThat(currentUrl).contains("/login");
}
```

## Anti-patrones

- **NO** probar solo happy paths de seguridad: incluir intentos de bypass.
- **NO** asumir que el framework protege automáticamente: validar siempre.
- **NO** ignorar storage del navegador/localStorage para datos sensibles.
- **NO** omitir verificación de CORS en APIs.
- **NO** olvidar probar con usuarios de diferentes roles.
- **NO** leer, exponer o hardcodear variables de entorno de producción/staging en tests (`.env`, secretos de Vault, AWS Secrets Manager, etc.).
- **NO** commitear archivos `.env` con credenciales reales.

## Checklist de Seguridad

- [ ] Headers de seguridad presentes y correctos.
- [ ] Inputs sanitizados contra XSS.
- [ ] Autenticación rechaza credenciales inválidas.
- [ ] Autorización bloquea acceso no autorizado.
- [ ] Datos sensibles no expuestos en respuestas.
- [ ] Cookies configuradas con flags de seguridad.
- [ ] CORS restringido a origins permitidos.
- [ ] **Variables de entorno de secretos/.env NO se leen ni exponen en código de pruebas.**
- [ ] Archivos `.env` incluidos en `.gitignore`.

## Contexto Específico del Proyecto

<!--
LLM_CONTEXT_START

Project-specific facts belong in the consuming project's AGENTS.md.

LLM_CONTEXT_END
-->
