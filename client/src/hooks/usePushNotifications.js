import { useState, useEffect } from 'react';
import { api } from '../utils/api';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return new Uint8Array([...rawData].map(c => c.charCodeAt(0)));
}

export function usePushNotifications() {
  const [permission, setPermission] = useState(Notification.permission);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && permission === 'granted') {
      navigator.serviceWorker.ready.then(reg =>
        reg.pushManager.getSubscription().then(sub => setSubscribed(!!sub))
      );
    }
  }, [permission]);

  const subscribe = async () => {
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') return;
      const reg = await navigator.serviceWorker.ready;
      const { publicKey } = await api.getVapidKey();
      if (!publicKey) { alert('Push notifications not configured yet.'); return; }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      await api.subscribe(sub.toJSON());
      setSubscribed(true);
    } catch (err) {
      console.error('Subscribe error:', err);
    } finally { setLoading(false); }
  };

  const unsubscribe = async () => {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) { await api.unsubscribe(sub.endpoint); await sub.unsubscribe(); }
      setSubscribed(false);
    } catch (err) { console.error('Unsubscribe error:', err); }
    finally { setLoading(false); }
  };

  return { permission, subscribed, loading, subscribe, unsubscribe };
}
