import { getUserAvatarDataUri, getUserInitials } from '../lib/avatar'

function UserAvatar({ user, size = 44, className = '' }) {
  const initials = getUserInitials(user)
  const src = getUserAvatarDataUri(user, Math.max(size, 64))
  const label = user?.email ? `Avatar for ${user.email}` : `Avatar ${initials}`

  return (
    <img
      src={src}
      alt={label}
      width={size}
      height={size}
      className={`user-avatar ${className}`.trim()}
    />
  )
}

export default UserAvatar
