import zipfile

def unzip_file(zip_file_path, unzip_dir):
    with zipfile.ZipFile(zip_file_path, 'r') as zip_ref:
        zip_ref.extractall(unzip_dir)