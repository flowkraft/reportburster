use clap::Clap;
use serde::Deserialize;
use std::fs;
use std::process::exit;
use crate::updater::do_kill_old_exe_then_copy_and_start_new_exe;

#[derive(Debug, Deserialize)]
pub struct Job {
    old_exe_path: String,
    new_exe_path: String,
    temp_folder_path: String,
}

#[derive(Clap)]
#[clap(version = "1.0", author = "Your Name")]
struct Opts {
    #[clap(short, long, default_value = "default_job.xml")]
    job_file_path: String,
}

fn main() {
    let opts: Opts = Opts::parse();

    let file = fs::File::open(&opts.job_file_path).expect("Unable to open file");
    let job: Job = serde_xml_rs::from_reader(file).expect("Unable to deserialize XML");

    if let Err(e) = do_kill_old_exe_then_copy_and_start_new_exe(&job) {
        eprintln!("Error: {}", e);
        exit(1);
    }
}