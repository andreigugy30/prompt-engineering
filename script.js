const STORAGE_KEY = "promptLibrary";

const promptForm = document.getElementById("promptForm");
const promptTitleInput = document.getElementById("promptTitle");
const promptModelInput = document.getElementById("promptModel");
const promptContentInput = document.getElementById("promptContent");
const promptsContainer = document.getElementById("promptsContainer");
const promptCount = document.getElementById("promptCount");

// ============ METADATA TRACKING SYSTEM ============

/**
 * Track metadata for a prompt
 * @param {string} modelName - The name of the model used
 * @param {string} content - The content of the prompt
 * @returns {Object} MetadataObject with model, timestamps, and token estimate
 */
function trackModel(modelName, content) {
	try {
		// Validate modelName
		if (typeof modelName !== "string" || modelName.trim().length === 0) {
			throw new Error("Model name must be a non-empty string");
		}
		if (modelName.length > 100) {
			throw new Error("Model name must not exceed 100 characters");
		}

		// Validate content
		if (typeof content !== "string") {
			throw new Error("Content must be a string");
		}

		const now = new Date().toISOString();
		const tokenEstimate = estimateTokens(content, false);

		return {
			model: modelName.trim(),
			createdAt: now,
			updatedAt: now,
			tokenEstimate: tokenEstimate,
		};
	} catch (error) {
		console.error("Error in trackModel:", error.message);
		throw error;
	}
}

/**
 * Update timestamps for metadata
 * @param {Object} metadata - The metadata object to update
 * @returns {Object} Updated metadata object
 */
function updateTimestamps(metadata) {
	try {
		// Validate metadata
		if (!metadata || typeof metadata !== "object") {
			throw new Error("Metadata must be a valid object");
		}

		// Validate createdAt
		if (!metadata.createdAt || !isValidISO8601(metadata.createdAt)) {
			throw new Error(
				"Metadata must have a valid ISO 8601 createdAt timestamp",
			);
		}

		const now = new Date().toISOString();
		const createdTime = new Date(metadata.createdAt).getTime();
		const updatedTime = new Date(now).getTime();

		// Validate updatedAt >= createdAt
		if (updatedTime < createdTime) {
			throw new Error("Updated timestamp cannot be before created timestamp");
		}

		return {
			...metadata,
			updatedAt: now,
		};
	} catch (error) {
		console.error("Error in updateTimestamps:", error.message);
		throw error;
	}
}

/**
 * Estimate token count for text
 * @param {string} text - The text to estimate tokens for
 * @param {boolean} isCode - Whether the text is code
 * @returns {Object} TokenEstimate with min, max, and confidence
 */
function estimateTokens(text, isCode = false) {
	try {
		if (typeof text !== "string") {
			throw new Error("Text must be a string");
		}

		if (typeof isCode !== "boolean") {
			throw new Error("isCode must be a boolean");
		}

		// Count words and characters
		const words = text
			.trim()
			.split(/\s+/)
			.filter((w) => w.length > 0).length;
		const characters = text.length;

		// Base calculation: min = 0.75 * word_count, max = 0.25 * character_count
		let min = 0.75 * words;
		let max = 0.25 * characters;

		// If isCode, multiply both by 1.3
		if (isCode) {
			min *= 1.3;
			max *= 1.3;
		}

		// Ensure min doesn't exceed max
		if (min > max) {
			const temp = min;
			min = max;
			max = temp;
		}

		// Round to integers
		min = Math.ceil(min);
		max = Math.ceil(max);

		// Determine confidence based on average
		const average = (min + max) / 2;
		let confidence = "high";
		if (average >= 1000 && average < 5000) {
			confidence = "medium";
		} else if (average >= 5000) {
			confidence = "low";
		}

		return {
			min,
			max,
			confidence,
		};
	} catch (error) {
		console.error("Error in estimateTokens:", error.message);
		throw error;
	}
}

/**
 * Validate ISO 8601 date string
 * @param {string} dateString - The date string to validate
 * @returns {boolean} True if valid ISO 8601 format
 */
function isValidISO8601(dateString) {
	if (typeof dateString !== "string") return false;
	const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
	return iso8601Regex.test(dateString) && !isNaN(Date.parse(dateString));
}

/**
 * Format ISO 8601 date to human-readable format
 * @param {string} isoString - ISO 8601 date string
 * @returns {string} Formatted date string
 */
function formatDateReadable(isoString) {
	try {
		if (!isValidISO8601(isoString)) {
			throw new Error("Invalid ISO 8601 date string");
		}
		const date = new Date(isoString);
		return date.toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	} catch (error) {
		console.error("Error formatting date:", error.message);
		return "Invalid date";
	}
}

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

	// Get model name or use default
	const modelName = promptModelInput?.value?.trim() || "Generic";

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
		metadata: null,
	};

	// Track metadata
	try {
		prompt.metadata = trackModel(modelName, content);
	} catch (error) {
		console.error("Failed to track metadata:", error.message);
		alert("Warning: Could not track metadata for this prompt");
	}

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

	// Sort prompts by metadata createdAt descending (or fallback to original createdAt)
	const sortedPrompts = [...prompts].sort((a, b) => {
		const aTime = a.metadata?.createdAt
			? new Date(a.metadata.createdAt).getTime()
			: 0;
		const bTime = b.metadata?.createdAt
			? new Date(b.metadata.createdAt).getTime()
			: 0;
		return bTime - aTime;
	});

	// Display each prompt as a card
	sortedPrompts.forEach((prompt) => {
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
	const notesPreview =
		prompt.notes.length > 0
			? prompt.notes[prompt.notes.length - 1].text.substring(0, 50) +
				(prompt.notes[prompt.notes.length - 1].text.length > 50 ? "..." : "")
			: "";

	// Build metadata section if available
	const metadataSection = prompt.metadata
		? `
		<div class="metadata-component">
			<div class="metadata-header">
				<span class="metadata-model">🤖 ${escapeHtml(prompt.metadata.model)}</span>
				<span class="metadata-created">${formatDateReadable(prompt.metadata.createdAt)}</span>
			</div>
			<div class="metadata-tokens">
				<div class="token-estimate ${getConfidenceClass(prompt.metadata.tokenEstimate.confidence)}">
					<span class="token-label">Tokens:</span>
					<span class="token-range">${prompt.metadata.tokenEstimate.min}-${prompt.metadata.tokenEstimate.max}</span>
					<span class="confidence-badge">${prompt.metadata.tokenEstimate.confidence}</span>
				</div>
			</div>
		</div>
	`
		: "";

	card.innerHTML = `
        <h3 class="prompt-card-title">${escapeHtml(prompt.title)}</h3>
        <p class="prompt-card-preview">${escapeHtml(preview)}</p>
        
        ${metadataSection}

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

/**
 * Get CSS class for confidence level
 * @param {string} confidence - Confidence level (high, medium, low)
/**
 * Get CSS class for confidence level
 * @param {string} confidence - Confidence level (high, medium, low)
 * @returns {string} CSS class name
 */
function getConfidenceClass(confidence) {
	const classMap = {
		high: "confidence-high",
		medium: "confidence-medium",
		low: "confidence-low",
	};
	return classMap[confidence] || "confidence-low";
}

// Calculate average rating
function calculateAverageRating(ratings) {
	if (ratings.length === 0) return 0;
	const sum = ratings.reduce((acc, r) => acc + r.score, 0);
	return sum / ratings.length;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
	const div = document.createElement("div");
	div.textContent = text;
	return div.innerHTML;
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
	document.getElementById("notesModalTitle").textContent =
		`Notes for "${escapeHtml(prompt.title)}"`;

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
	const sortedNotes = [...prompt.notes].sort(
		(a, b) => b.createdAt - a.createdAt,
	);

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
