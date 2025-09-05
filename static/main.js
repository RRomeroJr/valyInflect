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

// Map frontend values to database values
const valueMappings = {
    case: {
        'nominative': 'nom',
        'accusative': 'acc',
        'genitive': 'gen',
        'dative': 'dat',
        'locative': 'loc',
        'instrumental': 'ins',
        'comitative': 'com',
        'vocative': 'voc',
        'adverbial': 'adv'  // Added adverbial case
    },
    quantity: {
        'singular': 'sing',
        'plural': 'pl',
        'paucal': 'pau',
        'collective': 'col'
    },
    // Map gender names to match database values
    gender: {
        'lunar': 'lun',
        'solar': 'sol',
        'terrestrial': 'ter',
        'aquatic': 'aq'  // Changed from 'aqua' to 'aq' to match database
    },
    // These don't need mapping as they match the database
    declension: {}
};

// Initialize toolbar functionality
function initializeToolbar() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    // Use the global valueMappings
    
    // Set default selections (using frontend values)
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
        
        // Map frontend values to database values before sending to the server
        const mapValues = (category, values) => {
            const mapping = valueMappings[category] || {};
            return values.map(v => {
                const mapped = mapping[v];
                console.log(`Mapping ${category} value: ${v} -> ${mapped || v}`);
                return mapped !== undefined ? mapped : v;
            });
        };
        
        // Only add parameters that have selected values
        if (selectedFilters.case.length > 0) {
            const dbCases = mapValues('case', selectedFilters.case);
            params.append('cases', dbCases.join(','));
        }
        if (selectedFilters.quantity.length > 0) {
            const dbQuantities = mapValues('quantity', selectedFilters.quantity);
            params.append('quantities', dbQuantities.join(','));
        }
        if (selectedFilters.declension.length > 0) {
            params.append('declensions', selectedFilters.declension.join(','));
        }
        if (selectedFilters.gender.length > 0) {
            const dbGenders = mapValues('gender', selectedFilters.gender);
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
            
            // Map database values back to display values
            const caseDisplayMap = {
                'nom': 'nominative',
                'acc': 'accusative',
                'gen': 'genitive',
                'dat': 'dative',
                'loc': 'locative',
                'ins': 'instrumental',
                'com': 'comitative',
                'voc': 'vocative',
                'adv': 'adverbial'
            };
            
            const quantityDisplayMap = {
                'sing': 'singular',
                'pl': 'plural',
                'pau': 'paucal',
                'col': 'collective'
            };
            
            const genderDisplayMap = {
                'lun': 'lunar',
                'sol': 'solar',
                'ter': 'terrestrial',
                'aq': 'aquatic',  // Updated to match database
                'lun/sol': 'lunar/solar',
                'ter/aq': 'terrestrial/aquatic',
                'n/a': 'n/a'
            };
            
            const displayCase = caseDisplayMap[data.target_case] || data.target_case;
            const displayQuantity = quantityDisplayMap[data.target_quantity] || data.target_quantity;
            const displayGender = genderDisplayMap[data.gender] || data.gender;
            
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
    }
}
