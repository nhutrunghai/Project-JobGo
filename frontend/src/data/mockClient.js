import { isMockDataEnabled } from '../config/featureFlags.js'

export async function loadPortalMock() {
  if (!isMockDataEnabled()) {
    throw new Error('Mock portal data is disabled.')
  }

  const response = await fetch('/api/portal.json')
  if (!response.ok) {
    throw new Error('Không thể tải dữ liệu portal mock')
  }
  return response.json()
}
