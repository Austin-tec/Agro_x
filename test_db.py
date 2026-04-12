import os
from dotenv import load_dotenv
load_dotenv()
import psycopg2
try:
    conn = psycopg2.connect(os.getenv('DATABASE_URL'))
    print('✅ Neon DB is active and connected!')
    cur = conn.cursor()
    cur.execute('SELECT version();')
    version = cur.fetchone()
    print(f'DB Version: {version[0]}')
    
    # Check tables
    cur.execute('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\';')
    tables = cur.fetchall()
    print('Tables in DB:', [t[0] for t in tables])
    
    if 'waitlist' in [t[0] for t in tables]:
        cur.execute('SELECT COUNT(*) FROM waitlist;')
        count = cur.fetchone()[0]
        print(f'Waitlist entries: {count}')
    else:
        print('Waitlist table does not exist')
    
    cur.close()
    conn.close()
except Exception as e:
    print(f'❌ Error connecting to Neon DB: {e}')