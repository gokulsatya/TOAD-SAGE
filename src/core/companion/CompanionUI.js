// src/components/CompanionUI.js

class CompanionUI {
    constructor() {
        this.visible = false;
        this.state = 'idle';
        this.initializeUI();
    }

    initializeUI() {
        // Create companion container
        const companionContainer = document.createElement('div');
        companionContainer.id = 'toad-companion';
        companionContainer.innerHTML = `
            <div class="companion-bubble hidden">
                <div class="companion-header">
                    <span class="toad-emoji">🐸</span>
                    <span class="companion-name">TOAD SAGE</span>
                </div>
                <div class="companion-content">
                    <div class="thinking-indicator hidden">
                        <div class="bounce1"></div>
                        <div class="bounce2"></div>
                        <div class="bounce3"></div>
                    </div>
                    <div class="message-container"></div>
                </div>
                <div class="companion-actions"></div>
            </div>
        `;
        document.body.appendChild(companionContainer);

        // Add styles
        this.addStyles();
    }

    addStyles() {
        const styles = document.createElement('style');
        styles.textContent = `
            #toad-companion {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 10000;
                font-family: 'SF Pro Display', -apple-system, sans-serif;
            }

            .companion-bubble {
                background: rgba(29, 59, 29, 0.95);
                backdrop-filter: blur(10px);
                border-radius: 15px;
                padding: 15px;
                width: 300px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: white;
                transition: all 0.3s ease;
            }

            .companion-header {
                display: flex;
                align-items: center;
                margin-bottom: 10px;
            }

            .toad-emoji {
                font-size: 24px;
                margin-right: 10px;
            }

            .companion-name {
                font-weight: 600;
                color: #4CAF50;
            }

            .thinking-indicator {
                display: flex;
                justify-content: center;
                margin: 10px 0;
            }

            .thinking-indicator > div {
                width: 8px;
                height: 8px;
                margin: 0 2px;
                background-color: #4CAF50;
                border-radius: 100%;
                display: inline-block;
                animation: bounce 1.4s infinite ease-in-out both;
            }

            .companion-content {
                margin: 10px 0;
                line-height: 1.5;
            }

            .companion-actions {
                display: flex;
                gap: 10px;
                margin-top: 10px;
            }

            .companion-button {
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                padding: 8px 12px;
                border-radius: 8px;
                color: white;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .companion-button:hover {
                background: rgba(255, 255, 255, 0.2);
                transform: translateY(-1px);
            }

            .hidden {
                display: none;
            }

            @keyframes bounce {
                0%, 80%, 100% { transform: scale(0); }
                40% { transform: scale(1.0); }
            }

            @keyframes thinking {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(styles);
    }

    showMessage(message, type = 'info') {
        const container = document.querySelector('.message-container');
        const messageElement = document.createElement('div');
        messageElement.className = `companion-message ${type}`;
        messageElement.innerHTML = message;
        container.appendChild(messageElement);
    }

    showThinking(message = "Analyzing...") {
        this.state = 'thinking';
        const thinkingIndicator = document.querySelector('.thinking-indicator');
        thinkingIndicator.classList.remove('hidden');
        this.showMessage(message);
    }

    showAnalysis(analysis) {
        this.state = 'analysis';
        const container = document.querySelector('.message-container');
        container.innerHTML = '';

        // Show main analysis
        this.showMessage(analysis.message);

   // Show evidence
if (analysis.evidence.length > 0) {
    const evidenceList = document.createElement('div');
    evidenceList.className = 'evidence-list';
    
    // Create a document fragment to minimize DOM operations
    const fragment = document.createDocumentFragment();
    
    analysis.evidence.forEach(item => {
        const evidenceItem = document.createElement('div');
        evidenceItem.className = 'evidence-item';
        evidenceItem.innerHTML = `
            <div class="evidence-source">${item.source}</div>
            <div class="evidence-finding">${item.finding}</div>
            <a href="${item.link}" target="_blank" class="evidence-link">Learn more</a>
        `;
        fragment.appendChild(evidenceItem);
    });
    
    evidenceList.appendChild(fragment);
    container.appendChild(evidenceList);
}

// Show similar cases
if (analysis.relatedCases.length > 0) {
    const casesSection = document.createElement('div');
    casesSection.className = 'similar-cases';
    
    const heading = document.createElement('h4');
    heading.textContent = 'Similar Cases';
    casesSection.appendChild(heading);
    
    // Create a document fragment for cases
    const fragment = document.createDocumentFragment();
    
    analysis.relatedCases.forEach(caseItem => {
        const caseElement = document.createElement('div');
        caseElement.className = 'case-item';
        caseElement.innerHTML = `
            <div class="case-date">${caseItem.date}</div>
            <div class="case-summary">${caseItem.summary}</div>
            <div class="case-similarity">${Math.round(caseItem.similarity * 100)}% similar</div>
        `;
        fragment.appendChild(caseElement);
    });
    
    casesSection.appendChild(fragment);
    container.appendChild(casesSection);
}