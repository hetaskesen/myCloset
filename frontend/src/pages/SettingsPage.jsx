import { usePushNotifications } from '../hooks/usePushNotifications';

export default function SettingsPage() {
  const { permission, subscribed, loading, subscribe, unsubscribe } = usePushNotifications();
  const isPWA = window.matchMedia('(display-mode: standalone)').matches;

  return (
    <>
      <div className="topbar">
        <div className="page-title">Settings</div>
      </div>
      <div className="content" style={{ maxWidth: 520 }}>

        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>🔔 Notifications</div>

          {!isPWA && (
            <div style={{ background: 'var(--amber-light)', border: '0.5px solid #FAC775', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#633806' }}>
              💡 Install this app to your home screen for the best notification experience. In your browser, tap <strong>Share → Add to Home Screen</strong>.
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Daily outfit check-in</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
                {subscribed ? 'You\'ll get a notification when it\'s time to log' : 'Get a daily nudge to log your outfit'}
              </div>
            </div>
            <button className={`btn${subscribed ? '' : ' btn-primary'}`} onClick={subscribed ? unsubscribe : subscribe} disabled={loading}>
              {loading ? '...' : subscribed ? 'Turn off' : 'Enable'}
            </button>
          </div>

          {permission === 'denied' && (
            <div style={{ fontSize: 12, color: 'var(--red-dark)', marginTop: 8 }}>
              Notifications are blocked. Enable them in your browser settings for this site.
            </div>
          )}

          <div style={{ borderTop: '0.5px solid var(--border)', paddingTop: 14, marginTop: 14 }}>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
              To schedule automatic daily notifications on Linux, add this cron job:<br/>
              <code style={{ fontFamily: 'monospace', background: 'var(--bg)', padding: '4px 8px', borderRadius: 4, display: 'block', marginTop: 8, fontSize: 11 }}>
                0 20 * * * curl -X POST https://your-api.railway.app/notifications/send-daily -H "x-api-secret: YOUR_SECRET"
              </code>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>📱 Install as app</div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.7 }}>
            My Closet is a Progressive Web App. Install it for an app-like experience with offline support:<br/><br/>
            <strong>Android:</strong> Tap ⋮ menu → "Add to Home screen"<br/>
            <strong>iPhone:</strong> Tap Share → "Add to Home Screen"<br/>
            <strong>Desktop:</strong> Click the install icon in your browser's address bar
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>🔑 API connection</div>
          <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
            <div style={{ marginBottom: 8 }}>Backend URL: <code style={{ fontFamily: 'monospace', fontSize: 12 }}>{import.meta.env.VITE_API_URL || 'not set'}</code></div>
            <div>API Secret: <code style={{ fontFamily: 'monospace', fontSize: 12 }}>{import.meta.env.VITE_API_SECRET ? '••••••••' : 'not set'}</code></div>
          </div>
        </div>
      </div>
    </>
  );
}
