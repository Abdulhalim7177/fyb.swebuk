/**
 * Utility functions for academic level-based access control
 */

// Define academic level hierarchy
export const academicLevelHierarchy = {
  student: 0,      // New students start here
  level_100: 100,
  level_200: 200,
  level_300: 300,
  level_400: 400,
  alumni: 999,     // Highest level
};

/**
 * Check if a user has access based on their academic level
 * @param userAcademicLevel - The academic level of the user
 * @param requiredLevel - The minimum required level for access
 * @returns boolean indicating if access is granted
 */
export function hasAcademicLevelAccess(userAcademicLevel: string, requiredLevel: string): boolean {
  const userLevelValue = academicLevelHierarchy[userAcademicLevel as keyof typeof academicLevelHierarchy] ?? 0;
  const requiredLevelValue = academicLevelHierarchy[requiredLevel as keyof typeof academicLevelHierarchy] ?? 0;
  
  return userLevelValue >= requiredLevelValue;
}

/**
 * Get the next academic level for a user
 * @param currentLevel - The current academic level of the user
 * @returns The next academic level or 'alumni' if they're at level_400
 */
export function getNextAcademicLevel(currentLevel: string): string {
  switch (currentLevel) {
    case 'student':
      return 'level_100';
    case 'level_100':
      return 'level_200';
    case 'level_200':
      return 'level_300';
    case 'level_300':
      return 'level_400';
    case 'level_400':
      return 'alumni';
    default:
      return currentLevel;  // If already alumni or unknown level, stay there
  }
}

/**
 * Check if a user is eligible for FYP (Final Year Project) access
 * @param userAcademicLevel - The academic level of the user
 * @returns boolean indicating if user can access FYP features
 */
export function isEligibleForFYP(userAcademicLevel: string): boolean {
  return userAcademicLevel === 'level_400';
}

/**
 * Check if user is in their final year (level_400)
 * @param userAcademicLevel - The academic level of the user
 * @returns boolean indicating if user is in final year
 */
export function isFinalYearStudent(userAcademicLevel: string): boolean {
  return userAcademicLevel === 'level_400';
}

/**
 * Check if user is an alumnus
 * @param userAcademicLevel - The academic level of the user
 * @returns boolean indicating if user is an alumnus
 */
export function isAlumni(userAcademicLevel: string): boolean {
  return userAcademicLevel === 'alumni';
}