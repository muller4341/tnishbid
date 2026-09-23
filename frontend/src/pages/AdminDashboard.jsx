import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, Image, AlignLeft, Tag, Calendar, DollarSign } from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    base_price: '',
    start_time: '',
    end_time: ''
  });
  const [imageFile, setImageFile] = useState(null);

  // Basic security check (though protected by route as well)
  if (!user || user.role !== 'admin') {
    return <div className="text-center py-20 text-red-500 font-bold">Access Denied. Admins Only.</div>;
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('base_price', formData.base_price);
      data.append('start_time', formData.start_time);
      data.append('end_time', formData.end_time);
      if (imageFile) {
        data.append('image', imageFile);
      }

      await axios.post('http://localhost:5000/api/items', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // make sure it's authenticated
        }
      });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 md:p-10 border border-slate-100">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-800 mb-2 flex items-center justify-center gap-2">
          <PlusCircle className="text-indigo-600" size={32} />
          Create New Auction
        </h1>
        <p className="text-slate-500">List a new item for the Lowest Unique Bid platform</p>
      </div>

      {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Item Title</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Tag className="text-slate-400" size={18} /></div>
            <input type="text" name="title" required value={formData.title} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="e.g. iPhone 15 Pro Max" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
          <div className="relative">
            <div className="absolute top-3 left-3 pointer-events-none"><AlignLeft className="text-slate-400" size={18} /></div>
            <textarea name="description" required value={formData.description} onChange={handleChange} rows="4" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="Describe the item..."></textarea>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Upload Item Image</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Image className="text-slate-400" size={18} /></div>
            <input type="file" accept="image/*" name="image" onChange={handleFileChange} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Base Price (ETB)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><DollarSign className="text-slate-400" size={18} /></div>
              <input type="number" step="0.01" name="base_price" required value={formData.base_price} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="50.00" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Start Time</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Calendar className="text-slate-400" size={18} /></div>
              <input type="datetime-local" name="start_time" required value={formData.start_time} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">End Time</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Calendar className="text-slate-400" size={18} /></div>
              <input type="datetime-local" name="end_time" required value={formData.end_time} onChange={handleChange} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all" />
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button type="submit" disabled={loading} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] flex justify-center items-center gap-2 disabled:bg-slate-400">
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <PlusCircle size={20} />}
            {loading ? 'Creating...' : 'Create Auction Item'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminDashboard;
