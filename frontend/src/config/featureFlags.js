export function isMockDataEnabled() {
  return import.meta.env.VITE_USE_MOCK_DATA === 'true'
}
