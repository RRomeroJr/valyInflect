// Mapping from display values to database values
export const valueMappings = {
    case: {
        'nominative': 'nom',
        'accusative': 'acc',
        'genitive': 'gen',
        'dative': 'dat',
        'locative': 'loc',
        'instrumental': 'ins',
        'comitative': 'com',
        'vocative': 'voc',
        'adverbial': 'adv'
    },
    quantity: {
        'singular': 'sing',
        'plural': 'pl',
        'paucal': 'pau',
        'collective': 'col'
    },
    gender: {
        'lunar': 'lun',
        'solar': 'sol',
        'terrestrial': 'ter',
        'aquatic': 'aq',
        'lunar/solar': 'lun/sol',
        'terrestrial/aquatic': 'ter/aq'
    },
    position: {
        'prepositive': 'prepos',
        'postpositive': 'postpos'
    },
    d_type: {
        'Positive': 'pos',
        'Equal': 'eq',
        'Comparative': 'comp',
        'Superlative': 'sup'
    },
    declension: {}
};

// Mapping from database values back to display values
export const displayMaps = {
    case: {
        'nom': 'nominative',
        'acc': 'accusative',
        'gen': 'genitive',
        'dat': 'dative',
        'loc': 'locative',
        'ins': 'instrumental',
        'com': 'comitative',
        'voc': 'vocative',
        'adv': 'adverbial'
    },
    quantity: {
        'sing': 'singular',
        'pl': 'plural',
        'pau': 'paucal',
        'col': 'collective'
    },
    gender: {
        'lun': 'lunar',
        'sol': 'solar',
        'ter': 'terrestrial',
        'aq': 'aquatic',
        'lun/sol': 'lunar/solar',
        'ter/aq': 'terrestrial/aquatic',
        'n/a': 'n/a'
    },
    position: {
        'prepos': 'prepositive',
        'postpos': 'postpositive'
    },
    d_type: {
        'pos': 'positive',
        'eq': 'equative',
        'comp': 'comparative',
        'sup': 'superlative',
    }
};

// Default selections for filters
export const defaultSelections = {
    case: ['nominative', 'accusative', 'genitive', 'dative', 'locative', 'instrumental', 'comitative', 'vocative'],
    quantity: ['singular', 'plural', 'paucal', 'collective'],
    declension: ['1st', '2nd', '3rd', '4th', '5th', '6th'],
    gender: ['lunar', 'solar', 'terrestrial', 'aquatic', 'lunar/solar', 'terrestrial/aquatic'],
    position: ['prepositive', 'postpositive'],
    d_type: ['positive', 'equative', 'comparative', 'superlative']
};

// Helper function to map values using the appropriate mapping
export function mapValues(category, values, toDb = true) {
    const mapping = toDb ? valueMappings[category] : displayMaps[category];
    if (!mapping) return values;
    
    return values.map(v => {
        const mapped = mapping[v];
        return mapped !== undefined ? mapped : v;
    });
}

// Helper function to get display value for a single value
export function getDisplayValue(category, value) {
    return displayMaps[category]?.[value] || value;
}
