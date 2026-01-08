import React, { useState, useEffect } from 'react';

const CATEGORIES = [
    { id: 'school', label: 'Schools', icon: '🎓' },
    { id: 'hospital', label: 'Hospitals', icon: '🏥' },
    { id: 'restaurant', label: 'Restaurants', icon: '🍽️' },
    { id: 'hotel', label: 'Hotels', icon: '🏨' },
    { id: 'park', label: 'Parks', icon: '🌳' },
    { id: 'bank', label: 'Banks', icon: '🏦' },
    { id: 'pharmacy', label: 'Pharmacies', icon: '💊' },
    { id: 'supermarket', label: 'Supermarkets', icon: '🛒' }
];

const PlacesSidebar = ({ isOpen, onToggle, placesLib, mapInstance, onUpdateMarkers }) => {
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [places, setPlaces] = useState([]); // List of fetched places
    const [selectedPlaceIds, setSelectedPlaceIds] = useState(new Set()); // Set of IDs
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Effect: When category changes, fetch places
    useEffect(() => {
        if (!selectedCategory || !placesLib || !mapInstance) return;

        const fetchPlaces = () => {
            setIsLoading(true);
            setError(null);
            setPlaces([]);
            setSelectedPlaceIds(new Set());
            onUpdateMarkers([]); // Clear map markers

            const service = new placesLib.PlacesService(document.createElement('div'));

            const request = {
                location: mapInstance.center, // Use current map center
                radius: 3000, // 3km radius
                type: selectedCategory
            };

            service.nearbySearch(request, (results, status) => {
                setIsLoading(false);
                if (status === placesLib.PlacesServiceStatus.OK) {
                    setPlaces(results);
                    // Automatically uncheck all initially
                } else {
                    setError('No places found or API error.');
                }
            });
        };

        fetchPlaces();
    }, [selectedCategory, placesLib, mapInstance]);

    // Effect: Sync markers when selection changes
    useEffect(() => {
        const markersToShow = places.filter(p => selectedPlaceIds.has(p.place_id));
        onUpdateMarkers(markersToShow);
    }, [selectedPlaceIds, places, onUpdateMarkers]);

    const handleCategoryClick = (categoryId) => {
        if (selectedCategory === categoryId) {
            setSelectedCategory(null); // Deselect if clicking same
            setPlaces([]);
            setSelectedPlaceIds(new Set());
            onUpdateMarkers([]);
        } else {
            setSelectedCategory(categoryId);
        }
    };

    const handleCheckboxChange = (placeId) => {
        const newSelected = new Set(selectedPlaceIds);
        if (newSelected.has(placeId)) {
            newSelected.delete(placeId);
        } else {
            newSelected.add(placeId);
        }
        setSelectedPlaceIds(newSelected);
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allIds = new Set(places.map(p => p.place_id));
            setSelectedPlaceIds(allIds);
        } else {
            setSelectedPlaceIds(new Set());
        }
    };

    return (
        <>
            {/* Toggle Button (Visible when closed) */}
            {!isOpen && (
                <button
                    className="places-toggle-button"
                    onClick={onToggle}
                    style={{
                        position: 'fixed',
                        top: '100px',
                        left: '20px',
                        zIndex: 100,
                        padding: '12px 16px',
                        background: 'white',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: '600',
                        color: '#333',
                        transition: 'transform 0.2s',
                        pointerEvents: 'auto'
                    }}
                    onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
                    onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                >
                    <span style={{ fontSize: '20px' }}>📍</span>
                    <span>Explore Nearby</span>
                </button>
            )}

            {/* Sidebar Panel */}
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '320px',
                    height: '100vh',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '4px 0 20px rgba(0,0,0,0.1)',
                    zIndex: 999,
                    display: 'flex',
                    flexDirection: 'column',
                    pointerEvents: 'auto'
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '20px',
                    background: 'linear-gradient(135deg, #4285F4 0%, #34A853 100%)',
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h2 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        📍 Explore Nearby
                    </h2>
                    <button
                        onClick={onToggle}
                        style={{
                            background: 'rgba(255,255,255,0.2)',
                            border: 'none',
                            color: 'white',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '18px'
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

                    {/* Categories Grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '10px',
                        marginBottom: '20px'
                    }}>
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => handleCategoryClick(cat.id)}
                                style={{
                                    padding: '12px',
                                    border: '1px solid',
                                    borderColor: selectedCategory === cat.id ? '#4285F4' : '#eee',
                                    borderRadius: '8px',
                                    background: selectedCategory === cat.id ? '#edf4ff' : 'white',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '6px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <span style={{ fontSize: '24px' }}>{cat.icon}</span>
                                <span style={{ fontSize: '13px', fontWeight: '500', color: '#555' }}>
                                    {cat.label}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div style={{ borderTop: '1px solid #eee', margin: '0 -16px 16px -16px' }} />

                    {/* Results List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {selectedCategory && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <h3 style={{ margin: 0, fontSize: '16px', color: '#333' }}>
                                    Found Results ({places.length})
                                </h3>
                                {places.length > 0 && (
                                    <label style={{ fontSize: '12px', color: '#4285F4', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <input
                                            type="checkbox"
                                            checked={places.length > 0 && selectedPlaceIds.size === places.length}
                                            onChange={handleSelectAll}
                                        />
                                        Select All
                                    </label>
                                )}
                            </div>
                        )}

                        {isLoading && <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>Scanning area... 🔄</div>}

                        {error && <div style={{ padding: '10px', background: '#ffebee', color: '#d32f2f', borderRadius: '6px', fontSize: '14px' }}>{error}</div>}

                        {!isLoading && selectedCategory && places.length === 0 && !error && (
                            <div style={{ textAlign: 'center', color: '#888', fontStyle: 'italic', padding: '20px' }}>
                                No {selectedCategory}s found nearby. Try moving the map!
                            </div>
                        )}

                        {places.map(place => (
                            <div
                                key={place.place_id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '10px',
                                    padding: '10px',
                                    background: 'white',
                                    borderRadius: '8px',
                                    border: '1px solid #eee',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedPlaceIds.has(place.place_id)}
                                    onChange={() => handleCheckboxChange(place.place_id)}
                                    style={{ marginTop: '4px', cursor: 'pointer' }}
                                />
                                <div>
                                    <div style={{ fontWeight: '600', fontSize: '14px', color: '#333' }}>{place.name}</div>
                                    <div style={{ fontSize: '12px', color: '#777', marginTop: '2px' }}>
                                        {place.vicinity || place.formatted_address}
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px', fontSize: '11px', color: '#555' }}>
                                        {place.rating && <span>⭐ {place.rating}</span>}
                                        {place.user_ratings_total && <span>({place.user_ratings_total})</span>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};

export default PlacesSidebar;
