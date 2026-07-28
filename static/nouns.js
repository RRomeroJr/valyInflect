import { getDisplayValue } from "./searchMaps.js?v=1.0";
const nounFilters = {
    case: ['nom', 'acc', 'gen', 'dat', 'loc', 'ins', 'com', 'voc'],
    quantity: ['sing', 'pl', 'pau', 'col'],
    declension: ['1st', '2nd', '3rd', '4th', '5th', '6th'],
    gender: ['lun', 'sol', 'ter', 'aq'],
    declen_subtypes: [
        '5th_ir', '3rd_changing_k', '3rd_io', '1st_changing_d', '3rd_changing_v', 
        '3rd_changing_n', '2nd_y', '3rd_ion', '5th_is', '3rd_or', '2nd_ys', 
        '3rd_changing_h', '1st_a', '6th_i', '3rd_changing_e', '5th_i', '3rd_changing_d', 
        '1st_ar', '3rd_changing_b', '4th_es', '1st_changing_b', '4th_ien', '3rd_on', 
        '3rd_changing_l', '4th_e', '3rd_os', '3rd_o', '1st_ia'
    ].sort()
    // '5th_ir', '3rd_changing_k', '3rd_io', '1st_changing_d', '3rd_changing_v', 
    // '3rd_changing_n', '2nd_y', '3rd_ion', '5th_is', '3rd_or', '2nd_ys', 
    // '3rd_changing_h', '1st_a', '6th_i', '3rd_changing_e', '5th_i', '3rd_changing_d', 
    // '1st_ar', '3rd_changing_b', '4th_es', '1st_changing_b', '4th_ien', '3rd_on', 
    // '3rd_changing_l', '4th_e', '3rd_os', '3rd_o', '1st_ia'
};
const nounFiltersPresets = {
    wordType: 'noun',
    quantity: ['sing', 'pl'],
};

/**
 * Displays the quiz question with details
 * @param {Object} data - The quiz data object
 * @param {HTMLElement} questionText - The element to display the question
 * @param {HTMLElement} questionDetails - The element to display the question details
 * @returns {Object} The current quiz data
 */
function displayQuizQuestion(data, questionText, questionDetails) {
    // Store quiz data
    const currentQuiz = data;
    
    // Get display values using the mapping function
    const displayCase = getDisplayValue('case', data.g_case) || data.g_case;
    const displayQuantity = getDisplayValue('quantity', data.quant) || data.quant;
    const displayGender = getDisplayValue('gender', data.gender) || data.gender;
    
    // Display the question with abbreviated forms
    questionText.textContent = `What is the ${data.g_case}, ${data.quant} of "${data.base}"?`;
    questionDetails.innerHTML = `
        <strong>Base word:</strong> ${data.base}<br>
        <strong>Target case:</strong> ${displayCase}<br>
        <strong>Target quantity:</strong> ${displayQuantity}<br>
        <strong>Declension:</strong> ${data.declen}<br>
        <strong>Gender:</strong> ${displayGender}
    `;
    
    return currentQuiz;
}

/**
 * Creates URL parameters for the noun quiz API based on selected filters
 * @param {Object} currentFilters - Object containing filter categories and their selected values
 * @returns {URLSearchParams} The constructed URL parameters
 */
function makeNounParams(currentFilters) {
    const params = new URLSearchParams();
    
    // Only add parameters that have selected values
    if (currentFilters.case?.length > 0) {
        params.append('cases', currentFilters.case.join(','));
    }
    if (currentFilters.quantity?.length > 0) {
        params.append('quants', currentFilters.quantity.join(','));
    }
    if (currentFilters.declension?.length > 0) {
        params.append('declens', currentFilters.declension.join(','));
    }
    if (currentFilters.gender?.length > 0) {
        params.append('genders', currentFilters.gender.join(','));
    }
    if (currentFilters.declen_subtypes?.length > 0) {
        params.append('declen_subtypes', currentFilters.declen_subtypes.join(','));
    }
    
    return params;
}

// Function to generate filter elements for nouns
function generateNounFilterElements() {
    const elements = [];
    
    for (const [category, values] of Object.entries(nounFilters)) {
        const section = document.createElement('div');
        section.className = 'filter-section';
        
        // Create heading
        const heading = document.createElement('h4');
        if (category === "declen_subtypes") {
            heading.textContent = "Declension Subtypes";
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
            button.textContent = getDisplayValue(category, value);
            button.textContent = button.textContent.charAt(0).toUpperCase() + button.textContent.slice(1);
            
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

export { nounFilters, nounFiltersPresets, displayQuizQuestion, makeNounParams, generateNounFilterElements };