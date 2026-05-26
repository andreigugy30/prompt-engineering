## Practical Prompt Engineering Course

# Standard prompt

Create a prompt library application that lets users save and delete prompts.

Users should be able to:

- Enter a title and content for their prompt
- Save it to localStorage
- See all their saved prompts displayed on the page
- Delete prompts they no longer need

Make it look clean and professional with HTML, CSS, and JavaScript.

# Zero shot prompt

Create a prompt library application in HTML, CSS, and JavaScript.

Create an HTML page with a form containing fields for the prompt title and content

Add a save prompt button that saves to localStorage

Display saved prompts in cards

Each prompt card should show the title, a content preview of a few words, and a delete button

Deleting should remove the prompt from localStorage and update the display

Style it with CSS to look clean and modern with a developer theme

Include all HTML structure, CSS styling, and JavaScript functionality in their own files, but that can be run immediately and includes no other features.

# One shot prompt

You are helping develop a prompt library application. Here's an example of how to analyze and implement a new feature:

**EXAMPLE:** Feature Request: "Add a favorites/bookmarking system"

Implementation Plan:

1. **User Story**: As a user, I want to mark prompts as favorites so I can quickly access my most-used prompts without scrolling through the entire library.
2. **Technical Requirements**:
   - Add a heart/bookmark icon to each prompt card
   - Store favorite status in localStorage or database
   - Create a filter to show only favorited prompts
   - Visual indicator when a prompt is favorited (filled vs outlined icon)
3. **Code Structure**:

javascript
// Data model update
prompt = {
id: 'prompt-123',
title: 'Marketing Email Generator',
content: '...',
isFavorite: false, // New field
createdAt: '2024-01-15',
rating: 4.5
}

// Toggle favorite function
function toggleFavorite(promptId) {
const prompt = prompts.find(p => p.id === promptId);
prompt.isFavorite = !prompt.isFavorite;
saveToStorage(prompts);
updateUI();
}

4. **UI/UX Considerations**:
   - Place favorite icon in consistent location (top-right of card)
   - Use intuitive icons (heart or star)
   - Provide visual feedback on click (animation/color change)
   - Add "Favorites" filter tab in navigation

---

**YOUR TASK:** Analyze the following feature request using the EXACT same format as the example above (User Story, Technical Requirements with bullet points, Code Structure with JavaScript examples, and UI/UX Considerations).

Feature Request: "Add a 5-star rating component to rate prompt effectiveness"

# Structured output prompt

Create a metadata tracking system for a prompt journal web application that is attached to our prompts in our prompt library.

FUNCTION SPECIFICATIONS:

1. trackModel(modelName: string, content: string): MetadataObject
   - Accept any non-empty string for modelName
   - Auto-generate createdAt timestamp
   - Estimate tokens from content
2. updateTimestamps(metadata: MetadataObject): MetadataObject
   - Update the updatedAt field
   - Validate updatedAt >= createdAt
3. estimateTokens(text: string, isCode: boolean): TokenEstimate
   - Base calculation: min = 0.75 _ word_count, max = 0.25 _ character_count
   - If isCode=true, multiply both by 1.3
   - Confidence: 'high' if <1000 tokens, 'medium' if 1000-5000, 'low' if >5000

VALIDATION RULES:

- All dates must be valid ISO 8601 strings (YYYY-MM-DDTHH:mm:ss.sssZ)
- Model name must be non-empty string, max 100 characters
- Throw errors for invalid inputs with descriptive messages

OUTPUT SCHEMA:
{
model: string,
createdAt: string (ISO 8601),
updatedAt: string (ISO 8601),
tokenEstimate: {
min: number,
max: number,
confidence: 'high' | 'medium' | 'low'
}
}

VISUAL DISPLAY:
Create an HTML/CSS component that adds and displays metadata in the prompt card:

- Model name
- Timestamps in human-readable format
- Token estimate with color-coded confidence (green/yellow/red)
- Sort by createdAt descending

CONSTRAINTS:

- Pure JavaScript only (no external libraries)
- Must work in browser environment
- Include try/catch error handling
