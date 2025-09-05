import sqlite3
import random, logging
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, RedirectResponse

app = FastAPI()

# Mount static files (for serving HTML, CSS, JS)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Database connection function
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

def get_quiz_question(cases=None, quantities=None, declensions=None, genders=None):
    """Get a quiz question with optional filters for case, quantity, declension, and gender"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Build the base query with filters
    query = """
        SELECT DISTINCT n.id, n.base, n.declen, n.gender
        FROM nouns n
        JOIN noun_forms nf ON n.id = nf.noun_id
        WHERE nf.form != n.base
    """
    
    params = []
    
    # Add filters if they are provided
    if cases and len(cases) > 0:
        placeholders = ",".join(["?"] * len(cases))
        query += f" AND nf.g_case IN ({placeholders})"
        params.extend(cases)
    
    if quantities and len(quantities) > 0:
        placeholders = ",".join(["?"] * len(quantities))
        query += f" AND nf.quant IN ({placeholders})"
        params.extend(quantities)
    
    if declensions and len(declensions) > 0:
        placeholders = ",".join(["?"] * len(declensions))
        query += f" AND n.declen IN ({placeholders})"
        params.extend(declensions)  # Use the string values directly ('1st', '2nd', etc.)
    
    if genders and len(genders) > 0:
        placeholders = ",".join(["?"] * len(genders))
        query += f" AND n.gender IN ({placeholders})"
        params.extend(genders)
    
    # Add ordering and limit
    query += " ORDER BY RANDOM() LIMIT 1"
    
    # Execute the query
    cursor.execute(query, params)
    base_result = cursor.fetchone()
    
    if not base_result:
        conn.close()
        return None
    
    # Get a random form of this noun that matches the filters
    form_query = """
        SELECT nf.form, nf.g_case, nf.quant
        FROM noun_forms nf
        WHERE nf.noun_id = ? AND nf.form != ?
    """
    
    form_params = [base_result["id"], base_result["base"]]
    
    # Add the same filters to the form query
    if cases and len(cases) > 0:
        placeholders = ",".join(["?"] * len(cases))
        form_query += f" AND nf.g_case IN ({placeholders})"
        form_params.extend(cases)
    
    if quantities and len(quantities) > 0:
        placeholders = ",".join(["?"] * len(quantities))
        form_query += f" AND nf.quant IN ({placeholders})"
        form_params.extend(quantities)
    
    form_query += " ORDER BY RANDOM() LIMIT 1"
    
    cursor.execute(form_query, form_params)
    
    form_result = cursor.fetchone()
    conn.close()
    
    if form_result:
        return {
            "base_word": base_result["base"],
            "target_case": form_result["g_case"],
            "target_quantity": form_result["quant"],
            "correct_answer": form_result["form"],
            "declension": base_result["declen"],
            "gender": base_result["gender"]
        }
    return None

@app.get("/favicon.ico")
def favicon():
    return {"message": "No favicon"}

@app.get("/")
def read_root():
    """Redirect to static HTML page"""
    return RedirectResponse(url="/static/index.html")

@app.get("/random-word")
def get_random_valyrian_word():
    """API endpoint that returns a random Valyrian word"""
    word_data = get_random_word()
    if word_data:
        return word_data
    else:
        return {"error": "No word found"}

@app.get("/quiz-question")
async def get_quiz(
    cases: str = "",
    quantities: str = "",
    declensions: str = "",
    genders: str = ""
):
    """API endpoint that returns a quiz question with optional filters
    
    Parameters:
    - cases: Comma-separated list of cases to include (e.g., 'nom,acc')
    - quantities: Comma-separated list of quantities to include (e.g., 'sing,pl')
    - declensions: Comma-separated list of declensions to include (e.g., '1st,2nd,3rd')
    - genders: Comma-separated list of genders to include (e.g., 'lunar,solar')
    """
    try:
        # Convert comma-separated strings to lists, filtering out empty strings
        case_list = [c.strip() for c in cases.split(",") if c.strip()]
        quantity_list = [q.strip() for q in quantities.split(",") if q.strip()]
        declension_list = [d.strip() for d in declensions.split(",") if d.strip()]
        gender_list = [g.strip() for g in genders.split(",") if g.strip()]
        
        logging.info(f"Fetching quiz question with filters - cases: {case_list}, quantities: {quantity_list}, "
                   f"declensions: {declension_list}, genders: {gender_list}")
        
        quiz_data = get_quiz_question(
            cases=case_list,
            quantities=quantity_list,
            declensions=declension_list,
            genders=gender_list
        )
        
        if quiz_data:
            logging.info(f"Found quiz question: {quiz_data}")
            return quiz_data
        else:
            # Log the actual database query that was run
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Check if we have any noun_forms at all
            cursor.execute("SELECT COUNT(*) FROM noun_forms")
            total_forms = cursor.fetchone()[0]
            
            # Check if we have any matching the filters
            query = "SELECT COUNT(*) FROM noun_forms nf JOIN nouns n ON nf.noun_id = n.id WHERE 1=1"
            params = []
            
            if case_list:
                placeholders = ",".join(["?"] * len(case_list))
                query += f" AND nf.g_case IN ({placeholders})"
                params.extend(case_list)
                
            if quantity_list:
                placeholders = ",".join(["?"] * len(quantity_list))
                query += f" AND nf.quant IN ({placeholders})"
                params.extend(quantity_list)
                
            if declension_list:
                placeholders = ",".join(["?"] * len(declension_list))
                query += f" AND n.declen IN ({placeholders})"  # Using n.declen which matches the table alias in the FROM clause
                params.extend(declension_list)  # Use the string values directly ('1st', '2nd', etc.)
                
            if gender_list:
                placeholders = ",".join(["?"] * len(gender_list))
                query += f" AND n.gender IN ({placeholders})"
                params.extend(gender_list)
            
            cursor.execute(query, params)
            matching_forms = cursor.fetchone()[0]
            conn.close()
            
            _msg = (f"No matching quiz question found. Total forms: {total_forms}, "
                   f"Matching filters: {matching_forms}. Query: {query} with params {params}")
            logging.error(_msg)
            
            return {
                "error": "No matching quiz question found with the selected filters. "
                        "Please try different filter combinations.",
                "debug": {
                    "total_forms_in_database": total_forms,
                    "matching_forms": matching_forms,
                    "filters_applied": {
                        "cases": case_list,
                        "quantities": quantity_list,
                        "declensions": declension_list,
                        "genders": gender_list
                    }
                }
            }
            
    except Exception as e:
        logging.exception("Error in /quiz-question endpoint")
        return {
            "error": "An error occurred while fetching a quiz question",
            "details": str(e)
        }

@app.post("/check-answer")
def check_answer(answer_data: dict):
    """API endpoint to check if the user's answer is correct"""
    user_answer = answer_data.get("answer", "").strip().lower()
    correct_answer = answer_data.get("correct_answer", "").strip().lower()
    
    is_correct = user_answer == correct_answer
    
    return {
        "correct": is_correct,
        "user_answer": answer_data.get("answer", ""),
        "correct_answer": answer_data.get("correct_answer", "")
    }

if __name__ == "__main__":
    import uvicorn
    import os
    
    # Get port from environment variable (for hosting platforms) or default to 8000
    port = int(os.environ.get("PORT", 8000))
    
    # Run the app
    uvicorn.run(app, host="0.0.0.0", port=port)