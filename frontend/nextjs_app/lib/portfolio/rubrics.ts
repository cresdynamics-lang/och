/**
 * Rubric System Configuration
 * Defines scoring criteria for different portfolio item types
 */

import type { Rubric, PortfolioItemType } from './types';

export const RUBRICS: Record<PortfolioItemType, Rubric> = {
  mission: {
    id: 'mission-rubric',
    name: 'Mission Completion Rubric',
    itemType: 'mission',
    criteria: [
      {
        id: 'technical-execution',
        name: 'Technical Execution',
        description: 'Quality of technical implementation and problem-solving',
        weight: 0.3,
      },
      {
        id: 'documentation',
        name: 'Documentation',
        description: 'Clarity and completeness of documentation',
        weight: 0.2,
      },
      {
        id: 'creativity',
        name: 'Creativity & Innovation',
        description: 'Originality and creative problem-solving approach',
        weight: 0.2,
      },
      {
        id: 'communication',
        name: 'Communication',
        description: 'Clarity of explanation and presentation',
        weight: 0.15,
      },
      {
        id: 'impact',
        name: 'Impact & Results',
        description: 'Measurable outcomes and real-world applicability',
        weight: 0.15,
      },
    ],
  },
  reflection: {
    id: 'reflection-rubric',
    name: 'Reflection Rubric',
    itemType: 'reflection',
    criteria: [
      {
        id: 'depth',
        name: 'Depth of Reflection',
        description: 'Thoughtfulness and self-awareness demonstrated',
        weight: 0.3,
      },
      {
        id: 'learning',
        name: 'Learning Insights',
        description: 'Quality of insights and lessons learned',
        weight: 0.25,
      },
      {
        id: 'growth',
        name: 'Growth Mindset',
        description: 'Demonstration of growth and improvement',
        weight: 0.25,
      },
      {
        id: 'articulation',
        name: 'Articulation',
        description: 'Clarity and coherence of writing',
        weight: 0.2,
      },
    ],
  },
  certification: {
    id: 'certification-rubric',
    name: 'Certification Rubric',
    itemType: 'certification',
    criteria: [
      {
        id: 'credibility',
        name: 'Credibility',
        description: 'Reputation and recognition of certification body',
        weight: 0.3,
      },
      {
        id: 'relevance',
        name: 'Relevance',
        description: 'Alignment with career goals and skills',
        weight: 0.3,
      },
      {
        id: 'difficulty',
        name: 'Difficulty Level',
        description: 'Complexity and rigor of certification',
        weight: 0.2,
      },
      {
        id: 'recency',
        name: 'Recency',
        description: 'How current and up-to-date the certification is',
        weight: 0.2,
      },
    ],
  },
  github: {
    id: 'github-rubric',
    name: 'GitHub Project Rubric',
    itemType: 'github',
    criteria: [
      {
        id: 'code-quality',
        name: 'Code Quality',
        description: 'Clean, maintainable, and well-structured code',
        weight: 0.3,
      },
      {
        id: 'functionality',
        name: 'Functionality',
        description: 'Working features and proper implementation',
        weight: 0.25,
      },
      {
        id: 'documentation',
        name: 'Documentation',
        description: 'README, comments, and project documentation',
        weight: 0.2,
      },
      {
        id: 'best-practices',
        name: 'Best Practices',
        description: 'Following industry standards and conventions',
        weight: 0.15,
      },
      {
        id: 'innovation',
        name: 'Innovation',
        description: 'Unique features or creative solutions',
        weight: 0.1,
      },
    ],
  },
  thm: {
    id: 'thm-rubric',
    name: 'TryHackMe Rubric',
    itemType: 'thm',
    criteria: [
      {
        id: 'completion',
        name: 'Completion',
        description: 'Full completion of rooms and challenges',
        weight: 0.3,
      },
      {
        id: 'understanding',
        name: 'Understanding',
        description: 'Demonstrated comprehension of concepts',
        weight: 0.3,
      },
      {
        id: 'difficulty',
        name: 'Difficulty',
        description: 'Complexity of rooms completed',
        weight: 0.2,
      },
      {
        id: 'writeups',
        name: 'Writeups',
        description: 'Quality of documentation and explanations',
        weight: 0.2,
      },
    ],
  },
  external: {
    id: 'external-rubric',
    name: 'External Portfolio Rubric',
    itemType: 'external',
    criteria: [
      {
        id: 'quality',
        name: 'Overall Quality',
        description: 'Professional presentation and execution',
        weight: 0.4,
      },
      {
        id: 'relevance',
        name: 'Relevance',
        description: 'Alignment with career goals',
        weight: 0.3,
      },
      {
        id: 'impact',
        name: 'Impact',
        description: 'Real-world results and outcomes',
        weight: 0.3,
      },
    ],
  },
  marketplace: {
    id: 'marketplace-rubric',
    name: 'Marketplace Work Rubric',
    itemType: 'marketplace',
    criteria: [
      {
        id: 'client-satisfaction',
        name: 'Client Satisfaction',
        description: 'Feedback and ratings from clients',
        weight: 0.3,
      },
      {
        id: 'delivery',
        name: 'Delivery Quality',
        description: 'Quality of deliverables and work',
        weight: 0.3,
      },
      {
        id: 'professionalism',
        name: 'Professionalism',
        description: 'Communication and business practices',
        weight: 0.2,
      },
      {
        id: 'value',
        name: 'Value Delivered',
        description: 'Impact and value provided to client',
        weight: 0.2,
      },
    ],
  },
};

export function getRubricForType(type: PortfolioItemType): Rubric {
  return RUBRICS[type];
}

export function calculateWeightedScore(rubric: Rubric, scores: Record<string, number>): number {
  let totalWeightedScore = 0;
  let totalWeight = 0;

  rubric.criteria.forEach((criterion) => {
    const score = scores[criterion.id] || 0;
    totalWeightedScore += score * criterion.weight;
    totalWeight += criterion.weight;
  });

  return totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
}

