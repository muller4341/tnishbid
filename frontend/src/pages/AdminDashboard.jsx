import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, Image as ImageIcon, AlignLeft, Tag, Calendar, DollarSign, ShieldCheck, Layers, CheckCircle2, AlertCircle, Smartphone, Clock, Sparkles, Edit3, Trash2, X, Save, Grid, Flame, Trophy } from 'lucide-react';

const toLocalISO = (date) => {
  const pad = (n) => (n < 10 ? '0' + n : n);
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const formatHumanDate = (isoStr) => {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

const CATEGORIES = [
  'Supercars & Vehicles',
  'Electronics',
  'Cosmetics',
  'Fashion & Luxury',
  'Appliances',
  'Others'
];

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [existingItems, setExistingItems] = useState([]);
  const [activeTab, setActiveTab] = useState('create'); // 'create' | 'manage'
  
  // Create Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Electronics',
    pool_type: 'premium', // 'premium' | 'open'
    base_price: '',
    start_time: '',
    end_time: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Edit Modal State
  const [editingItem, setEditingItem] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    category: 'Electronics',
    pool_type: 'premium',
    base_price: '',
    start_time: '',
    end_time: '',
    status: 'active'
  });
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  // Delete Confirm Modal State
  const [deletingItem, setDeletingItem] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchItems();

    const now = new Date();
    const end = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    setFormData(prev => ({
      ...prev,
      start_time: toLocalISO(now),
      end_time: toLocalISO(end)
    }));
  }, []);

  const fetchItems = async () => {
    try {
      const res = await axios.get('/api/items');
      setExistingItems(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setItemsLoading(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-red-950/40 text-red-400 border border-red-800/60 flex items-center justify-center mx-auto">
          <ShieldCheck size={32} />
        </div>
        <h2 className="text-2xl font-black text-white">Access Denied</h2>
        <p className="text-xs text-zinc-400 max-w-xs mx-auto">
          You must be logged in as a System Admin (Phone: <span className="font-mono font-bold text-amber-400">0911000000</span>) to access the Admin Dashboard.
        </p>
        <Link to="/login" className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-black font-bold text-xs rounded-xl shadow-md">
          <Smartphone size={16} /> Login as Admin
        </Link>
      </div>
    );
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview(null);
    }
  };

  const handleSetStartNow = () => {
    const now = new Date();
    setFormData(prev => ({ ...prev, start_time: toLocalISO(now) }));
  };

  const handleSetDurationHours = (hoursToAdd) => {
    const start = formData.start_time ? new Date(formData.start_time) : new Date();
    const end = new Date(start.getTime() + hoursToAdd * 60 * 60 * 1000);
    setFormData(prev => ({
      ...prev,
      start_time: toLocalISO(start),
      end_time: toLocalISO(end)
    }));
  };

  const handleFillSample = () => {
    const now = new Date();
    const end = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    setFormData({
      title: 'Porsche 911 Carrera S',
      description: 'Luxury twin-turbo performance sports car. Win this supercar with the lowest unique bid!',
      category: 'Supercars & Vehicles',
      pool_type: 'premium',
      base_price: '87.00',
      start_time: toLocalISO(now),
      end_time: toLocalISO(end)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('category', formData.category);
      data.append('pool_type', formData.pool_type);
      data.append('base_price', formData.base_price);
      data.append('start_time', formData.start_time);
      data.append('end_time', formData.end_time);
      if (imageFile) {
        data.append('image', imageFile);
      }

      await axios.post('/api/items', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setSuccess(`Auction item created under "${formData.pool_type === 'premium' ? 'Active Premium Pool' : 'Active Open Bid'}"!`);
      const now = new Date();
      const end = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      setFormData({
        title: '',
        description: '',
        category: 'Electronics',
        pool_type: 'premium',
        base_price: '',
        start_time: toLocalISO(now),
        end_time: toLocalISO(end)
      });
      setImageFile(null);
      setImagePreview(null);
      fetchItems();
      
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create item');
    } finally {
      setLoading(false);
    }
  };

  // --- EDIT HANDLERS ---
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setEditFormData({
      title: item.title || '',
      description: item.description || '',
      category: item.category || 'Electronics',
      pool_type: item.pool_type || 'open',
      base_price: item.base_price ? item.base_price.toString() : '',
      start_time: toLocalISO(item.start_time),
      end_time: toLocalISO(item.end_time),
      status: item.status || 'active'
    });
    setEditImageFile(null);
    setEditImagePreview(item.image_url || null);
  };

  const handleEditChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleEditFileChange = (e) => {
    const file = e.target.files[0];
    setEditImageFile(file);
    if (file) {
      setEditImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;

    setEditLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = new FormData();
      data.append('title', editFormData.title);
      data.append('description', editFormData.description);
      data.append('category', editFormData.category);
      data.append('pool_type', editFormData.pool_type);
      data.append('base_price', editFormData.base_price);
      data.append('start_time', editFormData.start_time);
      data.append('end_time', editFormData.end_time);
      data.append('status', editFormData.status);
      if (editImageFile) {
        data.append('image', editImageFile);
      }

      await axios.put(`/api/items/${editingItem.id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccess(`Auction item "${editFormData.title}" updated successfully!`);
      setEditingItem(null);
      fetchItems();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update item');
    } finally {
      setEditLoading(false);
    }
  };

  // --- DELETE HANDLERS ---
  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    setDeleteLoading(true);
    setError('');
    setSuccess('');

    try {
      await axios.delete(`/api/items/${deletingItem.id}`);
      setSuccess(`Item "${deletingItem.title}" deleted successfully!`);
      setDeletingItem(null);
      fetchItems();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete item');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#16161A] p-5 rounded-3xl border border-zinc-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <ShieldCheck size={20} />
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight">Admin Portal</h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">Logged in as System Admin (<span className="font-mono font-bold text-amber-400">{user.phone_number}</span>)</p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-[#111113] p-1 rounded-2xl w-full sm:w-auto border border-zinc-800">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'create'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Create Auction
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'manage'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Manage Items ({existingItems.length})
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-red-950/40 text-red-300 rounded-2xl text-xs border border-red-800/60 flex items-start gap-2">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 bg-emerald-950/40 text-emerald-300 rounded-2xl text-xs border border-emerald-800/60 flex items-start gap-2">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      {activeTab === 'create' ? (
        <div className="bg-[#16161A] rounded-3xl shadow-2xl p-6 md:p-8 border border-zinc-800 space-y-6">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <PlusCircle className="text-amber-400" size={20} />
                List New Auction Item
              </h2>
              <p className="text-xs text-zinc-400">Select Pool Type (Premium Pool vs Open Bid) & launch item</p>
            </div>

            <button
              type="button"
              onClick={handleFillSample}
              className="px-3 py-1.5 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 font-bold text-xs rounded-xl border border-amber-500/30 transition-colors flex items-center gap-1.5"
            >
              <Sparkles size={14} />
              Auto-Fill Sample
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* POOL TYPE SELECTOR BUTTONS */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">Auction Pool Registration Category</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, pool_type: 'premium' })}
                  className={`py-3 px-4 rounded-2xl border text-xs font-black transition-all flex items-center justify-center gap-2 ${
                    formData.pool_type === 'premium'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-lg shadow-amber-500/10 scale-[1.01]'
                      : 'bg-[#111113] border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Flame size={16} className={formData.pool_type === 'premium' ? 'text-amber-400' : 'text-zinc-500'} />
                  Active Premium Pool
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, pool_type: 'open' })}
                  className={`py-3 px-4 rounded-2xl border text-xs font-black transition-all flex items-center justify-center gap-2 ${
                    formData.pool_type === 'open'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-lg shadow-amber-500/10 scale-[1.01]'
                      : 'bg-[#111113] border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Trophy size={16} className={formData.pool_type === 'open' ? 'text-amber-400' : 'text-zinc-500'} />
                  Active Open Bid
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">Item Title</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Tag className="text-amber-400" size={16} />
                  </div>
                  <input 
                    type="text" 
                    name="title" 
                    required 
                    value={formData.title} 
                    onChange={handleChange} 
                    className="w-full pl-10 pr-4 py-3 bg-[#111113] border border-zinc-800 rounded-2xl focus:ring-2 focus:ring-amber-500/50 text-sm font-semibold text-white transition-all" 
                    placeholder="e.g. Porsche 911 Carrera S" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">Product Category</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Grid className="text-amber-400" size={16} />
                  </div>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-3 bg-[#111113] border border-zinc-800 rounded-2xl focus:ring-2 focus:ring-amber-500/50 text-xs font-bold text-white transition-all cursor-pointer"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">Description</label>
              <div className="relative">
                <div className="absolute top-3.5 left-3.5 pointer-events-none">
                  <AlignLeft className="text-amber-400" size={16} />
                </div>
                <textarea 
                  name="description" 
                  required 
                  value={formData.description} 
                  onChange={handleChange} 
                  rows="3" 
                  className="w-full pl-10 pr-4 py-3 bg-[#111113] border border-zinc-800 rounded-2xl focus:ring-2 focus:ring-amber-500/50 text-sm font-medium text-white transition-all" 
                  placeholder="Detailed specs and auction instructions..."
                ></textarea>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">Upload Item Image</label>
              <div className="space-y-3">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <ImageIcon className="text-amber-400" size={16} />
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    name="image" 
                    onChange={handleFileChange} 
                    className="w-full pl-10 pr-4 py-2.5 bg-[#111113] border border-zinc-800 rounded-2xl text-xs text-zinc-300 focus:ring-2 focus:ring-amber-500/50 transition-all file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-black hover:file:bg-amber-400 cursor-pointer" 
                  />
                </div>
                
                {imagePreview && (
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border border-zinc-800 relative shadow-md">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">Starting Price / Bid Fee (Birr)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <DollarSign className="text-amber-400" size={16} />
                </div>
                <input 
                  type="number" 
                  step="0.01" 
                  name="base_price" 
                  required 
                  value={formData.base_price} 
                  onChange={handleChange} 
                  className="w-full pl-10 pr-4 py-3 bg-[#111113] border border-zinc-800 rounded-2xl focus:ring-2 focus:ring-amber-500/50 text-sm font-mono font-bold text-white transition-all" 
                  placeholder="87.00" 
                />
              </div>
            </div>

            {/* REAL DATE SELECTION SECTION */}
            <div className="p-4 bg-[#111113] border border-zinc-800 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Calendar size={16} className="text-amber-400" />
                  Real Auction Start & End Date Selector
                </span>
                <button
                  type="button"
                  onClick={handleSetStartNow}
                  className="text-[11px] font-bold text-amber-400 hover:underline flex items-center gap-1"
                >
                  <Clock size={12} /> Start Right Now
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                    Start Date & Time (Calendar Pick)
                  </label>
                  <input 
                    type="datetime-local" 
                    name="start_time" 
                    required 
                    value={formData.start_time} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2.5 bg-[#18181C] border border-zinc-700/80 rounded-xl focus:ring-2 focus:ring-amber-500/50 text-xs font-mono font-bold text-white transition-all cursor-pointer" 
                  />
                  {formData.start_time && (
                    <p className="mt-1 text-[10px] text-amber-400/90 font-mono">
                      📅 {formatHumanDate(formData.start_time)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                    End Date & Time (Calendar Pick)
                  </label>
                  <input 
                    type="datetime-local" 
                    name="end_time" 
                    required 
                    value={formData.end_time} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2.5 bg-[#18181C] border border-zinc-700/80 rounded-xl focus:ring-2 focus:ring-amber-500/50 text-xs font-mono font-bold text-white transition-all cursor-pointer" 
                  />
                  {formData.end_time && (
                    <p className="mt-1 text-[10px] text-emerald-400/90 font-mono">
                      🏁 {formatHumanDate(formData.end_time)}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-1">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">
                  Quick Duration Selectors:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: '+12 Hours', hrs: 12 },
                    { label: '+24 Hours (1 Day)', hrs: 24 },
                    { label: '+48 Hours (2 Days)', hrs: 48 },
                    { label: '+7 Days (1 Week)', hrs: 168 }
                  ].map((preset) => (
                    <button
                      key={preset.hrs}
                      type="button"
                      onClick={() => handleSetDurationHours(preset.hrs)}
                      className="px-2.5 py-1 bg-[#18181C] hover:bg-amber-500/10 text-zinc-300 hover:text-amber-400 text-[11px] font-bold rounded-lg border border-zinc-700/80 hover:border-amber-500/30 transition-all"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-600 hover:brightness-110 text-black rounded-2xl font-black text-xs uppercase tracking-wider shadow-md transition-all active:scale-[0.98] flex justify-center items-center gap-2 disabled:bg-zinc-800 disabled:text-zinc-600"
              >
                {loading ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : <PlusCircle size={18} />}
                {loading ? 'Creating Auction...' : `Launch Item in ${formData.pool_type === 'premium' ? 'Premium Pool' : 'Open Bids'}`}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Manage Items Tab */
        <div className="bg-[#16161A] rounded-3xl border border-zinc-800 p-6 space-y-4 shadow-2xl">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="text-amber-400" size={20} />
            Active & Past Items ({existingItems.length})
          </h2>

          {itemsLoading ? (
            <p className="text-xs text-zinc-500 text-center py-6">Loading items...</p>
          ) : existingItems.length === 0 ? (
            <p className="text-xs text-zinc-500 text-center py-6">No auction items found.</p>
          ) : (
            <div className="space-y-3">
              {existingItems.map((item) => (
                <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-[#111113] rounded-2xl border border-zinc-800/80 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-zinc-900 overflow-hidden shrink-0">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-700"><Tag size={20} /></div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-sm line-clamp-1">{item.title}</h4>
                        <span className={`px-2 py-0.5 border text-[9px] font-bold rounded-full ${
                          item.pool_type === 'premium' 
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' 
                            : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                        }`}>
                          {item.pool_type === 'premium' ? 'PREMIUM POOL' : 'OPEN BID'}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400">
                        Price/Fee: <span className="font-mono font-bold text-amber-400">{item.base_price.toFixed(2)} Birr</span>
                      </p>
                      <p className="text-[10px] text-zinc-500 font-mono">
                        Ends: {formatHumanDate(item.end_time)}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-800">
                    <span className={`px-2.5 py-1 font-extrabold text-[10px] rounded-full uppercase tracking-wider ${
                      item.status === 'active' 
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50' 
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                    }`}>
                      {item.status}
                    </span>

                    <button 
                      onClick={() => handleOpenEdit(item)}
                      className="px-3 py-1.5 bg-[#18181C] text-amber-400 hover:bg-amber-500/10 font-bold text-xs rounded-xl border border-zinc-700 hover:border-amber-500/30 transition-colors flex items-center gap-1"
                      title="Edit Item"
                    >
                      <Edit3 size={13} /> Edit
                    </button>

                    <button 
                      onClick={() => setDeletingItem(item)}
                      className="px-3 py-1.5 bg-red-950/40 text-red-400 hover:bg-red-900/50 font-bold text-xs rounded-xl border border-red-800/60 transition-colors flex items-center gap-1"
                      title="Delete Item"
                    >
                      <Trash2 size={13} /> Delete
                    </button>

                    <Link to={`/item/${item.id}`} className="px-3 py-1.5 bg-[#16161A] text-zinc-300 hover:text-white font-bold text-xs rounded-xl border border-zinc-800 hover:bg-zinc-800 transition-colors">
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* EDIT MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#16161A] border border-zinc-800 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl relative my-8">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit3 className="text-amber-400" size={18} />
                Edit Auction Item #{editingItem.id}
              </h3>
              <button 
                onClick={() => setEditingItem(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-full bg-[#111113] border border-zinc-800"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              
              {/* Pool Type Edit Toggle */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">Pool Category</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditFormData({ ...editFormData, pool_type: 'premium' })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      editFormData.pool_type === 'premium'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                        : 'bg-[#111113] border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <Flame size={14} /> Premium Pool
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditFormData({ ...editFormData, pool_type: 'open' })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      editFormData.pool_type === 'open'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                        : 'bg-[#111113] border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <Trophy size={14} /> Open Bid
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Item Title</label>
                  <input 
                    type="text" 
                    name="title" 
                    required 
                    value={editFormData.title} 
                    onChange={handleEditChange} 
                    className="w-full px-3.5 py-2.5 bg-[#111113] border border-zinc-800 rounded-xl text-xs font-semibold text-white focus:ring-2 focus:ring-amber-500/50 transition-all" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Category</label>
                  <select 
                    name="category" 
                    value={editFormData.category} 
                    onChange={handleEditChange} 
                    className="w-full px-3 py-2.5 bg-[#111113] border border-zinc-800 rounded-xl text-xs font-bold text-white focus:ring-2 focus:ring-amber-500/50 transition-all cursor-pointer"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">Description</label>
                <textarea 
                  name="description" 
                  required 
                  value={editFormData.description} 
                  onChange={handleEditChange} 
                  rows="3" 
                  className="w-full px-3.5 py-2.5 bg-[#111113] border border-zinc-800 rounded-xl text-xs font-medium text-white focus:ring-2 focus:ring-amber-500/50 transition-all" 
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Base Price (Birr)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    name="base_price" 
                    required 
                    value={editFormData.base_price} 
                    onChange={handleEditChange} 
                    className="w-full px-3.5 py-2.5 bg-[#111113] border border-zinc-800 rounded-xl text-xs font-mono font-bold text-white focus:ring-2 focus:ring-amber-500/50 transition-all" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Status</label>
                  <select 
                    name="status" 
                    value={editFormData.status} 
                    onChange={handleEditChange} 
                    className="w-full px-3.5 py-2.5 bg-[#111113] border border-zinc-800 rounded-xl text-xs font-bold text-amber-400 focus:ring-2 focus:ring-amber-500/50 transition-all cursor-pointer"
                  >
                    <option value="active">ACTIVE</option>
                    <option value="ended">ENDED</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">Start Time</label>
                  <input 
                    type="datetime-local" 
                    name="start_time" 
                    required 
                    value={editFormData.start_time} 
                    onChange={handleEditChange} 
                    className="w-full px-3 py-2 bg-[#111113] border border-zinc-800 rounded-xl text-xs font-mono text-white transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 mb-1">End Time</label>
                  <input 
                    type="datetime-local" 
                    name="end_time" 
                    required 
                    value={editFormData.end_time} 
                    onChange={handleEditChange} 
                    className="w-full px-3 py-2 bg-[#111113] border border-zinc-800 rounded-xl text-xs font-mono text-white transition-all" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">Replace Image (Optional)</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleEditFileChange} 
                  className="w-full px-3 py-2 bg-[#111113] border border-zinc-800 rounded-xl text-xs text-zinc-300 file:mr-3 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-black cursor-pointer" 
                />
                {editImagePreview && (
                  <div className="mt-2 w-20 h-20 rounded-xl overflow-hidden border border-zinc-800">
                    <img src={editImagePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setEditingItem(null)} 
                  className="flex-1 py-3 bg-[#111113] hover:bg-zinc-800 text-zinc-300 rounded-xl font-bold text-xs border border-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={editLoading} 
                  className="flex-1 py-3 bg-gradient-to-r from-amber-400 to-amber-600 hover:brightness-110 text-black font-black text-xs uppercase rounded-xl shadow-md transition-all active:scale-95 flex justify-center items-center gap-1.5"
                >
                  {editLoading ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div> : <Save size={15} />}
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#16161A] border border-zinc-800 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-red-950/50 text-red-400 border border-red-800/60 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-white">Delete Auction Item?</h3>
              <p className="text-xs text-zinc-400">
                Are you sure you want to delete <span className="font-bold text-white">"{deletingItem.title}"</span>? This will remove the item and all associated bids.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => setDeletingItem(null)} 
                className="flex-1 py-2.5 bg-[#111113] hover:bg-zinc-800 text-zinc-300 rounded-xl font-bold text-xs border border-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmDelete} 
                disabled={deleteLoading} 
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 flex justify-center items-center gap-1"
              >
                {deleteLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Trash2 size={14} />}
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
