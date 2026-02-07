/**
 * External OAuth Integration
 * GitHub and TryHackMe OAuth for portfolio imports
 */

import { createClient } from '@/lib/supabase/client';
import type { PortfolioItem, EvidenceFile } from './types';

const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || '';
const THM_CLIENT_ID = process.env.NEXT_PUBLIC_THM_CLIENT_ID || '';

/**
 * GitHub OAuth Integration
 */
export async function connectGitHub(): Promise<void> {
  const redirectUri = `${window.location.origin}/api/auth/github/callback`;
  const scope = 'repo read:user';
  const state = generateState();

  // Store state in sessionStorage
  sessionStorage.setItem('github_oauth_state', state);

  const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;
  
  window.location.href = authUrl;
}

export async function importGitHubRepositories(
  userId: string,
  accessToken: string
): Promise<PortfolioItem[]> {
  try {
    // Fetch user's repositories
    const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=10', {
      headers: {
        Authorization: `token ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) throw new Error('Failed to fetch GitHub repositories');

    const repos = await response.json();
    const supabase = createClient();

    const portfolioItems: PortfolioItem[] = [];

    for (const repo of repos) {
      // Create portfolio item from repository
      const evidenceFiles: EvidenceFile[] = [
        {
          url: repo.html_url,
          type: 'link',
          size: 0,
          name: repo.name,
        },
      ];

      if (repo.homepage) {
        evidenceFiles.push({
          url: repo.homepage,
          type: 'link',
          size: 0,
          name: 'Live Demo',
        });
      }

      const { data: item, error } = await supabase
        .from('portfolio_items')
        .insert({
          user_id: userId,
          title: `GitHub: ${repo.name}`,
          summary: repo.description || `Repository: ${repo.name}`,
          type: 'github',
          visibility: 'marketplace_preview',
          skill_tags: extractSkillsFromRepo(repo),
          evidence_files: evidenceFiles,
          external_providers: {
            github: {
              repo_id: repo.id,
              repo_name: repo.name,
              repo_url: repo.html_url,
              language: repo.language,
              stars: repo.stargazers_count,
              forks: repo.forks_count,
              created_at: repo.created_at,
              updated_at: repo.updated_at,
            },
          },
          status: 'draft',
        })
        .select()
        .single();

      if (!error && item) {
        portfolioItems.push(item as any);
      }
    }

    return portfolioItems;
  } catch (error) {
    console.error('GitHub import failed:', error);
    throw error;
  }
}

/**
 * TryHackMe OAuth Integration
 */
export async function connectTryHackMe(): Promise<void> {
  const redirectUri = `${window.location.origin}/api/auth/thm/callback`;
  const state = generateState();

  sessionStorage.setItem('thm_oauth_state', state);

  const authUrl = `https://tryhackme.com/oauth/authorize?client_id=${THM_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${state}`;
  
  window.location.href = authUrl;
}

export async function importTryHackMeProfile(
  userId: string,
  accessToken: string
): Promise<PortfolioItem[]> {
  try {
    // Fetch user's THM profile and completed rooms
    const profileResponse = await fetch('https://tryhackme.com/api/user/profile', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!profileResponse.ok) throw new Error('Failed to fetch THM profile');

    const profile = await profileResponse.json();

    const roomsResponse = await fetch('https://tryhackme.com/api/user/completed-rooms', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const rooms = roomsResponse.ok ? await roomsResponse.json() : [];
    const supabase = createClient();

    const portfolioItems: PortfolioItem[] = [];

    // Create portfolio item for THM profile
    const evidenceFiles: EvidenceFile[] = [
      {
        url: `https://tryhackme.com/p/${profile.username}`,
        type: 'link',
        size: 0,
        name: 'THM Profile',
      },
    ];

    const { data: item, error } = await supabase
      .from('portfolio_items')
      .insert({
        user_id: userId,
        title: `TryHackMe Profile: ${profile.username}`,
        summary: `Rank: ${profile.rank}, Rooms Completed: ${rooms.length}`,
        type: 'thm',
        visibility: 'marketplace_preview',
        skill_tags: extractSkillsFromTHM(rooms),
        evidence_files: evidenceFiles,
        external_providers: {
          thm: {
            username: profile.username,
            rank: profile.rank,
            rooms_completed: rooms.length,
            profile_url: `https://tryhackme.com/p/${profile.username}`,
          },
        },
        status: 'draft',
      })
      .select()
      .single();

    if (!error && item) {
      portfolioItems.push(item as any);
    }

    return portfolioItems;
  } catch (error) {
    console.error('TryHackMe import failed:', error);
    throw error;
  }
}

/**
 * Helper Functions
 */
function generateState(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function extractSkillsFromRepo(repo: any): string[] {
  const skills: string[] = [];
  
  if (repo.language) {
    skills.push(repo.language.toLowerCase());
  }

  // Extract from topics
  if (repo.topics) {
    skills.push(...repo.topics);
  }

  // Extract from description
  const commonSkills = ['python', 'javascript', 'typescript', 'react', 'node', 'security', 'cybersecurity', 'pentesting', 'siem', 'dfir'];
  const description = (repo.description || '').toLowerCase();
  commonSkills.forEach(skill => {
    if (description.includes(skill)) {
      skills.push(skill);
    }
  });

  return Array.from(new Set(skills));
}

function extractSkillsFromTHM(rooms: any[]): string[] {
  const skills = new Set<string>();
  
  rooms.forEach(room => {
    if (room.categories) {
      room.categories.forEach((cat: string) => skills.add(cat.toLowerCase()));
    }
    if (room.tags) {
      room.tags.forEach((tag: string) => skills.add(tag.toLowerCase()));
    }
  });

  return Array.from(skills);
}

/**
 * OAuth Callback Handlers
 */
export async function handleGitHubCallback(code: string, state: string): Promise<string> {
  const storedState = sessionStorage.getItem('github_oauth_state');
  
  if (state !== storedState) {
    throw new Error('Invalid state parameter');
  }

  // Exchange code for access token
  const response = await fetch('/api/auth/github/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) throw new Error('Failed to exchange code for token');

  const { access_token } = await response.json();
  return access_token;
}

export async function handleTryHackMeCallback(code: string, state: string): Promise<string> {
  const storedState = sessionStorage.getItem('thm_oauth_state');
  
  if (state !== storedState) {
    throw new Error('Invalid state parameter');
  }

  // Exchange code for access token
  const response = await fetch('/api/auth/thm/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) throw new Error('Failed to exchange code for token');

  const { access_token } = await response.json();
  return access_token;
}

