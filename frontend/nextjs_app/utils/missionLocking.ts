/**
 * Mission Locking Logic
 *
 * Handles track-based mission locking where missions are only unlocked
 * if they match the user's enrolled/recommended track from their profile.
 *
 * A mission is LOCKED if:
 * 1. The user's profile does not have an enrolled track, OR
 * 2. The mission's track_key does not match the user's enrolled track
 *
 * Lock Reason Types:
 * - 'not_enrolled': User hasn't enrolled in any track yet
 * - 'wrong_track': Mission is for a different track
 * - 'pending_profile': User's track info is still loading
 */

export type LockReason =
  | 'not_enrolled'
  | 'wrong_track'
  | 'pending_profile'
  | null

export interface MissionLockState {
  is_locked: boolean
  lock_reason: LockReason
  lock_message: string
}

export interface UserTrackInfo {
  track_key?: string
  track_name?: string
  enrollment_status?: 'enrolled' | 'pending' | 'not_enrolled'
  profile_complete?: boolean
}

export interface MissionInfo {
  id: string
  code: string
  title: string
  track_key?: string
  track?: string
}

/**
 * Determine if a mission should be locked based on user's track enrollment
 *
 * @param mission - The mission to check
 * @param userTrack - The user's track information
 * @param isProfileLoading - Whether the user profile is still loading
 * @returns MissionLockState with lock status and reason
 */
export function getMissionLockState(
  mission: MissionInfo,
  userTrack: UserTrackInfo,
  isProfileLoading: boolean = false
): MissionLockState {
  // Profile is still loading
  if (isProfileLoading) {
    return {
      is_locked: true,
      lock_reason: 'pending_profile',
      lock_message: 'Loading your track information...'
    }
  }

  // User hasn't enrolled in any track yet
  if (!userTrack?.track_key) {
    return {
      is_locked: true,
      lock_reason: 'not_enrolled',
      lock_message:
        'Complete your profile and select a track to unlock this mission. ' +
        'Visit your profile to enroll in a track.'
    }
  }

  // Mission is for a different track
  const missionTrack = mission.track_key || mission.track
  if (missionTrack && missionTrack !== userTrack.track_key) {
    const trackNames: Record<string, string> = {
      defender: 'Defender Track',
      offensive: 'Offensive Track',
      grc: 'GRC Track',
      innovation: 'Innovation Track',
      leadership: 'Leadership Track'
    }

    const missionTrackName = trackNames[missionTrack] || missionTrack.toUpperCase()
    const userTrackName = trackNames[userTrack.track_key] || userTrack.track_key.toUpperCase()

    return {
      is_locked: true,
      lock_reason: 'wrong_track',
      lock_message:
        `This mission is for the ${missionTrackName}. ` +
        `You are enrolled in the ${userTrackName} track. ` +
        `Switch tracks in your profile to unlock this mission.`
    }
  }

  // Mission is unlocked
  return {
    is_locked: false,
    lock_reason: null,
    lock_message: ''
  }
}

/**
 * Filter missions to only include unlocked missions for a user
 *
 * @param missions - Array of missions to filter
 * @param userTrack - User's track information
 * @param includeLockedInfo - If true, include lock state in returned missions
 * @returns Filtered missions (only unlocked) or missions with lock state
 */
export function filterUnlockedMissions<T extends MissionInfo>(
  missions: T[],
  userTrack: UserTrackInfo,
  includeLockedInfo: boolean = false
): Array<T & Partial<MissionLockState>> {
  if (includeLockedInfo) {
    // Return all missions with lock state attached
    return missions.map(mission => ({
      ...mission,
      ...getMissionLockState(mission, userTrack)
    }))
  }

  // Return only unlocked missions
  return missions.filter(mission => {
    const lockState = getMissionLockState(mission, userTrack)
    return !lockState.is_locked
  })
}

/**
 * Get lock reason description for UI display
 */
export function getLockReasonDescription(reason: LockReason): string {
  const descriptions: Record<string, string> = {
    not_enrolled: 'Complete your profile to enroll in a track',
    wrong_track: 'This mission is for a different track',
    pending_profile: 'Loading track information...'
  }

  return descriptions[reason || ''] || 'This mission is locked'
}

/**
 * Get lock reason icon type for UI display
 */
export function getLockReasonIcon(
  reason: LockReason
): 'lock' | 'alert' | 'info' | 'clock' {
  switch (reason) {
    case 'not_enrolled':
      return 'alert'
    case 'wrong_track':
      return 'lock'
    case 'pending_profile':
      return 'clock'
    default:
      return 'lock'
  }
}

/**
 * Check if a user is ready to access missions
 * (has completed profile and enrolled in a track)
 */
export function isUserMissionReady(userTrack: UserTrackInfo): boolean {
  return Boolean(userTrack?.track_key && userTrack?.profile_complete !== false)
}
