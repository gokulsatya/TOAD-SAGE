// TOAD SAGE Popup Script
// This script manages the popup interface interactions and communication with the background script

class TOADSagePopup {
    constructor() {
        // Initialize state management
        this.state = {
            currentTab: 'analysis',
            isAnalyzing: false,
            analysisResults: null,
            systemStatus: 'optimal',
            learningProgress: 0
        };

        // Cache DOM elements for better performance
        this.elements = {
            tabButtons: document.querySelectorAll('.tab-button'),
            analysisInput: document.querySelector('#incident-input'),
            analyzeButton: document.querySelector('[class*="premium-button"]:first-of-type'),
            clearButton: document.querySelector('[class*="premium-button"]:last-of-type'),
            loadingState: document.querySelector('#loading-state'),
            resultsSection: document.querySelector('#analysis-results'),
            systemStatusIndicator: document.querySelector('.bg-gradient-to-r')
        };

        // Bind event handlers
        this.bindEvents();
        
        // Initialize the interface
        this.initialize();
    }

    /**
     * Initializes the popup interface and checks the system status
     */
    async initialize() {
        try {
            // Check connection with background script
            const status = await this.checkSystemStatus();
            this.updateSystemStatus(status);

            // Load any saved analysis state
            await this.loadSavedState();

            // Initialize animations and transitions
            this.initializeAnimations();

            console.log('TOAD SAGE Popup initialized successfully');
        } catch (error) {
            console.error('Initialization error:', error);
            this.showError('Failed to initialize TOAD SAGE');
        }
    }

    /**
     * Binds all event listeners for the interface
     */
    bindEvents() {
        // Tab navigation
        this.elements.tabButtons.forEach(button => {
            button.addEventListener('click', (e) => this.handleTabChange(e));
        });

        // Analysis actions
        this.elements.analyzeButton.addEventListener('click', () => this.handleAnalysis());
        this.elements.clearButton.addEventListener('click', () => this.clearAnalysis());

        // Input handling
        this.elements.analysisInput.addEventListener('input', (e) => this.handleInput(e));

        // Listen for messages from background script
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleBackgroundMessage(message, sender, sendResponse);
            return true; // Keep the message channel open for async responses
        });
    }

    /**
     * Handles tab changes in the interface
     */
    handleTabChange(event) {
        const selectedTab = event.target.getAttribute('data-tab') || 'analysis';
        
        // Update active tab styling
        this.elements.tabButtons.forEach(button => {
            button.classList.remove('text-green-400', 'border-b-2', 'border-green-400/50');
            button.classList.add('text-white/50');
        });
        
        event.target.classList.remove('text-white/50');
        event.target.classList.add('text-green-400', 'border-b-2', 'border-green-400/50');

        // Update state
        this.state.currentTab = selectedTab;
        this.updateTabContent(selectedTab);
    }

    /**
     * Handles the security analysis process
     */
    async handleAnalysis() {
        try {
            const incidentDetails = this.elements.analysisInput.value.trim();
            
            if (!incidentDetails) {
                this.showError('Please enter incident details');
                return;
            }

            // Update UI state
            this.state.isAnalyzing = true;
            this.updateUIForAnalysis(true);

            // Send analysis request to background script
            const results = await this.sendAnalysisRequest(incidentDetails);

            // Process and display results
            this.displayAnalysisResults(results);

        } catch (error) {
            console.error('Analysis error:', error);
            this.showError('Analysis failed. Please try again.');
        } finally {
            this.state.isAnalyzing = false;
            this.updateUIForAnalysis(false);
        }
    }

    /**
     * Updates the UI during analysis
     */
    updateUIForAnalysis(isAnalyzing) {
        // Toggle loading state
        this.elements.loadingState.style.display = isAnalyzing ? 'flex' : 'none';
        this.elements.analyzeButton.disabled = isAnalyzing;

        // Add loading animation
        if (isAnalyzing) {
            this.elements.analyzeButton.innerHTML = `
                <div class="loading-ring w-5 h-5 mr-2"></div>
                Analyzing...
            `;
        } else {
            this.elements.analyzeButton.textContent = 'Begin Analysis';
        }

        // Toggle input interaction
        this.elements.analysisInput.disabled = isAnalyzing;
    }

    /**
     * Displays the analysis results in the interface
     */
    displayAnalysisResults(results) {
        // Store results in state
        this.state.analysisResults = results;

        // Show results section
        this.elements.resultsSection.style.display = 'block';

        // Populate results with smooth fade-in
        this.elements.resultsSection.style.opacity = '0';
        requestAnimationFrame(() => {
            // Create and populate result elements
            this.createResultElements(results);
            
            // Fade in results
            this.elements.resultsSection.style.opacity = '1';
            this.elements.resultsSection.style.transition = 'opacity 0.3s ease-in-out';
        });
    }

    /**
     * Creates and populates result elements with analysis data
     */
    createResultElements(results) {
        const { severity, findings, recommendations } = results;

        // Update severity indicator
        const severityElement = document.querySelector('.severity-indicator');
        if (severityElement) {
            severityElement.className = `severity-indicator ${this.getSeverityClass(severity)}`;
            severityElement.textContent = severity;
        }

        // Update findings list
        const findingsList = document.querySelector('#key-findings-list');
        if (findingsList) {
            findingsList.innerHTML = findings.map(finding => `
                <li class="feature-card premium-card rounded-xl p-4 mb-2">
                    <h4 class="text-sm font-semibold text-green-400">${finding.title}</h4>
                    <p class="text-xs text-white/70 mt-1">${finding.description}</p>
                </li>
            `).join('');
        }

        // Update recommendations
        const recommendationsList = document.querySelector('#recommendations-list');
        if (recommendationsList) {
            recommendationsList.innerHTML = recommendations.map(rec => `
                <li class="feature-card premium-card rounded-xl p-4 mb-2">
                    <h4 class="text-sm font-semibold text-green-400">${rec.title}</h4>
                    <p class="text-xs text-white/70 mt-1">${rec.description}</p>
                </li>
            `).join('');
        }
    }

    /**
     * Clears the analysis input and results
     */
    clearAnalysis() {
        // Clear input
        this.elements.analysisInput.value = '';

        // Hide results with fade-out
        if (this.elements.resultsSection.style.display !== 'none') {
            this.elements.resultsSection.style.opacity = '0';
            setTimeout(() => {
                this.elements.resultsSection.style.display = 'none';
                this.state.analysisResults = null;
            }, 300);
        }

        // Reset state
        this.state.analysisResults = null;
    }

    /**
     * Sends analysis request to the background script
     */
    async sendAnalysisRequest(incidentDetails) {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
                type: 'ANALYZE_INCIDENT',
                data: { incident: incidentDetails }
            }, response => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(response);
                }
            });
        });
    }

    /**
     * Updates the system status display
     */
    updateSystemStatus(status) {
        const statusIndicator = document.querySelector('.status-dot');
        const statusText = document.querySelector('.text-green-400');

        if (status === 'optimal') {
            statusIndicator.style.backgroundColor = '#4CAF50';
            statusText.textContent = 'Guardian Active';
        } else {
            statusIndicator.style.backgroundColor = '#FFA726';
            statusText.textContent = 'Guardian Alert';
        }
    }

    /**
     * Shows error messages in the interface
     */
    showError(message) {
        // Create error notification
        const notification = document.createElement('div');
        notification.className = 'fixed bottom-4 right-4 bg-red-500/90 text-white px-4 py-2 rounded-lg shadow-lg';
        notification.textContent = message;

        // Add to DOM
        document.body.appendChild(notification);

        // Remove after delay
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * Initializes custom animations for the interface
     */
    initializeAnimations() {
        // Add entrance animation to hero section
        const heroSection = document.querySelector('.hero-section');
        if (heroSection) {
            heroSection.style.opacity = '0';
            heroSection.style.transform = 'translateY(20px)';
            
            requestAnimationFrame(() => {
                heroSection.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                heroSection.style.opacity = '1';
                heroSection.style.transform = 'translateY(0)';
            });
        }

        // Initialize feature card animations
        const featureCards = document.querySelectorAll('.feature-card');
        featureCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 100 * (index + 1));
        });
    }

    /**
     * Checks the system status with the background script
     */
    async checkSystemStatus() {
        try {
            const response = await new Promise((resolve) => {
                chrome.runtime.sendMessage({ type: 'CHECK_STATUS' }, resolve);
            });
            return response.status;
        } catch (error) {
            console.error('Status check failed:', error);
            return 'error';
        }
    }

    /**
     * Loads any saved state from storage
     */
    async loadSavedState() {
        try {
            const savedState = await new Promise((resolve) => {
                chrome.storage.local.get(['toadSageState'], resolve);
            });

            if (savedState.toadSageState) {
                this.state = { ...this.state, ...savedState.toadSageState };
                this.updateUIFromState();
            }
        } catch (error) {
            console.error('Failed to load saved state:', error);
        }
    }
}

// Initialize the popup when the document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.toadSage = new TOADSagePopup();
});