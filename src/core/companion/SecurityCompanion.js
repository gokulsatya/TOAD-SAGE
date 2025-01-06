// src/core/companion/SecurityCompanion.js

import { GroqAI } from '../api/groq';
import { VirusTotalAPI } from '../api/virustotal';
import { MitreAPI } from '../api/mitre';
import { AlienVaultAPI } from '../api/alienvault';

class SecurityCompanion {
    constructor() {
        // Initialize API clients
        this.groq = new GroqAI();
        this.virusTotal = new VirusTotalAPI();
        this.mitre = new MitreAPI();
        this.alienVault = new AlienVaultAPI();

        // Initialize learning database
        this.previousCases = new Map();
        this.learningPatterns = new Map();
        
        // Companion state
        this.currentContext = null;
        this.analysisHistory = [];
    }

    /**
     * Starts monitoring the analyst's work environment
     * and provides proactive assistance
     */
    async startCompanionMode() {
        console.log('🐸 TOAD SAGE is now watching and learning...');
        
        // Monitor clipboard for potential IoCs
        this.startClipboardMonitoring();
        
        // Monitor browser tabs for security research
        this.startTabMonitoring();
        
        // Initialize UI elements
        this.initializeCompanionUI();
    }

    /**
     * Analyzes a security incident with context and historical learning
     */
    async analyzeIncidentWithContext(incident) {
        // Start friendly interaction
        this.showThinkingState("Hmm, let me take a look at this incident...");

        try {
            // Perform multi-source analysis
            const [vtResults, mitreMapping, threatIntel] = await Promise.all([
                this.virusTotal.analyzeIndicators(incident.indicators),
                this.mitre.mapTechniques(incident.description),
                this.alienVault.gatherIntel(incident.indicators)
            ]);

            // Check for similar historical cases
            const similarCases = this.findSimilarCases(incident);

            // Generate AI-powered insights
            const aiAnalysis = await this.groq.generateAnalysis({
                incident,
                vtResults,
                mitreMapping,
                threatIntel,
                similarCases
            });

            // Format response in a conversational way
            const response = this.formatCompanionResponse({
                analysis: aiAnalysis,
                similarCases,
                confidence: this.calculateConfidence(aiAnalysis)
            });

            // Update learning database
            await this.updateLearningDatabase(incident, response);

            return response;

        } catch (error) {
            console.error('Analysis failed:', error);
            this.showError("Oops! I ran into a problem while analyzing this incident. Let me try a different approach...");
        }
    }

    /**
     * Formats the response in a conversational, companion-like way
     */
    formatCompanionResponse({ analysis, similarCases, confidence }) {
        let response = {
            message: '',
            evidence: [],
            suggestions: [],
            relatedCases: []
        };

        // Start with a friendly introduction
        if (confidence > 0.8) {
            response.message = "🐸 Ah, I've seen something like this before!";
        } else if (confidence > 0.5) {
            response.message = "🐸 This looks interesting. Here's what I found...";
        } else {
            response.message = "🐸 This is a tricky one, but let me share what I discovered...";
        }

        // Add main analysis
        response.message += ` ${analysis.summary}`;

        // Add evidence and references
        response.evidence = analysis.evidence.map(e => ({
            source: e.source,
            finding: e.description,
            link: e.reference
        }));

        // Add similar cases if found
        if (similarCases.length > 0) {
            response.message += "\n\n🔍 By the way, this reminds me of some cases we've worked on before:";
            response.relatedCases = similarCases.map(c => ({
                date: c.date,
                similarity: c.similarityScore,
                summary: c.briefDescription
            }));
        }

        // Add actionable suggestions
        response.suggestions = analysis.recommendations.map(r => ({
            priority: r.priority,
            action: r.description,
            reasoning: r.explanation
        }));

        return response;
    }

    /**
     * Shows the thinking state in the UI
     */
    showThinkingState(message) {
        // Animate the TOAD SAGE icon
        document.querySelector('.toad-icon').classList.add('thinking');
        
        // Show thinking message
        const thinkingBubble = document.createElement('div');
        thinkingBubble.className = 'thinking-bubble';
        thinkingBubble.innerHTML = `
            <div class="bubble-content">
                <span class="toad-emoji">🐸</span>
                <span class="thinking-text">${message}</span>
                <div class="thinking-dots">...</div>
            </div>
        `;
        
        document.body.appendChild(thinkingBubble);
    }

    /**
     * Updates the learning database with new insights
     */
    async updateLearningDatabase(incident, response) {
        // Store the case
        const caseId = `case_${Date.now()}`;
        this.previousCases.set(caseId, {
            incident,
            response,
            timestamp: new Date(),
            patterns: this.extractPatterns(incident)
        });

        // Update pattern recognition
        this.updatePatternLearning(incident, response);

        // Prune old data if needed
        this.pruneOldData();
    }

    /**
     * Finds similar cases from historical data
     */
    findSimilarCases(incident) {
        const similarCases = [];
        const patterns = this.extractPatterns(incident);

        for (const [id, historicalCase] of this.previousCases) {
            const similarity = this.calculateSimilarity(patterns, historicalCase.patterns);
            if (similarity > 0.7) {
                similarCases.push({
                    ...historicalCase,
                    similarityScore: similarity
                });
            }
        }

        return similarCases.sort((a, b) => b.similarityScore - a.similarityScore);
    }
}

export default SecurityCompanion;