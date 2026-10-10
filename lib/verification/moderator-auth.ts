export function isAuthorizedModerator(
  userId: string,
  profileRole: string | null | undefined,
  allowlistedUserIds: readonly string[],
) {
  return profileRole === "moderator" && allowlistedUserIds.includes(userId);
}
