import sqlite3
import random
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

def get_quiz_question():
    """Get a quiz question: base word and ask for specific case/quantity form"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get a random base noun
    cursor.execute("""
        SELECT DISTINCT n.id, n.base, n.declen, n.gender
        FROM nouns n
        ORDER BY RANDOM()
        LIMIT 1
    """)
    
    base_result = cursor.fetchone()
    if not base_result:
        conn.close()
        return None
    
    # Get a random form of this noun (excluding the base form itself)
    cursor.execute("""
        SELECT nf.form, nf.g_case, nf.quant
        FROM noun_forms nf
        WHERE nf.noun_id = ? AND nf.form != ?
        ORDER BY RANDOM()
        LIMIT 1
    """, (base_result["id"], base_result["base"]))
    
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
def get_quiz():
    """API endpoint that returns a quiz question"""
    quiz_data = get_quiz_question()
    if quiz_data:
        return quiz_data
    else:
        return {"error": "No quiz question found"}

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