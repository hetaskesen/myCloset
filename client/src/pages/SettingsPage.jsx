import React from 'react';
import { usePushNotifications } from '../hooks/usePushNotifications';

export default function SettingsPage() {
  const { permission, subscribed, loading, subscribe, unsubscribe } = usePushNotifications();
  return (
    <>
      <div className="topbar"><div className="page-title">Settings</div></div>
      <div className="content" style={{ maxWidth:520 }}>
        <div className="card" style={{ padding:20, marginBottom:16 }}>
          <div style={{ fontSize:14, fontWeight:600, marginBottom:16 }}>🔔 Daily notifications</div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
            <div>
              <div style={{ fontSize:13, fontWeight:500 }}>Daily outfit check-in</div>
              <div style={{ fontSize:12, color:'var(--text-2)', marginTop:2 }}>
                {subscribed ? "You'll get notified to log your outfit" : 'Get a daily nudge to log your outfit'}
              </div>
            </div>
            <button className={`btn${subscribed?'':' btn-primary'}`} onClick={subscribed?unsubscribe:subscribe} disabled={loading}>
              {loading ? '...' : subscribed ? 'Turn off' : 'Enable'}
            </button>
          </div>
          {permission === 'denied' && (
            <div style={{ fontSize:12, color:'var(--red-dark)', marginTop:8 }}>
              Notifications are blocked in your browser settings.
            </div>
          )}
          <div style={{ borderTop:'0.5px solid var(--border)', paddingTop:14, marginTop:14, fontSize:12, color:'var(--text-3)' }}>
            To trigger daily notifications via cron (Linux), add this to <code>crontab -e</code>:<br/>
            <code style={{ fontFamily:'monospace', background:'var(--bg)', padding:'4px 8px', borderRadius:4, display:'block', marginTop:8, fontSize:11 }}>
              0 20 * * * curl -s -X POST http://localhost:3001/api/notifications/send-daily -H "x-api-secret: YOUR_SECRET"
            </code>
          </div>
        </div>
        <div className="card" style={{ padding:20 }}>
          <div style={{ fontSize:14, fontWeight:600, marginBottom:12 }}>📱 Install as app</div>
          <div style={{ fontSize:13, color:'var(--text-2)', lineHeight:1.8 }}>
            This is a Progressive Web App — install it for app-like experience with offline support:<br/>
            <strong>Android:</strong> tap ⋮ → "Add to Home screen"<br/>
            <strong>iPhone:</strong> tap Share → "Add to Home Screen"<br/>
            <strong>Desktop:</strong> click the install icon in the address bar
          </div>
        </div>
      </div>
    </>
  );
}
