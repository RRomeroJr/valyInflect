import { getDisplayValue } from "./searchMaps.js?v=0.2";

const adjFilters = {
    class: ["1", "2", "3"],
    case: ['nom', 'acc', 'gen', 'dat', 'loc', 'ins', 'com', 'voc', 'adv'],
    quantity: ['sing/col', 'pl/pau', 'n/a'],
    gender: ['lun', 'sol', 'ter', 'aq', 'lun/sol', 'ter/aq'],
    position: ['prepos', 'postpos'],
    d_type: ['pos', 'eq', 'comp', 'super']
};

const adjFiltersPresets = {
    wordType: 'adjective',
    d_type: ['pos'],
};

/**
 * Displays the quiz question with details for adjectives
 * @param {Object} data - The quiz data object
 * @param {HTMLElement} questionText - The element to display the question
 * @param {HTMLElement} questionDetails - The element to display the question details
 * @returns {Object} The current quiz data
 */
function displayAdjectiveQuizQuestion(data, questionText, questionDetails) {
    // Store quiz data
    const currentQuiz = data;
    
    // Get display values using the mapping function
    const displayClass = data.class;
    const displayCase = data.g_case;
    const displayQuantity = data.quant;
    const displayGender = data.gender;
    const displayPosition = data.pos;
    const displayDType = getDisplayValue('d_type', data.d_type) || data.d_type;

    let displayParamsArr = [];
    for (const value of [displayPosition, displayDType, displayQuantity, displayCase, displayGender]) {
        if (value === "n/a") continue;
        displayParamsArr.push(value);
    }
    let displayParamsString = "";
    for (let i = 0; i < displayParamsArr.length; i+=3) {
        if (i > 2) {
            displayParamsString = displayParamsString + ",<br>";
        }
        displayParamsString = displayParamsString + displayParamsArr.slice(i, i+3).join(", ");
    }
    // Display the question with all relevant details
    questionText.innerHTML = `What is the<br>${displayParamsString} of "${data.base}"?`;
    questionDetails.innerHTML = `
        <strong>Adj Class:</strong> ${displayClass}<br>
        <strong>Target case:</strong> ${displayCase}<br>
        <strong>Target quantity:</strong> ${displayQuantity}<br>
        <strong>Gender:</strong> ${displayGender}<br>
        <strong>Position:</strong> ${displayPosition}<br>
        <strong>Declension Type:</strong> ${displayDType}
    `;
    
    return currentQuiz;
}

/**
 * Creates URL parameters for the adjective quiz API based on selected filters
 * @param {Object} currentFilters - Object containing filter categories and their selected values
 * @returns {URLSearchParams} The constructed URL parameters
 */
function makeAdjectiveParams(currentFilters) {
    const params = new URLSearchParams();
    
    // Only add parameters that have selected values
    if (currentFilters.class?.length > 0) {
        params.append('classes', currentFilters.class.join(','));
    }
    if (currentFilters.case?.length > 0) {
        params.append('cases', currentFilters.case.join(','));
    }
    if (currentFilters.quantity?.length > 0) {
        params.append('quants', currentFilters.quantity.join(','));
    }
    if (currentFilters.gender?.length > 0) {
        params.append('genders', currentFilters.gender.join(','));
    }
    if (currentFilters.position?.length > 0) {
        params.append('positions', currentFilters.position.join(','));
    }
    if (currentFilters.d_type?.length > 0) {
        params.append('adj_d_types', currentFilters.d_type.join(','));
    }
    
    return params;
}

// Function to generate filter elements for adjectives
function generateAdjectiveFilterElements() {
    const elements = [];
    
    for (const [category, values] of Object.entries(adjFilters)) {
        const section = document.createElement('div');
        section.className = 'filter-section';
        
        // Create heading
        const heading = document.createElement('h4');
        if (category === "d_type") {
            heading.textContent = "Adj Declension Type";
        } else {
            heading.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        }
        section.appendChild(heading);
        
        // Create button group
        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'button-group';
        buttonGroup.dataset.category = category;
        
        // Create buttons for each value
        values.forEach(value => {
            const button = document.createElement('button');
            button.className = 'filter-btn';
            button.dataset.value = value;
            
            // Get display value and capitalize first letter
            let displayValue = getDisplayValue(category, value) || value;
            displayValue = displayValue.charAt(0).toUpperCase() + displayValue.slice(1);
            
            // Special handling for combined gender types
            if (category === 'gender' || category === 'declension') {
                if (value === 'lun/sol') {
                    displayValue = 'Lunar/Solar';
                } else if (value === 'ter/aq') {
                    displayValue = 'Terrestrial/Aquatic';
                }
            }
            
            button.textContent = displayValue;
            
            // Add click event
            button.addEventListener('click', function() {
                this.classList.toggle('selected');
            });
            
            buttonGroup.appendChild(button);
        });
        
        section.appendChild(buttonGroup);
        elements.push(section);
    }
    
    return elements;
}

export { adjFilters, adjFiltersPresets, displayAdjectiveQuizQuestion, makeAdjectiveParams, generateAdjectiveFilterElements };
