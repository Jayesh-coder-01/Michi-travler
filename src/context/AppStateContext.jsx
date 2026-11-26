import { createContext, useContext, useEffect, useState } from 'react';
import {
  INITIAL_COMMENTS,
  JOURNEYS as INITIAL_JOURNEYS,
  PROFILE_USER as INITIAL_PROFILE,
} from '../data/journeys';

const AppStateContext = createContext(null);

function loadStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function AppStateProvider({ children }) {
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('michi-theme') === 'dark';
  });

  const [journeys, setJourneys] = useState(() =>
    loadStorage('michi-journeys', INITIAL_JOURNEYS)
  );
  const [bookmarkedIds, setBookmarkedIds] = useState(() =>
    loadStorage('michi-bookmarks', [])
  );
  const [likedIds, setLikedIds] = useState(() =>
    loadStorage('michi-likes', [])
  );
  const [followedAuthors, setFollowedAuthors] = useState(() =>
    loadStorage('michi-following', [])
  );
  const [profile, setProfile] = useState(() =>
    loadStorage('michi-profile', INITIAL_PROFILE)
  );
  const [isSignedIn, setIsSignedIn] = useState(() =>
    loadStorage('michi-signed-in', false)
  );
  const [commentsByJourney, setCommentsByJourney] = useState(() =>
    loadStorage('michi-comments', INITIAL_COMMENTS)
  );
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
      localStorage.setItem('michi-theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('michi-theme', 'light');
    }
  }, [dark]);

  // Hydrate from SQLite backend when available
  useEffect(() => {
    let active = true;
    fetch('/api/bootstrap')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data) return;
        if (Array.isArray(data.journeys)) setJourneys(data.journeys);
        if (data.profile) setProfile(data.profile);
        if (data.commentsByJourney) setCommentsByJourney(data.commentsByJourney);
        if (Array.isArray(data.bookmarkedIds))
          setBookmarkedIds(data.bookmarkedIds);
        if (Array.isArray(data.likedIds)) setLikedIds(data.likedIds);
        if (Array.isArray(data.followedAuthors))
          setFollowedAuthors(data.followedAuthors);
      })
      .catch(() => {
        // Fallback silently to localStorage when running frontend-only
      });
    return () => {
      active = false;
    };
  }, []);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => {
      setToast((current) => (current === message ? null : current));
    }, 2800);
  };

  const toggleTheme = () => setDark((prev) => !prev);

  const toggleBookmark = (id) => {
    setBookmarkedIds((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((item) => item !== id) : [...prev, id];
      localStorage.setItem('michi-bookmarks', JSON.stringify(next));
      showToast(exists ? 'Removed from saved paths' : 'Saved to your atlas');
      return next;
    });
    fetch(`/api/journeys/${encodeURIComponent(id)}/bookmark`, {
      method: 'POST',
    }).catch(() => {});
  };

  const toggleLike = (id) => {
    setLikedIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id];
      localStorage.setItem('michi-likes', JSON.stringify(next));
      return next;
    });
    fetch(`/api/journeys/${encodeURIComponent(id)}/like`, {
      method: 'POST',
    }).catch(() => {});
  };

  const toggleFollow = (handle) => {
    setFollowedAuthors((prev) => {
      const exists = prev.includes(handle);
      const next = exists ? prev.filter((h) => h !== handle) : [...prev, handle];
      localStorage.setItem('michi-following', JSON.stringify(next));
      showToast(exists ? `Unfollowed ${handle}` : `Following ${handle}`);
      return next;
    });
    fetch('/api/follow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handle }),
    }).catch(() => {});
  };

  const addJourney = (newJourney) => {
    setJourneys((prev) => {
      const next = [newJourney, ...prev];
      localStorage.setItem('michi-journeys', JSON.stringify(next));
      return next;
    });
    showToast('Journey published to MICHI!');
    fetch('/api/journeys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newJourney),
    }).catch(() => {});
  };

  const updateProfile = (updates) => {
    setProfile((prev) => {
      const initials = (updates.name || prev.name)
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join('');
      const next = { ...prev, ...updates, initials: initials || prev.initials };
      localStorage.setItem('michi-profile', JSON.stringify(next));
      return next;
    });
    showToast('Profile updated');
    fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).catch(() => {});
  };

  const signIn = (name) => {
    setIsSignedIn(true);
    localStorage.setItem('michi-signed-in', 'true');
    if (name && name.trim()) {
      updateProfile({ name: name.trim() });
    } else {
      showToast('Welcome back to MICHI');
    }
  };

  const signOut = () => {
    setIsSignedIn(false);
    localStorage.setItem('michi-signed-in', 'false');
    showToast('Signed out');
  };

  const addComment = (journeyId, text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const entry = {
      id: `c-${Date.now()}`,
      author: profile.name,
      handle: profile.handle,
      text: trimmed,
      time: 'Just now',
    };
    setCommentsByJourney((prev) => {
      const current = prev[journeyId] || [];
      const next = { ...prev, [journeyId]: [entry, ...current] };
      localStorage.setItem('michi-comments', JSON.stringify(next));
      return next;
    });
    showToast('Thought added');
    fetch(`/api/journeys/${encodeURIComponent(journeyId)}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        author: profile.name,
        handle: profile.handle,
        text: trimmed,
      }),
    }).catch(() => {});
  };

  return (
    <AppStateContext.Provider
      value={{
        dark,
        toggleTheme,
        journeys,
        addJourney,
        bookmarkedIds,
        toggleBookmark,
        likedIds,
        toggleLike,
        followedAuthors,
        toggleFollow,
        profile,
        updateProfile,
        isSignedIn,
        signIn,
        signOut,
        commentsByJourney,
        addComment,
        showToast,
      }}
    >
      {children}
      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-[var(--border)] bg-[var(--foreground)] px-5 py-2.5 text-xs font-bold text-[var(--background)] shadow-xl"
        >
          {toast}
        </div>
      )}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return ctx;
}
