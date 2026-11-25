import { TokenStorage } from '../src/api/storage';
import { User } from '../src/api/types';

describe('TokenStorage & Secure Auth Cache', () => {
  beforeEach(async () => {
    await TokenStorage.clearAll();
  });

  it('stores and retrieves JWT authentication token', async () => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.testToken';
    await TokenStorage.saveToken(token);

    const retrieved = await TokenStorage.getToken();
    expect(retrieved).toBe(token);
  });

  it('clears stored authentication token', async () => {
    await TokenStorage.saveToken('sample_token');
    await TokenStorage.clearToken();

    const retrieved = await TokenStorage.getToken();
    expect(retrieved).toBeNull();
  });

  it('stores and retrieves serialized User profile object', async () => {
    const user: User = {
      id: 'tech-surbhi-01',
      email: 'surbhi.field@industrialbrain.io',
      role: 'technician',
      name: 'Surbhi (Lead Field Tech)',
    };

    await TokenStorage.saveUser(user);

    const retrieved = await TokenStorage.getUser();
    expect(retrieved).toEqual(user);
    expect(retrieved?.role).toBe('technician');
  });

  it('persists custom backend URL override', async () => {
    const customUrl = 'http://192.168.1.100:8000';
    await TokenStorage.saveCustomUrl(customUrl);

    const retrieved = await TokenStorage.getCustomUrl();
    expect(retrieved).toBe(customUrl);

    await TokenStorage.saveCustomUrl(null);
    expect(await TokenStorage.getCustomUrl()).toBeNull();
  });

  it('persists offline mode setting', async () => {
    await TokenStorage.saveOfflineMode(true);
    expect(await TokenStorage.getOfflineMode()).toBe(true);

    await TokenStorage.saveOfflineMode(false);
    expect(await TokenStorage.getOfflineMode()).toBe(false);
  });
});
