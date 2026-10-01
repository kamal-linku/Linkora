// Time formatting utility for chats and timestamps
export function formatMessageTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${minutes} ${ampm}`;
}

export function formatChatSnippetTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const now = new Date();

  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  if (isToday) {
    return formatMessageTime(isoString);
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  if (isYesterday) {
    return 'Yesterday';
  }

  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function formatLastSeen(isoString) {
  if (!isoString) return 'offline';
  const d = new Date(isoString);
  const now = new Date();
  const diffMinutes = Math.floor((now - d) / (1000 * 60));

  if (diffMinutes < 1) return 'last seen just now';
  if (diffMinutes < 60) return `last seen ${diffMinutes}m ago`;
  return `last seen today at ${formatMessageTime(isoString)}`;
}
