import { useState, useEffect } from 'react';
import { api } from '../utils/api';

const CATEGORIES = ['all', 'tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories', 'other'];
const CATEGORY_EMOJI = { tops:'👕', bottoms:'👖', dresses:'👗', outerwear:'🧥', shoes:'👟', accessories:'👜', other:'🧣' };

function AddItemModal({ onClose, onSave, editItem }) {
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
    if (!form.name || !form.category) return;
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
      if (photo) fd.append('photo', photo);
      if (editItem) await api.updateItem(editItem.id, fd);
      else await api.createItem(fd);
      onSave();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">{editItem ? 'Edit item' : 'Add new item'}</div>
        <div className="form-group">
          <label className="form-label">Photo</label>
          <label className="photo-upload" style={{ display: 'block' }}>
            {preview ? <img src={preview} alt="preview" className="photo-preview" /> : <span>📷 Tap to upload photo</span>}
            <input type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
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
            <input className="form-input" value={form.color} onChange={e => set('color', e.target.value)} placeholder="e.g. Navy blue" />
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
          <textarea className="form-textarea" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Material, fit notes, how to style..." />
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
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
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getItems(category !== 'all' ? { category } : {});
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [category]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return;
    await api.deleteItem(id);
    load();
  };

  const maxWear = Math.max(...items.map(i => parseInt(i.wear_count || 0)), 1);

  return (
    <>
      <div className="topbar">
        <div className="page-title">My closet <span>· {items.length} items</span></div>
        <div className="topbar-actions">
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add item</button>
        </div>
      </div>
      <div className="content">
        <div className="filter-row">
          {CATEGORIES.map(c => (
            <button key={c} className={`chip${category === c ? ' active' : ''}`} onClick={() => setCategory(c)}>
              {c === 'all' ? 'All' : `${CATEGORY_EMOJI[c]} ${c}`}
            </button>
          ))}
        </div>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-3)' }}>Loading...</div>
        ) : (
          <div className="item-grid">
            {items.map(item => {
              const wearCount = parseInt(item.wear_count || 0);
              const isRarelyWorn = wearCount === 0;
              return (
                <div key={item.id} className="item-card" onClick={() => setEditItem(item)}>
                  {item.photo_url
                    ? <img src={item.photo_url} alt={item.name} className="item-photo" />
                    : <div className="item-photo-placeholder">{CATEGORY_EMOJI[item.category] || '👚'}</div>
                  }
                  <div className="item-info">
                    <div className="item-name">{item.name}</div>
                    <div className="item-meta">{item.brand || item.category}</div>
                    <div className="wear-badge">
                      <div className="wear-dot" style={{ background: isRarelyWorn ? '#F09595' : '#5DCAA5' }} />
                      <span style={{ color: isRarelyWorn ? 'var(--red-dark)' : 'var(--teal-dark)', fontSize: 11 }}>
                        {isRarelyWorn ? 'never worn' : `worn ${wearCount}×`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            <button className="add-card" onClick={() => setShowAdd(true)}>
              <span className="add-card-icon">+</span>
              <span>add item</span>
            </button>
          </div>
        )}
      </div>

      {(showAdd || editItem) && (
        <AddItemModal
          editItem={editItem}
          onClose={() => { setShowAdd(false); setEditItem(null); }}
          onSave={() => { setShowAdd(false); setEditItem(null); load(); }}
        />
      )}
    </>
  );
}
