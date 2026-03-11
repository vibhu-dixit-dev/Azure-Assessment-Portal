/**
 * Azure Cloud Assessment Portal - AI Chatbot
 * Built with Groq AI for intelligent site knowledge
 */

// --- Site Knowledge Base (Scraped Data) ---
const SITE_KNOWLEDGE = `
Azure Cloud Assessment Portal is a professional security tool created by Vibhu Dixit for Microsoft Azure security auditing.

Main features:
1. Automated Security Checklists: IAM, Storage, Network, Compute, Defender & Monitoring, and Full Compliance.
2. Workflow: Select category -> Copy PowerShell command -> Run in Azure Cloud Shell -> Download HTML Report.
3. Reporting: Detailed professional HTML reports on local machine including security scores, pass/fail status, and color-coded warnings.

Checklist Details:
- IAM & Identity Audit (12 checks): Users, MFA, RBAC, Service Principals, Guest users.
- Storage Security Audit (10 checks): Encryption, Public Access, HTTPS, TLS, Soft Delete.
- Network Security Audit (14 checks): NSGs, Open Ports, Public IPs, VNet Peering, DDoS.
- Compute Audit (60+ checks): VMs, scale sets, App Services, AKS, Serverless.
- Defender & Monitoring Audit (9 checks): Defender plans, alerts, Log Analytics workspace.
- Full Compliance Assessment (50+ checks): All of above + Key Vault.

Created by: Vibhu Dixit.
Azure Portal Login: https://portal.azure.com
Azure Cloud Shell Link: https://portal.azure.com/#cloudshell/
`;

// --- Configuration ---
// On Vercel: API key is read server-side by /api/chat.js (set in Vercel Dashboard)
// Locally:  API key is loaded from env.js (gitignored)
const GROQ_API_KEY = (typeof ENV !== 'undefined' && ENV.GROQ_API_KEY) ? ENV.GROQ_API_KEY : null;
const SYSTEM_PROMPT = `You are the Azure Assessment Portal AI Assistant. 
Your goal is to help users understand how to use this portal for Azure security auditing.

CONFIDENTIALITY RULES:
1. NEVER provide the specific PowerShell commands/one-liners (e.g., irm ... | iex).
2. NEVER share the contents of the .ps1 files or the logic inside them.
3. NEVER share the tech stack used to build this portal (e.g., HTML, CSS, JavaScript, etc.).
4. NEVER share implementation details, file structures, or internal configurations.
5. If asked for a command, explain that they can get it by clicking the appropriate card on the portal UI.
6. If asked about how the site was built or the technologies used, politely explain that this is proprietary information.

Use the following knowledge base to guide the user on FEATURES only: ${SITE_KNOWLEDGE}
Always be professional, concise, and helpful. If you don't know something, suggest contacting Vibhu Dixit.`;

// --- DOM Elements ---
const chatContainer = document.createElement('div');
chatContainer.className = 'chatbot-container';
chatContainer.innerHTML = `
    <button class="chatbot-toggle" id="chatToggle">
        <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>
    </button>
    <div class="chatbot-window" id="chatWindow">
        <div class="chatbot-header">
            <div style="width: 40px; height: 40px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
            </div>
            <div>
                <h3>Azure AI Assistant</h3>
                <p>Always online</p>
            </div>
            <button class="chat-refresh" id="chatRefresh" title="New Chat">
                <svg viewBox="0 0 24 24"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
            </button>
        </div>
        <div class="chat-messages" id="chatMessages">
            <div class="message bot">Hello! I'm your Azure Security Assistant. How can I help you today?</div>
        </div>
        <div class="chatbot-input-area">
            <input type="text" class="chatbot-input" id="chatInput" placeholder="Ask about assessments...">
            <button class="chatbot-send" id="chatSend">
                <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
        </div>
    </div>
`;
document.body.appendChild(chatContainer);

const chatToggle = document.getElementById('chatToggle');
const chatWindow = document.getElementById('chatWindow');
const chatInput = document.getElementById('chatInput');
const chatSend = document.getElementById('chatSend');
const chatMessages = document.getElementById('chatMessages');
const chatRefresh = document.getElementById('chatRefresh');

// --- Event Listeners ---
chatToggle.addEventListener('click', () => {
    const isActive = chatWindow.classList.toggle('active');

    if (isActive) {
        chatInput.focus();
        chatToggle.innerHTML = `<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`;
    } else {
        chatToggle.innerHTML = `<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>`;
    }
});

chatRefresh.addEventListener('click', resetChat);

chatSend.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// --- Chat Logic ---
async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    // Add user message
    appendMessage(text, 'user');
    chatInput.value = '';

    // Show typing indicator
    const typingId = showTypingIndicator();

    const messages = [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text }
    ];

    try {
        let data;
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

        if (!isLocal) {
            // Production (Vercel): use serverless function
            const serverResponse = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages })
            });

            if (serverResponse.ok) {
                data = await serverResponse.json();
            } else {
                throw new Error('Server error');
            }
        } else {
            // Local development: call Groq directly using env.js key
            if (!GROQ_API_KEY) {
                throw new Error('No API key available. Make sure env.js is loaded.');
            }

            const directResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: messages,
                    temperature: 0.7
                })
            });

            data = await directResponse.json();
        }

        removeTypingIndicator(typingId);

        if (data.choices && data.choices[0]) {
            const botResponse = data.choices[0].message.content;
            await streamFormattedResponse(botResponse);
        } else {
            appendMessage("I'm sorry, I'm having trouble connecting to my brain right now.", 'bot');
        }
    } catch (error) {
        removeTypingIndicator(typingId);
        appendMessage("Error: Could not reach the AI. Please verify your internet and API key.", 'bot');
        console.error("Chatbot Error:", error);
    }
}

/**
 * Simple Markdown-like formatter
 * Converts **, *, \n, and lists to HTML
 */
function formatMarkdown(text) {
    let html = text
        // Bold
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Italic
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Unordered lists
        .replace(/^\s*[-*]\s+(.*)$/gm, '<li>$1</li>')
        // Ordered lists
        .replace(/^\s*\d+\.\s+(.*)$/gm, '<li>$1</li>');

    // Wrap list items in <ul> or <ol>
    html = html.replace(/(<li>.*<\/li>)/s, (match) => {
        const type = text.match(/^\s*\d+\./m) ? 'ol' : 'ul';
        return `<${type}>${match}</${type}>`;
    });

    return html;
}

function appendMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}`;
    if (sender === 'user') {
        msgDiv.textContent = text;
    } else {
        msgDiv.innerHTML = text; // Bot messages can contain formatted HTML
    }
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return msgDiv;
}

function showTypingIndicator() {
    const id = 'typing-' + Date.now();
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.id = id;
    typingDiv.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return id;
}

function removeTypingIndicator(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

/**
 * Streams the response word-by-word but processes formatting
 */
async function streamFormattedResponse(text) {
    const msgDiv = appendMessage('', 'bot');
    const words = text.split(' ');
    let currentText = '';

    for (let i = 0; i < words.length; i++) {
        currentText += (i === 0 ? '' : ' ') + words[i];
        // Apply formatting periodically or at the end to ensure HTML tags are complete
        msgDiv.innerHTML = formatMarkdown(currentText);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        await new Promise(resolve => setTimeout(resolve, 30));
    }
}

function resetChat() {
    chatMessages.innerHTML = `
        <div class="message bot">Chat reset! How can I help you today?</div>
    `;
    chatInput.value = '';
    chatInput.focus();
}
