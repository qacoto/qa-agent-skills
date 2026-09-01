---
name: oracle-state
description: "Integra Cypress API con Oracle para preparar estado, validar persistencia, limpiar datos y esperar consistencia eventual de forma acotada."
---

# Estado Oracle para Cypress API

## Propósito

Usar Oracle como soporte de preparación y verificación de estado cuando el proyecto consumidor realmente lo requiere. La base de datos complementa la validación HTTP; no reemplaza la respuesta observable de la API.

## Reglas

- Activa esta skill sólo si `AGENTS.md`, la configuración y las dependencias confirman Oracle.
- Mantén credenciales, host, service name y wallet fuera del código; resuélvelos desde variables de entorno o un secret manager.
- Expone operaciones DB mediante `cy.task()` y conserva el driver Oracle en el proceso Node.
- Usa binds para todos los valores variables. Nunca interpoles datos del test dentro del SQL.
- Separa consultas, comandos y lifecycle en módulos pequeños si el consumidor ya sigue esa convención.
- Cierra conexiones en `finally`, incluso cuando la consulta o aserción falla.
- Para consistencia eventual, usa polling con intervalo y timeout finitos; informa claramente el último estado observado.
- Haz cleanup sólo sobre datos creados por el test y con identificadores inequívocos.
- No registres credenciales, connection strings ni payloads sensibles en terminal o reportes.

## Estructura recomendada

```text
cypress/
  e2e/apis/orders/create-order.cy.js       # Execution
  fixtures/testdata/apis/orders/*.json     # Data
  support/commands/apis/orders.js           # Logic HTTP
  support/commands/dbs/orders.js            # Logic DB desde Cypress
  utils/oracle.js                           # Adaptador Node
cypress.config.js                           # Registro de tasks
```

## Implementación

Adaptador Node con binds y cierre seguro:

```javascript
// cypress/utils/oracle.js
const oracledb = require("oracledb");

const connectionConfig = () => ({
  user: process.env.ORACLE_USER,
  password: process.env.ORACLE_PASSWORD,
  connectString: process.env.ORACLE_CONNECT_STRING
});

async function queryOracle({ sql, binds = {} }) {
  let connection;
  try {
    connection = await oracledb.getConnection(connectionConfig());
    const result = await connection.execute(sql, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT
    });
    return result.rows;
  } finally {
    if (connection) await connection.close();
  }
}

module.exports = { queryOracle };
```

Registro compuesto de tasks:

```javascript
// cypress.config.js
const { defineConfig } = require("cypress");
const { queryOracle } = require("./cypress/utils/oracle");

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      on("task", {
        queryOracle
      });
      return config;
    }
  }
});
```

Comando DB con polling acotado:

```javascript
// cypress/support/commands/dbs/orders.js
Cypress.Commands.add(
  "waitForOrderState",
  ({ orderId, expectedStatus, timeout = 15000, interval = 1000 }) => {
    const startedAt = Date.now();

    const poll = () => cy.task("queryOracle", {
      sql: "SELECT STATUS FROM ORDERS WHERE ORDER_ID = :orderId",
      binds: { orderId }
    }).then((rows) => {
      const currentStatus = rows[0]?.STATUS;
      if (currentStatus === expectedStatus) return rows[0];

      if (Date.now() - startedAt >= timeout) {
        throw new Error(
          `Order ${orderId} did not reach ${expectedStatus}; last status: ${currentStatus}`
        );
      }

      return cy.wait(interval, { log: false }).then(poll);
    });

    return poll();
  }
);
```

Uso desde el spec después de validar HTTP:

```javascript
cy.createOrder(testCase.request).then((response) => {
  cy.validateStatus(response, testCase.status);
  cy.waitForOrderState({
    orderId: response.body.id,
    expectedStatus: testCase.expectedDbStatus
  }).then((row) => {
    expect(row.STATUS).to.eq(testCase.expectedDbStatus);
  });
});
```

## Anti-patrones prohibidos

- Agregar Oracle al perfil Cypress API genérico.
- Hardcodear credenciales o usar fallbacks de secretos en el código.
- Interpolar strings en SQL en lugar de usar binds.
- Abrir conexiones sin cierre en `finally`.
- Usar esperas fijas largas como sustituto de polling acotado.
- Consultar indefinidamente o hacer cleanup masivo.
- Considerar exitosa una prueba sólo porque la fila existe, sin validar primero la respuesta HTTP relevante.

## Contexto Específico del Proyecto

<!--
LLM_CONTEXT_START

Project-specific facts belong in the consuming project's AGENTS.md.

LLM_CONTEXT_END
-->
