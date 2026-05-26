const STORAGE_KEY = 'promptLibrary';

const promptForm = document.getElementById('promptForm');
const promptTitleInput = document.getElementById('promptTitle');
const promptContentInput = document.getElementById('promptContent');
const promptsContainer = document.getElementById('promptsContainer');
const promptCount = document.getElementById('promptCount');

// Load prompts from localStorage on page load
document.addEventListener('DOMContentLoaded', () => {
    displayPrompts();
});

// Handle form submission
promptForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = promptTitleInput.value.trim();
    const content = promptContentInput.value.trim();

    if (!title || !content) {
        alert('Please fill in all fields');
        return;
    }

    // Create prompt object
    const prompt = {
        id: Date.now(),
        title: title,
        content: content,
        createdAt: new Date().toLocaleDateString()
    };

    // Get existing prompts
    const prompts = getPrompts();

    // Add new prompt
    prompts.push(prompt);

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));

    // Clear form
    promptForm.reset();
    promptTitleInput.focus();

    // Update display
    displayPrompts();
});

// Get all prompts from localStorage
function getPrompts() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
}

// Display all prompts
function displayPrompts() {
    const prompts = getPrompts();
    promptCount.textContent = prompts.length;

    // Clear container
    promptsContainer.innerHTML = '';

    if (prompts.length === 0) {
        promptsContainer.innerHTML = '<p class="empty-state">No prompts yet. Create one to get started!</p>';
        return;
    }

    // Display each prompt as a card
    prompts.forEach((prompt) => {
        const card = createPromptCard(prompt);
        promptsContainer.appendChild(card);
    });
}

// Create a prompt card element
function createPromptCard(prompt) {
    const card = document.createElement('div');
    card.className = 'prompt-card';

    // Get preview (first 50 characters)
    const preview = prompt.content.substring(0, 80) + (prompt.content.length > 80 ? '...' : '');

    card.innerHTML = `
        <h3 class="prompt-card-title">${escapeHtml(prompt.title)}</h3>
        <p class="prompt-card-preview">${escapeHtml(preview)}</p>
        <div class="prompt-card-footer">
            <span class="prompt-card-date">${prompt.createdAt}</span>
            <button class="btn btn-danger" onclick="deletePrompt(${prompt.id})">Delete</button>
        </div>
    `;

    return card;
}

// Delete a prompt
function deletePrompt(id) {
    if (confirm('Are you sure you want to delete this prompt?')) {
        let prompts = getPrompts();
        prompts = prompts.filter((prompt) => prompt.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
        displayPrompts();
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
