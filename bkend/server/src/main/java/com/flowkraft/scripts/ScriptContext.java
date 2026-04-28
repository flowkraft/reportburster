package com.flowkraft.scripts;

/**
 * Minimal ctx object exposed to inline Groovy scripts in the data canvas.
 * Scripts access ctx.dbSql.rows(sql) to query the database.
 */
public class ScriptContext {

    public DbSqlProxy dbSql;

    public ScriptContext(DbSqlProxy dbSqlProxy) {
        this.dbSql = dbSqlProxy;
    }
}
