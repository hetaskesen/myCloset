import { useState, useEffect } from 'react';
import { api } from '../utils/api';

const CATEGORY_EMOJI = { tops:'👕', bottoms:'👖', dresses:'👗', outerwear:'🧥', shoes:'👟', accessories:'👜', other:'🧣' };

function OutfitModal({ onClose, onSave, editOutfit }) {
  const [allItems, setAllItems] = useState([]);
  const [name, setName] = useState(editOutfit?.name || '');
  const [notes, setNotes] = useState(editOutfit?.notes || '');
  const [selected, setSelected] = useState(new Set(editOutfit?.items?.map(i => i.id) || []));
  const [saving, setSaving] = useState(false);

  useEffect(() => { api.getItems().then(setAllItems); }, []);

  const toggle = (id) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleSave = async () => {
    if (!name) return;
    setSaving(true);
    try {
      const data = { name, notes, item_ids: [...selected] };
      if (editOutfit) await api.updateOutfit(editOutfit.id, data);
      else await api.createOutfit(data);
      onSave();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">{editOutfit ? 'Edit outfit' : 'Create outfit'}</div>
        <div className="form-group">
          <label className="form-label">Outfit name *</label>
          <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Casual Friday" />
        </div>
        <div className="form-group">
          <label className="form-label">Pick items</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 8 }}>
            {allItems.map(item => (
              <div key={item.id} onClick={() => toggle(item.id)}
                style={{ border: `1.5px solid ${selected.has(item.id) ? 'var(--purple)' : 'var(--border)'}`,
                  borderRadius: 8, overflow: 'hidden', cursor: 'pointer', background: selected.has(item.id) ? 'var(--purple-light)' : 'var(--bg-card)' }}>
                {item.photo_url
                  ? <img src={item.photo_url} alt={item.name} style={{ width: '100%', aspectRatio:'3/4', objectFit:'cover', display:'block' }} />
                  : <div style={{ aspectRatio:'3/4', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, background:'var(--bg)' }}>
                      {CATEGORY_EMOJI[item.category] || '👚'}
                    </div>
                }
                <div style={{ padding:'4px 6px', fontSize:10, fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{item.name}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder="When to wear, occasion..." />
        </div>
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || !name}>
            {saving ? 'Saving...' : editOutfit ? 'Save changes' : 'Create outfit'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OutfitsPage() {
  const [outfits, setOutfits] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editOutfit, setEditOutfit] = useState(null);

  const load = () => api.getOutfits().then(setOutfits);
  useEffect(() => { load(); }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this outfit?')) return;
    await api.deleteOutfit(id);
    load();
  };

  return (
    <>
      <div className="topbar">
        <div className="page-title">Outfits <span>· {outfits.length} saved</span></div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ New outfit</button>
      </div>
      <div className="content">
        <div className="item-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
          {outfits.map(outfit => (
            <div key={outfit.id} className="item-card" onClick={() => setEditOutfit(outfit)}>
              <div style={{ display:'flex', padding:10, gap:6, background:'var(--bg)', justifyContent:'center', minHeight:80, alignItems:'center', flexWrap:'wrap' }}>
                {outfit.items?.slice(0,3).map(item =>
                  item.photo_url
                    ? <img key={item.id} src={item.photo_url} alt={item.name} style={{ width:36, height:48, objectFit:'cover', borderRadius:4 }} />
                    : <span key={item.id} style={{ fontSize:28 }}>{CATEGORY_EMOJI[item.category] || '👚'}</span>
                )}
                {!outfit.items?.length && <span style={{ fontSize:32 }}>🪄</span>}
              </div>
              <div className="item-info">
                <div className="item-name">{outfit.name}</div>
                <div className="item-meta">{outfit.items?.length || 0} items · worn {outfit.wear_count || 0}×</div>
                {outfit.last_worn && <div className="item-meta" style={{ marginTop:2 }}>last: {new Date(outfit.last_worn).toLocaleDateString()}</div>}
              </div>
            </div>
          ))}
          <button className="add-card" onClick={() => setShowAdd(true)}>
            <span className="add-card-icon">+</span>
            <span>create outfit</span>
          </button>
        </div>
      </div>
      {(showAdd || editOutfit) && (
        <OutfitModal
          editOutfit={editOutfit}
          onClose={() => { setShowAdd(false); setEditOutfit(null); }}
          onSave={() => { setShowAdd(false); setEditOutfit(null); load(); }}
        />
      )}
    </>
  );
}
