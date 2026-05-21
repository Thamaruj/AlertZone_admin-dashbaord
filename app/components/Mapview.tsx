"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { MOCK_REPORTS as reports_data, Report } from "@/app/data/mockData";

const categoryMeta: Record<Report["category"], { color: string; bg: string; icon: string }> = {
    Hazard: { color: "text-rose-400", bg: "bg-rose-500/10", icon: "⚠️" },
    Lighting: { color: "text-yellow-400", bg: "bg-yellow-500/10", icon: "💡" },
    Waste: { color: "text-green-400", bg: "bg-green-500/10", icon: "🗑️" },
    Roads: { color: "text-blue-400", bg: "bg-blue-500/10", icon: "🚧" },
    Water: { color: "text-sky-400", bg: "bg-sky-500/10", icon: "💧" },
    Safety: { color: "text-violet-400", bg: "bg-violet-500/10", icon: "🛡️" },
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

// Google Maps subcomponent
function GoogleMapContainer({
    reports,
    selectedReport,
    setSelectedReport,
    mapCenter,
}: {
    reports: Report[];
    selectedReport: Report | null;
    setSelectedReport: (report: Report | null) => void;
    mapCenter: [number, number];
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [googleLoaded, setGoogleLoaded] = useState(false);
    const mapRef = useRef<any>(null);
    const markersRef = useRef<{ id: string; overlay: any; latlng: any; report: Report }[]>([]);
    const activeInfoWindowRef = useRef<any>(null);

    // Dynamic Google Maps Script Loader
    useEffect(() => {
        if (typeof window === "undefined") return;

        const apiKey = process.env.NEXT_PUBLIC_MAPS_API_Key || "";
        if (!apiKey) {
            console.error("Google Maps API Key (NEXT_PUBLIC_MAPS_API_Key) is missing!");
            return;
        }

        // If already loaded globally
        if ((window as any).google && (window as any).google.maps) {
            setGoogleLoaded(true);
            return;
        }

        // Check if script tag is already injected by another render instance
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
            // Script tag exists, poll until window.google.maps is available
            const interval = setInterval(() => {
                if ((window as any).google && (window as any).google.maps) {
                    setGoogleLoaded(true);
                    clearInterval(interval);
                }
            }, 100);
            return () => clearInterval(interval);
        }
    }, []);

    // Custom Dark Mode Map Styles for Google Maps
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

    // Initialize Map
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
            zoomControl: true,
            zoomControlOptions: {
                position: google.maps.ControlPosition.RIGHT_TOP,
            },
        });

        mapRef.current = map;
    }, [googleLoaded]);

    // Handle selectedReport changes (Pan and Zoom)
    useEffect(() => {
        if (!googleLoaded || !mapRef.current) return;

        if (selectedReport) {
            mapRef.current.panTo({
                lat: selectedReport.coordinates.lat,
                lng: selectedReport.coordinates.lng,
            });
            if (mapRef.current.getZoom() < 14) {
                mapRef.current.setZoom(14);
            }
        }
    }, [selectedReport, googleLoaded]);

    // Handle mapCenter changes (from filtering)
    useEffect(() => {
        if (!googleLoaded || !mapRef.current || selectedReport) return;
        mapRef.current.panTo({
            lat: mapCenter[0],
            lng: mapCenter[1]
        });
    }, [mapCenter, googleLoaded, selectedReport]);

    // Render / Update Markers dynamically
    useEffect(() => {
        if (!googleLoaded || !mapRef.current) return;

        const google = (window as any).google;

        // Clear existing overlays
        markersRef.current.forEach((item) => item.overlay.setMap(null));
        markersRef.current = [];

        if (activeInfoWindowRef.current) {
            activeInfoWindowRef.current.close();
            activeInfoWindowRef.current = null;
        }

        // Define CustomHTMLOverlay dynamically inside useEffect so it has direct scope of the loaded google instance
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

                div.addEventListener("click", (e) => {
                    e.stopPropagation();
                    this.onClick();
                });

                this.div = div;
                const panes = this.getPanes();
                panes?.overlayMouseTarget.appendChild(div);
            }

            draw() {
                if (!this.div) return;
                const overlayProjection = this.getProjection();
                const position = overlayProjection.fromLatLngToDivPixel(this.latlng);
                if (position) {
                    this.div.style.left = (position.x - 20) + "px"; // center it
                    this.div.style.top = (position.y - 20) + "px";  // center it
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

            // Handler for click
            const handleMarkerClick = () => {
                setSelectedReport(report);

                if (activeInfoWindowRef.current) {
                    activeInfoWindowRef.current.close();
                }

                const infoWindow = new google.maps.InfoWindow({
                    content: `
                        <div class="p-2 min-w-[150px]" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                            <div class="flex items-center gap-2 mb-1">
                                <span class="text-xs font-bold text-white">${report.id}</span>
                            </div>
                            <p class="text-[11px] text-slate-300 mb-2">${report.location}</p>
                            <button class="w-full py-1.5 bg-teal-500 rounded text-[10px] font-bold text-white uppercase tracking-widest pointer-events-none">Details View</button>
                        </div>
                    `,
                    pixelOffset: new google.maps.Size(0, -20),
                });

                infoWindow.open({
                    map: mapRef.current,
                    shouldFocus: false,
                });
                infoWindow.setPosition(latlng);
                activeInfoWindowRef.current = infoWindow;
            };

            const overlay = new CustomHTMLOverlay(latlng, markerHtml, handleMarkerClick);
            overlay.setMap(mapRef.current);

            markersRef.current.push({ id: report.id, overlay, latlng, report });

            // If selected report, trigger InfoWindow popup automatically
            if (isSelected) {
                const infoWindow = new google.maps.InfoWindow({
                    content: `
                        <div class="p-2 min-w-[150px]" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                            <div class="flex items-center gap-2 mb-1">
                                <span class="text-xs font-bold text-white">${report.id}</span>
                            </div>
                            <p class="text-[11px] text-slate-300 mb-2">${report.location}</p>
                            <button class="w-full py-1.5 bg-teal-500 rounded text-[10px] font-bold text-white uppercase tracking-widest pointer-events-none">Details View</button>
                        </div>
                    `,
                    pixelOffset: new google.maps.Size(0, -20),
                });

                infoWindow.open({
                    map: mapRef.current,
                    shouldFocus: false,
                });
                infoWindow.setPosition(latlng);
                activeInfoWindowRef.current = infoWindow;
            }
        });
    }, [reports, selectedReport, googleLoaded]);

    if (!process.env.NEXT_PUBLIC_MAPS_API_Key) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#0d1f2d] text-slate-400 p-6 text-center border border-white/5" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
                <span className="text-3xl mb-2">⚠️</span>
                <p className="text-sm font-bold uppercase tracking-wider text-slate-200">Google Maps API Key Missing</p>
                <p className="text-xs text-slate-500 mt-1 max-w-md">Please specify NEXT_PUBLIC_MAPS_API_Key in your .env.local configuration file.</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full relative">
            {!googleLoaded && (
                <div className="absolute inset-0 bg-[#0d1f2d] flex flex-col items-center justify-center text-slate-400 z-10" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
                    <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mb-3" />
                    <p className="text-xs uppercase tracking-widest text-slate-500">Loading Google Maps...</p>
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
    const [loading] = useState(false);

    // Reset district when province changes
    useEffect(() => {
        setSelectedDistrict("All");
    }, [selectedProvince]);

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
        if (selectedReport) {
            return [selectedReport.coordinates.lat, selectedReport.coordinates.lng];
        }
        if (filteredReports.length > 0) {
            return [filteredReports[0].coordinates.lat, filteredReports[0].coordinates.lng];
        }
        return [6.9271, 79.8612]; // Default Colombo
    }, [selectedReport, filteredReports]);

    return (
        <div className="h-auto md:flex-1 w-full flex flex-col md:flex-row gap-4 md:gap-0 animate-slide-up" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>

            <style jsx global>{`
                /* Google Maps Overrides and Professional Font Enforcements */
                .gm-style, .gm-style-iw-c, .gm-style-iw-d, .custom-google-marker, .custom-google-marker * {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
                }
                .custom-google-marker {
                    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                .custom-google-marker:hover {
                    transform: scale(1.15);
                    z-index: 9999 !important;
                }
                .gm-style .gm-style-iw-c {
                    background-color: #0f2233 !important;
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                    border-radius: 12px !important;
                    padding: 0 !important;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5) !important;
                }
                .gm-style .gm-style-iw-tc::after {
                    background: #0f2233 !important;
                }
                .gm-style .gm-style-iw-d {
                    overflow: hidden !important;
                    max-height: none !important;
                }
                .gm-ui-hover-effect {
                    top: 4px !important;
                    right: 4px !important;
                    color: white !important;
                    background: rgba(255,255,255,0.05) !important;
                    border-radius: 50% !important;
                    width: 20px !important;
                    height: 20px !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                }
                .gm-ui-hover-effect span {
                    margin: 0 !important;
                }
            `}</style>

            {/* ── Left Sidebar: Report List ── */}
            <div className="w-full md:w-96 h-[320px] md:h-full flex flex-col bg-[#0f2233]/80 backdrop-blur-xl border border-white/5 rounded-2xl md:rounded-none overflow-hidden shadow-2xl z-[1000] flex-shrink-0">
                <div className="p-4 border-b border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-tight">Active Reports</h2>
                            <p className="text-[10px] text-teal-400 font-bold uppercase tracking-widest mt-1">Live from Firebase</p>
                        </div>
                        {loading && (
                            <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                        )}
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

            {/* ── Main Map Area ── */}
            <div className="flex-1 min-h-[400px] bg-[#0d1f2d] md:rounded-none rounded-2xl overflow-hidden md:border-none border border-white/10 relative z-10 shadow-inner">
                
                <GoogleMapContainer
                    reports={filteredReports}
                    selectedReport={selectedReport}
                    setSelectedReport={setSelectedReport}
                    mapCenter={mapCenter}
                />

                {/* Info BarHUD */}
                <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/50 backdrop-blur-md border border-white/10 rounded-full text-[9px] font-mono text-slate-300 flex items-center gap-3 shadow-lg pointer-events-none z-[1000]">
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
