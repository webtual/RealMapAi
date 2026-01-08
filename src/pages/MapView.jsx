import React, { useEffect, useRef, useState } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import ChatSidebar from '../components/ChatSidebar';
import PlacesSidebar from '../components/PlacesSidebar';


const MapView = () => {
    const maps3d = useMapsLibrary('maps3d');
    const placesLib = useMapsLibrary('places');

    const mapContainerRef = useRef(null);
    const searchInputRef = useRef(null);
    const [mapInstance, setMapInstance] = useState(null);
    const [error, setError] = useState(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [hideUI, setHideUI] = useState(false); // State to hide UI during capture
    const [showRoads, setShowRoads] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    // Nearby Places State
    const [isPlacesSidebarOpen, setIsPlacesSidebarOpen] = useState(false);
    const [nearbyMarkers, setNearbyMarkers] = useState([]);
    const [resetPlacesTrigger, setResetPlacesTrigger] = useState(0);
    const [placeToRemove, setPlaceToRemove] = useState(null); // ID of place to remove



    const [hasMounted, setHasMounted] = useState(false);
    useEffect(() => {
        if (!mapInstance || !maps3d) return;

        // Handle Map Mode (Roads)
        // Hybrid = Roads + Labels
        // Satellite = Pure Imagery (No Roads, No Labels)
        const targetMode = showRoads ? maps3d.MapMode.HYBRID : maps3d.MapMode.SATELLITE;

        // Only update if different to avoid flickering
        if (mapInstance.mode !== targetMode) {
            mapInstance.mode = targetMode;
        }

    }, [showRoads, mapInstance, maps3d]);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    useEffect(() => {
        window.gm_authFailure = () => {
            setError("Google Maps Auth Failed. Check API Key & Billing.");
        };
    }, []);

    // Initialize Map
    useEffect(() => {
        if (!maps3d || !mapContainerRef.current) return;
        if (mapContainerRef.current.children.length > 0) return;

        const { Map3DElement, MapMode } = maps3d;

        const map = new Map3DElement({
            center: { lat: -37.8136, lng: 144.9631, altitude: 200 },
            tilt: 67.5,
            heading: 0,
            range: 1000,
            mode: MapMode.SATELLITE
        });

        map.style.width = '100%';
        map.style.height = '100%';

        const mapId = import.meta.env.VITE_MAP_ID;
        if (mapId) {
            map.setAttribute('map-id', mapId);
        }

        mapContainerRef.current.appendChild(map);
        setMapInstance(map);

    }, [maps3d]);

    // Effect: Render Nearby Markers from Sidebar
    useEffect(() => {
        if (!mapInstance || !maps3d) return;

        // Cleanup old nearby markers and lines
        const oldMarkers = mapInstance.querySelectorAll('.nearby-place-marker');
        oldMarkers.forEach(m => m.remove());
        const oldLines = mapInstance.querySelectorAll('.nearby-place-line');
        oldLines.forEach(l => l.remove());

        const { Marker3DElement, Polyline3DElement } = maps3d;

        // Helper: Calculate Distance
        const calculateDistance = (lat1, lon1, lat2, lon2) => {
            const R = 6371;
            const dLat = (lat2 - lat1) * (Math.PI / 180);
            const dLon = (lon2 - lon1) * (Math.PI / 180);
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return (R * c).toFixed(1);
        };

        console.log(`📍 Rendering ${nearbyMarkers.length} nearby markers`);

        nearbyMarkers.forEach((place, index) => {
            if (!place.geometry || !place.geometry.location) {
                console.warn(`Skipping marker ${index}: No geometry`);
                return;
            }

            try {
                // Robust coordinate extraction
                const lat = typeof place.geometry.location.lat === 'function'
                    ? place.geometry.location.lat()
                    : place.geometry.location.lat;
                const lng = typeof place.geometry.location.lng === 'function'
                    ? place.geometry.location.lng()
                    : place.geometry.location.lng;

                // Calculate distance from map center
                const distance = calculateDistance(mapInstance.center.lat, mapInstance.center.lng, lat, lng);

                console.log(`adding marker for ${place.name} at ${lat}, ${lng} (${distance}km)`);

                // 1. Create Marker
                const marker = new Marker3DElement({
                    position: { lat, lng, altitude: 50 },
                    altitudeMode: 'RELATIVE_TO_GROUND'
                });
                marker.classList.add('nearby-place-marker');

                // 2. Build Content (SVG -> ForeignObject -> HTML)
                // This structure has proven compatible with gmp-marker-3d while effectively hosting HTML.

                const svgNs = "http://www.w3.org/2000/svg";
                const svg = document.createElementNS(svgNs, "svg");
                svg.setAttribute("width", "300");
                svg.setAttribute("height", "120"); // Ample height
                svg.setAttribute("viewBox", "0 0 300 120");
                // svg.style.pointerEvents = "none"; // Let clicks pass through empty areas

                // 2a. The HTML Card Container (ForeignObject)
                const foreignObject = document.createElementNS(svgNs, "foreignObject");
                foreignObject.setAttribute("x", "0");
                foreignObject.setAttribute("y", "0");
                foreignObject.setAttribute("width", "300");
                foreignObject.setAttribute("height", "120");
                foreignObject.style.pointerEvents = "none"; // Critical: Pass events unless hit child

                const htmlContainer = document.createElement("div");
                htmlContainer.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
                htmlContainer.style.cssText = `
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: flex-start;
                    padding-top: 10px;
                `;

                // The Card Itself
                const card = document.createElement("div");
                card.style.cssText = `
                    background: white; 
                    padding: 8px 12px; 
                    border-radius: 12px; 
                    border: 1px solid #ccc; 
                    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 2px;
                    font-family: sans-serif;
                    text-align: center;
                    min-width: 100px;
                    position: relative;
                    margin-bottom: 2px;
                    pointer-events: auto; /* Re-enable clicks for the card */
                    cursor: default;
                `;

                card.innerHTML = `
                        <!-- Close Button -->
                        <div class="close-btn" style="
                            position: absolute;
                            top: -10px;
                            right: -10px;
                            width: 26px;
                            height: 26px;
                            background: #ff5252;
                            color: white;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 16px;
                            font-weight: bold;
                            border: 2px solid white;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                            cursor: pointer;
                            z-index: 1000;
                            pointer-events: auto; /* Ensure button captures clicks */
                        " title="Remove">×</div>

                        <span style="font-size: 13px; font-weight: 700; color: #222; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: flex; align-items: center; gap: 4px;">
                            <span style="font-size: 16px;">${place.placeEmoji || '📍'}</span>
                            <span>${place.name}</span>
                        </span>

                        <span style="font-size: 11px; font-weight: 600; color: #1a73e8; background: #e8f0fe; padding: 2px 6px; border-radius: 10px;">
                            ${distance} km
                        </span>
                `;

                // Attach Close Listener
                const closeBtn = card.querySelector('.close-btn');
                if (closeBtn) {
                    const removeHandler = (e) => {
                        console.log("Close Clicked:", place.name);
                        e.stopPropagation();
                        e.preventDefault();
                        setPlaceToRemove(place.place_id);
                    };

                    closeBtn.addEventListener('click', removeHandler);
                    closeBtn.addEventListener('mousedown', (e) => e.stopPropagation()); // Stop Map drag
                    closeBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
                    closeBtn.addEventListener('touchstart', removeHandler, { passive: false });
                }

                htmlContainer.appendChild(card);
                foreignObject.appendChild(htmlContainer);
                svg.appendChild(foreignObject);

                // 2b. The Pin (SVG Group)
                const pinGroup = document.createElementNS(svgNs, "g");
                // Center the pin. Width 300, center 150. Pin height ~40 (24 + gap).
                // Card is maybe 50-60px tall.
                // We want pin below card.
                pinGroup.setAttribute("transform", "translate(138, 70)");
                pinGroup.innerHTML = `
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#EA4335" stroke="white" stroke-width="2">
                         <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                         <circle cx="12" cy="9" r="2.5" fill="white"/>
                    </svg>
                `;
                svg.appendChild(pinGroup);

                // 3. Wrap in Template (Required)
                const template = document.createElement('template');
                template.content.appendChild(svg);

                // Append using replaceChildren to be safe from ghost slots
                marker.replaceChildren(template);

                mapInstance.appendChild(marker);

                // 2. Create Stem (Polyline)
                if (Polyline3DElement) {
                    const polyline = new Polyline3DElement({
                        coordinates: [
                            { lat, lng, altitude: 0 },
                            { lat, lng, altitude: 50 }
                        ],
                        altitudeMode: 'RELATIVE_TO_GROUND',
                        strokeColor: 'rgba(255, 255, 255, 1)', // Higher opacity
                        strokeWidth: 1 // Thicker line
                    });
                    polyline.classList.add('nearby-place-line');
                    mapInstance.appendChild(polyline);
                }

            } catch (err) {
                console.error("Error creating marker:", err);
            }
        });

    }, [nearbyMarkers, mapInstance, maps3d]);


    // Initialize Search & Logic
    useEffect(() => {
        if (!placesLib || !searchInputRef.current || !mapInstance || !maps3d) return;

        const autocomplete = new placesLib.Autocomplete(searchInputRef.current, {
            fields: ['geometry', 'name', 'formatted_address', 'editorial_summary']
        });

        autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();

            if (!place.geometry || !place.geometry.location) {
                console.warn("No geometry for this place.");
                return;
            }

            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();

            // 1. Move Camera
            mapInstance.center = { lat, lng, altitude: 200 };
            mapInstance.range = 500;
            mapInstance.tilt = 45;

            // Reset Nearby Places Sidebar
            setResetPlacesTrigger(prev => prev + 1);
            setNearbyMarkers([]); // Clear local marker state

            // 2. Draw Polygon
            if (place.geometry.viewport) {
                const bounds = place.geometry.viewport;

                const ne = bounds.getNorthEast();
                const sw = bounds.getSouthWest();

                const coords = [
                    { lat: ne.lat(), lng: sw.lng(), altitude: 0 },
                    { lat: ne.lat(), lng: ne.lng(), altitude: 0 },
                    { lat: sw.lat(), lng: ne.lng(), altitude: 0 },
                    { lat: sw.lat(), lng: sw.lng(), altitude: 0 },
                    { lat: ne.lat(), lng: sw.lng(), altitude: 0 }
                ];

                const { Polygon3DElement, Marker3DElement, Polyline3DElement } = maps3d;

                // Cleanup existing markers, polygons, and lines
                const oldPolys = mapInstance.querySelectorAll('gmp-polygon-3d');
                oldPolys.forEach(p => p.remove());
                const oldMarkers = mapInstance.querySelectorAll('gmp-marker-3d');
                oldMarkers.forEach(m => m.remove());
                const oldLines = mapInstance.querySelectorAll('gmp-polyline-3d');
                oldLines.forEach(l => l.remove());

                // Explicitly clear nearby class ones too just in case
                const nearbyMarkers = mapInstance.querySelectorAll('.nearby-place-marker');
                nearbyMarkers.forEach(m => m.remove());
                const nearbyLines = mapInstance.querySelectorAll('.nearby-place-line');
                nearbyLines.forEach(l => l.remove());


                // Add Polygon
                const polygon = new Polygon3DElement({
                    outerCoordinates: coords,
                    altitudeMode: 'CLAMP_TO_GROUND',
                    strokeColor: 'rgba(255, 0, 0, 0.8)',
                    strokeWidth: 5,
                    fillColor: 'rgba(255, 0, 0, 0.2)',
                    extruded: true
                });
                mapInstance.appendChild(polygon);

                // Add Polyline (Stem) connecting ground to marker
                if (Polyline3DElement) {
                    const polyline = new Polyline3DElement({
                        coordinates: [
                            { lat, lng, altitude: 0 },
                            { lat, lng, altitude: 50 }
                        ],
                        altitudeMode: 'RELATIVE_TO_GROUND',
                        strokeColor: 'rgba(255, 255, 255, 0.8)',
                        strokeWidth: 2
                    });
                    mapInstance.appendChild(polyline);
                }

                // Add Marker with Card
                if (Marker3DElement) {
                    const marker = new Marker3DElement({
                        position: { lat, lng, altitude: 50 },
                        altitudeMode: 'RELATIVE_TO_GROUND'
                    });

                    // Construct SVG
                    const svgNs = "http://www.w3.org/2000/svg";
                    const svg = document.createElementNS(svgNs, "svg");
                    svg.setAttribute("width", "280");
                    svg.setAttribute("height", "140");
                    svg.setAttribute("viewBox", "0 0 280 140");
                    svg.style.display = "block";

                    const foreignObject = document.createElementNS(svgNs, "foreignObject");
                    foreignObject.setAttribute("x", "0");
                    foreignObject.setAttribute("y", "0");
                    foreignObject.setAttribute("width", "280");
                    foreignObject.setAttribute("height", "100");

                    const description = place.editorial_summary?.overview || place.formatted_address || "";

                    const htmlContent = document.createElement("div");
                    htmlContent.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
                    // Important: Background must be opaque white for screenshot
                    htmlContent.style.cssText = `
                        background: #ffffff; 
                        width: 100%;
                        height: 100%;
                        border-radius: 8px; 
                        box-shadow: 0 4px 15px rgba(0,0,0,0.5); 
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        text-align: center; 
                        font-family: sans-serif;
                        padding: 10px;
                        box-sizing: border-box;
                    `;
                    htmlContent.innerHTML = `
                        <div style="font-weight: bold; margin-bottom: 4px; color: #333; font-size: 14px;">${place.name}</div>
                        <div style="font-size: 11px; color: #555; width: 100%; height: 100%; overflow: hidden; text-overflow: ellipsis;">
                            ${description}
                        </div>
                    `;

                    foreignObject.appendChild(htmlContent);
                    svg.appendChild(foreignObject);

                    const pinGroup = document.createElementNS(svgNs, "g");
                    // Center the pin below the card
                    pinGroup.setAttribute("transform", "translate(120, 100)");
                    pinGroup.innerHTML = `
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="#EA4335" stroke="white" stroke-width="2">
                             <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                             <circle cx="12" cy="9" r="2.5" fill="white"/>
                        </svg>
                    `;
                    svg.appendChild(pinGroup);

                    const template = document.createElement('template');
                    template.content.appendChild(svg);
                    marker.appendChild(template);

                    mapInstance.appendChild(marker);
                }
            }
        });

    }, [placesLib, mapInstance, maps3d]);

    const handleCapture = async () => {
        try {
            setIsCapturing(true);
            setIsPlacesSidebarOpen(false); // Close the drawer before capture

            // 1. Ask permission to capture screen
            // Prefer "current tab" if browser supports suggestion, but standard API doesn't force it.
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    displaySurface: 'browser' // hints to user to share browser tab
                },
                audio: false,
                preferCurrentTab: true // Chrome specific hint
            });

            // 2. Hide UI elements so they aren't in the screenshot
            setHideUI(true);

            // Inject styles to hide global UI (Navbar) and Cursor
            const style = document.createElement('style');
            style.id = 'capture-styles';
            style.innerHTML = `
                .navbar { display: none !important; }
                .chat-fab-button, .chat-sidebar-panel { display: none !important; }
                .places-toggle-button { display: none !important; }
                * { cursor: none !important; }
            `;
            document.head.appendChild(style);

            // 3. Wait for UI to hide and stream to stabilize
            await new Promise(resolve => setTimeout(resolve, 500));

            // 4. Capture frame from stream (Cross-browser compatible way)
            const video = document.createElement('video');
            video.srcObject = stream;
            video.playsInline = true;
            video.muted = true;

            // Wait for video to be ready
            await new Promise((resolve) => {
                video.onloadedmetadata = () => {
                    video.play().then(resolve);
                };
            });

            // Wait a bit ensuring the frame is fresh (optional but safer)
            await new Promise(r => setTimeout(r, 100));

            // 5. Convert to Canvas/Blob to download
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // 6. Stop sharing
            stream.getTracks().forEach(track => track.stop());
            video.srcObject = null;

            // 8. Download
            const image = canvas.toDataURL("image/png");
            const link = document.createElement('a');
            link.href = image;
            link.download = `3d-map-capture-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (err) {
            console.error("Screen Capture failed:", err);
            setError("Capture cancelled or failed: " + err.message);
        } finally {
            setIsCapturing(false);
            setHideUI(false);
            const styleEl = document.getElementById('capture-styles');
            if (styleEl) styleEl.remove();
        }
    };

    return (
        <div style={{ position: 'relative', width: '100%', height: '100vh', background: '#000', overflow: 'hidden' }}>

            <PlacesSidebar
                isOpen={isPlacesSidebarOpen}
                onToggle={() => setIsPlacesSidebarOpen(prev => !prev)}
                placesLib={placesLib}
                mapInstance={mapInstance}
                onUpdateMarkers={setNearbyMarkers}
                resetTrigger={resetPlacesTrigger}
                placeToRemove={placeToRemove}
                onPlaceRemovalHandled={() => setPlaceToRemove(null)}
            />


            {/* Control Panel */}

            {/* Control Panel */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 100,
                transition: 'opacity 0.2s',
                opacity: hideUI ? 0 : 1,
                pointerEvents: 'none'
            }}>
                {/* Note: Fragments or conditional rendering removed to keep component mounted */}
                <div>
                    <div style={{
                        position: 'absolute', top: 20, left: isPlacesSidebarOpen ? 340 : 20, zIndex: 100,
                        background: 'white', padding: '10px', borderRadius: '8px',
                        transition: 'left 0.3s ease',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.3)', display: 'flex', gap: '10px',

                        pointerEvents: 'auto'
                    }}>
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Search address..."
                            style={{ width: '300px', padding: '8px', fontSize: '16px', outline: 'none', border: '1px solid #ccc', borderRadius: '4px' }}
                        />
                    </div>

                    <button
                        onClick={handleCapture}
                        disabled={isCapturing}
                        style={{
                            position: 'absolute',
                            top: 20,
                            right: 20,
                            zIndex: 100,
                            padding: '10px 20px',
                            background: isCapturing ? '#f0f0f0' : 'white',
                            color: '#333',
                            border: 'none',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            cursor: isCapturing ? 'wait' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            pointerEvents: 'auto'
                        }}
                        onMouseEnter={(e) => !isCapturing && (e.target.style.background = '#f0f0f0')}
                        onMouseLeave={(e) => !isCapturing && (e.target.style.background = 'white')}
                    >
                        {isCapturing ? 'Select Tab...' : '📷 Capture'}
                    </button>

                    {error && <div style={{ position: 'absolute', zIndex: 110, top: 80, left: 20, color: 'white', padding: 10, background: 'red', borderRadius: '4px' }}>{error}</div>}

                    {/* Instructions for user (optional, can remove if too cluttered) */}
                    {/* <div style={{
                        position: 'absolute',
                        bottom: 20,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        color: 'rgba(255,255,255,0.7)',
                        fontSize: '12px',
                        pointerEvents: 'none',
                        textAlign: 'center'
                    }}>
                        Use "Capture" to take a screenshot. Select "This Tab" when prompted.
                    </div> */}


                </div>
            </div>

            {/* Bottom Right Controls: Show Labels / Show Roads */}
            <div style={{
                position: 'absolute',
                bottom: 60,
                right: 160,
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                padding: '2px',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                opacity: hideUI ? 0 : 1,
                pointerEvents: hideUI ? 'none' : 'auto',
                transition: 'opacity 0.2s'
            }}>
                {/* <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#666',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '4px',
                    paddingLeft: '4px'
                }}>
                    Map Layers
                </div> */}

                <button
                    onClick={() => setShowRoads(prev => !prev)}
                    style={{
                        padding: '10px 16px',
                        background: showRoads ? '#4285F4' : '#f8f9fa',
                        color: showRoads ? 'white' : '#333',
                        border: '1px solid',
                        borderColor: showRoads ? '#4285F4' : '#e0e0e0',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        transition: 'all 0.2s ease',
                        width: '120px'
                    }}
                >
                    <span>Show Labels</span>
                    {/* <span style={{ fontSize: '16px' }}>{showRoads ? '🛣️' : '🛰️'}</span> */}
                </button>
            </div>

            <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

            {hasMounted && (
                <ChatSidebar
                    isOpen={isChatOpen}
                    onToggle={() => setIsChatOpen(prev => !prev)}
                    onLocationSearch={(query) => {
                        console.log(`🗺️ AI Requesting search for: ${query}`);

                        // Update the visual input value
                        if (searchInputRef.current) {
                            searchInputRef.current.value = query;
                        }

                        if (!placesLib || !maps3d) {
                            console.error("Google Maps Libraries not ready");
                            return;
                        }

                        // Use a dummy div for the service to avoid 3D map conflicts
                        const dummyDiv = document.createElement('div');
                        const service = new placesLib.PlacesService(dummyDiv);

                        const request = {
                            query: query,
                            location: mapInstance.center, // Bias to map center
                            radius: 5000
                        };

                        service.textSearch(request, (results, status) => {
                            if (status === placesLib.PlacesServiceStatus.OK && results && results.length > 0) {
                                const placeSummary = results[0];
                                console.log("📍 Found Place ID:", placeSummary.place_id);

                                // Step 2: Get Full Details (Needed for Viewport/Bounds)
                                service.getDetails({
                                    placeId: placeSummary.place_id,
                                    fields: ['name', 'geometry', 'formatted_address', 'editorial_summary']
                                }, (place, detailStatus) => {
                                    if (detailStatus === placesLib.PlacesServiceStatus.OK && place && place.geometry && place.geometry.location) {
                                        console.log("📍 Got Full Details for:", place.name);

                                        const lat = place.geometry.location.lat();
                                        const lng = place.geometry.location.lng();

                                        // 1. Move Camera
                                        if (mapInstance) {
                                            mapInstance.center = { lat, lng, altitude: 200 };
                                            mapInstance.range = 500;
                                            mapInstance.tilt = 45;
                                        }

                                        // 2. Draw Polygon & Marker
                                        const { Polygon3DElement, Marker3DElement, Polyline3DElement } = maps3d;

                                        // Cleanup existing
                                        const oldPolys = mapInstance.querySelectorAll('gmp-polygon-3d');
                                        oldPolys.forEach(p => p.remove());
                                        const oldMarkers = mapInstance.querySelectorAll('gmp-marker-3d');
                                        oldMarkers.forEach(m => m.remove());
                                        const oldLines = mapInstance.querySelectorAll('gmp-polyline-3d');
                                        oldLines.forEach(l => l.remove());

                                        // Draw Viewport Polygon if available
                                        if (place.geometry.viewport) {
                                            const bounds = place.geometry.viewport;
                                            const ne = bounds.getNorthEast();
                                            const sw = bounds.getSouthWest();

                                            const coords = [
                                                { lat: ne.lat(), lng: sw.lng(), altitude: 0 },
                                                { lat: ne.lat(), lng: ne.lng(), altitude: 0 },
                                                { lat: sw.lat(), lng: ne.lng(), altitude: 0 },
                                                { lat: sw.lat(), lng: sw.lng(), altitude: 0 },
                                                { lat: ne.lat(), lng: sw.lng(), altitude: 0 }
                                            ];

                                            const polygon = new Polygon3DElement({
                                                outerCoordinates: coords,
                                                altitudeMode: 'CLAMP_TO_GROUND',
                                                strokeColor: 'rgba(255, 0, 0, 0.8)',
                                                strokeWidth: 5,
                                                fillColor: 'rgba(255, 0, 0, 0.2)',
                                                extruded: true
                                            });
                                            mapInstance.appendChild(polygon);
                                        }

                                        // Add Marker with Card
                                        if (Marker3DElement) {
                                            const marker = new Marker3DElement({
                                                position: { lat, lng, altitude: 50 },
                                                altitudeMode: 'RELATIVE_TO_GROUND'
                                            });

                                            // Construct SVG
                                            const svgNs = "http://www.w3.org/2000/svg";
                                            const svg = document.createElementNS(svgNs, "svg");
                                            svg.setAttribute("width", "280");
                                            svg.setAttribute("height", "140");
                                            svg.setAttribute("viewBox", "0 0 280 140");
                                            svg.style.display = "block";

                                            const foreignObject = document.createElementNS(svgNs, "foreignObject");
                                            foreignObject.setAttribute("x", "0");
                                            foreignObject.setAttribute("y", "0");
                                            foreignObject.setAttribute("width", "280");
                                            foreignObject.setAttribute("height", "100");

                                            const description = place.editorial_summary?.overview || place.formatted_address || "Location found by AI";

                                            const htmlContent = document.createElement("div");
                                            htmlContent.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
                                            htmlContent.style.cssText = `
                                                background: #ffffff; 
                                                width: 100%;
                                                height: 100%;
                                                border-radius: 8px; 
                                                box-shadow: 0 4px 15px rgba(0,0,0,0.5); 
                                                display: flex;
                                                flex-direction: column;
                                                align-items: center;
                                                justify-content: center;
                                                text-align: center; 
                                                font-family: sans-serif;
                                                padding: 10px;
                                                box-sizing: border-box;
                                            `;
                                            htmlContent.innerHTML = `
                                                <div style="font-weight: bold; margin-bottom: 4px; color: #333; font-size: 14px;">${place.name}</div>
                                                <div style="font-size: 11px; color: #555; width: 100%; height: 100%; overflow: hidden; text-overflow: ellipsis;">
                                                    ${description}
                                                </div>
                                            `;

                                            foreignObject.appendChild(htmlContent);
                                            svg.appendChild(foreignObject);

                                            const pinGroup = document.createElementNS(svgNs, "g");
                                            pinGroup.setAttribute("transform", "translate(120, 100)");
                                            pinGroup.innerHTML = `
                                                <svg width="40" height="40" viewBox="0 0 24 24" fill="#EA4335" stroke="white" stroke-width="2">
                                                     <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                                                     <circle cx="12" cy="9" r="2.5" fill="white"/>
                                                </svg>
                                            `;
                                            svg.appendChild(pinGroup);

                                            const template = document.createElement('template');
                                            template.content.appendChild(svg);
                                            marker.appendChild(template);
                                            mapInstance.appendChild(marker);

                                            // Add Polyline (Stem)
                                            if (Polyline3DElement) {
                                                const polyline = new Polyline3DElement({
                                                    coordinates: [
                                                        { lat, lng, altitude: 0 },
                                                        { lat, lng, altitude: 50 }
                                                    ],
                                                    altitudeMode: 'RELATIVE_TO_GROUND',
                                                    strokeColor: 'rgba(255, 255, 255, 0.8)',
                                                    strokeWidth: 2
                                                });
                                                mapInstance.appendChild(polyline);
                                            }
                                        }

                                    } else {
                                        console.error("Failed to get place details or no geometry", detailStatus);
                                    }
                                });
                            } else {
                                console.error("Place not found:", status);
                            }
                        });
                    }}
                    getMapContext={() => {
                        if (!mapInstance) return null;
                        const center = mapInstance.center;
                        return {
                            lat: center.lat,
                            lng: center.lng,
                            range: mapInstance.range,
                            tilt: mapInstance.tilt,
                            heading: mapInstance.heading
                        };
                    }}
                    onCameraAction={(action) => {
                        if (!mapInstance) return;
                        console.log("📷 Camera Action:", action);

                        const { type, value } = action;
                        const current = {
                            range: mapInstance.range || 1000,
                            heading: mapInstance.heading || 0,
                            tilt: mapInstance.tilt || 0,
                            center: mapInstance.center
                        };

                        switch (type) {
                            case 'ZOOM_IN':
                                mapInstance.range = Math.max(100, current.range * 0.6);
                                break;
                            case 'ZOOM_OUT':
                                mapInstance.range = Math.min(20000, current.range * 1.5);
                                break;
                            case 'ROTATE_LEFT':
                                mapInstance.heading = (current.heading - (value || 45) + 360) % 360;
                                break;
                            case 'ROTATE_RIGHT':
                                mapInstance.heading = (current.heading + (value || 45)) % 360;
                                break;
                            case 'TILT_UP': // Look from top (flat)
                                mapInstance.tilt = Math.max(0, current.tilt - (value || 30));
                                break;
                            case 'TILT_DOWN': // Look from side (3D)
                                mapInstance.tilt = Math.min(75, current.tilt + (value || 30));
                                break;
                            case 'RESET':
                                mapInstance.range = 1000;
                                mapInstance.tilt = 67.5;
                                mapInstance.heading = 0;
                                break;
                            case 'SWITCH_MODE':
                                console.log("Switch mode requested (Not fully implemented for 3D map yet):", value);
                                // Future: Toggle 2D/3D map overlay
                                break;
                            default:
                                console.warn("Unknown camera action:", type);
                        }
                    }}
                />
            )}


            {!maps3d && <div style={{ position: 'absolute', top: '50%', left: '50%', color: 'white' }}>Loading Maps...</div>}
        </div >
    );
};

export default MapView;
