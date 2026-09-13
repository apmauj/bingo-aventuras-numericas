export type LineCompletionRole = 'master' | 'student';

/**
 * Local line feedback belongs only to the student whose card completed it.
 * Other participants still receive the broadcast toast, but must not see a
 * highlight or hear the local completion sound on their own screen.
 */
export function isOwnLineCompletion(
  currentRole: LineCompletionRole,
  completedPlayerId: string,
  currentPlayerId: string,
): boolean {
  return currentRole === 'student'
    && currentPlayerId.length > 0
    && completedPlayerId === currentPlayerId;
}
