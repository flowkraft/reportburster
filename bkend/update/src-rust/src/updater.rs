use std::process::Command;
use std::fs;

pub fn do_kill_old_exe_then_copy_and_start_new_exe(job: &crate::main::Job) -> std::io::Result<()> {
    // Kill the old process
    Command::new("pkill")
        .arg("-f")
        .arg(&job.old_exe_path)
        .output()
        .expect("Failed to kill old process");

    // Remove the old executable
    fs::remove_file(&job.old_exe_path)?;

    // Copy the new executable to the old location
    fs::copy(&job.new_exe_path, &job.old_exe_path)?;

    // Start the new process
    Command::new(&job.old_exe_path)
        .spawn()
        .expect("Failed to start new process");

    Ok(())
}