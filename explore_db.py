import sqlite3

# Connect to the database
conn = sqlite3.connect('valy.sqlite3')
cursor = conn.cursor()

# Get all table names
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()
print("Tables in the database:")
for table in tables:
    print(f"  - {table[0]}")

# For each table, show its structure and a few sample rows
for table in tables:
    table_name = table[0]
    print(f"\n--- Table: {table_name} ---")
    
    # Get column info
    cursor.execute(f"PRAGMA table_info({table_name})")
    columns = cursor.fetchall()
    print("Columns:")
    for col in columns:
        print(f"  {col[1]} ({col[2]})")
    
    # Get sample data (first 3 rows)
    cursor.execute(f"SELECT * FROM {table_name} LIMIT 3")
    rows = cursor.fetchall()
    print("Sample data:")
    for row in rows:
        print(f"  {row}")
    
    # Get total count
    cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
    count = cursor.fetchone()[0]
    print(f"Total rows: {count}")

conn.close()
