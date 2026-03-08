// Dev-only in-memory store to keep booking requests working
// even when the database is unreachable.
//
// This is NOT durable storage and will reset on server restart.

function getStore() {
  if (!globalThis.__vapraBookingRequests) {
    globalThis.__vapraBookingRequests = [];
  }
  return globalThis.__vapraBookingRequests;
}

export function addBookingRequest(request) {
  const store = getStore();
  store.unshift(request);
}

export function listBookingRequests(limit = 50) {
  const store = getStore();
  return store.slice(0, limit);
}

