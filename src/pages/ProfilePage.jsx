import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Film, X } from 'lucide-react';
import JourneyCard from '../components/JourneyCard';
import { useAppState } from '../context/AppStateContext';

export default function ProfilePage() {
  const { profile, updateProfile, journeys, bookmarkedIds } = useAppState();
  const [activeTab, setActiveTab] = useState('Overview');
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(profile.name);
  const [draftLocation, setDraftLocation] = useState(profile.location);
  const [draftBio, setDraftBio] = useState(profile.bio);

  const profileJourneys = journeys.filter(
    (j) =>
      j.profileAuthor.handle === profile.handle ||
      j.author.handle === profile.handle ||
      bookmarkedIds.includes(j.id)
  );

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateProfile({
      name: draftName.trim() || profile.name,
      location: draftLocation.trim() || profile.location,
      bio: draftBio.trim() || profile.bio,
    });
    setEditing(false);
  };

  return (
    <main>
      {/* Cover Banner */}
      <div className="relative h-44 w-full overflow-hidden border-b border-[var(--border)] sm:h-56">
        <img
          src={profile.coverImage}
          alt="Alpine ridge cover"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141A18]/45 to-transparent" />
      </div>

      <div className="mx-auto max-w-[1400px] px-5 pb-16 lg:px-8">
        {/* Avatar + Name Row */}
        <div className="-mt-12 flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-end gap-4">
            <div className="flex size-24 items-center justify-center rounded-full border-4 border-[var(--background)] bg-[var(--accent)] font-heading text-2xl font-extrabold text-[#141A18] shadow-lg">
              {profile.initials}
            </div>
            <div className="pb-1">
              <h1 className="font-heading text-2xl font-extrabold tracking-[-.03em] text-[var(--foreground)] sm:text-3xl">
                {profile.name}
              </h1>
              <p className="text-xs font-medium text-[var(--muted-foreground)]">
                {profile.handle} · {profile.location}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setDraftName(profile.name);
              setDraftLocation(profile.location);
              setDraftBio(profile.bio);
              setEditing(true);
            }}
            className="michi-interactive rounded-full border border-[var(--border)] bg-[var(--card)] px-5 py-2 text-xs font-bold text-[var(--foreground)] hover:border-[var(--accent)]"
          >
            Edit profile
          </button>
        </div>

        <p className="mt-5 max-w-xl text-sm leading-6 text-[var(--muted-foreground)]">
          {profile.bio}
        </p>

        {/* Stats */}
        <div className="mt-6 flex flex-wrap gap-8 border-b border-[var(--border)] pb-6">
          {profile.stats.map((stat) => (
            <div key={stat.label} className="flex items-baseline gap-1.5">
              <span className="font-heading text-lg font-extrabold text-[var(--foreground)]">
                {stat.label === 'journeys'
                  ? Math.max(14, profileJourneys.length)
                  : stat.value}
              </span>
              <span className="text-xs text-[var(--muted-foreground)]">
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-6 overflow-x-auto border-b border-[var(--border)]">
          {profile.tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`border-b-2 py-3.5 text-sm font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-[var(--accent)] text-[var(--foreground)]'
                    : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {(activeTab === 'Overview' || activeTab === 'Trips') && (
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {profileJourneys.map((journey) => (
              <JourneyCard key={journey.id} journey={journey} useProfileAuthor />
            ))}
          </div>
        )}

        {activeTab === 'Field notes' && (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {profileJourneys.map((journey) => (
              <Link
                key={journey.id}
                to={`/journey/${journey.id}`}
                className="michi-interactive rounded-[20px] border border-[var(--border)] bg-[var(--card)] p-6"
              >
                <p className="text-xs font-bold uppercase tracking-[.14em] text-[var(--accent)]">
                  {journey.route}
                </p>
                <h3 className="font-heading mt-2 text-xl font-extrabold text-[var(--foreground)]">
                  {journey.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                  {journey.summary}
                </p>
              </Link>
            ))}
          </div>
        )}

        {activeTab === 'Photos' && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {journeys.map((journey) => (
              <Link
                key={journey.id}
                to={`/journey/${journey.id}`}
                className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-[var(--border)]"
              >
                <img
                  src={journey.image}
                  alt={journey.title}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <span className="absolute bottom-3 left-3 rounded-full bg-[#141A18]/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                  {journey.title}
                </span>
              </Link>
            ))}
          </div>
        )}

        {activeTab === 'Videos' && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {profileJourneys.slice(0, 2).map((journey) => (
              <Link
                key={journey.id}
                to={`/journey/${journey.id}`}
                className="michi-interactive flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4"
              >
                <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-xl">
                  <img
                    src={journey.image}
                    alt={journey.title}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute inset-0 flex items-center justify-center bg-[#141A18]/35 text-white">
                    <Film className="size-5" />
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                    0:48 trail reel
                  </p>
                  <p className="font-heading mt-1 text-base font-extrabold text-[var(--foreground)]">
                    {journey.title}
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    {journey.meta}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {editing && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#141A18]/60 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSaveProfile}
            className="w-full max-w-md rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl font-extrabold text-[var(--foreground)]">
                Edit profile
              </h2>
              <button
                type="button"
                onClick={() => setEditing(false)}
                aria-label="Close modal"
                className="rounded-full p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                  Display name
                </label>
                <input
                  type="text"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-xl border border-[var(--input)] bg-[var(--background)] px-3.5 text-sm text-[var(--foreground)]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                  Location
                </label>
                <input
                  type="text"
                  value={draftLocation}
                  onChange={(e) => setDraftLocation(e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-xl border border-[var(--input)] bg-[var(--background)] px-3.5 text-sm text-[var(--foreground)]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                  Bio
                </label>
                <textarea
                  rows={3}
                  value={draftBio}
                  onChange={(e) => setDraftBio(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[var(--input)] bg-[var(--background)] p-3.5 text-sm text-[var(--foreground)]"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-full border border-[var(--border)] px-4 py-2 text-xs font-bold text-[var(--foreground)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-full bg-[var(--accent)] px-5 py-2 text-xs font-bold text-[#141A18]"
              >
                Save changes
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
