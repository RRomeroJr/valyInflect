// Import mapping functions and data
import { valueMappings, defaultSelections, mapValues, getDisplayValue } from './searchMaps.js';
import { nounFilters, displayQuizQuestion, makeNounParams, generateNounFilterElements } from './nouns.js';

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

// Store current quiz data
let currentQuiz = null;

// Initialize toolbar functionality
function initializeToolbar() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    // Apply default selections
    filterButtons.forEach(button => {
        const category = button.dataset.category;
        const value = button.dataset.value;
        
        if (defaultSelections[category] && defaultSelections[category].includes(value)) {
            button.classList.add('selected');
        }
        
        // Add click event listener
        button.addEventListener('click', function() {
            // Toggle selection
            this.classList.toggle('selected');
            
            // Log current filter state
            console.log('Selected filters:', getSelectedFilters());
        });
    });
    
    console.log('Default filters applied:', getSelectedFilters());
}

/**
 * Collects all selected filter values from the sidebar
 * @returns {Object} An object where keys are filter categories and values are arrays of selected values
 */
function getFilters() {
    const filters = {};
    
    // Find all button groups in the filter section
    const buttonGroups = document.querySelectorAll('#filter-section .button-group');
    
    buttonGroups.forEach(group => {
        const category = group.dataset.category;
        if (!category) return;
        
        // Get all selected buttons in this group
        const selectedButtons = group.querySelectorAll('.filter-btn.selected');
        const selectedValues = Array.from(selectedButtons).map(btn => btn.dataset.value);
        
        filters[category] = selectedValues;
    });
    
    return filters;
}

// Function to populate filter buttons based on word type
function populateFiltersForWordType(wordType) {
    // Clear existing filter sections (except wordType)
    const existingSections = practiceToolbar.querySelectorAll('.filter-section:not(:nth-of-type(1))');
    existingSections.forEach(section => section.remove());
    
    if (wordType === 'noun') {
        // Get filter elements from nouns.js
        const filterElements = generateNounFilterElements();
        
        // Append all filter elements to the practice toolbar
        filterElements.forEach(element => {
            practiceToolbar.appendChild(element);
        });
    }
    // Add other word type conditions here when needed
}

// Add event listener for word type buttons
function initializeWordTypeButtons() {
    const wordTypeButtons = document.querySelectorAll('[data-category="wordType"] .filter-btn');
    wordTypeButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove selected class from all word type buttons
            wordTypeButtons.forEach(btn => btn.classList.remove('selected'));
            // Add selected class to clicked button
            this.classList.add('selected');
            // Populate filters for the selected word type
            populateFiltersForWordType(this.dataset.value);
        });
    });
}

// Initialize toolbar when page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeToolbar();
    initializeWordTypeButtons();
    // Initialize with noun filters by default
    const nounButton = document.querySelector('[data-category="wordType"] [data-value="noun"]');
    // if (nounButton) {
    //     nounButton.click();
    // }
});

startQuizBtn.addEventListener('click', startNewQuiz);
submitBtn.addEventListener('click', submitAnswer);
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
    
    // Get current filters from the UI
    const currentFilters = getSelectedFilters();
    console.log('Current filters:', JSON.stringify(currentFilters, null, 2));
    
    try {
        // Build query parameters from selected filters
        // Later we will need to check the word type (noun, adj, etc.)
        // and use the appropriate param generation function here.
        const _selectedFilters = getSelectedFilters();
        let params = null
        if (_selectedFilters["wordType"] === 'noun') {
            params = makeNounParams(currentFilters);
        } else if (_selectedFilters.wordType === 'adjective') {
            throw new Error('Adjective not implemented yet');   
        } else{
            console.error('Word type not found in selected filters', _selectedFilters);
            throw new Error('Word type not found in selected filters', _selectedFilters);
        }
        
        // Make request to get quiz question with filters
        const url = `/noun-quiz-question?${params.toString()}`;
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
            return;
        }
        
        // Store and display quiz data using the imported function
        // Later we will need to check the word type (noun, adj, etc.)
        // and use the appropriate display function here.
        let currentQuiz = null;
        if (_selectedFilters.wordType === 'noun') {
        currentQuiz = displayQuizQuestion(data, questionText, questionDetails);
        } else if (_selectedFilters.wordType === 'adjective') {
            throw new Error('Adjective not implemented yet');
        } else{
            console.error('Somehow reached displayQuizQuestion with unknown word type', _selectedFilters);
            throw new Error('Somehow reached displayQuizQuestion with unknown word type');
        }
        // Reset input and show submit button
        answerInput.value = '';
        submitBtn.style.display = 'inline-block';
        
        // Show the practice toolbar and quiz display
        console.log('Showing toolbar and quiz display');
        // practiceToolbar.style.display = 'block';
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
    let normalized = text.toLowerCase();

    // Replace double vowels with macronized versions
    const replacements = {'aa': 'ā', 'ii': 'ī', 'ee': 'ē', 'oo': 'ō', 'uu': 'ū', 'yy': 'ȳ'};
    
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
    const correctAnswer = currentQuiz.form || '';
    
    try {
        // Normalize both answers for comparison
        const normalizedUserAnswer = normalizeText(userAnswer);
        const normalizedCorrectAnswer = normalizeText(correctAnswer);
        
        // Compare the normalized answers case-insensitively
        const isCorrect = normalizedUserAnswer.toLowerCase() === correctAnswer.toLowerCase();
        
        // Show feedback
        feedback.style.display = 'block';
        feedback.className = 'feedback ' + (isCorrect ? 'correct' : 'incorrect');
        
        if (isCorrect) {
            feedback.innerHTML = `
                <strong>✅ Correct!</strong><br>
                Your answer: "${userAnswer}"
            `;
        } else {
            feedback.innerHTML = `
                <strong>❌ Incorrect</strong><br>
                Your answer: "${userAnswer}"<br>
                Correct answer: "${correctAnswer}"
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

function getSelectedFilters() {
    const selectedFilters = {};
    
    // Get all button groups with data-category attribute
    const buttonGroups = practiceToolbar.querySelectorAll('.button-group[data-category]');
    
    buttonGroups.forEach(group => {
        const category = group.dataset.category;
        if (category === 'wordType'){ // Only one button can be selected for wordType
            const selectedButtons = group.querySelector('.filter-btn.selected');
            if (selectedButtons){
                selectedFilters[category] = selectedButtons.dataset.value;
            }
        } else { // Anything else get all the selected buttons
            const selectedButtons = group.querySelectorAll('.filter-btn.selected');
            selectedFilters[category] = Array.from(selectedButtons).map(button => button.dataset.value);
        }
    });
    
    return selectedFilters;
}
console.log("Selected Filters:", getSelectedFilters());