package com.flowkraft.scripts;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.flowkraft.queries.services.QueriesService;

import groovy.lang.Binding;
import groovy.lang.GroovyShell;

/**
 * Executes inline Groovy scripts for the data canvas Script mode.
 * Scripts receive a minimal ctx with ctx.dbSql wired to the connection,
 * and should return List<Map> (or assign it to a variable and use return).
 *
 * Example script:
 *   def data = ctx.dbSql.rows('SELECT ShipCountry, SUM(Freight) AS total FROM Orders GROUP BY ShipCountry')
 *   return data
 */
@Service
public class ScriptsService {

    private static final Logger log = LoggerFactory.getLogger(ScriptsService.class);

    @Autowired
    private QueriesService queriesService;

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> executeScript(
            String connectionId, String script, Map<String, Object> filterValues) throws Exception {
        DbSqlProxy dbSqlProxy = new DbSqlProxy(connectionId, queriesService);
        ScriptContext ctx = new ScriptContext(dbSqlProxy);

        Binding binding = new Binding();
        binding.setVariable("ctx", ctx);
        binding.setVariable("log", LoggerFactory.getLogger("ScriptExecution"));
        // Bind each filter value as a named Groovy variable so ${paramName} resolves
        // naturally in Groovy GStrings (e.g. "WHERE col = ${shipper}").
        if (filterValues != null) {
            for (Map.Entry<String, Object> entry : filterValues.entrySet()) {
                binding.setVariable(entry.getKey(), entry.getValue());
            }
        }

        GroovyShell shell = new GroovyShell(binding);

        log.debug("Executing inline script on connection '{}': {}",
                connectionId,
                script.length() > 120 ? script.substring(0, 120) + "..." : script);

        Object result = shell.evaluate(script);

        if (result instanceof List) {
            return (List<Map<String, Object>>) result;
        }

        log.debug("Script returned non-List result ({}); returning empty", result == null ? "null" : result.getClass().getName());
        return Collections.emptyList();
    }
}
