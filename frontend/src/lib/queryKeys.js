export const queryKeys = {
  profile: {
    me: ['profile', 'me'],
    detail: ['profile', 'detail'],
    public: (id) => ['profile', 'public', id],
  },
  jobs: {
    search: (filters) => ['jobs', 'search', filters],
  },
  wallet: {
    details: ['wallet', 'details'],
    transactions: ({ page, limit }) => ['wallet', 'transactions', { page, limit }],
  },
}
