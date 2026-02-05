/**
 * Skills Extraction Module
 * Auto-extracts skill tags from mission titles, evidence files, mentor feedback
 */

import type { PortfolioItem, EvidenceFile } from './types';

/**
 * Common cybersecurity skills keywords
 */
const SKILL_KEYWORDS = [
  // Network Security
  'network', 'firewall', 'ids', 'ips', 'vpn', 'wireshark', 'packet', 'tcp', 'udp', 'dns',
  // Web Security
  'web', 'xss', 'sql injection', 'csrf', 'owasp', 'api', 'rest', 'oauth', 'jwt',
  // Malware Analysis
  'malware', 'reverse engineering', 'sandbox', 'static analysis', 'dynamic analysis',
  // Incident Response
  'incident response', 'forensics', 'dfir', 'siem', 'splunk', 'log analysis',
  // Penetration Testing
  'pentest', 'penetration testing', 'metasploit', 'burp', 'nmap', 'kali', 'oscp',
  // Cloud Security
  'aws', 'azure', 'gcp', 'cloud', 'docker', 'kubernetes', 'container',
  // Cryptography
  'crypto', 'encryption', 'rsa', 'aes', 'hash', 'ssl', 'tls',
  // Programming
  'python', 'javascript', 'java', 'c++', 'go', 'rust', 'bash', 'powershell',
  // Tools
  'wireshark', 'burp suite', 'nmap', 'metasploit', 'kali linux', 'splunk', 'elastic',
];

/**
 * Extract skills from text content
 */
export function extractSkillsFromText(text: string): string[] {
  if (!text) return [];

  const lowerText = text.toLowerCase();
  const foundSkills: Set<string> = new Set();

  // Check for keyword matches
  SKILL_KEYWORDS.forEach((keyword) => {
    if (lowerText.includes(keyword.toLowerCase())) {
      foundSkills.add(keyword);
    }
  });

  // Extract hashtags (e.g., #cybersecurity, #pentest)
  const hashtagMatches = text.match(/#[\w]+/g);
  if (hashtagMatches) {
    hashtagMatches.forEach((tag) => {
      foundSkills.add(tag.substring(1)); // Remove #
    });
  }

  // Extract common patterns like "skill: value" or "skill - description"
  const patternMatches = text.match(/(\w+)\s*[:|-]\s*[\w\s]+/gi);
  if (patternMatches) {
    patternMatches.forEach((match) => {
      const skill = match.split(/[:|-]/)[0].trim().toLowerCase();
      if (skill.length > 2 && skill.length < 30) {
        foundSkills.add(skill);
      }
    });
  }

  return Array.from(foundSkills).slice(0, 20); // Limit to 20 skills
}

/**
 * Extract skills from mission title
 */
export function extractSkillsFromMissionTitle(title: string): string[] {
  return extractSkillsFromText(title);
}

/**
 * Extract skills from evidence files
 */
export function extractSkillsFromEvidence(files: EvidenceFile[]): string[] {
  const skills: Set<string> = new Set();

  files.forEach((file) => {
    // Extract from filename
    if (file.name) {
      const filenameSkills = extractSkillsFromText(file.name);
      filenameSkills.forEach((skill) => skills.add(skill));
    }

    // Extract from file type/extension
    if (file.url) {
      const extension = file.url.split('.').pop()?.toLowerCase();
      if (extension) {
        const extensionMap: Record<string, string> = {
          py: 'python',
          js: 'javascript',
          java: 'java',
          cpp: 'c++',
          go: 'go',
          rs: 'rust',
          sh: 'bash',
          ps1: 'powershell',
        };
        if (extensionMap[extension]) {
          skills.add(extensionMap[extension]);
        }
      }
    }
  });

  return Array.from(skills);
}

/**
 * Extract skills from mentor feedback
 */
export function extractSkillsFromFeedback(feedback: string): string[] {
  return extractSkillsFromText(feedback);
}

/**
 * Auto-extract skills from portfolio item
 */
export function autoExtractSkills(item: PortfolioItem): string[] {
  const allSkills: Set<string> = new Set();

  // Extract from title
  const titleSkills = extractSkillsFromMissionTitle(item.title);
  titleSkills.forEach((skill) => allSkills.add(skill));

  // Extract from summary
  if (item.summary) {
    const summarySkills = extractSkillsFromText(item.summary);
    summarySkills.forEach((skill) => allSkills.add(skill));
  }

  // Extract from evidence files
  if (item.evidenceFiles && item.evidenceFiles.length > 0) {
    const evidenceSkills = extractSkillsFromEvidence(item.evidenceFiles);
    evidenceSkills.forEach((skill) => allSkills.add(skill));
  }

  // Extract from mentor feedback
  if (item.mentorFeedback) {
    const feedbackSkills = extractSkillsFromFeedback(item.mentorFeedback);
    feedbackSkills.forEach((skill) => allSkills.add(skill));
  }

  // Merge with existing skill tags (don't duplicate)
  item.skillTags.forEach((tag) => allSkills.add(tag.toLowerCase()));

  return Array.from(allSkills)
    .map((skill) => skill.charAt(0).toUpperCase() + skill.slice(1)) // Capitalize
    .slice(0, 15); // Limit to 15 skills
}

/**
 * Normalize skill name (remove duplicates, standardize format)
 */
export function normalizeSkillName(skill: string): string {
  // Remove common prefixes/suffixes
  let normalized = skill.trim().toLowerCase();

  // Standardize common variations
  const standardizations: Record<string, string> = {
    'pentest': 'penetration testing',
    'pentesting': 'penetration testing',
    'web sec': 'web security',
    'net sec': 'network security',
    'cyber sec': 'cybersecurity',
    'malware analysis': 'malware analysis',
    'reverse eng': 'reverse engineering',
  };

  if (standardizations[normalized]) {
    normalized = standardizations[normalized];
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

