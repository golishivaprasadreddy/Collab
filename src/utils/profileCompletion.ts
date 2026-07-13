import { FullProfile } from "@/hooks/useProfile";

interface CompletionResult {
  percentage: number;
  isComplete: boolean;
  missingFields: string[];
}

/**
 * Calculate profile completion percentage.
 * Fields and weights:
 * - full_name: 15%
 * - college: 10%
 * - degree: 10%
 * - year: 5%
 * - bio: 10%
 * - avatar_url: 10%
 * - skills (at least 1): 20%
 * - availability (at least 1): 10%
 * - interests: 10%
 */
export function calculateProfileCompletion(profile: FullProfile | null): CompletionResult {
  if (!profile) return { percentage: 0, isComplete: false, missingFields: ["Profile not found"] };

  const checks: { field: string; label: string; weight: number; filled: boolean }[] = [
    { field: "full_name", label: "Full Name", weight: 15, filled: !!profile.full_name?.trim() },
    { field: "college", label: "College", weight: 10, filled: !!profile.college?.trim() },
    { field: "degree", label: "Degree", weight: 10, filled: !!profile.degree?.trim() },
    { field: "year", label: "Year", weight: 5, filled: !!profile.year?.trim() },
    { field: "bio", label: "Bio", weight: 10, filled: !!profile.bio?.trim() },
    { field: "avatar_url", label: "Profile Photo", weight: 10, filled: !!profile.avatar_url },
    { field: "skills", label: "At least 1 skill", weight: 20, filled: (profile.skills?.length || 0) > 0 },
    { field: "availability", label: "Availability", weight: 10, filled: !!(profile.availability?.learning || profile.availability?.project || profile.availability?.paid_collaboration) },
    { field: "interests", label: "Interests", weight: 10, filled: (profile.availability?.interests?.length || 0) > 0 },
  ];

  const percentage = checks.reduce((sum, c) => sum + (c.filled ? c.weight : 0), 0);
  const missingFields = checks.filter((c) => !c.filled).map((c) => c.label);

  return {
    percentage,
    isComplete: percentage >= 70,
    missingFields,
  };
}

/** Daily request limit */
export const DAILY_REQUEST_LIMIT = 5;

/** Request expiration in days */
export const REQUEST_EXPIRY_DAYS = 7;
