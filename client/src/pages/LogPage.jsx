import React from 'react';
import { useState, useEffect } from 'react';
import { api } from '../utils/api';

const EMOJI = { tops:'👕', bottoms:'👖', dresses:'👗', outerwear:'🧥', shoes:'👟', accessories:'👜', other:'🧣' };
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function LogModal({ onClose, onSave, date }) {
  const [outfits, setOutfits] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [mode, setMode] = useState('outfit');
  const [selectedOutfit, setSelectedOutfit] = useState(null);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([api.getOutfits(), api.getItems()]).then(([o,i]) => { setOutfits(o); setAllItems(i); });
  }, []);

  const toggleItem = (id) => setSelectedItems(s => { const n = new Set(s); n.has(id)?n.delete(id):n.add(id); return n; });

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = { worn_date: date, notes };
      if (mode === 'outfit' && selectedOutfit) data.outfit_id = selectedOutfit;
      else if (mode === 'custom') data.item_ids = [...selectedItems];
      await api.logOutfit(data);
      onSave();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">Log outfit — {new Date(date+'T12:00:00').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</div>
        <div className="filter-row" style={{ marginBottom:16 }}>
          <button className={`chip${mode==='outfit'?' active':''}`} onClick={() => setMode('outfit')}>Saved outfit</button>
          <button className={`chip${mode==='custom'?' active':''}`} onClick={() => setMode('custom')}>Pick items</button>
        </div>
        {mode === 'outfit' ? (
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16, maxHeight:300, overflowY:'auto' }}>
            {outfits.map(o => (
              <div key={o.id} onClick={() => setSelectedOutfit(o.id)}
                style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', border:`1.5px solid ${selectedOutfit===o.id?'var(--purple)':'var(--border)'}`, borderRadius:8, cursor:'pointer', background:selectedOutfit===o.id?'var(--purple-light)':'var(--bg-card)' }}>
                <span style={{ fontSize:20 }}>{o.items?.slice(0,2).map(i=>EMOJI[i.category]||'👚').join('')||'🪄'}</span>
                <div>
                  <div style={{ fontSize:13, fontWeight:500 }}>{o.name}</div>
                  <div style={{ fontSize:11, color:'var(--text-3)' }}>{o.items?.length||0} items</div>
                </div>
              </div>
            ))}
            {outfits.length === 0 && <div style={{ color:'var(--text-3)', fontSize:13 }}>No saved outfits yet — pick items instead.</div>}
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(80px,1fr))', gap:8, marginBottom:16, maxHeight:300, overflowY:'auto' }}>
            {allItems.map(item => (
              <div key={item.id} onClick={() => toggleItem(item.id)}
                style={{ border:`1.5px solid ${selectedItems.has(item.id)?'var(--purple)':'var(--border)'}`, borderRadius:8, overflow:'hidden', cursor:'pointer', background:selectedItems.has(item.id)?'var(--purple-light)':'var(--bg-card)' }}>
                {item.photo_url
                  ? <img src={item.photo_url} alt={item.name} style={{ width:'100%', aspectRatio:'3/4', objectFit:'cover', display:'block' }} />
                  : <div style={{ aspectRatio:'3/4', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, background:'var(--bg)' }}>{EMOJI[item.category]||'👚'}</div>
                }
                <div style={{ padding:'4px 6px', fontSize:10, fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{item.name}</div>
              </div>
            ))}
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Notes (optional)</label>
          <input className="form-input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="How did it feel? Weather?" />
        </div>
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Log outfit'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LogPage() {
  const [logs, setLogs] = useState([]);
  const [todayLog, setTodayLog] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const load = async () => {
    const [l, t] = await Promise.all([api.getLogs(), api.getTodayLog()]);
    setLogs(l); setTodayLog(t);
  };
  useEffect(() => { load(); }, []);

  return (
    <>
      <div className="topbar">
        <div className="page-title">Daily log</div>
        <span style={{ fontSize:12, color:'var(--text-3)' }}>{new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</span>
      </div>
      {!todayLog && (
        <div className="banner banner-teal">
          <div className="banner-icon">👗</div>
          <div>
            <div className="banner-title">What did you wear today?</div>
            <div className="banner-sub">Log your outfit to keep your streak going</div>
          </div>
          <div className="banner-action" onClick={() => setShowModal(true)}>Log now →</div>
        </div>
      )}
      <div className="content">
        {logs.length === 0
          ? <div style={{ textAlign:'center', padding:40, color:'var(--text-3)' }}>No logs yet. Start by logging today's outfit!</div>
          : logs.map(log => {
              const d = new Date(log.worn_date+'T12:00:00');
              return (
                <div key={log.id} className="log-row">
                  <div className="log-date">
                    <div className="log-date-day">{DAYS[d.getDay()]}</div>
                    <div className="log-date-num">{d.getDate()}</div>
                  </div>
                  <div style={{ display:'flex', gap:6, fontSize:22 }}>
                    {log.items?.slice(0,4).map(i => <span key={i.id}>{EMOJI[i.category]||'👚'}</span>)}
                    {!log.items?.length && <span>👗</span>}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:500 }}>{log.outfit_name||'Custom outfit'}</div>
                    {log.notes && <div style={{ fontSize:12, color:'var(--text-2)', marginTop:2 }}>{log.notes}</div>}
                  </div>
                  <div className="logged-badge">logged ✓</div>
                </div>
              );
            })
        }
      </div>
      {showModal && <LogModal date={today} onClose={() => setShowModal(false)} onSave={() => { setShowModal(false); load(); }} />}
    </>
  );
}
