// Import mapping functions and data
import { valueMappings, defaultSelections, mapValues, getDisplayValue } from './searchMaps.js';

// Get references to HTML elements
//#region HTML Element References
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
//#endregion

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
    console.log('startNewQuiz called');
    // Show loading, hide previous results
    loading.style.display = 'block';
    quizDisplay.style.display = 'none';
    feedback.style.display = 'none';
    nextQuestionBtn.style.display = 'none';
    
    // Log the current state of selected filters
    console.log('Selected filters:', JSON.stringify(selectedFilters, null, 2));
    
    try {
        // Build query parameters from selected filters
        const params = new URLSearchParams();
        
        // Only add parameters that have selected values
        if (selectedFilters.case.length > 0) {
            const dbCases = mapValues('case', selectedFilters.case, true);
            console.log(`Mapping case values: ${selectedFilters.case} -> ${dbCases}`);
            params.append('cases', dbCases.join(','));
        }
        if (selectedFilters.quantity.length > 0) {
            const dbQuantities = mapValues('quantity', selectedFilters.quantity, true);
            console.log(`Mapping quantity values: ${selectedFilters.quantity} -> ${dbQuantities}`);
            params.append('quantities', dbQuantities.join(','));
        }
        if (selectedFilters.declension.length > 0) {
            params.append('declensions', selectedFilters.declension.join(','));
        }
        if (selectedFilters.gender.length > 0) {
            const dbGenders = mapValues('gender', selectedFilters.gender, true);
            console.log(`Mapping gender values: ${selectedFilters.gender} -> ${dbGenders}`);
            params.append('genders', dbGenders.join(','));
        }
        
        // Make request to get quiz question with filters
        const url = `/quiz-question?${params.toString()}`;
        console.log('Fetching quiz question with URL:', url);
        
        let data;
        try {
            const response = await fetch(url);
            console.log('Received response, status:', response.status);
            if (!response.ok) {
                console.error('Error response:', response.status, response.statusText);
                const errorText = await response.text();
                console.error('Error details:', errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            data = await response.json();
            console.log('Received data:', data);
        } catch (error) {
            console.error('Error in fetch:', error);
            throw error; // Re-throw to be caught by the outer try-catch
        }
        
        // Hide loading
        loading.style.display = 'none';
        
        if (data && data.error) {
            console.error('Error from server:', data.error);
            questionText.textContent = 'Error loading quiz';
            questionDetails.textContent = data.error;
        } else {
            // Store quiz data
            currentQuiz = data;
            
            // Get display values using the mapping function
            const displayCase = getDisplayValue('case', data.target_case) || data.target_case;
            const displayQuantity = getDisplayValue('quantity', data.target_quantity) || data.target_quantity;
            const displayGender = getDisplayValue('gender', data.gender) || data.gender;
            
            // Display the question with abbreviated forms
            questionText.textContent = `What is the ${data.target_case}, ${data.target_quantity} of "${data.base_word}"?`;
            questionDetails.innerHTML = `
                <strong>Base word:</strong> ${data.base_word}<br>
                <strong>Target case:</strong> ${displayCase}<br>
                <strong>Target quantity:</strong> ${displayQuantity}<br>
                <strong>Declension:</strong> ${data.declension}<br>
                <strong>Gender:</strong> ${displayGender}
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
        throw error;
    }
}

function normalizeText(text) {
    if (!text) return '';
    
    // Convert to lowercase first
    let normalized = text.toLowerCase();
    
    // Replace double vowels with macronized versions
    const replacements = {
        'aa': 'ā',
        'ii': 'ī',
        'ee': 'ē',
        'oo': 'ō',
        'uu': 'ū', 
        'yy': 'ȳ'
    };
    
    // Replace all occurrences of double vowels
    for (const [pattern, replacement] of Object.entries(replacements)) {
        normalized = normalized.split(pattern).join(replacement);
    }
    
    // Return the normalized text with macronized vowels, preserving original case and diacritics
    return normalized;
}

function submitAnswer() {
    if (!currentQuiz || !answerInput.value.trim()) {
        return;
    }
    
    const userAnswer = answerInput.value.trim();
    const correctAnswer = currentQuiz.correct_answer || '';
    
    try {
        // Normalize both answers for comparison
        const normalizedUserAnswer = normalizeText(userAnswer);
        const normalizedCorrectAnswer = normalizeText(correctAnswer);
        
        // Compare the normalized answers case-insensitively
        const isCorrect = normalizedUserAnswer.toLowerCase() === correctAnswer.toLowerCase();
        
        // Create result object similar to what the server would return
        const result = {
            correct: isCorrect,
            user_answer: userAnswer,
            correct_answer: correctAnswer
        };
        
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
        throw error;
    }
}
