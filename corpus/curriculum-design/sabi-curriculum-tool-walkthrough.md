# SABI Curriculum Tool — Decomposition Simulation Walkthrough

**Source:** HowToRunACurriculumDecompositionSimulation.pdf
**Tool URL:** sabificate.com/zTemp/SABICurriculmToolTest/_sabi-v3-curriculum-demo.html

---

## Overview

The SABI Curriculum Tool automates the decomposition of skills into course structures and generates course briefs. This walkthrough covers the 7-stage pipeline prototype.

## Stages Demonstrated

### Stage 1-2: Skill Intake
1. Navigate to the curriculum tool
2. Enter a **skill statement** describing the competency to teach
3. Click **"Decompose this skill →"** to trigger AI decomposition

### Stage 3: Skill Decomposition
4. Select **"Simulated"** mode (vs. live AI)
5. Click **"Run decomposition"**
6. AI produces 3-6 competency spine nodes with:
   - Learning objectives per node
   - Artifact intent
   - Catalog overlap flags (concept_id matching)

### Stage 4: Brief Preparation
6. Click **"Approve & pre-fill brief →"** to carry decomposition results forward
7. Fill in **"Things to avoid"** field (SME guidance for content generation)
8. Click **"Generate & review course →"**

### Stage 5: Course Generation & Review
9. Upload audio script file (for TTS/audio learning)
10. Click **"Show trust layer"** to reveal claim sourcing
11. Click **"Simulate sourcing"** to verify claims against references

### Stages 6-7: Assembly Review & Publish
(Not shown in this walkthrough — handled by SME review workflow)

## Key Technical Notes

- The tool supports both simulated and live AI decomposition modes
- Trust layer shows source citations for every factual claim
- Audio script upload supports TTS generation
- Claim sourcing simulation verifies AI-generated content against reference databases
- The brief carries forward: objective, learner role, artifact intent, functional statement
- SME adds "things to avoid" as negative constraints for content generation
