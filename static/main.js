// Import mapping functions and data
import { valueMappings, defaultSelections, mapValues, getDisplayValue } from './searchMaps.js?v=0.2';
import { nounFilters, nounFiltersPresets, displayQuizQuestion as displayNounQuizQuestion, makeNounParams, generateNounFilterElements } from './nouns.js?v=0.2';
import { adjFilters, adjFiltersPresets, displayAdjectiveQuizQuestion, makeAdjectiveParams, generateAdjectiveFilterElements } from './adjectives.js?v=0.2';

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

// Function to populate filter buttons based on word type
function populateFiltersForWordType(wordType) {
    // Clear existing filter sections (except wordType)
    const existingSections = practiceToolbar.querySelectorAll('.filter-section:not(:nth-of-type(1))');
    existingSections.forEach(section => section.remove());
    const filterContainer = practiceToolbar.querySelector('.filter-container');
    let filterElements = [];
    
    if (wordType === 'noun') {
        // Get filter elements from nouns.js
        filterElements = generateNounFilterElements();
    } else if (wordType === 'adjective') {
        // Get filter elements from adjectives.js
        filterElements = generateAdjectiveFilterElements();
    }
    
    // Append all filter elements to the practice toolbar
    filterElements.forEach(element => {
        filterContainer.appendChild(element);
    });
    
    // Apply default selections for the word type
    applyDefaultSelections(wordType);
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

// Function to apply default selections based on word type
function applyDefaultSelections(wordType) {
    let defaults = {};
    
    if (wordType === 'noun') {
        defaults = {
            ...defaultSelections,
            ...nounFiltersPresets
        };
    } else if (wordType === 'adjective') {
        defaults = {
            ...defaultSelections,
            ...adjFiltersPresets
        };
    }
    
    // Apply the defaults
    for (const [category, values] of Object.entries(defaults)) {
        if (Array.isArray(values)) {
            values.forEach(value => {
                const button = document.querySelector(`[data-category="${category}"][data-value="${value}"]`);
                if (button) {
                    button.classList.add('selected');
                }
            });
        }
    }
}

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
        // Build query parameters from selected filters based on word type
        const _selectedFilters = getSelectedFilters();
        let params = null;
        let endpoint = '';
        
        if (_selectedFilters.wordType === 'noun') {
            params = makeNounParams(currentFilters);
            endpoint = '/noun-quiz-question';
        } else if (_selectedFilters.wordType === 'adjective') {
            params = makeAdjectiveParams(currentFilters);
            endpoint = '/adj-quiz-question';
        } else {
            console.error('Unsupported word type in selected filters', _selectedFilters);
            throw new Error(`Unsupported word type: ${_selectedFilters.wordType}`);
        }
        
        // Make request to get quiz question with filters
        const url = `${endpoint}?${params.toString()}`;
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
        
        // Store and display quiz data based on word type
        currentQuiz = null;
        if (_selectedFilters.wordType === 'noun') {
            currentQuiz = displayNounQuizQuestion(data, questionText, questionDetails);
        } else if (_selectedFilters.wordType === 'adjective') {
            currentQuiz = displayAdjectiveQuizQuestion(data, questionText, questionDetails);
        } else {
            console.error('Unsupported word type in display function', _selectedFilters);
            throw new Error(`Unsupported word type in display function: ${_selectedFilters.wordType}`);
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
    // console.log('submitAnswer called');
    try {
        const correctAnswer = currentQuiz.form;
        const userAnswer = answerInput.value.trim();
        // Normalize both answers for comparison
        const normalizedUserAnswer = normalizeText(userAnswer);
        
        // Compare the normalized answers case-insensitively
        // const isCorrect = normalizedUserAnswer.toLowerCase() === correctAnswer.toLowerCase();
        const correctAnswers = correctAnswer.split("/").map(e => e.trim());
        console.log('Correct answers:', correctAnswers);
        const isCorrect =
            correctAnswers.some(e => e.toLowerCase() === normalizedUserAnswer.toLowerCase());
        
        // Show feedback
        feedback.style.display = 'block';
        feedback.className = 'feedback ' + (isCorrect ? 'correct' : 'incorrect');
        
        if (isCorrect) {
            feedback.innerHTML = `
                <strong>✅ Correct!</strong><br>
                Your answer: "${userAnswer}"<br>
                Correct answer: "${correctAnswer}"
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
        feedback.textContent = error.message;
        throw error;
    }
}

function getSelectedFilters() {
    const selectedFilters = {};
    
    // Get all button groups with data-category attribute
    const buttonGroups = practiceToolbar.querySelectorAll('.button-group[data-category]');
    // console.log('Button groups:', buttonGroups);
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

// Language configuration
let languageMode = 'en'; // Default language is English

/**
 * Applies localization to all elements based on the current language mode
 * Looks for elements with IDs or classes that match keys in localization.json
 */
async function applyLocalization() {
    try {
        // Fetch the localization data
        const response = await fetch('localization.json');
        const translations = await response.json();
        
        // Process each translation key
        Object.entries(translations).forEach(([key, languages]) => {
            const text = languages[languageMode];
            if (!text) return; // Skip if translation not available for current language
            
            // Try to find element by ID first
            const elementById = document.getElementById(key);
            if (elementById) {
                elementById.innerHTML = text; // Use innerHTML to support HTML content
                return;
            }
            
            // If no element with matching ID, try class
            const elementsByClass = document.getElementsByClassName(key);
            if (elementsByClass.length > 0) {
                Array.from(elementsByClass).forEach(el => {
                    el.innerHTML = text; // Use innerHTML to support HTML content
                });
            }
        });
        
        console.log(`Localization applied for language: ${languageMode}`);
    } catch (error) {
        console.error('Error loading localization:', error);
    }
}
function toggleValyLocalization() {
    if (languageMode === "vl"){
        languageMode = 'en';
    } else {
        languageMode = 'vl';
    }
    applyLocalization();
}
// Apply localization when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeWordTypeButtons();
    if (languageMode !== 'en') {
        applyLocalization();
    }

    const localizationToggle = /** @type {Button} */document.querySelector('.vl-localization-toggle');
    if (localizationToggle) {
        localizationToggle.addEventListener('click', toggleValyLocalization);
    }
    const nounButton = document.querySelector('[data-category="wordType"] [data-value="noun"]');
    if (nounButton) {
        nounButton.click();
    }
    
});