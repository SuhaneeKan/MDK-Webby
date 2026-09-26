const apiBase = '';

export const inboxConfigured = true;
export const storageMode = /** @type {'supabase' | 'node'} */ ('supabase');

async function decode(response) {
  const text = await response.text();

  let data;

  try {
    data = JSON.parse(text);
  } catch {
    data = null;
  }

  if (!response.ok || !data) {
    throw new Error(
      data?.error ||
      'Unable to complete the request.'
    );
  }

  return data;
}

export async function saveEnquiry(data) {
  const response = await fetch(
    `${apiBase}/api/consultation`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
  );

  return decode(response);
}

export async function signInAdmin(
  email,
  password
) {
  const response = await fetch(
    `${apiBase}/api/admin/login`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    }
  );

  return decode(response);
}

export async function refreshAdmin(
  refresh_token
) {
  const response = await fetch(
    `${apiBase}/api/admin/refresh`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token,
      }),
    }
  );

  return decode(response);
}

export async function listEnquiries(token) {
  const response = await fetch(
    `${apiBase}/api/admin/enquiries`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return decode(response);
}

export async function exportEnquiries(token) {
  const response = await fetch(
    `${apiBase}/api/admin/export.csv`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    let message = 'Unable to export enquiries.';

    try {
      const data = await response.json();
      message = data?.error || message;
    } catch {
      // Ignore JSON parsing failure.
    }

    throw new Error(message);
  }

  const blob = await response.blob();

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download =
    `mdk-enquiries-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

  document.body.appendChild(link);

  link.click();

  link.remove();

  URL.revokeObjectURL(url);
}

export async function signOutAdmin(token) {
  await fetch(
    `${apiBase}/api/admin/logout`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  ).catch(() => {});
}