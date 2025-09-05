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
const practiceToolbar = document.getElementById('practiceToolbar');

// Store current quiz data and selected filters
let currentQuiz = null;
let selectedFilters = {
    case: [],
    quantity: [],
    declension: [],
    gender: []
};

// Initialize toolbar functionality
function initializeToolbar() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    // Set default selections
    const defaultSelections = {
        case: ['nominative', 'accusative', 'genitive', 'dative', 'locative', 'instrumental', 'comitative', 'vocative'],
        quantity: ['singular', 'plural'],
        declension: ['1st', '2nd', '3rd', '4th', '5th', '6th'],
        gender: ['lunar', 'solar', 'terrestrial', 'aquatic']
    };
    
    // Apply default selections
    filterButtons.forEach(button => {
        const category = button.dataset.category;
        const value = button.dataset.value;
        
        if (defaultSelections[category] && defaultSelections[category].includes(value)) {
            button.classList.add('selected');
            if (!selectedFilters[category].includes(value)) {
                selectedFilters[category].push(value);
            }
        }
        
        // Add click event listener
        button.addEventListener('click', function() {
            // Toggle selection
            this.classList.toggle('selected');
            
            // Update selectedFilters array
            if (this.classList.contains('selected')) {
                if (!selectedFilters[category].includes(value)) {
                    selectedFilters[category].push(value);
                }
            } else {
                const index = selectedFilters[category].indexOf(value);
                if (index > -1) {
                    selectedFilters[category].splice(index, 1);
                }
            }
            
            console.log('Selected filters:', selectedFilters);
        });
    });
    
    console.log('Default filters applied:', selectedFilters);
}

// Initialize toolbar when page loads
document.addEventListener('DOMContentLoaded', initializeToolbar);

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
        
        // Show the practice toolbar and quiz display
        console.log('Showing toolbar and quiz display');
        practiceToolbar.style.display = 'block';
        quizDisplay.style.display = 'block';
        console.log('Toolbar display style:', practiceToolbar.style.display);
        
        // Focus input field after quiz display is shown
        if (currentQuiz) {
            answerInput.focus();
        }
        
    } catch (error) {
        loading.style.display = 'none';
        questionText.textContent = 'Error';
        questionDetails.textContent = 'Failed to fetch quiz question from server';
        practiceToolbar.style.display = 'block';
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
