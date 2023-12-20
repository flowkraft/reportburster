/*
 *
 * 1. This script should be used as a sample to fetch the 
 *    bursting/distribution meta-data details from an external database.
 *
 * 2. The script can be executed (depending on the need) in either 
 *    startExtractDocument, endExtractDocument or startDistributeDocument 
 *    report bursting life-cycle phases.
 *
 * 3. Please copy and paste (if this is what you need) the content 
 *    of this sample script into the existing 
 *    scripts/burst/startExtractDocument.groovy script.
 *
 * 4. This sample script is connecting to an HSQLDB database, however 
 *    you can modify the connection details to point to an 
 *         
 *        Oracle,
 *        Microsoft Access,
 *        Microsoft SQL Server,
 *        Microsoft FoxPro,
 *        IBM DB2,
 *        IBM AS/400,
 *        MySQL,
 *        PostgreSQL,
 *        Teradata,
 *        SQLite,
 *        Apache Derby or
 *        FireBird SQL database
 *
 * 5. In order for this script to work it is mandatory to copy the correct
 *    JDBC driver jar (corresponding to your database)
 *    file into the existing lib/burst folder
 *
 * 6. For more details about available JDBC drivers please check 
 *  
 *        http://developers.sun.com/product/jdbc/drivers
 *
 * 7. Groovy SQL resources 
 *  
 *        7.1 Groovy SQL - http://groovy.codehaus.org/Tutorial+6+-+Groovy+SQL
 *        7.2 Practically Groovy: JDBC programming with Groovy - 
 *        http://www.ibm.com/developerworks/java/library/j-pg01115/index.html
 *
 */
 
import groovy.sql.Sql

//HSQLDB sample

//Replace localhost with your host
//Replace xdb with your own database name
//Replace sa and '' with your own database login details

def sql = Sql.newInstance('jdbc:hsqldb:hsql://localhost/xdb', 
                          'sa', '','org.hsqldb.jdbcDriver')

//Oracle sample

//Replace localhost with your host
//Replace username and password with your database login details
//Change to your own database instance

//def sql = Sql.newInstance('jdbc:oracle:thin:@localhost:1521:orcl', 
//                         'username', 'password',
//                         'oracle.jdbc.pool.OracleDataSource' )
					  
//The burst token is used as a key to identify the details
//of the appropriate employee or customer
def token = ctx.token

//Change the SQL to your own need

//Double check your customized SQL is correct and is 
//properly returning the unique details for the appropriate 
//employee/customer (otherwise the risk is to send 
//confidential information to the wrong employee or customer) 

def employeeRow = sql.firstRow('SELECT employee_id, email_address,' +
                  'first_name, last_name FROM employees WHERE employee_id = ?',
                  [token])

def emailAddress = employeeRow.email_address

def firstName = employeeRow.first_name
def lastName = employeeRow.last_name

println "Employee: employee_id = ${employeeRow.employee_id} and " +
         "email_address = ${emailAddress} and first_name = ${firstName} " +
         "and last_name = ${lastName}"

//Populate the fetched information into var0, var1, etc user variables.
ctx.variables.setUserVariable(String.valueOf("${token}"),"var0",
                              String.valueOf("${emailAddress}"))

ctx.variables.setUserVariable(String.valueOf("${token}"),"var1",
                              String.valueOf("${firstName}"))

ctx.variables.setUserVariable(String.valueOf("${token}"),"var2",
                              String.valueOf("${lastName}"))