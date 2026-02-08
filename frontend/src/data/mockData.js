/**
 * Original frontend mock data used for all users when logged in with mock auth.
 * Single source of truth so login shows the same experience for everyone.
 */

export const MOCK_USER = {
  id: 1,
  name: "Buddy",
  email: "guest@example.com",
};

export const MOCK_PETS = [
  { id: 1, name: "Buddy", species: "dog" },
];

export const MOCK_EVENTS = [
  { id: 1, date: "2025-10-24", title: "Vet Checkup", pet: "Buddy" },
];

export const MOCK_POSTS_LIST = [
  {
    id: 1,
    user_name: "Luna's Mom",
    title: "New dog park opened!",
    content: "Just wanted to share – the new dog park on Main St is amazing. Buddy loved it!",
    created_at: "2 mins ago",
  },
];

export const MOCK_POSTS_BY_ID = {
  1: MOCK_POSTS_LIST[0],
};

/** Activity bar heights (percent) for Stats / Home preview - 7 days */
export const MOCK_ACTIVITY_HEIGHTS = [50, 80, 40, 95, 70, 60, 85];

/** Upcoming events in API shape: { events: [...] } */
export const MOCK_UPCOMING_EVENTS = {
  events: MOCK_EVENTS.map((e) => ({
    id: e.id,
    date: e.date,
    title: e.title,
    pet_name: e.pet,
  })),
};
