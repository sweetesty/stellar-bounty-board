import type { Bounty, BountyStatus } from './types';

export interface BountyRecommendation {
  bounty: Bounty;
  reasons: string[];
  score: number;
}

export interface ContributorProfile {
  address?: string;
  completedLabels: string[];
  preferredRepos: string[];
  averageRewardRange: {
    min: number;
    max: number;
  };
  skills: string[];
}

const LABEL_WEIGHTS: Record<string, number> = {
  'help wanted': 0.8,
  'good first issue': 0.9,
  'beginner friendly': 0.9,
  documentation: 0.7,
  bug: 0.6,
  enhancement: 0.6,
  feature: 0.6,
  backend: 0.5,
  frontend: 0.5,
  javascript: 0.4,
  typescript: 0.4,
  react: 0.4,
  'node.js': 0.4,
  stellar: 0.3,
  blockchain: 0.3,
};

const REPO_WEIGHT = 0.3;
const REWARD_WEIGHT = 0.2;

const STATUS_WEIGHTS: Record<BountyStatus, number> = {
  open: 1.0,
  reserved: 0.2,
  submitted: 0.1,
  released: 0,
  refunded: 0,
  expired: 0,
};

function normalizeTerms(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean))];
}

function getBountySkillTerms(bounty: Bounty): string[] {
  const labelTerms = bounty.labels.map((label) => label.name);
  const titleTerms = bounty.title.split(/[^a-zA-Z0-9#+.]+/);
  const summaryTerms = bounty.summary.split(/[^a-zA-Z0-9#+.]+/);

  return normalizeTerms([...labelTerms, ...titleTerms, ...summaryTerms]);
}

export function scoreMatch(bounty: Bounty, skills: string[]): number {
  const bountySkills = getBountySkillTerms(bounty);
  const contributorSkills = normalizeTerms(skills);

  if (bountySkills.length === 0 || contributorSkills.length === 0) {
    return 0;
  }

  const bountySkillSet = new Set(bountySkills);
  const contributorSkillSet = new Set(contributorSkills);
  let overlap = 0;

  for (const skill of contributorSkillSet) {
    if (bountySkillSet.has(skill)) {
      overlap += 1;
      continue;
    }

    for (const bountySkill of bountySkillSet) {
      if (bountySkill.includes(skill) || skill.includes(bountySkill)) {
        overlap += 1;
        break;
      }
    }
  }

  return Math.round((overlap / contributorSkillSet.size) * 100) / 100;
}

export function calculateRecommendationScore(
  bounty: Bounty,
  profile: ContributorProfile
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let totalScore = 0;
  let maxPossibleScore = 0;

  const labelScore = bounty.labels.reduce((acc, label) => {
    const normalizedLabel = label.name.toLowerCase();
    const weight = LABEL_WEIGHTS[normalizedLabel] || 0.1;

    if (profile.completedLabels.includes(normalizedLabel)) {
      reasons.push(`You've worked with "${label.name}" before`);
      return acc + weight * 1.5;
    }

    if (normalizedLabel === 'good first issue' || normalizedLabel === 'beginner friendly') {
      reasons.push('Great for getting started');
      return acc + weight;
    }

    return acc + weight;
  }, 0);

  totalScore += labelScore;
  maxPossibleScore += bounty.labels.length * 1.5;

  if (profile.preferredRepos.some((repo) => bounty.repo.includes(repo))) {
    totalScore += REPO_WEIGHT;
    maxPossibleScore += REPO_WEIGHT;
    reasons.push(`You're familiar with ${bounty.repo}`);
  }

  if (
    bounty.amount >= profile.averageRewardRange.min &&
    bounty.amount <= profile.averageRewardRange.max
  ) {
    totalScore += REWARD_WEIGHT;
    maxPossibleScore += REWARD_WEIGHT;
    reasons.push('Reward matches your typical range');
  }

  const skillScore = scoreMatch(bounty, profile.skills);

  if (skillScore > 0) {
    totalScore += skillScore * 0.5;
    maxPossibleScore += 0.5;
    reasons.push(`Matches ${Math.round(skillScore * 100)}% of your skills`);
  }

  const statusWeight = STATUS_WEIGHTS[bounty.status] || 0;
  totalScore *= statusWeight;
  maxPossibleScore *= statusWeight;

  const normalizedScore = maxPossibleScore > 0 ? totalScore / maxPossibleScore : 0;

  return {
    score: Math.round(normalizedScore * 100) / 100,
    reasons: reasons.slice(0, 3),
  };
}

export function generateRecommendations(
  bounties: Bounty[],
  profile: ContributorProfile,
  limit = 5
): BountyRecommendation[] {
  return bounties
    .filter((bounty) => bounty.status === 'open')
    .map((bounty) => {
      const { score, reasons } = calculateRecommendationScore(bounty, profile);

      return {
        bounty,
        score,
        reasons,
      };
    })
    .filter((recommendation) => recommendation.score > 0.1)
    .sort((a, b) => {
      const scoreDifference = b.score - a.score;

      if (scoreDifference !== 0) {
        return scoreDifference;
      }

      return (
        scoreMatch(b.bounty, profile.completedLabels) -
        scoreMatch(a.bounty, profile.completedLabels)
      );
    })
    .slice(0, limit);
}

export function createDefaultProfile(): ContributorProfile {
  return {
    completedLabels: [],
    preferredRepos: [],
    averageRewardRange: {
      min: 0,
      max: 1000,
    },
    skills: [],
  };
}

export function updateProfileFromBounties(
  profile: ContributorProfile,
  completedBounties: Bounty[]
): ContributorProfile {
  const updatedProfile = { ...profile };

  const newLabels = completedBounties
    .filter((bounty) => bounty.status === 'released')
    .flatMap((bounty) => bounty.labels.map((label) => label.name.toLowerCase()));

  updatedProfile.completedLabels = [...new Set([...profile.completedLabels, ...newLabels])];

  const newRepos = completedBounties
    .filter((bounty) => bounty.status === 'released')
    .map((bounty) => bounty.repo.split('/')[0]);

  updatedProfile.preferredRepos = [...new Set([...profile.preferredRepos, ...newRepos])];

  const releasedBounties = completedBounties.filter((bounty) => bounty.status === 'released');

  if (releasedBounties.length > 0) {
    const amounts = releasedBounties.map((bounty) => bounty.amount);

    updatedProfile.averageRewardRange = {
      min: Math.min(...amounts),
      max: Math.max(...amounts),
    };
  }

  const inferredSkills = new Set<string>(profile.skills);
  const skillKeywords = [
    'react',
    'typescript',
    'javascript',
    'rust',
    'python',
    'solidity',
    'stellar',
    'blockchain',
    'frontend',
    'backend',
    'docs',
    'testing',
    'node.js',
    'node',
    'api',
    'css',
    'html',
    'docker',
    'graphql',
    'web3',
    'smart-contract',
  ];

  for (const label of newLabels) {
    if (skillKeywords.includes(label)) {
      const skill = label.charAt(0).toUpperCase() + label.slice(1);

      if (skill === 'Docs') {
        inferredSkills.add('Docs');
      } else if (skill === 'Node.js') {
        inferredSkills.add('Node.js');
      } else {
        inferredSkills.add(skill);
      }
    }
  }

  updatedProfile.skills = [...inferredSkills];

  return updatedProfile;
}
