import vanna as vn
import os

def connect_from_env():
    """
    Connects Vanna to a database using only environment variables based on
    the ServerDatabaseSettings model.
    """
    db_type = os.getenv('DB_TYPE')
    if not db_type:
        raise ValueError("DB_TYPE environment variable must be set to specify the database.")

    db_type = db_type.lower()
    
    # Use DB_DATABASE or db_type as a default model name for Vanna
    model_name = os.getenv('DB_DATABASE', db_type)

    # Mapping from Vanna's connection function arguments to environment variables
    env_map = {
        'host': os.getenv('DB_HOST'),
        'port': os.getenv('DB_PORT'),
        'db': os.getenv('DB_DATABASE'),
        'user': os.getenv('DB_USERID'),
        'password': os.getenv('DB_USERPASSWORD'),
        'path': os.getenv('DB_CONNECTIONSTRING')  # Used for file-based DBs like SQLite
    }

    # Filter out unset environment variables to avoid passing None to Vanna
    config = {key: value for key, value in env_map.items() if value is not None}

    print(f"Attempting to connect to database type '{db_type}' using environment variables.")

    # Map the database type string to the corresponding Vanna connection function
    connection_map = {
        'sqlite': vn.connect_to_sqlite,
        'mysql': vn.connect_to_mysql,
        'postgres': vn.connect_to_postgres,
        'sqlserver': vn.connect_to_sqlserver,
        'oracle': vn.connect_to_oracle,
        'ibm_db2': vn.connect_to_ibm_db2,
    }

    connect_function = connection_map.get(db_type)

    if connect_function:
        # Call the appropriate connection function with the collected config
        connect_function(**config)
        print(f"Successfully connected to {db_type} database.")
        
        # Set a model name for vector storage separation
        vn.set_model(model_name)
        print(f"Vanna model set to: '{model_name}'")
    else:
        raise NotImplementedError(f"Database type '{db_type}' is not supported.")
