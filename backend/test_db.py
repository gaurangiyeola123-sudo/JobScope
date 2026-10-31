from database import engine

try:
    with engine.connect() as connection:
        print("MySQL connection successful!")
        print("Connected to JobScope database.")

except Exception as error:
    print("Database connection failed:")
    print(error)