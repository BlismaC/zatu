// chat.js - Handles client-side chat functionality

// DOM elements for the chat UI (these will be added to index.html)
let chatMessagesDiv; // Div to display chat messages
let chatInput;       // Input field for typing messages
let chatSendButton;  // Button to send messages
let chatContainer;   // Overall chat container

let socket; // Reference to the Socket.IO client socket

// Configuration constants for chat UI
const MAX_CHAT_MESSAGES = 100; // Limit the number of messages displayed
const CHAT_AUTO_SCROLL_THRESHOLD = 50; // Pixels from bottom to trigger auto-scroll

/**
 * Initializes the chat system.
 * This function should be called once when the game starts, after the socket is established.
 * @param {SocketIO.Socket} gameSocket - The Socket.IO client socket instance.
 */
export function initChat(gameSocket) {
    socket = gameSocket;

    // Get references to the HTML elements
    chatContainer = document.getElementById('chatContainer');
    chatMessagesDiv = document.getElementById('chatMessages');
    chatInput = document.getElementById('chatInput');
    chatSendButton = document.getElementById('chatSendButton');

    if (!chatContainer || !chatMessagesDiv || !chatInput || !chatSendButton) {
        console.error("Chat UI elements not found. Make sure chatContainer, chatMessages, chatInput, and chatSendButton exist in index.html.");
        return;
    }

    // Event listener for sending messages via button click
    chatSendButton.addEventListener('click', sendMessage);

    // Event listener for sending messages via Enter key in the input field
    chatInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendMessage();
            event.preventDefault(); // Prevent default Enter key behavior (e.g., form submission)
        }
    });

    // Listen for incoming chat messages from the server
    socket.on('chat-message', (data) => {
        addMessageToChat(data.senderName, data.message, data.senderId === socket.id);
    });

    console.log("Chat system initialized.");
}

/**
 * Sends a chat message to the server.
 */
function sendMessage() {
    const message = chatInput.value.trim();
    if (message.length > 0) {
        // Emit the 'chat-message' event to the server
        socket.emit('chat-message', { message: message });
        chatInput.value = ''; // Clear the input field
    }
}

/**
 * Adds a message to the chat display.
 * @param {string} senderName - The name of the sender.
 * @param {string} message - The message content.
 * @param {boolean} isSelf - True if the message is from the current user, false otherwise.
 */
function addMessageToChat(senderName, message, isSelf) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message');
    if (isSelf) {
        messageElement.classList.add('self');
    } else {
        messageElement.classList.add('other');
    }

    // Create a span for the sender's name
    const senderSpan = document.createElement('span');
    senderSpan.classList.add('sender-name');
    senderSpan.textContent = senderName + ": ";

    // Create a span for the message text
    const messageTextSpan = document.createElement('span');
    messageTextSpan.classList.add('message-text');
    messageTextSpan.textContent = message;

    messageElement.appendChild(senderSpan);
    messageElement.appendChild(messageTextSpan);
    
    chatMessagesDiv.appendChild(messageElement);

    // Remove old messages if the limit is exceeded
    while (chatMessagesDiv.children.length > MAX_CHAT_MESSAGES) {
        chatMessagesDiv.removeChild(chatMessagesDiv.firstChild);
    }

    // Auto-scroll to the bottom if the user is near the bottom
    if (chatMessagesDiv.scrollHeight - chatMessagesDiv.clientHeight <= chatMessagesDiv.scrollTop + CHAT_AUTO_SCROLL_THRESHOLD) {
        chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
    }
}

/**
 * Toggles the visibility of the chat window.
 */
export function toggleChatVisibility() {
    if (chatContainer) {
        chatContainer.style.display = (chatContainer.style.display === 'block') ? 'none' : 'block';
    }
    // Optionally focus the input when showing the chat
    if (chatContainer.style.display === 'block' && chatInput) {
        chatInput.focus();
    }
}

/**
 * Shows the chat window.
 */
export function showChat() {
    if (chatContainer) {
        chatContainer.style.display = 'block';
    }
}

/**
 * Hides the chat window.
 */
export function hideChat() {
    if (chatContainer) {
        chatContainer.style.display = 'none';
    }
}
