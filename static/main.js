// Get references to HTML elements
const startQuizBtn = document.getElementById('startQuizBtn');
const quizDisplay = document.getElementById('quizDisplay');
const questionText = document.getElementById('questionText');
const questionDetails = document.getElementById('questionDetails');
const answerInput = document.getElementById('answerInput');
const submitBtn = document.getElementById('submitBtn');
const feedback = document.getElementById('feedback');
const nextQuestionBtn = document.getElementById('nextQuestionBtn');
const loading = document.getElementById('loading');

// Store current quiz data
let currentQuiz = null;

// Start quiz event listener
startQuizBtn.addEventListener('click', startNewQuiz);

// Submit answer event listener
submitBtn.addEventListener('click', submitAnswer);

// Next question event listener
nextQuestionBtn.addEventListener('click', startNewQuiz);

// Enter key event listener for input field
answerInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        if (submitBtn.style.display !== 'none') {
            submitAnswer();
        } else if (nextQuestionBtn.style.display !== 'none') {
            startNewQuiz();
        }
    }
});

async function startNewQuiz() {
    // Show loading, hide previous results
    loading.style.display = 'block';
    quizDisplay.style.display = 'none';
    feedback.style.display = 'none';
    nextQuestionBtn.style.display = 'none';
    
    try {
        // Make request to get quiz question
        const response = await fetch('/quiz-question');
        const data = await response.json();
        
        // Hide loading
        loading.style.display = 'none';
        
        if (data.error) {
            questionText.textContent = 'Error loading quiz';
            questionDetails.textContent = data.error;
        } else {
            // Store quiz data
            currentQuiz = data;
            
            // Display the question
            questionText.textContent = `What is the ${data.target_case}, ${data.target_quantity} of "${data.base_word}"?`;
            questionDetails.innerHTML = `
                <strong>Base word:</strong> ${data.base_word}<br>
                <strong>Target case:</strong> ${data.target_case}<br>
                <strong>Target quantity:</strong> ${data.target_quantity}<br>
                <strong>Declension:</strong> ${data.declension}<br>
                <strong>Gender:</strong> ${data.gender}
            `;
            
            // Reset input and show submit button
            answerInput.value = '';
            submitBtn.style.display = 'inline-block';
        }
        
        // Show the quiz display
        quizDisplay.style.display = 'block';
        
        // Focus input field after quiz display is shown
        if (currentQuiz) {
            answerInput.focus();
        }
        
    } catch (error) {
        loading.style.display = 'none';
        questionText.textContent = 'Error';
        questionDetails.textContent = 'Failed to fetch quiz question from server';
        quizDisplay.style.display = 'block';
    }
}

async function submitAnswer() {
    if (!currentQuiz || !answerInput.value.trim()) {
        return;
    }
    
    const userAnswer = answerInput.value.trim();
    
    try {
        // Send answer to server for validation
        const response = await fetch('/check-answer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                answer: userAnswer,
                correct_answer: currentQuiz.correct_answer
            })
        });
        
        const result = await response.json();
        
        // Show feedback
        feedback.style.display = 'block';
        feedback.className = 'feedback ' + (result.correct ? 'correct' : 'incorrect');
        
        if (result.correct) {
            feedback.innerHTML = `
                <strong>✅ Correct!</strong><br>
                Your answer: "${result.user_answer}"
            `;
        } else {
            feedback.innerHTML = `
                <strong>❌ Incorrect</strong><br>
                Your answer: "${result.user_answer}"<br>
                Correct answer: "${result.correct_answer}"
            `;
        }
        
        // Hide submit button, show next question button
        submitBtn.style.display = 'none';
        nextQuestionBtn.style.display = 'inline-block';
        nextQuestionBtn.focus();
        
    } catch (error) {
        feedback.style.display = 'block';
        feedback.className = 'feedback incorrect';
        feedback.textContent = 'Error checking answer. Please try again.';
    }
}
