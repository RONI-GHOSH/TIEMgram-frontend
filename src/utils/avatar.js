export const DEFAULT_AVATAR = "/avatar.jpg";

export function getAvatarUrl(avatar, fallback = DEFAULT_AVATAR) {
  return avatar || fallback;
}

export function getUserAvatar(user, fallback = DEFAULT_AVATAR) {
  return user?.avatar_url || user?.avatar || fallback;
}

export function getProfileAvatar(profileData, currentUser, fallback = DEFAULT_AVATAR) {
  return profileData?.avatar_url || profileData?.avatar || currentUser?.avatar_url || currentUser?.avatar || fallback;
}
