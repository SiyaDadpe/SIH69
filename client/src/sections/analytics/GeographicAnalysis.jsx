import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons for different facility types
const createCustomIcon = (color, icon) => {
    return L.divIcon({
        className: 'custom-icon',
        html: `
            <div style="
                background-color: ${color};
                width: 32px;
                height: 32px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 3px solid white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                font-size: 16px;
            ">
                ${icon}
            </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });
};

const facilityIcons = {
    mine: createCustomIcon('#8B4513', '⛏️'),
    refinery: createCustomIcon('#FF6B6B', '🏭'),
    smelter: createCustomIcon('#FF9F1C', '🔥'),
    recycler: createCustomIcon('#00B894', '♻️'),
    default: createCustomIcon('#6B7280', '📍')
};

// Component to recenter map when facilities change
function MapRecenter({ center, zoom }) {
    const map = useMap();
    React.useEffect(() => {
        if (center) {
            map.setView(center, zoom);
        }
    }, [center, zoom, map]);
    return null;
}

export default function GeographicAnalysis({ mode, selectedProject }) {
    const [activeLayers, setActiveLayers] = useState({
        facilities: true,
        routes: true,
        environmental: true,
        biodiversity: false,
        social: false
    });
    const [whatIfScenario, setWhatIfScenario] = useState({
        distance: 50,
        volume: 10000,
        transportMode: 'truck'
    });

    if (!selectedProject) {
        return (
            <div className="text-center py-12 text-gray-500">
                Select a project to view geographic analysis
            </div>
        );
    }

    const geoData = selectedProject.geographicAnalysis || {};
    const facilities = geoData.facilities || [];
    const routes = geoData.transportationRoutes || [];
    const regionalImpacts = geoData.regionalImpacts || [];

    // Calculate map center from facilities
    const mapCenter = geoData.coordinates 
        ? [geoData.coordinates.latitude, geoData.coordinates.longitude]
        : facilities.length > 0 
        ? [facilities[0].latitude, facilities[0].longitude]
        : [20, 77]; // Default to India

    const toggleLayer = (layer) => {
        setActiveLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
    };

    // Get facility by ID
    const getFacilityById = (id) => {
        return facilities.find(f => f.id === id);
    };

    // Calculate route color based on emissions
    const getRouteColor = (emissions) => {
        if (emissions > 400) return '#EF4444'; // High emissions - red
        if (emissions > 200) return '#F59E0B'; // Medium emissions - orange
        return '#22C55E'; // Low emissions - green
    };

    // Calculate what-if scenario emissions
    const calculateScenarioEmissions = () => {
        const emissionFactors = {
            truck: 0.12, // kg CO2 per km per ton
            rail: 0.04,
            ship: 0.02
        };
        const factor = emissionFactors[whatIfScenario.transportMode] || 0.12;
        const tonnage = whatIfScenario.volume / 1000;
        return (whatIfScenario.distance * tonnage * factor).toFixed(2);
    };

    // Mock environmental hotspots (water stress areas)
    const environmentalHotspots = [
        { lat: mapCenter[0] + 0.05, lng: mapCenter[1] + 0.05, intensity: 'high', type: 'water stress' },
        { lat: mapCenter[0] - 0.08, lng: mapCenter[1] - 0.06, intensity: 'medium', type: 'air quality' },
        { lat: mapCenter[0] + 0.12, lng: mapCenter[1] - 0.1, intensity: 'low', type: 'soil degradation' }
    ];

    // Mock biodiversity areas
    const biodiversityZones = [
        { lat: mapCenter[0] + 0.15, lng: mapCenter[1] + 0.08, type: 'Protected Forest', status: 'Critical' },
        { lat: mapCenter[0] - 0.12, lng: mapCenter[1] + 0.15, type: 'Wildlife Corridor', status: 'Moderate' }
    ];

    // Mock social impact zones
    const socialZones = [
        { lat: mapCenter[0] + 0.08, lng: mapCenter[1] - 0.12, community: 'Local Community A', impact: 'Positive', jobs: 120 },
        { lat: mapCenter[0] - 0.1, lng: mapCenter[1] - 0.08, community: 'Local Community B', impact: 'Positive', jobs: 85 }
    ];

    return (
        <div className="geographic-analysis space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#BA7967]/10 to-[#BA7967]/5 rounded-lg p-6 border border-[#BA7967]/20">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Geographic Supply Chain Analysis</h2>
                        <p className="text-gray-600">{geoData.city}, {geoData.state} - {geoData.region}</p>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-[#BA7967]">
                            {facilities.length}
                        </div>
                        <div className="text-sm text-gray-600">Active Facilities</div>
                    </div>
                </div>
            </div>

            {/* Layer Toggle Controls */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Map Layers</h3>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => toggleLayer('facilities')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            activeLayers.facilities
                                ? 'bg-[#BA7967] text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        📍 Facilities
                    </button>
                    <button
                        onClick={() => toggleLayer('routes')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            activeLayers.routes
                                ? 'bg-[#BA7967] text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        🛣️ Routes
                    </button>
                    <button
                        onClick={() => toggleLayer('environmental')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            activeLayers.environmental
                                ? 'bg-[#BA7967] text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        🌍 Environmental
                    </button>
                    <button
                        onClick={() => toggleLayer('biodiversity')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            activeLayers.biodiversity
                                ? 'bg-[#BA7967] text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        🌳 Biodiversity
                    </button>
                    <button
                        onClick={() => toggleLayer('social')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            activeLayers.social
                                ? 'bg-[#BA7967] text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        👥 Social Impact
                    </button>
                </div>
            </div>

            {/* Interactive Map */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Supply Chain Network Map</h3>
                <div className="h-[600px] rounded-lg overflow-hidden border-2 border-gray-200">
                    <MapContainer 
                        center={mapCenter} 
                        zoom={10} 
                        style={{ height: '100%', width: '100%' }}
                        scrollWheelZoom={true}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <MapRecenter center={mapCenter} zoom={10} />

                        {/* Facility Markers */}
                        {activeLayers.facilities && facilities.map((facility) => (
                            <Marker
                                key={facility.id}
                                position={[facility.latitude, facility.longitude]}
                                icon={facilityIcons[facility.type] || facilityIcons.default}
                            >
                                <Popup>
                                    <div className="p-2">
                                        <h4 className="font-bold text-gray-900 mb-2">{facility.name}</h4>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Type:</span>
                                                <span className="font-semibold capitalize">{facility.type}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Capacity:</span>
                                                <span className="font-semibold">{facility.capacity.toLocaleString()} t/yr</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Emissions:</span>
                                                <span className="font-semibold text-red-600">{facility.emissions.toLocaleString()} kg</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Water:</span>
                                                <span className="font-semibold text-blue-600">{facility.waterUsage.toLocaleString()} L</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Energy:</span>
                                                <span className="font-semibold text-orange-600">{facility.energyConsumption.toLocaleString()} MJ</span>
                                            </div>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}

                        {/* Transportation Routes */}
                        {activeLayers.routes && routes.map((route) => {
                            const fromFacility = getFacilityById(route.fromFacility);
                            const toFacility = getFacilityById(route.toFacility);
                            
                            if (!fromFacility || !toFacility) return null;

                            return (
                                <React.Fragment key={route.id}>
                                    <Polyline
                                        positions={[
                                            [fromFacility.latitude, fromFacility.longitude],
                                            [toFacility.latitude, toFacility.longitude]
                                        ]}
                                        color={getRouteColor(route.emissions)}
                                        weight={4}
                                        opacity={0.7}
                                    >
                                        <Popup>
                                            <div className="p-2">
                                                <h4 className="font-bold text-gray-900 mb-2">Transportation Route</h4>
                                                <div className="space-y-1 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">From:</span>
                                                        <span className="font-semibold">{fromFacility.name}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">To:</span>
                                                        <span className="font-semibold">{toFacility.name}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Distance:</span>
                                                        <span className="font-semibold">{route.distance} km</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Mode:</span>
                                                        <span className="font-semibold capitalize">{route.transportMode}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Material:</span>
                                                        <span className="font-semibold">{route.materialType}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Volume:</span>
                                                        <span className="font-semibold">{route.volume.toLocaleString()} kg</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Emissions:</span>
                                                        <span className="font-semibold text-red-600">{route.emissions} kg CO₂</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Popup>
                                    </Polyline>
                                </React.Fragment>
                            );
                        })}

                        {/* Environmental Hotspots (Heatmap circles) */}
                        {activeLayers.environmental && environmentalHotspots.map((hotspot, idx) => (
                            <Circle
                                key={`env-${idx}`}
                                center={[hotspot.lat, hotspot.lng]}
                                radius={hotspot.intensity === 'high' ? 5000 : hotspot.intensity === 'medium' ? 3000 : 1500}
                                fillColor={hotspot.intensity === 'high' ? '#EF4444' : hotspot.intensity === 'medium' ? '#F59E0B' : '#FCD34D'}
                                fillOpacity={0.3}
                                stroke={true}
                                color={hotspot.intensity === 'high' ? '#DC2626' : hotspot.intensity === 'medium' ? '#D97706' : '#F59E0B'}
                                weight={2}
                            >
                                <Popup>
                                    <div className="p-2">
                                        <h4 className="font-bold text-gray-900 mb-1">Environmental Hotspot</h4>
                                        <div className="text-sm">
                                            <div><strong>Type:</strong> {hotspot.type}</div>
                                            <div><strong>Intensity:</strong> <span className="capitalize">{hotspot.intensity}</span></div>
                                        </div>
                                    </div>
                                </Popup>
                            </Circle>
                        ))}

                        {/* Biodiversity Zones */}
                        {activeLayers.biodiversity && biodiversityZones.map((zone, idx) => (
                            <Circle
                                key={`bio-${idx}`}
                                center={[zone.lat, zone.lng]}
                                radius={6000}
                                fillColor="#10B981"
                                fillOpacity={0.2}
                                stroke={true}
                                color="#059669"
                                weight={3}
                                dashArray="10, 10"
                            >
                                <Popup>
                                    <div className="p-2">
                                        <h4 className="font-bold text-gray-900 mb-1">🌳 {zone.type}</h4>
                                        <div className="text-sm">
                                            <div><strong>Status:</strong> {zone.status}</div>
                                            <div className="mt-1 text-xs text-gray-600">Protected biodiversity area</div>
                                        </div>
                                    </div>
                                </Popup>
                            </Circle>
                        ))}

                        {/* Social Impact Zones */}
                        {activeLayers.social && socialZones.map((zone, idx) => (
                            <Circle
                                key={`social-${idx}`}
                                center={[zone.lat, zone.lng]}
                                radius={4000}
                                fillColor="#6366F1"
                                fillOpacity={0.2}
                                stroke={true}
                                color="#4F46E5"
                                weight={2}
                            >
                                <Popup>
                                    <div className="p-2">
                                        <h4 className="font-bold text-gray-900 mb-1">👥 {zone.community}</h4>
                                        <div className="text-sm">
                                            <div><strong>Impact:</strong> {zone.impact}</div>
                                            <div><strong>Jobs Created:</strong> {zone.jobs}</div>
                                        </div>
                                    </div>
                                </Popup>
                            </Circle>
                        ))}
                    </MapContainer>
                </div>

                {/* Map Legend */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Legend</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div className="flex items-center gap-2">
                            <span>⛏️</span>
                            <span>Mining</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span>🏭</span>
                            <span>Refinery</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span>🔥</span>
                            <span>Smelter</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span>♻️</span>
                            <span>Recycling</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-1 bg-green-500"></div>
                            <span>Low Emissions</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-1 bg-orange-500"></div>
                            <span>Medium Emissions</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-1 bg-red-500"></div>
                            <span>High Emissions</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-red-500 opacity-30 border-2 border-red-600"></div>
                            <span>Env. Hotspot</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Regional Impact Cards */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Regional Impact Assessment</h3>
                    
                    {regionalImpacts.map((impact, idx) => (
                        <div key={idx} className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                            <h4 className="font-semibold text-gray-900 mb-3">{impact.region}</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-green-50 rounded-lg">
                                    <div className="text-xs text-gray-600">Economic Impact</div>
                                    <div className="text-lg font-bold text-green-700">
                                        ${(impact.economicImpact / 1000000).toFixed(1)}M
                                    </div>
                                </div>
                                <div className="p-3 bg-blue-50 rounded-lg">
                                    <div className="text-xs text-gray-600">Jobs Created</div>
                                    <div className="text-lg font-bold text-blue-700">
                                        {impact.jobsCreated}
                                    </div>
                                </div>
                                <div className="p-3 bg-red-50 rounded-lg">
                                    <div className="text-xs text-gray-600">Emissions Reduced</div>
                                    <div className="text-lg font-bold text-red-700">
                                        {impact.emissionsReduced.toLocaleString()} kg
                                    </div>
                                </div>
                                <div className="p-3 bg-purple-50 rounded-lg">
                                    <div className="text-xs text-gray-600">Community Benefit</div>
                                    <div className="text-lg font-bold text-purple-700">
                                        {impact.communityBenefit}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Environmental Stress Indicators */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                        <h4 className="font-semibold text-gray-900 mb-3">Environmental Stress Indicators</h4>
                        <div className="space-y-3">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-600">Water Stress</span>
                                    <span className="font-semibold text-blue-600">Medium</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-600">Air Quality Impact</span>
                                    <span className="font-semibold text-orange-600">Low-Medium</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-600">Soil Degradation</span>
                                    <span className="font-semibold text-green-600">Low</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '30%' }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-600">Biodiversity Risk</span>
                                    <span className="font-semibold text-yellow-600">Medium</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '55%' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Logistics Optimizer - What-If Scenarios */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Logistics Optimizer</h3>
                    
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                        <h4 className="font-semibold text-gray-900 mb-4">What-If Scenario Calculator</h4>
                        
                        <div className="space-y-4">
                            {/* Distance Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Transport Distance (km)
                                </label>
                                <input
                                    type="number"
                                    value={whatIfScenario.distance}
                                    onChange={(e) => setWhatIfScenario(prev => ({ ...prev, distance: parseFloat(e.target.value) || 0 }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BA7967] focus:border-[#BA7967]"
                                    min="0"
                                    step="0.1"
                                />
                            </div>

                            {/* Volume Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Material Volume (kg)
                                </label>
                                <input
                                    type="number"
                                    value={whatIfScenario.volume}
                                    onChange={(e) => setWhatIfScenario(prev => ({ ...prev, volume: parseFloat(e.target.value) || 0 }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BA7967] focus:border-[#BA7967]"
                                    min="0"
                                    step="100"
                                />
                            </div>

                            {/* Transport Mode Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Transport Mode
                                </label>
                                <select
                                    value={whatIfScenario.transportMode}
                                    onChange={(e) => setWhatIfScenario(prev => ({ ...prev, transportMode: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BA7967] focus:border-[#BA7967]"
                                >
                                    <option value="truck">Truck (0.12 kg CO₂/km/ton)</option>
                                    <option value="rail">Rail (0.04 kg CO₂/km/ton)</option>
                                    <option value="ship">Ship (0.02 kg CO₂/km/ton)</option>
                                </select>
                            </div>

                            {/* Calculated Results */}
                            <div className="pt-4 border-t border-gray-200">
                                <h5 className="text-sm font-semibold text-gray-900 mb-3">Calculated Impact</h5>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-red-50 rounded-lg">
                                        <div className="text-xs text-gray-600">Total Emissions</div>
                                        <div className="text-xl font-bold text-red-700">
                                            {calculateScenarioEmissions()}
                                        </div>
                                        <div className="text-xs text-gray-600">kg CO₂</div>
                                    </div>
                                    <div className="p-3 bg-blue-50 rounded-lg">
                                        <div className="text-xs text-gray-600">Est. Cost</div>
                                        <div className="text-xl font-bold text-blue-700">
                                            ${(whatIfScenario.distance * whatIfScenario.volume * 0.05 / 1000).toFixed(0)}
                                        </div>
                                        <div className="text-xs text-gray-600">USD</div>
                                    </div>
                                    <div className="p-3 bg-green-50 rounded-lg">
                                        <div className="text-xs text-gray-600">Transit Time</div>
                                        <div className="text-xl font-bold text-green-700">
                                            {whatIfScenario.transportMode === 'truck' 
                                                ? (whatIfScenario.distance / 60).toFixed(1)
                                                : whatIfScenario.transportMode === 'rail'
                                                ? (whatIfScenario.distance / 80).toFixed(1)
                                                : (whatIfScenario.distance / 40).toFixed(1)
                                            }
                                        </div>
                                        <div className="text-xs text-gray-600">hours</div>
                                    </div>
                                    <div className="p-3 bg-purple-50 rounded-lg">
                                        <div className="text-xs text-gray-600">Efficiency</div>
                                        <div className="text-xl font-bold text-purple-700">
                                            {whatIfScenario.transportMode === 'ship' ? '95%' : whatIfScenario.transportMode === 'rail' ? '85%' : '72%'}
                                        </div>
                                        <div className="text-xs text-gray-600">rating</div>
                                    </div>
                                </div>
                            </div>

                            {/* Recommendations */}
                            <div className="p-4 bg-gradient-to-r from-[#BA7967]/10 to-[#BA7967]/5 rounded-lg border border-[#BA7967]/20">
                                <div className="flex items-start gap-2">
                                    <svg className="w-5 h-5 text-[#BA7967] mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div className="text-sm">
                                        <div className="font-semibold text-gray-900 mb-1">Optimization Recommendation</div>
                                        <div className="text-gray-700">
                                            {whatIfScenario.transportMode === 'truck' && whatIfScenario.distance > 100
                                                ? 'Consider switching to rail transport for distances over 100km to reduce emissions by 67%'
                                                : whatIfScenario.transportMode === 'rail'
                                                ? 'Optimal choice for medium to long distances. Current configuration is efficient.'
                                                : 'Excellent choice for bulk materials. Minimize port-to-facility distance for best results.'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Supply Chain Summary */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                        <h4 className="font-semibold text-gray-900 mb-3">Supply Chain Summary</h4>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                <span className="text-sm text-gray-600">Total Network Distance</span>
                                <span className="font-semibold text-gray-900">{geoData.supplyChainMap?.totalDistance || 0} km</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                <span className="text-sm text-gray-600">Total Route Emissions</span>
                                <span className="font-semibold text-red-700">{geoData.supplyChainMap?.totalEmissions || 0} kg CO₂</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                <span className="text-sm text-gray-600">Active Routes</span>
                                <span className="font-semibold text-gray-900">{routes.length}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                <span className="text-sm text-gray-600">Network Efficiency</span>
                                <span className="font-semibold text-green-700">
                                    {mode === 'circular' ? '87%' : '65%'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Proximity Analysis */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Resource Proximity Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                        <div className="text-sm text-gray-700 mb-1">Recycling Facilities</div>
                        <div className="text-3xl font-bold text-green-700">
                            {geoData.proximityToResources?.recyclingFacilities || 0}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">Within 50km radius</div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                        <div className="text-sm text-gray-700 mb-1">Raw Material Sources</div>
                        <div className="text-3xl font-bold text-blue-700">
                            {geoData.proximityToResources?.rawMaterials || 0}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">Nearby suppliers</div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                        <div className="text-sm text-gray-700 mb-1">Transport Hubs</div>
                        <div className="text-3xl font-bold text-purple-700">
                            {geoData.proximityToResources?.transportHubs || 0}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">Ports, rail, highways</div>
                    </div>
                </div>
            </div>
        </div>
    );
}