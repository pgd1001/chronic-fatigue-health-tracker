# Requirements Document

## Introduction

This document outlines the requirements for a comprehensive digital health application designed specifically for individuals with Chronic Fatigue Syndrome (ME/CFS) and Long COVID. The application will provide gentle, evidence-based health routines, AI-powered pacing guidance, and empathetic user experience to help users manage their energy levels and prevent post-exertional malaise (PEM). The solution addresses the significant unmet need for accessible, reliable self-management tools in a population of 300K-1.7M ME/CFS patients and 1.9M Long COVID patients in the UK/Ireland.

## Requirements

### Requirement 1: Daily Health Routine Management

**User Story:** As a person with chronic fatigue, I want to follow a structured daily health routine, so that I can maintain consistent self-care practices without overwhelming my limited energy.

#### Acceptance Criteria

1. WHEN a user opens the app THEN the system SHALL display the Daily Anchor routine with 3 components: breathing (3 mins), mobility (4 mins), and stretches (3 mins)
2. WHEN a user completes each component THEN the system SHALL allow them to check off the activity and track completion time
3. WHEN a user accesses nutrition tracking THEN the system SHALL provide guidelines for 1-Product Foods and 1,000-Year Rule with simple logging interface
4. WHEN a user logs hydration THEN the system SHALL track daily water intake (1.5-2L target) and supplement reminders (magnesium, D3, iodine)
5. WHEN evening approaches THEN the system SHALL provide sleep optimization reminders (blue light blocking, screen replacement, room environment)

### Requirement 2: Adaptive Movement Program

**User Story:** As someone managing chronic fatigue, I want an optional gentle exercise program that adapts to my energy levels, so that I can maintain physical activity without triggering crashes.

#### Acceptance Criteria

1. WHEN a user's energy level is 5/10 or higher THEN the system SHALL offer the optional 2x weekly movement session
2. WHEN a user starts a movement session THEN the system SHALL guide them through 4 phases: warm-up (4 mins), light resistance (8 mins), integrated flow (3-5 mins), and cool down (3 mins)
3. WHEN a user completes the movement session THEN the system SHALL prompt for post-session self-check ratings (fatigue, breath, stability on 1-10 scale)
4. IF post-session fatigue rating is greater than 6 THEN the system SHALL recommend scaling back or skipping the next session
5. WHEN scheduling movement sessions THEN the system SHALL suggest lower-stress days and allow user customization

### Requirement 3: AI-Powered Pacing and Energy Management

**User Story:** As a chronic fatigue patient, I want intelligent pacing guidance based on my biometrics and symptoms, so that I can avoid post-exertional malaise and stay within my energy envelope.

#### Acceptance Criteria

1. WHEN a user grants camera permission THEN the system SHALL measure heart rate variability (HRV) and resting heart rate (RHR) using phone camera
2. WHEN the system detects concerning biometric patterns THEN it SHALL provide gentle notifications to slow down or rest
3. WHEN a user logs daily symptoms and energy levels THEN the system SHALL use AI to adapt routine recommendations
4. WHEN the AI analyzes user patterns THEN it SHALL provide personalized suggestions framed as "information" not medical advice
5. IF the system suggests routine modifications THEN it SHALL always emphasize consulting healthcare professionals for medical decisions

### Requirement 4: Low-Stimulus User Experience ("Vibe Coding")

**User Story:** As someone experiencing brain fog and cognitive fatigue, I want an app interface that minimizes cognitive load, so that I can use the app without exacerbating my symptoms.

#### Acceptance Criteria

1. WHEN a user interacts with the app THEN the system SHALL provide a minimalist, calming design with high contrast and large touch targets
2. WHEN displaying information THEN the system SHALL use clear, concise language and avoid overwhelming visual elements
3. WHEN a user navigates the app THEN the system SHALL provide intuitive, single-tap interactions with immediate visual feedback
4. WHEN the app loads THEN it SHALL prioritize fast loading times and smooth animations to reduce cognitive strain
5. WHEN users need help THEN the system SHALL provide contextual, empathetic guidance without medical jargon

### Requirement 5: Symptom and Progress Tracking

**User Story:** As a chronic illness patient, I want to track my symptoms and progress over time, so that I can identify patterns and share objective data with healthcare providers.

#### Acceptance Criteria

1. WHEN a user logs symptoms THEN the system SHALL capture fatigue levels, sleep quality, pain, brain fog, and custom symptoms with simple rating scales
2. WHEN a user views their data THEN the system SHALL display trends and patterns in an easy-to-understand visual format
3. WHEN a user wants to share data THEN the system SHALL generate healthcare provider reports with objective metrics and symptom correlations
4. WHEN tracking progress THEN the system SHALL highlight improvements and validate user experiences without toxic positivity
5. IF a user experiences symptom flares THEN the system SHALL provide supportive messaging and adjusted routine recommendations

### Requirement 6: Data Privacy and Security

**User Story:** As a user sharing sensitive health data, I want robust privacy protection and control over my information, so that I can trust the app with my personal health details.

#### Acceptance Criteria

1. WHEN a user creates an account THEN the system SHALL obtain explicit consent for health data collection and processing under GDPR
2. WHEN storing health data THEN the system SHALL encrypt all sensitive information and implement privacy by design principles
3. WHEN a user requests data export THEN the system SHALL provide complete data portability in standard formats
4. WHEN a user wants to delete their account THEN the system SHALL permanently remove all personal data within 30 days
5. IF there is a data breach THEN the system SHALL notify users within 72 hours as required by GDPR

### Requirement 7: Evidence-Based Content and Compliance

**User Story:** As someone seeking reliable health information, I want content backed by scientific research and clinical guidelines, so that I can trust the app's recommendations and share them with my healthcare team.

#### Acceptance Criteria

1. WHEN the app provides health recommendations THEN they SHALL align with NICE guidelines for ME/CFS and Long COVID management
2. WHEN displaying educational content THEN the system SHALL cite PhD research sources and evidence-based practices
3. WHEN the app makes suggestions THEN it SHALL clearly distinguish between general wellness information and medical advice
4. WHEN users access help content THEN the system SHALL provide empathetic, validating language that acknowledges their condition's legitimacy
5. IF regulatory requirements change THEN the system SHALL be designed to adapt to MHRA and EU MDR compliance needs

### Requirement 8: Authentication and User Management

**User Story:** As a user, I want secure and simple account management, so that I can access my health data safely across devices while maintaining my privacy.

#### Acceptance Criteria

1. WHEN a user creates an account THEN the system SHALL provide secure authentication using Better-auth with email/password and optional social login
2. WHEN a user logs in THEN the system SHALL maintain secure sessions with appropriate timeout periods
3. WHEN a user accesses the app from multiple devices THEN the system SHALL sync data securely across all authenticated sessions
4. WHEN a user forgets their password THEN the system SHALL provide secure password reset functionality
5. IF suspicious login activity is detected THEN the system SHALL implement appropriate security measures and user notifications