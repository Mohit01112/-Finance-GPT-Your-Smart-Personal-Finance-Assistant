document.addEventListener('DOMContentLoaded', function () {
    const chatHistory = document.getElementById('chatHistory');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');
    const clearChatButton = document.getElementById('clearChat');
    const typingIndicator = document.getElementById('typingIndicator');

    const welcomeMessageHTML = `
        <div class="message bot-message welcome-message">
            <div class="message-wrapper">
                <div class="avatar bot-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-content">
                    <p>Hello! I'm Finance-GPT, your personal finance expert. Ask me anything about:</p>
                    <ul>
                        <li><i class="fas fa-wallet"></i> Personal Finance & Budgeting</li>
                        <li><i class="fas fa-chart-line"></i> Stock Market & Investing</li>
                        <li><i class="fas fa-piggy-bank"></i> Savings & Retirement Planning</li>
                        <li><i class="fas fa-credit-card"></i> Loans & Credit Score</li>
                        <li><i class="fab fa-bitcoin"></i> Cryptocurrency & Fintech</li>
                    </ul>
                    <p>How can I help you today?</p>
                </div>
            </div>
        </div>
    `;

    function scrollToBottom() {
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    function formatMessage(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")             // bold
            .replace(/^\s*\*\s+(.*)$/gm, "<li>$1</li>")                   // bullet points
            .replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>")   // code blocks
            .replace(/\n\n/g, "<br><br>")                                 // paragraph breaks
            .replace(/\n/g, "<br>");                                      // line breaks
    }

    let isEditing = false;
    let editingMessageElement = null;
    let originalMessageText = "";

    function addMessage(content, isUser = false, messageId = null) {
        const msg = document.createElement("div");
        const id = messageId || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        msg.className = `message ${isUser ? "user-message" : "bot-message"}`;
        msg.dataset.messageId = id;
        if (isUser) {
            msg.dataset.isUser = "true";
        }

        const actionsHTML = isUser 
            ? `<div class="message-actions">
                <button class="message-action-btn edit-btn" title="Edit message" aria-label="Edit">
                    <i class="fas fa-pencil-alt"></i>
                </button>
                <button class="message-action-btn copy-btn" title="Copy message" aria-label="Copy">
                    <i class="fas fa-copy"></i>
                </button>
            </div>`
            : `<div class="message-actions">
                <button class="message-action-btn copy-btn" title="Copy message" aria-label="Copy">
                    <i class="fas fa-copy"></i>
                </button>
            </div>`;

        msg.innerHTML = `
            <div class="message-wrapper">
                <div class="avatar">
                    <i class="fas ${isUser ? "fa-user" : "fa-robot"}"></i>
                </div>
                <div class="message-content">${isUser ? content : formatMessage(content)}</div>
            </div>
            ${actionsHTML}
        `;

        chatHistory.appendChild(msg);
        
        // Attach event listeners
        if (isUser) {
            const editBtn = msg.querySelector('.edit-btn');
            const copyBtn = msg.querySelector('.copy-btn');
            if (editBtn) {
                editBtn.addEventListener('click', () => enterEditMode(msg, content));
            }
            if (copyBtn) {
                copyBtn.addEventListener('click', () => copyMessage(msg, content));
            }
        } else {
            const copyBtn = msg.querySelector('.copy-btn');
            if (copyBtn) {
                copyBtn.addEventListener('click', () => copyMessage(msg, content));
            }
        }

        scrollToBottom();
        return msg;
    }

    function enterEditMode(messageElement, originalText) {
        if (isEditing) return;
        
        isEditing = true;
        editingMessageElement = messageElement;
        
        // Get original text from message content if not provided
        const contentDiv = messageElement.querySelector('.message-content');
        if (!originalText) {
            originalText = contentDiv.textContent || contentDiv.innerText;
        }
        originalMessageText = originalText;
        
        messageElement.classList.add('editing');
        const actionsDiv = messageElement.querySelector('.message-actions');
        
        // Store original HTML
        contentDiv.dataset.originalHtml = contentDiv.innerHTML;
        
        // Replace with input
        contentDiv.innerHTML = `
            <textarea class="message-edit-input">${originalText}</textarea>
            <div class="message-edit-actions">
                <button class="cancel-btn">Cancel</button>
                <button class="edit-btn send-btn">
                    <i class="fas fa-paper-plane"></i> Send
                </button>
            </div>
        `;
        
        // Hide action buttons
        if (actionsDiv) actionsDiv.style.display = 'none';
        
        // Focus input
        const textarea = contentDiv.querySelector('.message-edit-input');
        textarea.focus();
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        
        // Disable input area
        document.querySelector('.input-area').classList.add('disabled');
        
        // Event listeners
        const sendBtn = contentDiv.querySelector('.send-btn, .edit-btn');
        const cancelBtn = contentDiv.querySelector('.cancel-btn');
        
        sendBtn.addEventListener('click', () => saveEditedMessage(messageElement, textarea.value));
        cancelBtn.addEventListener('click', () => cancelEdit(messageElement));
        
        // Allow Enter to save (with Shift+Enter for new line)
        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                saveEditedMessage(messageElement, textarea.value);
            }
            if (e.key === 'Escape') {
                cancelEdit(messageElement);
            }
        });
    }

    function cancelEdit(messageElement) {
        if (!isEditing || messageElement !== editingMessageElement) return;
        
        const contentDiv = messageElement.querySelector('.message-content');
        const originalHtml = contentDiv.dataset.originalHtml || originalMessageText;
        
        contentDiv.innerHTML = originalHtml;
        messageElement.classList.remove('editing');
        
        const actionsDiv = messageElement.querySelector('.message-actions');
        if (actionsDiv) actionsDiv.style.display = 'flex';
        
        document.querySelector('.input-area').classList.remove('disabled');
        
        isEditing = false;
        editingMessageElement = null;
        originalMessageText = "";
    }

    async function saveEditedMessage(messageElement, newText) {
        if (!isEditing || messageElement !== editingMessageElement) return;
        if (!newText.trim()) {
            cancelEdit(messageElement);
            return;
        }
        
        const trimmedText = newText.trim();
        const contentDiv = messageElement.querySelector('.message-content');
        
        // Update the text content (user messages are plain text)
        contentDiv.textContent = trimmedText;
        messageElement.classList.remove('editing');
        
        const actionsDiv = messageElement.querySelector('.message-actions');
        if (actionsDiv) actionsDiv.style.display = 'flex';
        
        // Find and remove the bot response that follows this user message
        let nextSibling = messageElement.nextElementSibling;
        while (nextSibling) {
            if (nextSibling.classList.contains('bot-message') && !nextSibling.classList.contains('welcome-message')) {
                nextSibling.remove();
                break;
            }
            nextSibling = nextSibling.nextElementSibling;
        }
        
        // Re-attach edit/copy listeners to the updated message
        const editBtn = messageElement.querySelector('.edit-btn');
        const copyBtn = messageElement.querySelector('.copy-btn');
        if (editBtn) {
            const newEditBtn = editBtn.cloneNode(true);
            editBtn.replaceWith(newEditBtn);
            newEditBtn.addEventListener('click', () => enterEditMode(messageElement, trimmedText));
        }
        if (copyBtn) {
            const newCopyBtn = copyBtn.cloneNode(true);
            copyBtn.replaceWith(newCopyBtn);
            newCopyBtn.addEventListener('click', () => copyMessage(messageElement, trimmedText));
        }
        
        // Show typing indicator
        typingIndicator.classList.add("visible");
        
        // Resend message
        try {
            const response = await fetch("/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: trimmedText })
            });

            const data = await response.json();
            addMessage(data.response, false);
        } catch (err) {
            addMessage("Error: " + err.message, false);
        }

        typingIndicator.classList.remove("visible");
        document.querySelector('.input-area').classList.remove('disabled');
        
        isEditing = false;
        editingMessageElement = null;
        originalMessageText = "";
    }

    function copyMessage(messageElement, text) {
        // Get plain text from message content if text not provided
        if (!text) {
            const contentDiv = messageElement.querySelector('.message-content');
            text = contentDiv.innerText || contentDiv.textContent;
        }
        
        navigator.clipboard.writeText(text).then(() => {
            const copyBtn = messageElement.querySelector('.copy-btn');
            if (copyBtn) {
                const tooltip = document.createElement('div');
                tooltip.className = 'copy-tooltip show';
                tooltip.textContent = 'Copied!';
                copyBtn.style.position = 'relative';
                copyBtn.appendChild(tooltip);
                
                setTimeout(() => {
                    tooltip.classList.remove('show');
                    setTimeout(() => tooltip.remove(), 200);
                }, 1500);
            }
        }).catch(err => {
            console.error('Failed to copy:', err);
        });
    }

    async function sendMessage() {
        if (isEditing) return; // Prevent sending while editing
        
        const text = userInput.value.trim();
        if (!text) return;

        const userMsg = addMessage(text, true);
        userInput.value = "";

        typingIndicator.classList.add("visible");

        try {
            const response = await fetch("/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text })
            });

            const data = await response.json();
            addMessage(data.response, false);
        } catch (err) {
            addMessage("Error: " + err.message, false);
        }

        typingIndicator.classList.remove("visible");
    }

    sendButton.addEventListener("click", sendMessage);

    userInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") sendMessage();
    });

    // On load: ensure welcome message populates once if nothing is present
    if (chatHistory.innerHTML.trim() === "") {
        chatHistory.innerHTML = welcomeMessageHTML;
    }

    clearChatButton.addEventListener("click", () => {
        chatHistory.innerHTML = welcomeMessageHTML;
    });
});
