const STORAGE_KEY = "promptLibrary";

const promptForm = document.getElementById("promptForm");
const promptTitleInput = document.getElementById("promptTitle");
const promptContentInput = document.getElementById("promptContent");
const promptsContainer = document.getElementById("promptsContainer");
const promptCount = document.getElementById("promptCount");

// Load prompts from localStorage on page load
document.addEventListener("DOMContentLoaded", () => {
	displayPrompts();
});

// Handle form submission
promptForm.addEventListener("submit", (e) => {
	e.preventDefault();

	const title = promptTitleInput.value.trim();
	const content = promptContentInput.value.trim();

	if (!title || !content) {
		alert("Please fill in all fields");
		return;
	}

	// Create prompt object
	const prompt = {
		id: Date.now(),
		title: title,
		content: content,
		createdAt: new Date().toLocaleDateString(),
		ratings: [],
		averageRating: 0,
		totalRatings: 0,
		notes: [],
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
	promptsContainer.innerHTML = "";

	if (prompts.length === 0) {
		promptsContainer.innerHTML =
			'<p class="empty-state">No prompts yet. Create one to get started!</p>';
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
	const card = document.createElement("div");
	card.className = "prompt-card";

	// Get preview (first 50 characters)
	const preview =
		prompt.content.substring(0, 80) + (prompt.content.length > 80 ? "..." : "");

	// Ensure rating properties exist for backwards compatibility
	if (prompt.ratings === undefined) prompt.ratings = [];
	if (prompt.averageRating === undefined) prompt.averageRating = 0;
	if (prompt.totalRatings === undefined) prompt.totalRatings = 0;
	if (prompt.notes === undefined) prompt.notes = [];

	// Get notes preview
	const notesPreview = prompt.notes.length > 0 
		? prompt.notes[prompt.notes.length - 1].text.substring(0, 50) + (prompt.notes[prompt.notes.length - 1].text.length > 50 ? "..." : "")
		: "";

	card.innerHTML = `
        <h3 class="prompt-card-title">${escapeHtml(prompt.title)}</h3>
        <p class="prompt-card-preview">${escapeHtml(preview)}</p>
        
        <div class="prompt-card-meta">
            <button class="btn-notes" onclick="openNotesModal(${prompt.id})" title="View notes">
                <span class="notes-icon">📝</span>
                <span class="notes-badge">${prompt.notes.length}</span>
            </button>
            ${notesPreview ? `<p class="notes-preview">${escapeHtml(notesPreview)}</p>` : ""}
        </div>

        <div class="rating-component" data-prompt-id="${prompt.id}">
            <div class="stars-input">
                ${[1, 2, 3, 4, 5]
									.map((star) => {
										const userRating = getUserRatingForPrompt(prompt.id);
										const isActive = star <= userRating ? "active" : "";
										return `<span class="star ${isActive}" data-value="${star}" data-prompt-id="${prompt.id}">★</span>`;
									})
									.join("")}
            </div>
            <div class="rating-info">
                <span class="average-rating">${(prompt.averageRating || 0).toFixed(1)}</span>
                <span class="total-ratings">(${prompt.totalRatings || 0})</span>
            </div>
        </div>
        <div class="prompt-card-footer">
            <span class="prompt-card-date">${prompt.createdAt}</span>
            <button class="btn btn-danger" onclick="deletePrompt(${prompt.id})">Delete</button>
        </div>
    `;

	return card;
}

// Delete a prompt
function deletePrompt(id) {
	if (confirm("Are you sure you want to delete this prompt?")) {
		let prompts = getPrompts();
		prompts = prompts.filter((prompt) => prompt.id !== id);
		localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
		displayPrompts();
	}
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
	const div = document.createElement("div");
	div.textContent = text;
	return div.innerHTML;
}

// Calculate average rating
function calculateAverageRating(ratings) {
	if (ratings.length === 0) return 0;
	const sum = ratings.reduce((acc, r) => acc + r.score, 0);
	return sum / ratings.length;
}

// Get current user ID (stored in localStorage)
function getCurrentUserId() {
	let userId = localStorage.getItem("userId");
	if (!userId) {
		userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		localStorage.setItem("userId", userId);
	}
	return userId;
}

// Get user's rating for a specific prompt
function getUserRatingForPrompt(promptId) {
	const prompts = getPrompts();
	const prompt = prompts.find((p) => p.id === promptId);
	if (!prompt) return 0;

	const userId = getCurrentUserId();
	const userRating = prompt?.ratings?.find((r) => r.userId === userId);
	return userRating ? userRating.score : 0;
}

// Submit rating for a prompt
function submitRating(promptId, score) {
	const prompts = getPrompts();
	const prompt = prompts.find((p) => p.id === promptId);

	if (!prompt) return;

	// Initialize ratings array if it doesn't exist (for backwards compatibility)
	if (!prompt.ratings) {
		prompt.ratings = [];
	}

	const userId = getCurrentUserId();
	const existingRating = prompt.ratings.find((r) => r.userId === userId);

	if (existingRating) {
		existingRating.score = score;
	} else {
		prompt.ratings.push({ userId, score });
	}

	prompt.averageRating = calculateAverageRating(prompt.ratings);
	prompt.totalRatings = prompt.ratings.length;

	localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
	displayPrompts();
}

// Handle star click events
document.addEventListener("click", (e) => {
	if (e.target.classList.contains("star")) {
		const promptId = parseInt(e.target.dataset.promptId);
		const score = parseInt(e.target.dataset.value);
		submitRating(promptId, score);
	}
});

// Handle star hover effect
document.addEventListener("mouseover", (e) => {
	if (e.target.classList.contains("star")) {
		const starsInput = e.target.closest(".stars-input");
		const hoverValue = parseInt(e.target.dataset.value);

		const stars = starsInput.querySelectorAll(".star");
		stars.forEach((star, index) => {
			if (index < hoverValue) {
				star.classList.add("hover");
			} else {
				star.classList.remove("hover");
			}
		});
	}
});

// Reset hover effect
document.addEventListener("mouseout", (e) => {
	if (e.target.classList.contains("star")) {
		const starsInput = e.target.closest(".stars-input");
		const stars = starsInput.querySelectorAll(".star");
		stars.forEach((star) => star.classList.remove("hover"));
	}
});

// ============ NOTES FUNCTIONALITY ============

let currentPromptId = null;

// Open notes modal
function openNotesModal(promptId) {
	currentPromptId = promptId;
	const prompts = getPrompts();
	const prompt = prompts.find((p) => p.id === promptId);

	if (!prompt) return;

	// Set modal title
	document.getElementById("notesModalTitle").textContent = `Notes for "${escapeHtml(prompt.title)}"`;

	// Clear input
	document.getElementById("noteInput").value = "";
	document.getElementById("charCount").textContent = "0 / 500";

	// Display notes
	displayNotes(promptId);

	// Show modal
	document.getElementById("notesModal").classList.add("show");
}

// Close notes modal
function closeNotesModal() {
	document.getElementById("notesModal").classList.remove("show");
	currentPromptId = null;
	document.getElementById("noteInput").value = "";
}

// Display all notes for a prompt
function displayNotes(promptId) {
	const prompts = getPrompts();
	const prompt = prompts.find((p) => p.id === promptId);

	if (!prompt) return;

	const notesList = document.getElementById("notesList");
	notesList.innerHTML = "";

	if (!prompt.notes || prompt.notes.length === 0) {
		notesList.innerHTML = '<p class="empty-notes">No notes yet</p>';
		return;
	}

	// Sort notes by most recent first
	const sortedNotes = [...prompt.notes].sort((a, b) => b.createdAt - a.createdAt);

	sortedNotes.forEach((note) => {
		const noteElement = document.createElement("div");
		noteElement.className = "note-item";
		noteElement.innerHTML = `
            <div class="note-header">
                <span class="note-date">${formatRelativeTime(note.createdAt)}</span>
                <button type="button" class="btn-delete-note" onclick="deleteNote(${promptId}, ${note.id})" title="Delete note">🗑️</button>
            </div>
            <p class="note-text">${escapeHtml(note.text)}</p>
        `;
		notesList.appendChild(noteElement);
	});
}

// Save a new note
function saveNote() {
	if (!currentPromptId) return;

	const noteText = document.getElementById("noteInput").value.trim();

	if (!noteText) {
		alert("Note cannot be empty");
		return;
	}

	const prompts = getPrompts();
	const prompt = prompts.find((p) => p.id === currentPromptId);

	if (!prompt) return;

	// Initialize notes array if it doesn't exist
	if (!prompt.notes) {
		prompt.notes = [];
	}

	// Limit notes to 10 per prompt
	if (prompt.notes.length >= 10) {
		alert("Maximum 10 notes per prompt");
		return;
	}

	// Create note object
	const note = {
		id: Date.now(),
		text: noteText,
		createdAt: Date.now(),
		editedAt: Date.now(),
	};

	// Add note
	prompt.notes.push(note);

	// Save to localStorage
	localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));

	// Clear input
	document.getElementById("noteInput").value = "";
	document.getElementById("charCount").textContent = "0 / 500";

	// Refresh display
	displayNotes(currentPromptId);
	displayPrompts();
}

// Delete a note
function deleteNote(promptId, noteId) {
	if (confirm("Are you sure you want to delete this note?")) {
		const prompts = getPrompts();
		const prompt = prompts.find((p) => p.id === promptId);

		if (!prompt) return;

		prompt.notes = prompt.notes.filter((note) => note.id !== noteId);

		localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));

		displayNotes(currentPromptId);
		displayPrompts();
	}
}

// Format relative time (e.g., "2 hours ago")
function formatRelativeTime(timestamp) {
	const now = Date.now();
	const diff = now - timestamp;

	const seconds = Math.floor(diff / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (seconds < 60) return "just now";
	if (minutes < 60) return `${minutes}m ago`;
	if (hours < 24) return `${hours}h ago`;
	if (days < 7) return `${days}d ago`;

	return new Date(timestamp).toLocaleDateString();
}

// Update character count in real-time
document.addEventListener("input", (e) => {
	if (e.target.id === "noteInput") {
		const count = e.target.value.length;
		document.getElementById("charCount").textContent = `${count} / 500`;
	}
});

// Close modal when clicking outside
document.addEventListener("click", (e) => {
	const modal = document.getElementById("notesModal");
	if (e.target === modal) {
		closeNotesModal();
	}
});
