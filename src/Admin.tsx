import { useEffect, useState, type FormEvent } from 'react';
import {
  inboxConfigured,
  signInAdmin,
  refreshAdmin,
  listEnquiries,
  signOutAdmin,
  exportEnquiries,
  storageMode,
} from './inbox-client.mjs';

type Enquiry = {
  id: string;
  created_at: string;
  name: string;
  organization: string;
  designation: string;
  email: string;
  phone: string;
  industry: string;
  service: string;
  topic: string;
  date: string;
  time: string;
  mode: string;
  message: string;
};

type Session = {
  access_token: string;
  refresh_token: string;
};

const sessionKey = 'mdk-admin-session';

export default function Admin() {
  const [session, setSession] = useState<Session | null>(null);
  const [entries, setEntries] = useState<Enquiry[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  async function load(token: string) {
    try {
      setEntries(await listEnquiries(token));
      setError('');
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Unable to load enquiries.'
      );
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => {
    if (!inboxConfigured) return;

    let active = true;

    const raw = sessionStorage.getItem(sessionKey);

    if (!raw) return;

    try {
      const previous = JSON.parse(raw);

      refreshAdmin(previous.refresh_token)
        .then((next) => {
          if (!active) return;

          const s = {
            access_token: next.access_token,
            refresh_token: next.refresh_token,
          };

          sessionStorage.setItem(
            sessionKey,
            JSON.stringify(s)
          );

          setSession(s);
          load(s.access_token);
        })
        .catch(() => {
          sessionStorage.removeItem(sessionKey);

          if (active) {
            setError(
              'Session expired. Please sign in again.'
            );
          }
        });
    } catch {
      sessionStorage.removeItem(sessionKey);
    }

    return () => {
      active = false;
    };
  }, []);

  async function login(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setBusy(true);
    setError('');

    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const auth = await signInAdmin(
        String(data.get('email')),
        String(data.get('password'))
      );

      const s = {
        access_token: auth.access_token,
        refresh_token: auth.refresh_token,
      };

      sessionStorage.setItem(
        sessionKey,
        JSON.stringify(s)
      );

      setSession(s);
      form.reset();

      await load(s.access_token);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Unable to sign in.'
      );
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    if (session) {
      void signOutAdmin(session.access_token);
    }

    sessionStorage.removeItem(sessionKey);
    setSession(null);
    setEntries([]);
    setError('');
    setLoaded(false);
  }

  async function exportCsv() {
    if (!session) return;

    try {
      setBusy(true);
      setError('');

      await exportEnquiries(
        session.access_token
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Unable to export enquiries.'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="section admin-section">
      <p className="eyebrow">MDK / PRIVATE</p>

      <h1>Enquiry inbox</h1>

      <p className="small muted">
        {storageMode === 'node'
          ? 'Private Node.js and SQLite inbox'
          : 'Private Supabase inbox'}
      </p>

      {!inboxConfigured ? (
        <p
          role="status"
          className="form-status"
        >
          Configure the Node.js server or Supabase
          to enable a shared inbox. See{' '}
          <strong>BACKEND-SETUP.md</strong>.
        </p>
      ) : !session ? (
        <form
          className="admin-login contact-form"
          onSubmit={login}
        >
          <h2>Admin sign in</h2>

          <p>
            Only an authorized MDK administrator
            can view enquiries.
          </p>

          <label>
            Email
            <input
              name="email"
              type="email"
              autoComplete="username"
              required
            />
          </label>

          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>

          <button
            className="button"
            disabled={busy}
          >
            {busy
              ? 'Signing in…'
              : 'Sign in'}
          </button>
        </form>
      ) : (
        <>
          <div className="admin-tools">
            <p>
              {loaded
                ? `${entries.length} recent enquiries`
                : 'Loading enquiries…'}
            </p>

            <div>
              <button
                className="button secondary"
                type="button"
                onClick={() =>
                  load(session.access_token)
                }
              >
                Refresh inbox
              </button>

              <button
                className="button secondary"
                type="button"
                onClick={exportCsv}
                disabled={busy}
              >
                {busy
                  ? 'Exporting…'
                  : 'Export CSV'}
              </button>

              <button
                className="button secondary"
                type="button"
                onClick={logout}
              >
                Sign out
              </button>
            </div>
          </div>

          {loaded &&
            entries.length === 0 &&
            !error && (
              <p>
                No enquiries have been stored yet.
              </p>
            )}

          <div className="admin-entries">
            {entries.map((e) => (
              <article
                className="admin-entry"
                key={e.id}
              >
                <div className="admin-entry-heading">
                  <div>
                    <h2>{e.name}</h2>
                    <strong>
                      {e.organization}
                    </strong>
                  </div>

                  <time dateTime={e.created_at}>
                    {new Date(
                      e.created_at
                    ).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </time>
                </div>

                <dl>
                  {Object.entries({
                    Designation: e.designation,
                    Email: e.email,
                    Phone: e.phone,
                    Industry: e.industry,
                    Service: e.service,
                    Topic: e.topic,
                    'Preferred date': e.date,
                    'Preferred time': e.time,
                    Mode: e.mode,
                  })
                    .filter(([, v]) =>
                      Boolean(v)
                    )
                    .map(([k, v]) => (
                      <div key={k}>
                        <dt>{k}</dt>

                        <dd>
                          {k === 'Email' ? (
                            <a
                              href={
                                'mailto:' + v
                              }
                            >
                              {v}
                            </a>
                          ) : k === 'Phone' ? (
                            <a
                              href={
                                'tel:' + v
                              }
                            >
                              {v}
                            </a>
                          ) : (
                            v
                          )}
                        </dd>
                      </div>
                    ))}
                </dl>

                <h3>Enquiry</h3>

                <p className="admin-message">
                  {e.message}
                </p>
              </article>
            ))}
          </div>
        </>
      )}

      {error && (
        <p
          role="alert"
          className="form-status"
        >
          {error}
        </p>
      )}
    </section>
  );
}