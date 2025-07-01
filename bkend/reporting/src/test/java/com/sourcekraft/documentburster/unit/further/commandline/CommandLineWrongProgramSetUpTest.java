package com.sourcekraft.documentburster.unit.further.commandline;

import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.fail;

import java.io.File;

import org.junit.Before;
import org.junit.Test;

import com.sourcekraft.documentburster.MainProgram;
import com.sourcekraft.documentburster.job.CliJob;

import picocli.CommandLine;

/*
 * Arguments are correct. The program environment (paths) is not set up.
 * FileNotFound should be raised for various files: settings.xml, job file etc
 */
public class CommandLineWrongProgramSetUpTest {

    private static final String PAYSLIPS_REPORT_PATH = "src/main/external-resources/template/samples/burst/Payslips.pdf";
    private static final String MERGE_FILE_PATH = "src/test/resources/input/unit/other/merge-file-Invoicec-Oct-Nov-Dec-bCpvjjzdk1.mf";
    
    private MainProgram program;
    
    @Before
    public void setUp() {
        // Create a fresh instance for each test
        program = new MainProgram();
        
        // Make sure the temp directory doesn't exist
        File tempDir = new File("./temp");
        if (tempDir.exists()) {
            tempDir.delete();
        }
    }

    /**
     * Custom CommandLine factory that creates commands that will cause errors
     * when accessing the temp directory
     */
    private CommandLine.IFactory createTestFactory() {
        return new CommandLine.IFactory() {
            @Override
            public <K> K create(Class<K> cls) throws Exception {
                if (cls == MainProgram.BurstCommand.class) {
                    MainProgram.BurstCommand cmd = new MainProgram.BurstCommand() {
                        @Override
                        protected CliJob getJob(String configFilePath) throws Exception {
                            // Create a CliJob that will fail when trying to use the temp directory
                            CliJob job = new CliJob(configFilePath) {
                                @Override
                                public String getTempFolder() {
                                    // Use a folder that doesn't exist and can't be created
                                    return "./temp/";
                                }
                            };
                            job.setGlobal(program.getGlobal());
                            return job;
                        }
                    };
                    return cls.cast(cmd);
                }
                else if (cls == MainProgram.DocumentCommand.MergeCommand.class) {
                    MainProgram.DocumentCommand.MergeCommand cmd = new MainProgram.DocumentCommand.MergeCommand() {
                        @Override
                        protected CliJob getJob(String configFilePath) throws Exception {
                            // Create a CliJob that will fail when trying to use the temp directory
                            CliJob job = new CliJob(configFilePath) {
                                @Override
                                public String getTempFolder() {
                                    // Use a folder that doesn't exist and can't be created
                                    return "./temp/";
                                }
                            };
                            job.setGlobal(program.getGlobal());
                            return job;
                        }
                    };
                    return cls.cast(cmd);
                }
                return CommandLine.defaultFactory().create(cls);
            }
        };
    }

    @Test
    public void testForValidBurstArguments() {
        // Using the new command structure - "burst" instead of "-f"
        String[] args = new String[] { "burst", PAYSLIPS_REPORT_PATH };
        
        try {
            // Parse arguments first
            CommandLine cmd = new CommandLine(program, createTestFactory());
            cmd.parseArgs(args);
            
            // Get the burst command
            MainProgram.BurstCommand burstCommand = cmd.getSubcommands().get("burst").getCommand();
            
            // Call directly to allow exceptions to propagate
            burstCommand.call();
            
            // If we get here, the test failed
            fail("It should not come here and it should fail with IOException since the ./temp folder does not exist");
        } catch (Exception e) {
            // Check that the exception chain contains something related to temp directory
            Throwable cause = findCauseWithTempMessage(e);
            assertNotNull("Expected exception with message containing 'temp'", cause);
            assertTrue("Exception should mention temp folder or job file", 
                cause.getMessage().contains("temp") || cause.getMessage().contains(".job"));
        }
    }

    @Test
    public void testForValidMergeArguments1() {
        // Using the new command structure - "document merge" instead of "-mf"
        String[] args = new String[] { "document", "merge", MERGE_FILE_PATH };
        
        try {
            // Parse arguments
            CommandLine cmd = new CommandLine(program, createTestFactory());
            cmd.parseArgs(args);
            
            // Get the merge command through the command hierarchy
            CommandLine documentCmd = cmd.getSubcommands().get("document");
            CommandLine mergeCmd = documentCmd.getSubcommands().get("merge");
            MainProgram.DocumentCommand.MergeCommand command = 
                (MainProgram.DocumentCommand.MergeCommand) mergeCmd.getCommand();
            
            // Call directly to allow exceptions to propagate
            command.call();
            
            // If we get here, the test failed
            fail("It should not come here and it should fail with IOException since the ./temp folder does not exist");
        } catch (Exception e) {
            Throwable cause = findCauseWithTempMessage(e);
            assertNotNull("Expected exception with message containing 'temp'", cause);
            assertTrue("Exception should mention temp folder or job file", 
                cause.getMessage().contains("temp") || cause.getMessage().contains(".job"));
        }
    }

    @Test
    public void testForValidMergeArguments2() {
        // Using the new command structure with output option
        String[] args = new String[] { "document", "merge", MERGE_FILE_PATH, "-o", "mergedTest.pdf" };
        
        try {
            // Parse arguments
            CommandLine cmd = new CommandLine(program, createTestFactory());
            cmd.parseArgs(args);
            
            // Get the merge command through the command hierarchy
            CommandLine documentCmd = cmd.getSubcommands().get("document");
            CommandLine mergeCmd = documentCmd.getSubcommands().get("merge");
            MainProgram.DocumentCommand.MergeCommand command = 
                (MainProgram.DocumentCommand.MergeCommand) mergeCmd.getCommand();
            
            // Call directly to allow exceptions to propagate
            command.call();
            
            // If we get here, the test failed
            fail("It should not come here and it should fail with IOException since the ./temp folder does not exist");
        } catch (Exception e) {
            Throwable cause = findCauseWithTempMessage(e);
            assertNotNull("Expected exception with message containing 'temp'", cause);
            assertTrue("Exception should mention temp folder or job file", 
                cause.getMessage().contains("temp") || cause.getMessage().contains(".job"));
        }
    }

    @Test
    public void testForValidMergeArguments3() {
        // Using the new command structure with output and burst options
        String[] args = new String[] { "document", "merge", MERGE_FILE_PATH, "-o", "mergedTest.pdf", "-b" };
        
        try {
            // Parse arguments
            CommandLine cmd = new CommandLine(program, createTestFactory());
            cmd.parseArgs(args);
            
            // Get the merge command through the command hierarchy
            CommandLine documentCmd = cmd.getSubcommands().get("document");
            CommandLine mergeCmd = documentCmd.getSubcommands().get("merge");
            MainProgram.DocumentCommand.MergeCommand command = 
                (MainProgram.DocumentCommand.MergeCommand) mergeCmd.getCommand();
            
            // Call directly to allow exceptions to propagate
            command.call();
            
            // If we get here, the test failed
            fail("It should not come here and it should fail with IOException since the ./temp folder does not exist");
        } catch (Exception e) {
            Throwable cause = findCauseWithTempMessage(e);
            assertNotNull("Expected exception with message containing 'temp'", cause);
            assertTrue("Exception should mention temp folder or job file", 
                cause.getMessage().contains("temp") || cause.getMessage().contains(".job"));
        }
    }
    
    /**
     * Helper method to find a cause in the exception chain that has a message containing "temp"
     */
    private Throwable findCauseWithTempMessage(Throwable e) {
        Throwable cause = e;
        while (cause != null) {
            if (cause.getMessage() != null && 
                (cause.getMessage().contains("temp") || cause.getMessage().contains(".job"))) {
                return cause;
            }
            cause = cause.getCause();
        }
        return null;
    }
}