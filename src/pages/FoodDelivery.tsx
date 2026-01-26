import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, PanInfo } from 'framer-motion';
import { ArrowLeft, Banknote, ChevronDown } from 'lucide-react';
import { useFoodOrderSession } from '../contexts/FoodOrderSession';
import { useFoodPayment } from '../contexts/FoodPaymentContext';

interface DeliveryMode {
  id: string;
  label: string;
  time: string;
  seats: number;
  description: string;
  price: number;
}

export function FoodDelivery() {
  const navigate = useNavigate();
  const { getCurrentLocationFoods, setDeliveryMode, cartItems } = useFoodOrderSession();
  const { paymentStatus } = useFoodPayment();

  const [selectedTab, setSelectedTab] = useState<'recommended' | 'faster' | 'cheaper'>('recommended');
  const [selectedModeId, setSelectedModeId] = useState('economy');
  const [panelHeight, setPanelHeight] = useState(600);

  const allModes: DeliveryMode[] = [
    { id: 'economy', label: 'Economy', time: '3 min', seats: 2, description: 'Affordable rides', price: 25 },
    { id: 'bolt', label: 'Bolt', time: '2 min', seats: 3, description: 'Mid-size cars', price: 25 },
    { id: 'wait-save', label: 'Wait and Save', time: '10-20 min', seats: 2, description: 'Save on delivery', price: 39 },
    { id: 'comfort', label: 'Comfort', time: '2 min', seats: 3, description: 'Full-size cars', price: 27 },
    { id: 'premium', label: 'Premium', time: '20 min', seats: 3, description: 'Premium cars', price: 125 }
  ];

  const getSortedModes = () => {
    let sorted = [...allModes];

    if (selectedTab === 'faster') {
      sorted.sort((a, b) => {
        const aTime = parseInt(a.time);
        const bTime = parseInt(b.time);
        return aTime - bTime;
      });
    } else if (selectedTab === 'cheaper') {
      sorted.sort((a, b) => a.price - b.price);
    }

    const selectedIndex = sorted.findIndex(m => m.id === selectedModeId);
    if (selectedIndex > 0) {
      const selected = sorted[selectedIndex];
      sorted = [selected, ...sorted.slice(0, selectedIndex), ...sorted.slice(selectedIndex + 1)];
    }

    return sorted;
  };

  const sortedModes = getSortedModes();
  const selectedMode = sortedModes[0];
  const currentLocationFoods = getCurrentLocationFoods();
  const foodSubtotal = currentLocationFoods.reduce((sum, item) => sum + item.price, 0);
  const total = foodSubtotal + (selectedMode?.price || 0);

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/shop');
    }
  }, [cartItems.length, navigate]);

  const handleDragEnd = (event: any, info: PanInfo) => {
    const dragVelocity = info.velocity.y;
    const dragOffset = info.offset.y;

    // If dragged down with enough velocity or offset, minimize panel
    if (dragVelocity > 500 || dragOffset > 150) {
      setPanelHeight(300);
    }
    // If dragged up with enough velocity or offset, maximize panel
    else if (dragVelocity < -500 || dragOffset < -150) {
      setPanelHeight(700);
    }
    // Otherwise snap back to default
    else {
      setPanelHeight(600);
    }
  };

  const handleSelectMode = () => {
    if (!selectedMode || paymentStatus !== 'authorized') return;
    setDeliveryMode(selectedMode.id, selectedMode.price);
    navigate('/food-confirm-order');
  };

  const handleCashPayment = () => {
    navigate('/food-payment');
  };

  return (
    <motion.div
      className="flex flex-col h-screen bg-gray-50 relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-blue-50 to-green-50">
        <svg className="w-full h-full opacity-30">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <motion.div
        className="absolute top-4 left-4 z-10"
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <button
          onClick={() => navigate('/foodies-route')}
          className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50"
        >
          <ArrowLeft size={20} className="text-gray-800" />
        </button>
      </motion.div>

      <motion.div
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-20"
        drag="y"
        dragConstraints={{ top: -100, bottom: 300 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        animate={{ height: panelHeight }}
        initial={{ y: '100%' }}
        style={{ height: panelHeight }}
        transition={{
          type: 'spring',
          damping: 30,
          stiffness: 300,
          height: { type: 'spring', damping: 25, stiffness: 200 }
        }}
      >
        <div
          className="w-full h-12 flex justify-center items-center cursor-grab active:cursor-grabbing touch-none"
        >
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="px-4 pb-20 overflow-y-auto h-full">
          <div className="bg-blue-100 rounded-lg p-3 mb-4 flex items-center justify-center">
            <span className="text-blue-700 font-medium text-sm">✓ 30% promo applied</span>
          </div>

          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setSelectedTab('recommended')}
              className={`px-6 py-2 rounded-full font-semibold transition-all text-sm ${
                selectedTab === 'recommended'
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Recommended
            </button>
            <button
              onClick={() => setSelectedTab('faster')}
              className={`px-6 py-2 rounded-full font-semibold transition-all text-sm flex items-center gap-2 ${
                selectedTab === 'faster'
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              ⚡ Faster
            </button>
            <button
              onClick={() => setSelectedTab('cheaper')}
              className={`px-6 py-2 rounded-full font-semibold transition-all text-sm flex items-center gap-2 ${
                selectedTab === 'cheaper'
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              💰 Cheaper
            </button>
          </div>

          <div className="space-y-3 mb-6">
            {sortedModes.map((mode, index) => (
              <motion.button
                key={mode.id}
                onClick={() => setSelectedModeId(mode.id)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                  selectedModeId === mode.id
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="w-12 h-12 flex-shrink-0 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🚗</span>
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-gray-900 text-sm">{mode.label}</h3>
                  <p className="text-xs text-gray-600">{mode.time} • {mode.seats} seats</p>
                  <p className="text-[10px] text-gray-500">{mode.description}</p>
                </div>
                <div className="flex flex-col items-end flex-shrink-0">
                  <span className="font-bold text-gray-900 text-base">R {mode.price}</span>
                  <span className="text-xs text-gray-400">R {Math.ceil(mode.price * 1.15)}</span>
                </div>
              </motion.button>
            ))}
          </div>

          {selectedMode && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-bold text-gray-900 text-sm mb-3">Order Summary</h3>
              <div className="space-y-2 mb-3">
                {currentLocationFoods.slice(0, 2).map((food) => (
                  <div key={food.id} className="flex justify-between text-xs">
                    <span className="text-gray-700">{food.name}</span>
                    <span className="text-gray-900 font-medium">K{food.price}</span>
                  </div>
                ))}
                {currentLocationFoods.length > 2 && (
                  <div className="text-xs text-gray-600">+{currentLocationFoods.length - 2} more items</div>
                )}
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Food</span>
                  <span className="font-medium text-gray-900">R {foodSubtotal}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Delivery</span>
                  <span className="font-medium text-gray-900">R {selectedMode.price}</span>
                </div>
                <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200">
                  <span className="text-gray-900">Total</span>
                  <span className="text-green-600">R {total}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 space-y-3">
          <motion.button
            onClick={handleCashPayment}
            className="w-full py-3 rounded-lg font-semibold text-sm bg-green-50 border-2 border-green-500 text-green-700 hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
            whileTap={{ scale: 0.98 }}
          >
            <Banknote size={18} />
            Cash
            <ChevronDown size={16} />
          </motion.button>

          <motion.button
            onClick={handleSelectMode}
            disabled={!selectedMode || paymentStatus !== 'authorized'}
            className={`w-full py-3 rounded-lg font-semibold text-lg transition-colors ${
              selectedMode && paymentStatus === 'authorized'
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            whileTap={{ scale: 0.98 }}
          >
            Select {selectedMode?.label || 'Mode'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
