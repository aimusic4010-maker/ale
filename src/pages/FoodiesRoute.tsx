   import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, X, Clock, ChevronRight } from 'lucide-react';
import { useFoodOrderSession, FoodItem } from '../contexts/FoodOrderSession';
import { FoodSelectionModal } from '../components/FoodSelectionModal';
import { useGeolocation } from '../hooks/useGeolocation';
import { mockDeliveryAddresses, getDeliveryAddressSuggestions } from '../data/mockDeliveryAddresses';

export function FoodiesRoute() {
  const navigate = useNavigate();
  const { address: currentLocation, loading: locationLoading } = useGeolocation();
  const {
    cartItems,
    currentLocationFoodIds,
    stops,
    addStop,
    removeStop,
    updateStop,
    canAddStop,
    getCurrentLocationFoods,
    removeStopsWithoutFoodOrAddress,
    deliveryLocation,
    setDeliveryLocation,
  } = useFoodOrderSession();

  const currentLocationInputRef = useRef<HTMLInputElement>(null);
  const stopInputRefs = useRef<{ [key: string]: HTMLInputElement }>({});

  const [showCurrentLocationModal, setShowCurrentLocationModal] = useState(false);
  const [showStopModal, setShowStopModal] = useState<string | null>(null);
  const [currentLocationQuery, setCurrentLocationQuery] = useState('');
  const [stopAddressQuery, setStopAddressQuery] = useState<{ [key: string]: string }>({});
  const [activeLocationInput, setActiveLocationInput] = useState('current-location');
  const [showCurrentLocationSuggestions, setShowCurrentLocationSuggestions] = useState(false);
  const [showStopSuggestions, setShowStopSuggestions] = useState<{ [key: string]: boolean }>({});
  const [showRecentAddresses, setShowRecentAddresses] = useState(true);

  // Flags to track user editing state
  const [userIsEditingLocation, setUserIsEditingLocation] = useState(false);
  const [userIsEditingStop, setUserIsEditingStop] = useState<{ [key: string]: boolean }>({});

  // Auto-fill location ONLY on initial load or when user selects a suggestion
  useEffect(() => {
    if (currentLocation && !deliveryLocation && !userIsEditingLocation) {
      setDeliveryLocation(currentLocation);
      setCurrentLocationQuery(currentLocation);
    } else if (deliveryLocation && !userIsEditingLocation) {
      setCurrentLocationQuery(deliveryLocation);
    }
  }, [currentLocation, deliveryLocation, setDeliveryLocation, userIsEditingLocation]);

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/shop');
    }
  }, [cartItems.length, navigate]);

  const handleCurrentLocationChange = (value: string) => {
    setUserIsEditingLocation(true); // Mark as user editing
    setCurrentLocationQuery(value);
    setDeliveryLocation(value);
    setShowCurrentLocationSuggestions(true);
    setShowRecentAddresses(false);
  };

  const handleCurrentLocationSelect = (address: string) => {
    setUserIsEditingLocation(false); // User selected a suggestion, allow auto-fill again
    setDeliveryLocation(address);
    setCurrentLocationQuery(address);
    setShowCurrentLocationSuggestions(false);
    setShowRecentAddresses(true);
    setActiveLocationInput('current-location');

    if (stops.length > 0 && !stops[0].address) {
      setTimeout(() => setActiveLocationInput(stops[0].id), 100);
    }
  };

  const handleClearCurrentLocation = () => {
    setUserIsEditingLocation(true);
    setCurrentLocationQuery('');
    setDeliveryLocation('');
    setShowCurrentLocationSuggestions(false);
    currentLocationInputRef.current?.focus();
  };

  const handleStopAddressChange = (stopId: string, value: string) => {
    setUserIsEditingStop(prev => ({ ...prev, [stopId]: true })); // Mark as user editing
    const newStops = stops.map(s =>
      s.id === stopId ? { ...s, address: value } : s
    );
    setStopAddressQuery(prev => ({ ...prev, [stopId]: value }));
    setShowStopSuggestions(prev => ({ ...prev, [stopId]: true }));
    setShowRecentAddresses(false);
  };

  const handleStopAddressSelect = (stopId: string, address: string, description: string) => {
    setUserIsEditingStop(prev => ({ ...prev, [stopId]: false })); // User selected a suggestion
    updateStop(stopId, { address, description });
    setStopAddressQuery(prev => ({ ...prev, [stopId]: '' }));
    setShowStopSuggestions(prev => ({ ...prev, [stopId]: false }));
    setShowRecentAddresses(true);

    const currentIndex = stops.findIndex(s => s.id === stopId);
    if (currentIndex < stops.length - 1) {
      const nextStop = stops[currentIndex + 1];
      if (!nextStop.address) {
        setActiveLocationInput(nextStop.id);
      }
    }
  };

  const handleClearStop = (stopId: string) => {
    setUserIsEditingStop(prev => ({ ...prev, [stopId]: true }));
    updateStop(stopId, { address: '' });
    setStopAddressQuery(prev => ({ ...prev, [stopId]: '' }));
    stopInputRefs.current[stopId]?.focus();
  };

  const handleAddStop = () => {
    if (!canAddStop()) return;

    const newStop = {
      id: `stop-${Date.now()}`,
      address: '',
      foodIds: []
    };
    addStop(newStop);
    setActiveLocationInput(newStop.id);
    setShowRecentAddresses(true);
  };

  const handleRemoveStop = (stopId: string) => {
    removeStop(stopId);
    setActiveLocationInput('current-location');
    setShowRecentAddresses(true);
  };

  const handleGoToDelivery = () => {
    removeStopsWithoutFoodOrAddress();
    navigate('/food-delivery');
  };

  const currentLocationFoods = getCurrentLocationFoods();
  const currentLocationSuggestions = getDeliveryAddressSuggestions(currentLocationQuery);
  const pickupLocation = cartItems[0]?.storeName || 'Store';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-screen bg-gray-50"
    >
      <div className="fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-100 flex-shrink-0">
        <div className="p-3">
          <div className="flex items-center gap-2 mb-3">
            <motion.button
              onClick={() => navigate('/order-foodies/' + cartItems[0]?.storeId)}
              whileTap={{ scale: 0.95 }}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
            >
              <X size={20} className="text-gray-800" />
            </motion.button>

            <div className="flex-1 flex items-center gap-1 min-w-0">
              <span className="text-sm font-semibold text-gray-900 truncate">{pickupLocation}</span>
              <span className="text-gray-500 flex-shrink-0">→</span>
              <span className="text-sm font-semibold text-gray-900 truncate">{deliveryLocation.split(',')[0] || 'Delivery'}</span>
            </div>

            <motion.button
              onClick={handleAddStop}
              disabled={!canAddStop()}
              className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors flex-shrink-0 ${
                canAddStop()
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              whileTap={{ scale: canAddStop() ? 0.95 : 1 }}
            >
              <Plus size={16} />
            </motion.button>
          </div>

          <div className="relative">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
              <div className={`flex-1 relative flex items-center rounded-lg px-3 py-2 transition-all ${
                activeLocationInput === 'current-location'
                  ? 'bg-white border border-green-500 shadow-sm'
                  : 'bg-gray-100 border border-transparent'
              }`}>
                <input
                  ref={currentLocationInputRef}
                  type="text"
                  value={currentLocationQuery}
                  onChange={(e) => handleCurrentLocationChange(e.target.value)}
                  onFocus={() => {
                    setActiveLocationInput('current-location');
                    setShowCurrentLocationSuggestions(false);
                    setShowRecentAddresses(true);
                  }}
                  onBlur={() => setTimeout(() => setShowCurrentLocationSuggestions(false), 200)}
                  placeholder="Delivery location"
                  className="flex-1 bg-transparent text-gray-900 text-xs outline-none"
                />
                {currentLocationQuery && (
                  <motion.button
                    onClick={handleClearCurrentLocation}
                    className="mr-2 w-4 h-4 bg-gray-300 rounded-full flex items-center justify-center hover:bg-gray-400 transition-colors"
                    whileTap={{ scale: 0.9 }}
                  >
                    <X size={10} className="text-white" />
                  </motion.button>
                )}
                <motion.button
                  onClick={() => setShowCurrentLocationModal(true)}
                  disabled={currentLocationFoods.length === 0}
                  className="relative ml-2 flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full border border-gray-200 hover:bg-gray-100 transition-colors"
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-sm">🍔</span>
                  <span className="text-[10px] font-medium text-gray-700">View your foodies</span>
                  {currentLocationFoods.length > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center"
                    >
                      {currentLocationFoods.length}
                    </motion.span>
                  )}
                </motion.button>
              </div>
            </div>

            <AnimatePresence>
              {showCurrentLocationSuggestions && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg z-40 border border-gray-200 max-h-60 overflow-y-auto"
                >
                  {!currentLocationQuery && (
                    <>
                      {currentLocation && currentLocation !== deliveryLocation && (
                        <button
                          onClick={() => handleCurrentLocationSelect(currentLocation)}
                          className="w-full flex items-center gap-2 p-2 hover:bg-gray-50 transition-colors border-b border-gray-100 text-left bg-blue-50"
                        >
                          <Clock size={14} className="text-blue-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-xs">Use current location</p>
                            <p className="text-[10px] text-gray-500">{currentLocation.split(',')[0]}</p>
                          </div>
                        </button>
                      )}
                      {mockDeliveryAddresses.slice(0, 5).map((addr) => (
                        <button
                          key={addr.id}
                          onClick={() => handleCurrentLocationSelect(addr.address)}
                          className="w-full flex items-center gap-2 p-2 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 text-left"
                        >
                          <Clock size={14} className="text-gray-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-xs">{addr.name}</p>
                            <p className="text-[10px] text-gray-500">{addr.description}</p>
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                  {currentLocationQuery && (
                    <>
                      {getCurrentLocationSuggestionsWithSynthetic().slice(0, 4).map((addr) => (
                        <button
                          key={addr.id}
                          onClick={() => handleCurrentLocationSelect(addr.address)}
                          className={`w-full flex items-center gap-2 p-2 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 text-left ${
                            addr.id === 'use-current' ? 'bg-blue-50' : ''
                          }`}
                        >
                          <Clock size={14} className={`flex-shrink-0 ${addr.id === 'use-current' ? 'text-blue-500' : 'text-gray-400'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-xs">{addr.name}</p>
                            <p className="text-[10px] text-gray-500">{addr.description}</p>
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {stops.map((stop) => (
              <motion.div
                key={stop.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 relative"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                  <div className={`flex-1 relative flex items-center rounded-lg px-3 py-2 transition-all ${
                    activeLocationInput === stop.id
                      ? 'bg-white border border-green-500 shadow-sm'
                      : 'bg-gray-100 border border-transparent'
                  }`}>
                    <input
                      ref={(el) => {
                        if (el) stopInputRefs.current[stop.id] = el;
                      }}
                      type="text"
                      value={stopAddressQuery[stop.id] ?? stop.address ?? ''}
                      onChange={(e) => handleStopAddressChange(stop.id, e.target.value)}
                      onFocus={() => {
                        setActiveLocationInput(stop.id);
                        setShowStopSuggestions(prev => ({ ...prev, [stop.id]: true }));
                        setShowRecentAddresses(false);
                      }}
                      onBlur={() => setTimeout(() => setShowStopSuggestions(prev => ({ ...prev, [stop.id]: false })), 200)}
                      placeholder="Stop location"
                      className="flex-1 bg-transparent text-gray-900 text-xs outline-none"
                    />
                    {(stop.address || stopAddressQuery[stop.id]) && (
                      <motion.button
                        onClick={() => handleClearStop(stop.id)}
                        className="mr-2 w-4 h-4 bg-gray-300 rounded-full flex items-center justify-center hover:bg-gray-400 transition-colors"
                        whileTap={{ scale: 0.9 }}
                      >
                        <X size={10} className="text-white" />
                      </motion.button>
                    )}
                    <motion.button
                      onClick={() => setShowStopModal(stop.id)}
                      className="ml-2 px-2 py-1 bg-gray-50 rounded-full border border-gray-200 hover:bg-gray-100 transition-colors"
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="text-[10px] font-medium text-gray-700">
                        {stop.foodIds.length > 0 ? `+${stop.foodIds.length}` : 'Add food'}
                      </span>
                    </motion.button>
                  </div>
                  <button
                    onClick={() => handleRemoveStop(stop.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
                  >
                    <X size={14} className="text-red-500" />
                  </button>
                </div>

                <AnimatePresence>
                  {showStopSuggestions[stop.id] && stopAddressQuery[stop.id] && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-8 right-0 mt-2 bg-white rounded-lg shadow-lg z-40 border border-gray-200"
                    >
                      {getDeliveryAddressSuggestions(stopAddressQuery[stop.id]).slice(0, 4).map((addr) => (
                        <button
                          key={addr.id}
                          onClick={() => handleStopAddressSelect(stop.id, addr.address, addr.description)}
                          className="w-full flex items-center gap-2 p-2 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 text-left"
                        >
                          <Clock size={14} className="text-gray-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-xs">{addr.name}</p>
                            <p className="text-[10px] text-gray-500">{addr.description}</p>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pt-40 px-3 pb-20">
        {showRecentAddresses && (
          <div className="space-y-2">
            <p className="text-[10px] text-gray-500 px-2">Recent addresses</p>
            {mockDeliveryAddresses.slice(0, 6).map((addr) => (
              <motion.button
                key={addr.id}
                onClick={() => {
                  if (activeLocationInput === 'current-location') {
                    handleCurrentLocationSelect(addr.address);
                  } else if (typeof activeLocationInput === 'string' && activeLocationInput !== 'current-location') {
                    handleStopAddressSelect(activeLocationInput, addr.address, '');
                  }
                }}
                className="w-full flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors"
                whileTap={{ scale: 0.98 }}
              >
                <Clock size={16} className="text-gray-400 flex-shrink-0" />
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900 text-xs">{addr.name}</p>
                  <p className="text-[10px] text-gray-500">{addr.description}</p>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-3 bg-white border-t border-gray-100 z-20">
        <motion.button
          onClick={handleGoToDelivery}
          disabled={currentLocationFoods.length === 0}
          className={`w-full py-3 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
            currentLocationFoods.length > 0
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          whileTap={{ scale: 0.98 }}
        >
          Go to delivery
          <ChevronRight size={16} />
        </motion.button>
      </div>

      <FoodSelectionModal
        isOpen={showCurrentLocationModal}
        onClose={() => setShowCurrentLocationModal(false)}
        title="Your Food"
        stopId="current-location"
        mode="current-location"
      />

      {showStopModal && (
        <FoodSelectionModal
          isOpen={true}
          onClose={() => setShowStopModal(null)}
          title="Select Food for Stop"
          stopId={showStopModal}
          mode="stop"
        />
      )}
    </motion.div>
  );
}