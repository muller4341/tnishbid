import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Clock, Tag } from 'lucide-react';

const Home = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useAuth();

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/items');
        setItems(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  }

  return (
    <div>
      <div className="mb-10 text-center space-y-4 py-8">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
          Win with the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Lowest Unique Bid</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Place a bid that no one else has placed. The lowest unique bid when the timer runs out wins the item!
        </p>
      </div>

      {items.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-xl font-medium text-slate-700">No active auctions right now</h3>
          <p className="text-slate-500 mt-2">Check back later for exciting items!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map(item => (
            <Link key={item.id} to={`/item/${item.id}`} className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 hover:-translate-y-1">
              <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 group-hover:rotate-1" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <Tag size={48} className="opacity-20" />
                  </div>
                )}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-indigo-700 shadow-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  {item.status.toUpperCase()}
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-bold text-slate-800 mb-2 line-clamp-1">{item.title}</h3>
                
                <div className="flex items-end justify-between mt-6">
                  <div>
                    <p className="text-sm text-slate-500 font-medium mb-1">Base Price</p>
                    <p className="text-2xl font-bold text-slate-900">{item.base_price.toFixed(2)} <span className="text-sm font-normal text-slate-500">ETB</span></p>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg text-sm font-medium">
                    <Clock size={16} />
                    <span>Ends soon</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
