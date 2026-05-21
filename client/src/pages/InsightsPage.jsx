import React from 'react';
import { useState, useEffect } from 'react';
import { api } from '../utils/api';

const EMOJI = { tops:'👕', bottoms:'👖', dresses:'👗', outerwear:'🧥', shoes:'👟', accessories:'👜', other:'🧣' };

export default function InsightsPage() {
  const [stats, setStats] = useState(null);
  useEffect(() => { api.getStats().then(setStats).catch(console.error); }, []);
  if (!stats) return <div style={{ padding:40, textAlign:'center', color:'var(--text-3)' }}>Loading insights...</div>;
  const maxWear = Math.max(...(stats.most_worn?.map(i => i.wear_count)||[1]), 1);
  const maxMonth = Math.max(...(stats.wear_by_month?.map(m => m.count)||[1]), 1);
  return (
    <>
      <div className="topbar">
        <div className="page-title">Insights</div>
        {stats.streak_days > 0 && (
          <div style={{ background:'var(--amber-light)', color:'#633806', fontSize:12, fontWeight:500, padding:'4px 12px', borderRadius:99 }}>
            🔥 {stats.streak_days}-day streak
          </div>
        )}
      </div>
      <div className="content">
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-label">Items owned</div><div className="stat-val">{stats.total_items}</div></div>
          <div className="stat-card"><div className="stat-label">Saved outfits</div><div className="stat-val">{stats.total_outfits}</div></div>
          <div className="stat-card"><div className="stat-label">Logged this month</div><div className="stat-val">{stats.logs_this_month}</div></div>
          <div className="stat-card"><div className="stat-label">Never worn</div><div className="stat-val" style={{ color:stats.never_worn?.length>0?'var(--red-dark)':'inherit' }}>{stats.never_worn?.length||0}</div></div>
        </div>
        {stats.most_worn?.length > 0 && (
          <div className="card" style={{ padding:16, marginBottom:16 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:14 }}>Most worn items</div>
            {stats.most_worn.map(item => (
              <div key={item.id} className="bar-row">
                <span style={{ fontSize:18 }}>{EMOJI[item.category]||'👚'}</span>
                <span className="bar-label">{item.name}</span>
                <div className="bar-track"><div className="bar-fill" style={{ width:`${Math.round(item.wear_count/maxWear*100)}%` }} /></div>
                <span className="bar-count">{item.wear_count}×</span>
              </div>
            ))}
          </div>
        )}
        {stats.wear_by_month?.length > 0 && (
          <div className="card" style={{ padding:16, marginBottom:16 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:14 }}>Outfits logged per month</div>
            {stats.wear_by_month.map(m => (
              <div key={m.month} className="bar-row">
                <span className="bar-label">{new Date(m.month+'-01').toLocaleDateString('en-US',{month:'short',year:'numeric'})}</span>
                <div className="bar-track"><div className="bar-fill" style={{ width:`${Math.round(m.count/maxMonth*100)}%` }} /></div>
                <span className="bar-count">{m.count}</span>
              </div>
            ))}
          </div>
        )}
        {stats.never_worn?.length > 0 && (
          <div style={{ background:'var(--red-light)', border:'0.5px solid var(--red-mid)', borderRadius:'var(--radius)', padding:16, marginBottom:16 }}>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--red-dark)', marginBottom:8 }}>⚠️ {stats.never_worn.length} items never worn</div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {stats.never_worn.map(item => (
                <span key={item.id} style={{ background:'white', border:'0.5px solid var(--red-mid)', borderRadius:6, padding:'4px 8px', fontSize:12 }}>
                  {EMOJI[item.category]} {item.name}
                </span>
              ))}
            </div>
          </div>
        )}
        {stats.category_breakdown?.length > 0 && (
          <div className="card" style={{ padding:16 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:14 }}>Closet by category</div>
            {stats.category_breakdown.map(c => (
              <div key={c.category} className="bar-row">
                <span style={{ fontSize:18 }}>{EMOJI[c.category]||'🧣'}</span>
                <span className="bar-label" style={{ textTransform:'capitalize' }}>{c.category}</span>
                <div className="bar-track"><div className="bar-fill" style={{ width:`${Math.round(c.count/stats.total_items*100)}%` }} /></div>
                <span className="bar-count">{c.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
