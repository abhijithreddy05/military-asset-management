import React, { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { ClipboardList } from 'lucide-react';

const Assignments = () => {
  const { user } = useAuth();
  const [assets, setAssets] = useState([]);
  const [bases, setBases] = useState([]);
  const [formData, setFormData] = useState({ asset_id: '', base_id: '', quantity: '', assigned_to: '' });
  const [status, setStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    fetchAssets();
    if (user.role === 'Admin') fetchBases();
  }, []);

  const fetchAssets = async () => {
    const res = await api.get('/assets');
    setAssets(res.data);
  };
  const fetchBases = async () => {
    const res = await api.get('/bases');
    setBases(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });
    
    // Auto-assign base for Commander/Logistics
    const payload = {
      ...formData,
      base_id: user.role === 'Admin' ? formData.base_id : user.base_id,
      quantity: parseInt(formData.quantity)
    };

    try {
      await api.post('/transactions/assignment', payload);
      setStatus({ type: 'success', message: 'Assignment/Expenditure recorded successfully. Inventory updated.' });
      setFormData({ asset_id: '', base_id: '', quantity: '', assigned_to: '' });
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Error recording assignment.' });
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <ClipboardList className="text-blue-500" />
          Field Assignments & Expenditures
        </h1>
        <p className="text-slate-400">Assign equipment to personnel or record consumption of ammunition.</p>
      </div>

      <div className="glass-panel p-8 animate-fade-in-up">
        {status.message && (
          <div className={`p-4 rounded-lg mb-6 ${status.type === 'success' ? 'bg-green-500/20 border border-green-500/50 text-green-300' : 'bg-red-500/20 border border-red-500/50 text-red-300'}`}>
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Asset</label>
              <select
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
                value={formData.asset_id}
                onChange={(e) => setFormData({ ...formData, asset_id: e.target.value })}
              >
                <option value="">Select an asset...</option>
                {assets.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.category})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Issuing Base</label>
              {user.role === 'Admin' ? (
                <select
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
                  value={formData.base_id}
                  onChange={(e) => setFormData({ ...formData, base_id: e.target.value })}
                >
                  <option value="">Select base...</option>
                  {bases.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  disabled
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-400 cursor-not-allowed"
                  value={`Your Assigned Base (ID: ${user.base_id})`}
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Assigned Personnel / Unit</label>
              <input
                type="text"
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
                value={formData.assigned_to}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                placeholder="e.g., Alpha Squad / Captain Smith"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Quantity Dispatched</label>
              <input
                type="number"
                min="1"
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="Enter quantity"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-700">
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors w-full md:w-auto"
            >
              Record Assignment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Assignments;
