"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { MOCK_REPORTS as reports_data, Report } from "@/app/data/mockData";

const categoryMeta: Record<Report["category"], { color: string; bg: string; icon: string }> = {
    "Road & Traffic": { color: "text-blue-400", bg: "bg-blue-500/10", icon: "🚧" },
    "Water and Drainage": { color: "text-sky-400", bg: "bg-sky-500/10", icon: "💧" },
    "Waste & Environment": { color: "text-green-400", bg: "bg-green-500/10", icon: "♻️" },
    "Social Security": { color: "text-violet-400", bg: "bg-violet-500/10", icon: "🛡️" },
    "Bridge & Structural": { color: "text-orange-400", bg: "bg-orange-500/10", icon: "🌉" },
    "Other": { color: "text-slate-400", bg: "bg-slate-500/10", icon: "📍" },
};

const statusMeta: Record<Report["status"], { color: string; bg: string; dot: string }> = {
    Reported: { color: "text-orange-300", bg: "bg-orange-500/10", dot: "bg-orange-400" },
    "In Progress": { color: "text-cyan-300", bg: "bg-cyan-500/10", dot: "bg-cyan-400" },
    Solved: { color: "text-teal-300", bg: "bg-teal-500/10", dot: "bg-teal-400" },
    Closed: { color: "text-slate-400", bg: "bg-slate-500/10", dot: "bg-slate-400" },
};

const priorityMeta: Record<Report["priority"], { color: string; bg: string }> = {
    Low: { color: "text-blue-300", bg: "bg-blue-500/10" },
    Medium: { color: "text-yellow-300", bg: "bg-yellow-500/10" },
    High: { color: "text-orange-400", bg: "bg-orange-400/10" },
    Critical: { color: "text-rose-500", bg: "bg-rose-500/10" },
};

const sriLankaRegions: Record<string, string[]> = {
    "Western": ["Colombo", "Gampaha", "Kalutara"],
    "Central": ["Kandy", "Matale", "Nuwara Eliya"],
    "Southern": ["Galle", "Matara", "Hambantota"],
    "Northern": ["Jaffna", "Kilinochchi", "Mannar", "Vavuniya", "Mullaitivu"],
    "Eastern": ["Batticaloa", "Ampara", "Trincomalee"],
    "North Western": ["Kurunegala", "Puttalam"],
    "North Central": ["Anuradhapura", "Polonnaruwa"],
    "Uva": ["Badulla", "Moneragala"],
    "Sabaragamuwa": ["Ratnapura", "Kegalle"]
};

interface RegionGeoinfo {
    lat: number;
    lng: number;
    zoom: number;
    radius: number;
}

const provinceGeoinfo: Record<string, RegionGeoinfo> = {
    "Western": { lat: 6.9000, lng: 79.9500, zoom: 10, radius: 40000 },
    "Central": { lat: 7.3500, lng: 80.6500, zoom: 10, radius: 45000 },
    "Southern": { lat: 6.1000, lng: 80.7000, zoom: 10, radius: 40000 },
    "Northern": { lat: 9.3000, lng: 80.4000, zoom: 9.5, radius: 60000 },
    "Eastern": { lat: 7.8000, lng: 81.5000, zoom: 9.5, radius: 65000 },
    "North Western": { lat: 7.8000, lng: 80.1000, zoom: 10, radius: 45000 },
    "North Central": { lat: 8.3300, lng: 80.4900, zoom: 9.5, radius: 55000 },
    "Uva": { lat: 7.0800, lng: 81.3400, zoom: 10, radius: 45000 },
    "Sabaragamuwa": { lat: 6.7000, lng: 80.5000, zoom: 10, radius: 40000 }
};

const districtGeoinfo: Record<string, RegionGeoinfo> = {
    "Colombo": { lat: 6.9355, lng: 79.8487, zoom: 12, radius: 15000 },
    "Gampaha": { lat: 7.0899, lng: 79.9994, zoom: 12, radius: 18000 },
    "Kalutara": { lat: 6.5793, lng: 79.9648, zoom: 12, radius: 20000 },
    "Kandy": { lat: 7.2906, lng: 80.6336, zoom: 12, radius: 22000 },
    "Matale": { lat: 7.4698, lng: 80.6217, zoom: 12, radius: 25000 },
    "Nuwara Eliya": { lat: 6.9708, lng: 80.7829, zoom: 12, radius: 20000 },
    "Galle": { lat: 6.0461, lng: 80.2103, zoom: 12, radius: 20000 },
    "Matara": { lat: 5.9485, lng: 80.5353, zoom: 12, radius: 18000 },
    "Hambantota": { lat: 6.1234, lng: 81.1205, zoom: 11.5, radius: 25000 },
    "Jaffna": { lat: 9.6685, lng: 80.0074, zoom: 12, radius: 18000 },
    "Kilinochchi": { lat: 9.3834, lng: 80.4002, zoom: 12, radius: 20000 },
    "Mannar": { lat: 8.9778, lng: 79.9093, zoom: 11.5, radius: 25000 },
    "Vavuniya": { lat: 8.7514, lng: 80.4971, zoom: 12, radius: 18000 },
    "Mullaitivu": { lat: 9.2236, lng: 80.7909, zoom: 11.5, radius: 25000 },
    "Batticaloa": { lat: 7.7102, lng: 81.6924, zoom: 12, radius: 22000 },
    "Ampara": { lat: 7.2975, lng: 81.6820, zoom: 11.5, radius: 30000 },
    "Trincomalee": { lat: 8.5778, lng: 81.2289, zoom: 12, radius: 22000 },
    "Kurunegala": { lat: 7.4839, lng: 80.3683, zoom: 11.5, radius: 30000 },
    "Puttalam": { lat: 8.0362, lng: 79.8283, zoom: 11.5, radius: 30000 },
    "Anuradhapura": { lat: 8.3122, lng: 80.4131, zoom: 11, radius: 35000 },
    "Polonnaruwa": { lat: 7.9329, lng: 81.0082, zoom: 11.5, radius: 25000 },
    "Badulla": { lat: 6.9802, lng: 81.0577, zoom: 11.5, radius: 25000 },
    "Moneragala": { lat: 6.8695, lng: 81.3454, zoom: 11, radius: 35000 },
    "Ratnapura": { lat: 6.6931, lng: 80.3995, zoom: 11.5, radius: 25000 },
    "Kegalle": { lat: 7.2515, lng: 80.3464, zoom: 12, radius: 20000 }
};

// Google Maps subcomponent
function GoogleMapContainer({
    reports,
    selectedReport,
    setSelectedReport,
    mapCenter,
    isSidebarCollapsed,
    selectedProvince,
    selectedDistrict,
}: {
    reports: Report[];
    selectedReport: Report | null;
    setSelectedReport: (report: Report | null) => void;
    mapCenter: [number, number];
    isSidebarCollapsed: boolean;
    selectedProvince: string;
    selectedDistrict: string;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [googleLoaded, setGoogleLoaded] = useState(false);
    const mapRef = useRef<any>(null);
    const markersRef = useRef<{ id: string; overlay: any; latlng: any; report: Report }[]>([]);
    const activeInfoWindowRef = useRef<any>(null);
    const highlightLayerRef = useRef<any>(null);

    // Dynamic Google Maps Script Loader
    useEffect(() => {
        if (typeof window === "undefined") return;

        const apiKey = process.env.NEXT_PUBLIC_MAPS_API_Key || "";
        if (!apiKey) {
            console.error("Google Maps API Key (NEXT_PUBLIC_MAPS_API_Key) is missing!");
            return;
        }

        if ((window as any).google && (window as any).google.maps) {
            setGoogleLoaded(true);
            return;
        }

        const scriptId = "google-maps-script";
        let script = document.getElementById(scriptId) as HTMLScriptElement;
        if (!script) {
            script = document.createElement("script");
            script.id = scriptId;
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initGoogleMap`;
            script.async = true;
            script.defer = true;
            (window as any).initGoogleMap = () => {
                setGoogleLoaded(true);
            };
            document.head.appendChild(script);
        } else {
            const interval = setInterval(() => {
                if ((window as any).google && (window as any).google.maps) {
                    setGoogleLoaded(true);
                    clearInterval(interval);
                }
            }, 100);
            return () => clearInterval(interval);
        }
    }, []);

    const darkThemeStyles = [
        { elementType: "geometry", stylers: [{ color: "#0d1f2d" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#0d1f2d" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#748899" }] },
        {
            featureType: "administrative.locality",
            elementType: "labels.text.fill",
            stylers: [{ color: "#a5b4fc" }],
        },
        {
            featureType: "poi",
            elementType: "labels.text.fill",
            stylers: [{ color: "#748899" }],
        },
        {
            featureType: "poi.park",
            elementType: "geometry",
            stylers: [{ color: "#11293d" }],
        },
        {
            featureType: "poi.park",
            elementType: "labels.text.fill",
            stylers: [{ color: "#546e85" }],
        },
        {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#193147" }],
        },
        {
            featureType: "road",
            elementType: "geometry.stroke",
            stylers: [{ color: "#112536" }],
        },
        {
            featureType: "road",
            elementType: "labels.text.fill",
            stylers: [{ color: "#748899" }],
        },
        {
            featureType: "road.highway",
            elementType: "geometry",
            stylers: [{ color: "#224260" }],
        },
        {
            featureType: "road.highway",
            elementType: "geometry.stroke",
            stylers: [{ color: "#193147" }],
        },
        {
            featureType: "road.highway",
            elementType: "labels.text.fill",
            stylers: [{ color: "#94a3b8" }],
        },
        {
            featureType: "transit",
            elementType: "geometry",
            stylers: [{ color: "#152e44" }],
        },
        {
            featureType: "transit.station",
            elementType: "labels.text.fill",
            stylers: [{ color: "#a5b4fc" }],
        },
        {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#06131f" }],
        },
        {
            featureType: "water",
            elementType: "labels.text.fill",
            stylers: [{ color: "#38bdf8" }],
        },
        {
            featureType: "water",
            elementType: "labels.text.stroke",
            stylers: [{ color: "#06131f" }],
        },
    ];

    const handleZoomIn = () => {
        if (!mapRef.current) return;
        const currentZoom = mapRef.current.getZoom();
        if (typeof currentZoom === "number") {
            mapRef.current.setZoom(currentZoom + 1);
        }
    };

    const handleZoomOut = () => {
        if (!mapRef.current) return;
        const currentZoom = mapRef.current.getZoom();
        if (typeof currentZoom === "number") {
            mapRef.current.setZoom(currentZoom - 1);
        }
    };

    useEffect(() => {
        if (!googleLoaded || !containerRef.current) return;

        const google = (window as any).google;
        const initialCenter = selectedReport
            ? { lat: selectedReport.coordinates.lat, lng: selectedReport.coordinates.lng }
            : { lat: mapCenter[0], lng: mapCenter[1] };

        const map = new google.maps.Map(containerRef.current, {
            center: initialCenter,
            zoom: 13,
            styles: darkThemeStyles,
            disableDefaultUI: true,
            zoomControl: false,
        });

        mapRef.current = map;
    }, [googleLoaded]);

    useEffect(() => {
        if (!googleLoaded || !mapRef.current) return;
        const google = (window as any).google;

        if (highlightLayerRef.current) {
            highlightLayerRef.current.setMap(null);
            highlightLayerRef.current = null;
        }

        let geoInfo: RegionGeoinfo | null = null;
        let regionName: string | null = null;
        let isDistrict = false;

        if (selectedDistrict && selectedDistrict !== "All") {
            geoInfo = districtGeoinfo[selectedDistrict];
            regionName = selectedDistrict;
            isDistrict = true;
        } else if (selectedProvince && selectedProvince !== "All") {
            geoInfo = provinceGeoinfo[selectedProvince];
            regionName = selectedProvince;
            isDistrict = false;
        }

        if (selectedReport) {
            mapRef.current.panTo({
                lat: selectedReport.coordinates.lat,
                lng: selectedReport.coordinates.lng,
            });
            if (mapRef.current.getZoom() < 14) {
                mapRef.current.setZoom(14);
            }
        } else if (geoInfo) {
            mapRef.current.panTo({ lat: geoInfo.lat, lng: geoInfo.lng });
            mapRef.current.setZoom(geoInfo.zoom);
        } else {
            mapRef.current.panTo({ lat: mapCenter[0], lng: mapCenter[1] });
            if (mapCenter[0] === 6.9271 && mapCenter[1] === 79.8612) {
                mapRef.current.setZoom(12);
            }
        }

        if (regionName && geoInfo) {
            const dataLayer = new google.maps.Data({ map: mapRef.current });

            dataLayer.setStyle({
                fillColor: "#14b8a6",
                fillOpacity: 0.15,
                strokeColor: "#2dd4bf",
                strokeOpacity: 0.8,
                strokeWeight: 2,
                clickable: false,
            });

            const encodedName = encodeURIComponent(
                isDistrict
                    ? `${regionName} District, Sri Lanka`
                    : `${regionName} Province, Sri Lanka`
            );

            fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodedName}&format=geojson&polygon_geojson=1&limit=1`,
                { headers: { "Accept-Language": "en" } }
            )
                .then((res) => res.json())
                .then((data) => {
                    if (data.features && data.features.length > 0) {
                        const feature = data.features[0];
                        if (
                            feature.geometry &&
                            (feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon")
                        ) {
                            dataLayer.addGeoJson({
                                type: "FeatureCollection",
                                features: [feature],
                            });
                            highlightLayerRef.current = dataLayer;

                            const bounds = new google.maps.LatLngBounds();
                            const coords = feature.geometry.type === "Polygon"
                                ? [feature.geometry.coordinates[0]]
                                : feature.geometry.coordinates.map((p: any) => p[0]);
                            coords.forEach((ring: any) => {
                                ring.forEach(([lng, lat]: [number, number]) => {
                                    bounds.extend({ lat, lng });
                                });
                            });
                            if (!selectedReport) {
                                mapRef.current.fitBounds(bounds, { padding: 40 });
                            }
                        } else {
                            dataLayer.setMap(null);
                        }
                    } else {
                        dataLayer.setMap(null);
                    }
                })
                .catch(() => {
                    dataLayer.setMap(null);
                });

            highlightLayerRef.current = dataLayer;
        }

        return () => {
            if (highlightLayerRef.current) {
                highlightLayerRef.current.setMap(null);
                highlightLayerRef.current = null;
            }
        };
    }, [googleLoaded, selectedReport, selectedProvince, selectedDistrict, mapCenter]);

    useEffect(() => {
        if (!googleLoaded || !mapRef.current) return;
        
        const timer = setTimeout(() => {
            const google = (window as any).google;
            if (google && google.maps) {
                google.maps.event.trigger(mapRef.current, "resize");
            }
            
            const centerTarget = selectedReport 
                ? { lat: selectedReport.coordinates.lat, lng: selectedReport.coordinates.lng }
                : { lat: mapCenter[0], lng: mapCenter[1] };
                
            mapRef.current.panTo(centerTarget);
        }, 320);

        return () => clearTimeout(timer);
    }, [isSidebarCollapsed, googleLoaded, selectedReport, mapCenter]);

    useEffect(() => {
        if (!googleLoaded || !mapRef.current) return;

        const google = (window as any).google;
        markersRef.current.forEach((item) => item.overlay.setMap(null));
        markersRef.current = [];

        if (activeInfoWindowRef.current) {
            activeInfoWindowRef.current.close();
            activeInfoWindowRef.current = null;
        }

        class CustomHTMLOverlay extends google.maps.OverlayView {
            private latlng: any;
            private html: string;
            private onClick: () => void;
            private div: HTMLDivElement | null = null;

            constructor(latlng: any, html: string, onClick: () => void) {
                super();
                this.latlng = latlng;
                this.html = html;
                this.onClick = onClick;
            }

            onAdd() {
                const div = document.createElement("div");
                div.className = "custom-google-marker";
                div.style.position = "absolute";
                div.style.cursor = "pointer";
                div.style.zIndex = "1000";
                div.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
                div.innerHTML = this.html;
                div.addEventListener("click", (e) => { e.stopPropagation(); this.onClick(); });
                this.div = div;
                const panes = this.getPanes();
                panes?.overlayMouseTarget.appendChild(div);
            }

            draw() {
                if (!this.div) return;
                const overlayProjection = this.getProjection();
                const position = overlayProjection.fromLatLngToDivPixel(this.latlng);
                if (position) {
                    this.div.style.left = (position.x - 20) + "px";
                    this.div.style.top = (position.y - 20) + "px";
                }
            }

            onRemove() {
                if (this.div && this.div.parentNode) {
                    this.div.parentNode.removeChild(this.div);
                    this.div = null;
                }
            }
        }

        reports.forEach((report) => {
            const isSelected = selectedReport?.id === report.id;
            const categoryInfo = categoryMeta[report.category] || { icon: "📍", color: "", bg: "" };
            const markerHtml = `
                <div class="relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                    isSelected
                        ? "scale-125 ring-4 ring-teal-500/30 bg-teal-500"
                        : "bg-[#0f2233] border border-white/20 shadow-xl"
                } shadow-lg group" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                    <span class="text-lg">${categoryInfo.icon}</span>
                </div>
            `;
            const latlng = new google.maps.LatLng(report.coordinates.lat, report.coordinates.lng);
            const handleMarkerClick = () => {
                setSelectedReport(report);
                if (activeInfoWindowRef.current) activeInfoWindowRef.current.close();
                const infoWindow = new google.maps.InfoWindow({
                    content: `<div class="p-2 min-w-[150px]"><div class="flex items-center gap-2 mb-1"><span class="text-xs font-bold text-white">${report.id}</span></div><p class="text-[11px] text-slate-300 mb-2">${report.location}</p></div>`,
                    pixelOffset: new google.maps.Size(0, -20),
                });
                infoWindow.open({ map: mapRef.current, shouldFocus: false });
                infoWindow.setPosition(latlng);
                activeInfoWindowRef.current = infoWindow;
            };
            const overlay = new CustomHTMLOverlay(latlng, markerHtml, handleMarkerClick);
            overlay.setMap(mapRef.current);
            markersRef.current.push({ id: report.id, overlay, latlng, report });
            if (isSelected) {
                const infoWindow = new google.maps.InfoWindow({
                    content: `<div class="p-2 min-w-[150px]"><div class="flex items-center gap-2 mb-1"><span class="text-xs font-bold text-white">${report.id}</span></div><p class="text-[11px] text-slate-300 mb-2">${report.location}</p></div>`,
                    pixelOffset: new google.maps.Size(0, -20),
                });
                infoWindow.open({ map: mapRef.current, shouldFocus: false });
                infoWindow.setPosition(latlng);
                activeInfoWindowRef.current = infoWindow;
            }
        });
    }, [reports, selectedReport, googleLoaded]);

    if (!process.env.NEXT_PUBLIC_MAPS_API_Key) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#0d1f2d] text-slate-400 p-6 text-center border border-white/5">
                <span className="text-3xl mb-2">⚠️</span>
                <p className="text-sm font-bold uppercase tracking-wider text-slate-200">Google Maps API Key Missing</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full relative">
            {!googleLoaded && (
                <div className="absolute inset-0 bg-[#0d1f2d] flex flex-col items-center justify-center text-slate-400 z-10">
                    <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mb-3" />
                    <p className="text-xs uppercase tracking-widest text-slate-500">Loading Google Maps...</p>
                </div>
            )}
            {googleLoaded && (
                <div className="absolute top-4 right-4 flex flex-col gap-1.5 z-20">
                    <button onClick={handleZoomIn} className="w-10 h-10 flex items-center justify-center bg-[#0f2233]/85 hover:bg-[#132d43]/90 hover:text-teal-400 border border-white/10 rounded-xl text-xl font-bold text-slate-200 shadow-xl transition-all active:scale-95 cursor-pointer backdrop-blur-md">＋</button>
                    <button onClick={handleZoomOut} className="w-10 h-10 flex items-center justify-center bg-[#0f2233]/85 hover:bg-[#132d43]/90 hover:text-teal-400 border border-white/10 rounded-xl text-xl font-bold text-slate-200 shadow-xl transition-all active:scale-95 cursor-pointer backdrop-blur-md">－</button>
                </div>
            )}
            <div ref={containerRef} className="w-full h-full" />
        </div>
    );
}

export default function MapView() {
    const [reports] = useState<Report[]>(reports_data);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [filter, setFilter] = useState<Report["category"] | "All">("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedProvince, setSelectedProvince] = useState<string>("All");
    const [selectedDistrict, setSelectedDistrict] = useState<string>("All");
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [loading] = useState(false);

    useEffect(() => {
        setSelectedDistrict("All");
        setSelectedReport(null);
    }, [selectedProvince]);

    useEffect(() => {
        setSelectedReport(null);
    }, [selectedDistrict]);

    const filteredReports = useMemo(() => {
        return reports.filter(r => {
            const matchesFilter = filter === "All" || r.category === filter;
            const matchesSearch = r.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.id?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesProvince = selectedProvince === "All" || r.province === selectedProvince;
            const matchesDistrict = selectedDistrict === "All" || r.district === selectedDistrict;
            return matchesFilter && matchesSearch && matchesProvince && matchesDistrict;
        });
    }, [reports, filter, searchQuery, selectedProvince, selectedDistrict]);

    const mapCenter: [number, number] = useMemo(() => {
        if (selectedReport) return [selectedReport.coordinates.lat, selectedReport.coordinates.lng];
        if (selectedDistrict !== "All") {
            const geo = districtGeoinfo[selectedDistrict];
            if (geo) return [geo.lat, geo.lng];
        }
        if (selectedProvince !== "All") {
            const geo = provinceGeoinfo[selectedProvince];
            if (geo) return [geo.lat, geo.lng];
        }
        return [6.9271, 79.8612];
    }, [selectedReport, selectedProvince, selectedDistrict, filteredReports]);

    return (
        <div className="h-full w-full flex flex-col md:flex-row md:overflow-hidden relative animate-slide-up" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
            <style jsx global>{`
                .gm-style, .gm-style-iw-c, .gm-style-iw-d, .custom-google-marker, .custom-google-marker * { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important; }
                .custom-google-marker:hover { transform: scale(1.15); z-index: 9999 !important; }
                .gm-style .gm-style-iw-c { background-color: #0f2233 !important; border: 1px solid rgba(255, 255, 255, 0.1) !important; border-radius: 12px !important; }
                .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.02); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(20, 184, 166, 0.2); border-radius: 10px; }
            `}</style>
            
            <div className={`flex flex-col bg-[#0f2233]/80 backdrop-blur-xl border border-white/5 rounded-2xl md:rounded-none overflow-hidden shadow-2xl z-[1000] flex-shrink-0 transition-all duration-300 ease-in-out ${
                isSidebarCollapsed 
                    ? 'h-0 opacity-0 pointer-events-none -translate-y-full md:h-full md:w-0 md:min-w-0 md:opacity-0 md:pointer-events-none md:-translate-x-full md:translate-y-0' 
                    : 'h-[320px] md:h-full w-full md:w-96 md:opacity-100 md:translate-x-0 md:translate-y-0'
            }`}>
                <div className="w-full md:w-[384px] h-full flex flex-col flex-shrink-0">
                    <div className="p-4 border-b border-white/5 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-white tracking-tight">Active Reports</h2>
                            <div className="flex items-center gap-2">
                                {loading && (
                                    <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                                )}
                                <button
                                    onClick={() => setIsSidebarCollapsed(true)}
                                    className="p-1.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg border border-white/5 hover:border-white/10 transition-all active:scale-95 cursor-pointer flex items-center justify-center"
                                    title="Collapse Sidebar"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-teal-500/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Find location or ID..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-teal-500/50 transition-all font-medium"
                        />
                    </div>

                    {/* Regional Dropdowns (Province & District) */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Province</label>
                            <select
                                value={selectedProvince}
                                onChange={(e) => setSelectedProvince(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500/50 transition-all font-medium appearance-none cursor-pointer"
                                style={{ backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2314b8a6' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.5rem center', backgroundSize: '1.25rem', backgroundRepeat: 'no-repeat', paddingRight: '1.75rem' }}
                            >
                                <option value="All" className="bg-[#0f2233] text-slate-200">All Provinces</option>
                                {Object.keys(sriLankaRegions).map((prov) => (
                                    <option key={prov} value={prov} className="bg-[#0f2233] text-slate-200">{prov}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">District</label>
                            <select
                                value={selectedDistrict}
                                onChange={(e) => setSelectedDistrict(e.target.value)}
                                disabled={selectedProvince === "All"}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium appearance-none cursor-pointer"
                                style={{ backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2314b8a6' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.5rem center', backgroundSize: '1.25rem', backgroundRepeat: 'no-repeat', paddingRight: '1.75rem' }}
                            >
                                <option value="All" className="bg-[#0f2233] text-slate-200">All Districts</option>
                                {selectedProvince !== "All" && sriLankaRegions[selectedProvince]?.map((dist) => (
                                    <option key={dist} value={dist} className="bg-[#0f2233] text-slate-200">{dist}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                        {["All", ...Object.keys(categoryMeta)].map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setFilter(cat as any)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all border ${filter === cat
                                    ? "bg-teal-500/20 border-teal-500/40 text-teal-400"
                                    : "bg-white/5 border-white/5 text-slate-400 hover:text-slate-300 hover:border-white/10"
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 p-3 custom-scrollbar">
                    {filteredReports.map((report) => {
                        const cat = categoryMeta[report.category];
                        const st = statusMeta[report.status];
                        const isSelected = selectedReport?.id === report.id;

                        return (
                            <button
                                key={report.id}
                                onClick={() => setSelectedReport(report)}
                                className={`w-full text-left p-3 rounded-xl border transition-all group ${isSelected
                                    ? "bg-teal-500/10 border-teal-500/30 ring-1 ring-teal-500/20 shadow-lg shadow-teal-900/10"
                                    : "bg-white/2 border-white/5 hover:border-white/10 hover:bg-white/5"
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${st.dot}`} />
                                        <span className="text-[10px] font-bold text-white tracking-tight">{report.id}</span>
                                    </div>
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${priorityMeta[report.priority]?.bg || 'bg-white/5'} ${priorityMeta[report.priority]?.color || 'text-slate-400'}`}>
                                        {report.priority}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg ${cat?.bg || 'bg-white/5'} flex items-center justify-center text-sm shadow-inner group-hover:scale-110 transition-transform`}>
                                        {cat?.icon || '📍'}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold text-slate-200 truncate">{report.location}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <p className="text-[10px] text-slate-400">{report.time}</p>
                                            {report.district && (
                                                <>
                                                    <span className="w-1 h-1 rounded-full bg-slate-600" />
                                                    <p className="text-[9px] font-bold text-teal-400 uppercase tracking-wider">{report.district}</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        );
                    })}

                    {!loading && filteredReports.length === 0 && (
                        <div className="py-20 text-center opacity-40">
                            <p className="text-2xl mb-2">📁</p>
                            <p className="text-xs text-slate-300 font-bold uppercase tracking-widest">No matching reports</p>
                            <p className="text-[10px] text-slate-500 mt-1">Check back later for updates</p>
                        </div>
                    )}
                </div>
                </div>
            </div>

            {isSidebarCollapsed && (
                <button
                    onClick={() => setIsSidebarCollapsed(false)}
                    className="absolute top-4 left-4 w-10 h-10 flex items-center justify-center bg-[#0f2233]/85 hover:bg-[#132d43]/90 hover:text-teal-400 border border-white/10 rounded-xl text-slate-200 shadow-xl transition-all active:scale-95 cursor-pointer backdrop-blur-md z-[1001] animate-in fade-in zoom-in-95 duration-200"
                    title="Expand Sidebar"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            )}

            {/* ── Main Map Area ── */}
            <div className="flex-1 min-h-[400px] bg-[#0d1f2d] md:rounded-none rounded-2xl overflow-hidden md:border-none border border-white/10 relative z-10 shadow-inner">
                
                <GoogleMapContainer
                    reports={filteredReports}
                    selectedReport={selectedReport}
                    setSelectedReport={setSelectedReport}
                    mapCenter={mapCenter}
                    isSidebarCollapsed={isSidebarCollapsed}
                    selectedProvince={selectedProvince}
                    selectedDistrict={selectedDistrict}
                />

                {/* Info BarHUD */}
                <div className={`absolute top-4 ${
                    isSidebarCollapsed ? 'left-16' : 'left-4'
                } px-3 py-1.5 bg-black/50 backdrop-blur-md border border-white/10 rounded-full text-[9px] font-mono text-slate-300 flex items-center gap-3 shadow-lg pointer-events-none z-[1000] transition-all duration-300`}>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" /> MAP HUB</span>
                    <span className="w-px h-2 bg-white/20" />
                    <span>GOOGLE MAPS API</span>
                    <span className="w-px h-2 bg-white/20" />
                    <span>TARGET: {filteredReports.length} NODES</span>
                </div>

                {/* Selection Details Panel overlay - Fixed positioning */}
                {selectedReport && (
                    <div className="absolute bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 sm:max-w-sm bg-[#0f2233]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden animate-in slide-in-from-bottom-10 sm:slide-in-from-right-10 duration-500 z-[1000]">
                        <div className="p-5 flex gap-4">
                            <div className={`w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center text-2xl shadow-inner ${categoryMeta[selectedReport.category]?.bg || 'bg-white/5'}`}>
                                {categoryMeta[selectedReport.category]?.icon || '📍'}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-base font-bold text-white tracking-tight">{selectedReport.id}</h3>
                                        <p className="text-xs text-slate-400 font-medium truncate">{selectedReport.location}</p>
                                    </div>
                                    <button onClick={() => setSelectedReport(null)} className="p-1 text-slate-500 hover:text-white transition-colors">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>

                                <div className="mt-4 flex gap-3">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusMeta[selectedReport.status]?.bg} ${statusMeta[selectedReport.status]?.color}`}>
                                        {selectedReport.status}
                                    </span>
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${priorityMeta[selectedReport.priority]?.bg} ${priorityMeta[selectedReport.priority]?.color}`}>
                                        {selectedReport.priority}
                                    </span>
                                </div>

                                <p className="mt-4 text-xs text-slate-300 leading-relaxed italic line-clamp-2 pr-2 opacity-80 uppercase tracking-tight font-medium">"{selectedReport.description}"</p>

                                <div className="mt-6 flex gap-2">
                                    <button className="flex-1 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:brightness-110 text-white text-[10px] font-bold rounded-xl transition-all shadow-lg shadow-teal-900/40 active:scale-[0.98] uppercase tracking-widest">
                                        Open Management
                                    </button>
                                    <button className="px-4 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[10px] font-bold rounded-xl transition-all uppercase tracking-widest">
                                        Share
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
