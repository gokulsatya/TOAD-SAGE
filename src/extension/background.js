// src/extension/background.js

import { SecurityAnalyzer } from '../core/toad/analyzer';
import { SecurityOperations } from '../core/toad/operations';
import { ThreatEngine } from '../core/toad/threat-engine';
import { SecurityMentor } from '../core/sage/mentor';

/**
 * BackgroundService manages the core functionality of the TOAD SAGE extension
 * running in the background context. It coordinates between different components
 * and handles extension-specific events while maintaining the educational focus.
 */
class BackgroundService {
    constructor() {
        // Initialize core components
        this.analyzer = new SecurityAnalyzer();
        this.operations = new SecurityOperations();
        this.threatEngine = new ThreatEngine();
        this.mentor = new SecurityMentor();

        // Extension state management
        this.state = {
            isMonitoring: false,
            activeAnalyses: new Map(),
            learningProgress: new Map(),
            lastUpdate: null
        };

        // Set up message handlers
        this.setupMessageHandlers();
        
        // Initialize extension
        this.initialize();
    }

    /**
     * Initializes the background service and starts core functionalities
     */
    async initialize() {
        try {
            console.log('Initializing TOAD SAGE background service...');

            // Start security monitoring
            await this.operations.startMonitoring();

            // Set up browser event listeners
            this.setupBrowserListeners();

            // Initialize learning tracking
            await this.initializeLearningTracking();

            this.state.isMonitoring = true;
            this.state.lastUpdate = new Date();

            console.log('TOAD SAGE background service initialized successfully');
        } catch (error) {
            console.error('Background service initialization failed:', error);
            this.handleServiceError(error);
        }
    }

    /**
     * Sets up message handlers for communication with the popup and content scripts
     */
    setupMessageHandlers() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender)
                .then(sendResponse)
                .catch(error => {
                    console.error('Message handling error:', error);
                    sendResponse({ error: error.message });
                });
            return true; // Keep message channel open for async response
        });
    }

    /**
     * Handles incoming messages from other extension components
     */
    async handleMessage(request, sender) {
        const { type, data } = request;

        try {
            switch (type) {
                case 'ANALYZE_INCIDENT':
                    return await this.handleIncidentAnalysis(data);
                
                case 'GET_LEARNING_RESOURCES':
                    return await this.handleLearningRequest(data);
                
                case 'UPDATE_ANALYSIS':
                    return await this.handleAnalysisUpdate(data);
                
                case 'GET_RECOMMENDATIONS':
                    return await this.handleRecommendationsRequest(data);
                
                default:
                    throw new Error(`Unknown message type: ${type}`);
            }
        } catch (error) {
            console.error(`Error handling message type ${type}:`, error);
            throw error;
        }
    }

    /**
     * Handles security incident analysis requests
     */
    async handleIncidentAnalysis(incidentData) {
        try {
            // Perform threat analysis
            const threatAnalysis = await this.threatEngine.analyzeThreat(incidentData);
            
            // Get comprehensive security analysis
            const securityAnalysis = await this.analyzer.analyzeIncident(incidentData);
            
            // Generate educational insights
            const educationalContext = await this.mentor.provideMentorship(
                incidentData,
                securityAnalysis
            );

            // Store analysis results
            const analysisId = this.generateAnalysisId();
            this.state.activeAnalyses.set(analysisId, {
                incident: incidentData,
                threatAnalysis,
                securityAnalysis,
                educationalContext,
                timestamp: new Date()
            });

            return {
                analysisId,
                summary: this.createAnalysisSummary(threatAnalysis, securityAnalysis),
                educational: educationalContext,
                recommendations: await this.generateRecommendations(
                    threatAnalysis,
                    securityAnalysis
                )
            };
        } catch (error) {
            console.error('Incident analysis failed:', error);
            throw new Error(`Analysis failed: ${error.message}`);
        }
    }

    /**
     * Handles requests for learning resources and educational content
     */
    async handleLearningRequest(request) {
        try {
            const { conceptId, analysisId } = request;
            
            // Get analysis context if available
            const analysisContext = this.state.activeAnalyses.get(analysisId);
            
            // Generate educational content
            const learningContent = await this.mentor.createLearningContent({
                conceptId,
                context: analysisContext
            });

            // Track learning progress
            await this.updateLearningProgress(request, learningContent);

            return {
                content: learningContent,
                nextSteps: this.suggestNextLearningSteps(request),
                relatedConcepts: await this.findRelatedConcepts(conceptId)
            };
        } catch (error) {
            console.error('Learning request failed:', error);
            throw new Error(`Learning content generation failed: ${error.message}`);
        }
    }

    /**
     * Handles updates to existing analyses
     */
    async handleAnalysisUpdate(updateData) {
        try {
            const { analysisId, newData } = updateData;
            
            // Get existing analysis
            const existingAnalysis = this.state.activeAnalyses.get(analysisId);
            if (!existingAnalysis) {
                throw new Error(`Analysis not found: ${analysisId}`);
            }

            // Update analysis with new data
            const updatedAnalysis = await this.updateExistingAnalysis(
                existingAnalysis,
                newData
            );

            // Update educational context
            const newEducationalContext = await this.mentor.provideMentorship(
                updatedAnalysis.incident,
                updatedAnalysis.securityAnalysis
            );

            // Store updated analysis
            this.state.activeAnalyses.set(analysisId, {
                ...updatedAnalysis,
                educationalContext: newEducationalContext,
                timestamp: new Date()
            });

            return {
                analysisId,
                summary: this.createAnalysisSummary(
                    updatedAnalysis.threatAnalysis,
                    updatedAnalysis.securityAnalysis
                ),
                educational: newEducationalContext
            };
        } catch (error) {
            console.error('Analysis update failed:', error);
            throw new Error(`Update failed: ${error.message}`);
        }
    }

    /**
     * Sets up browser-specific event listeners
     */
    setupBrowserListeners() {
        // Handle extension installation or update
        chrome.runtime.onInstalled.addListener(details => {
            this.handleExtensionInstall(details);
        });

        // Handle extension activation
        chrome.action.onClicked.addListener(tab => {
            this.handleExtensionClick(tab);
        });

        // Handle tab updates
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            this.handleTabUpdate(tabId, changeInfo, tab);
        });
    }

    /**
     * Initializes learning progress tracking
     */
    async initializeLearningTracking() {
        try {
            // Load saved learning progress
            const savedProgress = await this.loadSavedProgress();
            
            // Initialize progress tracking
            this.state.learningProgress = new Map(savedProgress);
            
            // Set up periodic progress updates
            this.setupProgressTracking();

            return true;
        } catch (error) {
            console.error('Learning tracking initialization failed:', error);
            return false;
        }
    }

    /**
     * Generates recommendations based on analyses
     */
    async generateRecommendations(threatAnalysis, securityAnalysis) {
        return {
            immediate: this.generateImmediateActions(threatAnalysis, securityAnalysis),
            investigation: await this.createInvestigationPlan(
                threatAnalysis,
                securityAnalysis
            ),
            learning: this.suggestLearningTopics(threatAnalysis, securityAnalysis)
        };
    }

    /**
     * Creates a summary of the analysis results
     */
    createAnalysisSummary(threatAnalysis, securityAnalysis) {
        return {
            severity: this.calculateOverallSeverity(threatAnalysis, securityAnalysis),
            keyFindings: this.extractKeyFindings(threatAnalysis, securityAnalysis),
            confidence: this.calculateConfidenceScore(threatAnalysis, securityAnalysis),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Generates a unique analysis identifier
     */
    generateAnalysisId() {
        return `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Handles errors in the background service
     */
    handleServiceError(error) {
        console.error('Background service error:', error);
        
        // Update service state
        this.state.isMonitoring = false;
        this.state.lastUpdate = new Date();

        // Attempt recovery
        this.attemptServiceRecovery();

        // Notify user if necessary
        this.notifyUserOfError(error);
    }
}

// Initialize background service
const backgroundService = new BackgroundService();

// Export for testing
export default backgroundService;