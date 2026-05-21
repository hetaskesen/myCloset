import React from 'react';
import { useState, useEffect } from 'react';
import { api } from '../utils/api';

const CATEGORIES = ['all','tops','bottoms','dresses','outerwear','shoes','accessories','other'];
const EMOJI = { tops:'👕', bottoms:'👖', dresses:'👗', outerwear:'🧥', shoes:'👟', accessories:'👜', other:'🧣' };

function ItemModal({ onClose, onSave, editItem }) {
  const [form, setForm] = useState(editItem || { name:'', category:'tops', brand:'', color:'', date_acquired:'', notes:'' });
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(editItem?.photo_url || null);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
      if (photo) fd.append('photo', photo);
      if (editItem) await api.updateItem(editItem.id, fd);
      else await api.createItem(fd);
      onSave();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">{editItem ? 'Edit item' : 'Add new item'}</div>
        <div className="form-group">
          <label className="form-label">Photo</label>
          <label className="photo-upload" style={{ display:'block' }}>
            {preview ? <img src={preview} alt="preview" className="photo-preview" /> : <span>📷 Tap to upload photo</span>}
            <input type="file" accept="image/*" onChange={handlePhoto} style={{ display:'none' }} />
          </label>
        </div>
        <div className="form-group">
          <label className="form-label">Name *</label>
          <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. White linen shirt" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Category *</label>
            <select className="form-select" value={form.category} onChange={e => set('category', e.target.value)}>
              {CATEGORIES.filter(c => c !== 'all').map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Color</label>
            <input className="form-input" value={form.color} onChange={e => set('color', e.target.value)} placeholder="e.g. Navy" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Brand</label>
            <input className="form-input" value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="e.g. Zara" />
          </div>
          <div className="form-group">
            <label className="form-label">Date acquired</label>
            <input className="form-input" type="date" value={form.date_acquired} onChange={e => set('date_acquired', e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-textarea" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Material, fit, how to style..." />
        </div>
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving || !form.name}>
            {saving ? 'Saving...' : editItem ? 'Save changes' : 'Add item'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClosetPage() {
  const [items, setItems] = useState([]);
  const [category, setCategory] = useState('all');
  const [modal, setModal] = useState(null); // null | 'add' | item object
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { setItems(await api.getItems(category !== 'all' ? { category } : {})); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [category]);

  return (
    <>
      <div className="topbar">
        <div className="page-title">My closet <span>· {items.length} items</span></div>
        <button className="btn btn-primary" onClick={() => setModal('add')}>+ Add item</button>
      </div>
      <div className="content">
        <div className="filter-row">
          {CATEGORIES.map(c => (
            <button key={c} className={`chip${category===c?' active':''}`} onClick={() => setCategory(c)}>
              {c === 'all' ? 'All' : `${EMOJI[c]} ${c}`}
            </button>
          ))}
        </div>
        {loading ? (
          <div style={{ padding:40, textAlign:'center', color:'var(--text-3)' }}>Loading...</div>
        ) : (
          <div className="item-grid">
            {items.map(item => (
              <div key={item.id} className="item-card" onClick={() => setModal(item)}>
                {item.photo_url
                  ? <img src={item.photo_url} alt={item.name} className="item-photo" />
                  : <div className="item-photo-placeholder">{EMOJI[item.category] || '👚'}</div>
                }
                <div className="item-info">
                  <div className="item-name">{item.name}</div>
                  <div className="item-meta">{item.brand || item.category}</div>
                  <div className="wear-badge">
                    <div className="wear-dot" style={{ background: item.wear_count > 0 ? '#5DCAA5' : '#F09595' }} />
                    <span style={{ color: item.wear_count > 0 ? 'var(--teal-dark)' : 'var(--red-dark)' }}>
                      {item.wear_count > 0 ? `worn ${item.wear_count}×` : 'never worn'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            <button className="add-card" onClick={() => setModal('add')}>
              <span className="add-card-icon">+</span><span>add item</span>
            </button>
          </div>
        )}
      </div>
      {modal && (
        <ItemModal
          editItem={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load(); }}
        />
      )}
    </>
  );
}
