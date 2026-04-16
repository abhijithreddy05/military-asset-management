import React, { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Package, X } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [bases, setBases] = useState([]);
  const [filterBase, setFilterBase] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    fetchInventory();
    if (user.role === 'Admin') fetchBases();
  }, [filterBase, filterCategory]);

  const fetchInventory = async () => {
    try {
      let url = '/inventory?';
      if (filterBase && user.role === 'Admin') url += `base=${filterBase}&`;
      if (filterCategory) url += `category=${filterCategory}`;
      const res = await api.get(url);
      setInventory(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBases = async () => {
    try {
      const res = await api.get('/bases');
      setBases(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const openNetMovements = async () => {
    try {
      const res = await api.get('/transactions');
      setTransactions(res.data);
      setShowPopup(true);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-slate-400">Overview of current asset inventory</p>
        </div>
        <button
          onClick={openNetMovements}
          className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20"
        >
          View Net Movements
        </button>
      </div>

      <div className="glass-panel p-6 mb-8 flex flex-col md:flex-row gap-4 items-end animate-fade-in-up">
        {user.role === 'Admin' && (
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-300 mb-2">Filter by Base</label>
            <select
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors appearance-none"
              value={filterBase}
              onChange={(e) => setFilterBase(e.target.value)}
            >
              <option value="">All Bases</option>
              {bases.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        )}
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-300 mb-2">Filter by Category</label>
          <select
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors appearance-none"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="Vehicle">Vehicles</option>
            <option value="Weapon">Weapons</option>
            <option value="Ammunition">Ammunition</option>
          </select>
        </div>
      </div>

      <div className="glass-panel overflow-hidden animate-fade-in-up" style={{animationDelay: '100ms'}}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/50 text-slate-300 border-b border-slate-700">
              <th className="p-4 font-semibold">Asset ID</th>
              <th className="p-4 font-semibold">Asset Name</th>
              <th className="p-4 font-semibold">Category</th>
              <th className="p-4 font-semibold">Base</th>
              <th className="p-4 font-semibold text-right">Quantity</th>
            </tr>
          </thead>
          <tbody>
            {inventory.length > 0 ? inventory.map((item) => (
              <tr key={item.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors text-slate-200">
                <td className="p-4">AST-{item.id.toString().padStart(4, '0')}</td>
                <td className="p-4 font-medium flex items-center gap-2">
                  <Package size={16} className="text-blue-400" />
                  {item.asset_name}
                </td>
                <td className="p-4">
                  <span className="bg-slate-700 px-3 py-1 rounded-full text-xs font-medium tracking-wide">
                    {item.category}
                  </span>
                </td>
                <td className="p-4">{item.base_name}</td>
                <td className="p-4 text-right font-medium text-lg">{item.quantity}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" className="p-8 text-center text-slate-500">No assets found matching the criteria.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setShowPopup(false)}></div>
          <div className="glass-panel w-full max-w-4xl max-h-[80vh] flex flex-col relative z-10 animate-fade-in-up">
            <div className="flex justify-between items-center p-6 border-b border-slate-700">
              <h2 className="text-xl font-bold text-white">Net Movements (Transaction History)</h2>
              <button onClick={() => setShowPopup(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/50 text-slate-300 border-b border-slate-700">
                    <th className="p-3 font-semibold text-sm">Date</th>
                    <th className="p-3 font-semibold text-sm">Type</th>
                    <th className="p-3 font-semibold text-sm">Asset</th>
                    <th className="p-3 font-semibold text-sm">Qty</th>
                    <th className="p-3 font-semibold text-sm">From &rarr; To / Assigned</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id} className="border-b border-slate-700/50 text-slate-200 text-sm">
                      <td className="p-3">{new Date(t.date).toLocaleDateString()}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${t.transaction_type === 'Purchase' ? 'bg-green-500/20 text-green-400' : t.transaction_type === 'Transfer' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>
                          {t.transaction_type}
                        </span>
                      </td>
                      <td className="p-3">{t.asset_name}</td>
                      <td className="p-3 font-medium">{t.quantity}</td>
                      <td className="p-3 text-slate-400">
                        {t.transaction_type === 'Purchase' && `→ ${t.to_base}`}
                        {t.transaction_type === 'Transfer' && `${t.from_base} → ${t.to_base}`}
                        {t.transaction_type === 'Assignment' && `${t.from_base} → Personnel: ${t.assigned_to}`}
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                     <tr>
                      <td colSpan="5" className="p-6 text-center text-slate-500">No transaction history.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
