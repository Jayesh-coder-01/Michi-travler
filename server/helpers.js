export function computeInitials(name) {
  return (
    (name || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('') || 'TR'
  );
}

export function formatLikesLabel(count) {
  const num = Number(count) || 0;
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return String(num);
}

export function slugify(text) {
  return (
    (text || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'path'
  );
}

export function relativeTime(isoString) {
  if (!isoString) return 'Just now';
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function canViewJourney(db, journeyRow, viewerId) {
  if (!journeyRow) return false;
  if (journeyRow.author_id === viewerId) return true;
  if (journeyRow.status === 'draft' || journeyRow.visibility === 'Private draft') {
    return false;
  }
  if (journeyRow.visibility === 'Followers only') {
    if (!viewerId) return false;
    const follows = db
      .prepare(
        'SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?'
      )
      .get(viewerId, journeyRow.author_id);
    return Boolean(follows);
  }
  return true;
}

export function serializeJourney(db, row, viewerId = null) {
  const author = db
    .prepare(
      'SELECT id, handle, name, initials, avatar_url FROM users WHERE id = ?'
    )
    .get(row.author_id);

  const stops = db
    .prepare(
      `SELECT id, position, name, day, mode, note, photo_url, lat, lng, type
       FROM journey_stops
       WHERE journey_id = ?
       ORDER BY position ASC`
    )
    .all(row.id)
    .map((s, idx, arr) => ({
      id: s.id,
      name: s.name,
      day: s.day,
      mode: s.mode,
      note: s.note,
      photoUrl: s.photo_url || '',
      lat: s.lat,
      lng: s.lng,
      type: s.type,
      index: idx > 0 && idx < arr.length - 1 ? idx : undefined,
    }));

  const isLiked = viewerId
    ? Boolean(
        db
          .prepare(
            'SELECT 1 FROM journey_likes WHERE user_id = ? AND journey_id = ?'
          )
          .get(viewerId, row.id)
      )
    : false;

  const isBookmarked = viewerId
    ? Boolean(
        db
          .prepare(
            'SELECT 1 FROM journey_bookmarks WHERE user_id = ? AND journey_id = ?'
          )
          .get(viewerId, row.id)
      )
    : false;

  const isFollowingAuthor =
    viewerId && author
      ? Boolean(
          db
            .prepare(
              'SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?'
            )
            .get(viewerId, author.id)
        )
      : false;

  const authorSummary = author
    ? {
        id: author.id,
        initials: author.initials,
        name: author.name,
        handle: author.handle,
        avatarUrl: author.avatar_url || '',
      }
    : {
        id: row.author_id,
        initials: 'TR',
        name: 'Traveller',
        handle: '@traveller',
        avatarUrl: '',
      };

  return {
    id: row.id,
    authorId: row.author_id,
    tag: row.tag,
    route: row.route,
    routeStart: row.route_start,
    routeEnd: row.route_end,
    title: row.title,
    days: row.days,
    stopsCount: stops.length || row.stops_count,
    meta: `${row.days} days · ${stops.length || row.stops_count} stops`,
    image: row.image,
    author: authorSummary,
    profileAuthor: authorSummary,
    likes: formatLikesLabel(row.likes_count),
    likesCount: row.likes_count,
    thoughts: row.thoughts_count,
    summary: row.summary,
    status: row.status,
    visibility: row.visibility,
    isLiked,
    isBookmarked,
    isFollowingAuthor,
    canEdit: Boolean(viewerId && viewerId === row.author_id),
    stops,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
