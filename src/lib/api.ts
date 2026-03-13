export async function authFetch(url: string, options: RequestInit = {}) {
  const cookies = document.cookie.split('; ');
  const tokenCookie = cookies.find(c => c.startsWith('token='));
  const token = tokenCookie ? tokenCookie.split('=')[1] : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
}