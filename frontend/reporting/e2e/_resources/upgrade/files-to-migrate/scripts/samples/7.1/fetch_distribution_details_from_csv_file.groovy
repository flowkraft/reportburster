/*
 *
 * 1. This script should be used as a sample to fetch the 
 *    bursting/distribution meta-data details from an external (CSV) file.
 *
 * 2. The script can be executed (depending on the need) in either 
 *    startExtractDocument, endExtractDocument or startDistributeDocument 
 *    report bursting life-cycle phases.
 *
 * 3. Please copy and paste (if this is what you need) the content 
 *    of this sample script into the existing 
 *    scripts/burst/startExtractDocument.groovy script.
 *
 * 4. This sample script is reading the information from a CSV file, however 
 *    you can modify the script to parse and read other plain text files 
 *    (which have your own custom format). 
 *         
 * 5. Following is a sample with how this script is expecting the CSV file
 *
 *        employee_id,email_address,first_name,last_name
 *        1,email1@address1.com,firstName1,lastName1
 *        2,email2@address2.com,firstName2,lastName2
 *        3,email3@address3.com,firstName3,lastName3
 *        4,email4@address4.com,firstName4,lastName4
 *
 * 6. If you have a file with a different structure then the script should
 *    be modified accordingly.
 *
 */
 
//The burst token is used as a key to identify the details
//of the appropriate employee or customer
def token = ctx.token

//Load and parse the CSV file - Change with the path of your own CSV file
def employees = new File("src/test/resources/input/unit/other/" +
                         "employees.csv").readLines()*.split(",")

println "Processed ${employees.size()} Lines"

def employeeId, emailAddress, firstName, lastName 

for (employeeRow in employees) {
   
    //The burst token is used as a key to identify the details
    //of the appropriate employee or customer
    if (employeeRow[0] ==  token)
    {
        employeeId = employeeRow[0]
        emailAddress = employeeRow[1]
        firstName = employeeRow[2]
        lastName = employeeRow[3]
    }
}

println "Employee: employee_id = ${employeeId} and" +
        " email_address = ${emailAddress} and" +
        " first_name = ${firstName} and" +
        " last_name = ${lastName}"

//Populate the fetched information into var0, var1, etc.
ctx.variables.setUserVariable(String.valueOf("${token}"),"var0",
                              String.valueOf("${emailAddress}"))

ctx.variables.setUserVariable(String.valueOf("${token}"),"var1",
                              String.valueOf("${firstName}"))

ctx.variables.setUserVariable(String.valueOf("${token}"),"var2",
                              String.valueOf("${lastName}"))