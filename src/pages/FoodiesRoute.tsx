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

  const [userIsEditingLocation, setUserIsEditingLocation] = useState(false);
  const [userIsEditingStop, setUserIsEditingStop] = useState<{ [key: string]: boolean }>({});

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
    setUserIsEditingLocation(true);
    setCurrentLocationQuery(value);
    setDeliveryLocation(value);
    setShowCurrentLocationSuggestions(true);
    setShowRecentAddresses(false);
  };

  const handleCurrentLocationSelect = (address: string) => {
    setUserIsEditingLocation(false);
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
    setUserIsEditingStop(prev => ({ ...prev, [stopId]: true }));
    setStopAddressQuery(prev => ({ ...prev, [stopId]: value }));
    setShowStopSuggestions(prev => ({ ...prev, [stopId]: true }));
    setShowRecentAddresses(false);
  };

  const handleStopAddressSelect = (stopId: string, address: string, description: string) => {
    setUserIsEditingStop(prev => ({ ...prev, [stopId]: false }));
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
    <motion.div className="flex flex-col h-screen bg-gray-50">
      {/* … everything above unchanged … */}

      <AnimatePresence>
        {stops.map((stop) => (
          <motion.div key={stop.id} className="mt-2 relative">
            <input
              ref={(el) => {
                if (el) stopInputRefs.current[stop.id] = el;
              }}
              type="text"
              value={stopAddressQuery[stop.id] ?? stop.address ?? ''}
              onChange={(e) => handleStopAddressChange(stop.id, e.target.value)}
              placeholder="Stop location"
              className="flex-1 bg-transparent text-gray-900 text-xs outline-none"
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* … everything below unchanged … */}
    </motion.div>
  );
}
