/**
 * Job state information
 */
export interface JobStateInfo {
  name: string;
  color: string;
}

/**
 * Get job state name and color from PBS state
 * @param pbsState PBS job state (Q, R, C, E, H, F, X, B, etc.)
 * @param exitCode Exit code (for completed jobs to determine success/failure)
 * @returns Job state information with name and color
 */
export function getJobStateFromPbsState(
  pbsState: string,
  exitCode?: number | null,
): JobStateInfo {
  const state = pbsState?.toUpperCase() || 'U';

  switch (state) {
    case 'Q':
      return {
        name: 'queued',
        color: 'bg-gray-200 text-gray-800',
      };
    case 'R':
    case 'B':
      return {
        name: 'running',
        color: 'bg-blue-100 text-blue-800',
      };
    case 'C':
    case 'F':
    case 'X':
      // Completed jobs - check exit code for success/failure
      if (exitCode !== null && exitCode !== undefined && exitCode !== 0) {
        return {
          name: 'completed_with_error',
          color: 'bg-red-100 text-red-800',
        };
      }
      return {
        name: 'completed',
        color: 'bg-green-100 text-green-800',
      };
    case 'E':
      return {
        name: 'exiting',
        color: 'bg-orange-100 text-orange-800',
      };
    case 'H':
      return {
        name: 'held',
        color: 'bg-red-100 text-red-800',
      };
    case 'S':
      return {
        name: 'suspended',
        color: 'bg-gray-100 text-gray-800',
      };
    case 'T':
    case 'M':
      return {
        name: 'moved',
        color: 'bg-gray-100 text-gray-800',
      };
    case 'W':
      return {
        name: 'waiting',
        color: 'bg-yellow-100 text-yellow-800',
      };
    default:
      return {
        name: 'unknown',
        color: 'bg-gray-100 text-gray-800',
      };
  }
}
