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
        const learningComponents = {
            conceptVisualizer: this.createConceptVisualization(),
            practiceExercises: this.createInteractiveExercises(),
            progressTracker: this.initializeProgressTracking(),
            feedbackSystem: this.createAdaptiveFeedback()
        };

        // Create adaptive interface
        const adaptiveUI = this.createAdaptiveInterface(learningComponents);
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

            .bounce1 { animation-delay: -0.32s; }
            .bounce2 { animation-delay: -0.16s; }

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
                60% { transform: scale(0.5); }
            }

            @keyframes thinking {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            .evidence-list, .similar-cases {
                margin-top: 15px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                padding-top: 15px;
            }

            .evidence-item, .case-item {
                margin-bottom: 12px;
                padding: 10px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 8px;
            }

            .evidence-source, .case-date {
                font-size: 12px;
                color: rgba(255, 255, 255, 0.7);
                margin-bottom: 4px;
            }

            .evidence-finding, .case-summary {
                font-size: 14px;
                margin-bottom: 8px;
            }

            .evidence-link {
                color: #4CAF50;
                text-decoration: none;
                font-size: 12px;
            }

            .evidence-link:hover {
                text-decoration: underline;
            }

            .case-similarity {
                font-size: 12px;
                color: #4CAF50;
            }
        `;
        document.head.appendChild(styles);
    }

    showMessage(message, type = 'info') {
        const container = document.querySelector('.message-container');
        if (!container) {
            console.error('Message container not found');
            return;
        }
        
        const messageElement = document.createElement('div');
        messageElement.className = `companion-message ${type}`;
        messageElement.innerHTML = this.sanitizeHTML(message);
        container.appendChild(messageElement);
    }

    showThinking(message = "Analyzing...") {
        this.state = 'thinking';
        const thinkingIndicator = document.querySelector('.thinking-indicator');
        if (thinkingIndicator) {
            thinkingIndicator.classList.remove('hidden');
        }
        this.showMessage(message);
    }

    showAnalysis(analysis) {
        this.state = 'analysis';
        const container = document.querySelector('.message-container');
        if (!container) return;

        // Clear existing content
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        // Show main analysis
        this.showMessage(analysis.message);

        // Show evidence
        if (analysis.evidence && analysis.evidence.length > 0) {
            const evidenceList = document.createElement('div');
            evidenceList.className = 'evidence-list';
            
            const fragment = document.createDocumentFragment();
            
            analysis.evidence.forEach(item => {
                if (!item) return;
                
                const evidenceItem = document.createElement('div');
                evidenceItem.className = 'evidence-item';
                evidenceItem.innerHTML = `
                    <div class="evidence-source">${this.sanitizeHTML(item.source)}</div>
                    <div class="evidence-finding">${this.sanitizeHTML(item.finding)}</div>
                    <a href="${this.sanitizeURL(item.link)}" target="_blank" class="evidence-link">Learn more</a>
                `;
                fragment.appendChild(evidenceItem);
            });
            
            evidenceList.appendChild(fragment);
            container.appendChild(evidenceList);
        }

        // Show similar cases
        if (analysis.relatedCases && analysis.relatedCases.length > 0) {
            const casesSection = document.createElement('div');
            casesSection.className = 'similar-cases';
            
            const heading = document.createElement('h4');
            heading.textContent = 'Similar Cases';
            casesSection.appendChild(heading);
            
            const fragment = document.createDocumentFragment();
            
            analysis.relatedCases.forEach(caseItem => {
                if (!caseItem) return;
                
                const caseElement = document.createElement('div');
                caseElement.className = 'case-item';
                caseElement.innerHTML = `
                    <div class="case-date">${this.sanitizeHTML(caseItem.date)}</div>
                    <div class="case-summary">${this.sanitizeHTML(caseItem.summary)}</div>
                    <div class="case-similarity">${Math.round(caseItem.similarity * 100)}% similar</div>
                `;
                fragment.appendChild(caseElement);
            });
            
            casesSection.appendChild(fragment);
            container.appendChild(casesSection);
        }
    }

    sanitizeHTML(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    sanitizeURL(url) {
        if (!url) return '#';
        try {
            return new URL(url).href;
        } catch {
            return '#';
        }
    }
}

// Export the class for use in other modules
export default CompanionUI;