import sqlite3
import random, logging, sys
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, RedirectResponse

app = FastAPI()

# Mount static files (for serving HTML, CSS, JS)
app.mount("/static", StaticFiles(directory="static"), name="static")
@app.get("/favicon.ico")
def favicon():
    return {"message": "No favicon"}
# Database connection function
def get_foreign_key_column(target_table: str, foreign_table: str) -> str:
    """
    Find the column in target_table that is a foreign key pointing to foreign_table.
    
    Args:
        target_table: The name of the table that should contain the foreign key
        foreign_table: The name of the referenced table
        
    Returns:
        str: The name of the column in target_table that is a foreign key to foreign_table,
             or None if no such relationship is found.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # SQLite pragma to get foreign key information
        cursor.execute(f"PRAGMA foreign_key_list({target_table})")
        fk_info = cursor.fetchall()
        
        for fk in fk_info:
            # fk[2] is the referenced table name in the foreign key constraint
            if fk[2].lower() == foreign_table.lower():
                # fk[3] is the column in the target table that's a foreign key
                return fk[3]
                
        # Also check for implicit foreign keys by column name convention
        cursor.execute(f"PRAGMA table_info({target_table})")
        columns = cursor.fetchall()
        
        # Common foreign key naming convention: tablename_id or tablenameId
        possible_fk_columns = [
            f"{foreign_table.lower()}_id",
            f"{foreign_table.lower()}id",
            f"{foreign_table.lower()}_fk"
        ]
        
        for col in columns:
            if col[1].lower() in possible_fk_columns:
                return col[1]
                
        return None
        
    except sqlite3.Error as e:
        logging.error(f"Error finding foreign key: {e}")
        return None
    finally:
        conn.close()

def get_db_connection():
    """Create and return a database connection"""
    conn = sqlite3.connect('valy.sqlite3')
    conn.row_factory = sqlite3.Row  # This lets us access columns by name
    return conn

def get_random_word():
    """Get a random Valyrian word with its information"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get a random noun with its base form
    cursor.execute("""
        SELECT n.id, n.base, n.declen, n.gender,
               nf.form, nf.g_case, nf.quant
        FROM nouns n
        JOIN noun_forms nf ON n.id = nf.noun_id
        ORDER BY RANDOM()
        LIMIT 1
    """)
    
    result = cursor.fetchone()
    conn.close()
    
    if result:
        return {
            "word": result["form"],
            "base": result["base"],
            "declension": result["declen"],
            "gender": result["gender"],
            "g_case": result["g_case"],
            "quant": result["quant"],
            "type": "noun"
        }
    return None

def get_noun_form(cases=None, quants=None, declens=None, genders=None):
    """Get a quiz question with optional filters for case, quantity, declension, and gender"""
    args = locals()
    print(args)
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Build the base query with filters
    query = """
        SELECT DISTINCT n.id, n.base, n.declen, n.gender, nf.g_case, nf.quant, nf.form
        FROM nouns n
        JOIN noun_forms nf ON n.id = nf.noun_id
        WHERE nf.form != n.base
    """
    
    params = []
    for k,v in args.items():
        if args[k] and len(args[k]) > 0:
            table = "noun_forms"
            short = "nf"
            fk = get_foreign_key_column(table, k)
            if not fk:
                table = "nouns"
                short = "n"
                fk = get_foreign_key_column(table, k)
            if not fk:
                conn.close()
                logging.error(f"No noun related foreign key found for {k}")
                return None
            print(args[k], len(args[k]))
            placeholders = ",".join(["?"] * len(args[k]))
            query += f" AND {short}.{fk} IN ({placeholders})"
            params.extend(args[k])
    
    # Add ordering and limit
    query += " ORDER BY RANDOM() LIMIT 1"
    
    # Execute the query
    cursor.execute(query, params)
    base_result = cursor.fetchone()
    
    conn.close()
    if not base_result:
        logging.error(f"No noun found with following query:\n{query}")
        return None
    
    return base_result

@app.get("/")
def read_root():
    """Redirect to static HTML page"""
    return RedirectResponse(url="/static/index.html?v=" + str(random.random()))

@app.get("/random-word")
def get_random_valyrian_word():
    """API endpoint that returns a random Valyrian word"""
    word_data = get_random_word()
    if word_data:
        return word_data
    else:
        return {"error": "No word found"}
@app.get("/noun-quiz-question")
async def get_noun_quiz(
    cases: str = "",
    quants: str = "",
    declens: str = "",
    genders: str = ""
):
    """API endpoint that returns a quiz question with optional filters
    
    Parameters:
    - cases: Comma-separated list of cases to include (e.g., 'nom,acc')
    - quants: Comma-separated list of quantities to include (e.g., 'sing,pl')
    - declens: Comma-separated list of declensions to include (e.g., '1st,2nd,3rd')
    - genders: Comma-separated list of genders to include (e.g., 'lun,sol')
    """
    try:
        # Convert comma-separated strings to lists, filtering out empty strings
        case_list = [c.strip() for c in cases.split(",") if c.strip()]
        quantity_list = [q.strip() for q in quants.split(",") if q.strip()]
        declension_list = [d.strip() for d in declens.split(",") if d.strip()]
        gender_list = [g.strip() for g in genders.split(",") if g.strip()]
        
        logging.info(f"Fetching quiz question with filters - cases: {case_list}, quantities: {quantity_list}, "
                   f"declensions: {declension_list}, genders: {gender_list}")
        
        quiz_data = get_noun_form(
            cases=case_list,
            quants=quantity_list,
            declens=declension_list,
            genders=gender_list
        )
        
        if quiz_data:
            logging.info(f"Found quiz question: {quiz_data}")
            return quiz_data
    except Exception as e:
        logging.exception("Error in /quiz-question endpoint")
        return {
            "error": "An error occurred while fetching a quiz question",
            "details": str(e)
        }

def get_adj_form(adj_classes=None, adj_positions=None, genders=None, quants=None, cases=None, adj_d_types=None):
    """Get an adjective quiz question with optional filters"""
    args = locals()
    print(args)
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Build the base query with filters
    query = """
        SELECT DISTINCT a.id, a.base, a.class as class, af.form, af.pos, af.gender,
        af.quant, af.g_case, af.d_type
        FROM adjs a
        JOIN adj_forms af ON a.id = af.adj_id
        WHERE af.form != a.base
    """
    params = []
    for k,v in args.items():
        if args[k] and len(args[k]) > 0:
            table = "adj_forms"
            short = "af"
            fk = get_foreign_key_column(table, k)
            if not fk:
                table = "adjs"
                short = "a"
                fk = get_foreign_key_column(table, k)
            if not fk:
                conn.close()
                logging.error(f"No adjective related foreign key found for {k}")
                return None
            placeholders = ",".join(["?"] * len(args[k]))
            query += f" AND {short}.{fk} IN ({placeholders})"
            params.extend(args[k])
    
    query += " ORDER BY RANDOM() LIMIT 1"
    cursor.execute(query, params)
    base_result = cursor.fetchone()
    
    conn.close()
    if not base_result:
        logging.error(f"No adjective found with following query:\n{query}\n{params}")
        return None
    
    return base_result

@app.get("/adj-quiz-question")
async def get_adj_quiz(
    classes: str = "",
    positions: str = "",
    genders: str = "",
    quants: str = "",
    cases: str = "",
    adj_d_types: str = ""
):
    """API endpoint that returns an adjective quiz question with optional filters
    
    Parameters:
    - classes: Comma-separated list of adjective classes to include (e.g., '1,2,3')
    - positions: Comma-separated list of positions to include (e.g., 'pre,post')
    - genders: Comma-separated list of genders to include (e.g., 'lun,sol')
    - quants: Comma-separated list of quantities to include (e.g., 'sing,pl')
    - cases: Comma-separated list of cases to include (e.g., 'nom,acc')
    - adj_d_types: Comma-separated list of adjective degree types (e.g., 'pos,comp,super')
    """
    try:
        # Convert comma-separated strings to lists and filter out empty strings
        class_list = [c.strip() for c in classes.split(",") if c.strip()]
        position_list = [p.strip() for p in positions.split(",") if p.strip()]
        gender_list = [g.strip() for g in genders.split(",") if g.strip()]
        quantity_list = [q.strip() for q in quants.split(",") if q.strip()]
        case_list = [c.strip() for c in cases.split(",") if c.strip()]
        adj_d_type_list = [d.strip() for d in adj_d_types.split(",") if d.strip()]
        
        print(f"Fetching adjective quiz question with filters - classes: {class_list}, "
                   f"positions: {position_list}, genders: {gender_list}, quantities: {quantity_list}, "
                   f"cases: {case_list}, adj_d_types: {adj_d_type_list}")
        
        quiz_data = get_adj_form(
            adj_classes=class_list,
            adj_positions=position_list,
            genders=gender_list,
            quants=quantity_list,
            cases=case_list,
            adj_d_types=adj_d_type_list
        )
        
        if quiz_data:
            logging.info(f"Found adjective quiz question: {quiz_data}")
            return quiz_data
    except Exception as e:
        logging.exception("Error in /adj-quiz-question endpoint")
        return {
            "error": "An error occurred while fetching an adjective quiz question",
            "details": str(e)
        }
if __name__ == "__main__":

    # print(get_foreign_key_column("adj_forms", "adj_positions"))
    # print(COLUMN_TABLES["id"])
    # print(get_adj_quiz_question(cases=["voc"]))
    # sys.exit()
    
    import uvicorn
    import os
    
    # Get port from environment variable (for hosting platforms) or default to 8000
    port = int(os.environ.get("PORT", 8000))
    
    # Run the app
    # uvicorn.run(app, host="127.0.0.1", port=port)
    uvicorn.run(app, host="0.0.0.0", port=port)