"use client";

import { useEffect, useRef, useState } from "react";
import { Report } from "@/lib/types/report";

export default function MiniMap({ report }: { report: Report }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const [googleLoaded, setGoogleLoaded] = useState(false);

    useEffect(() => {
        if ((window as any).google) {
            setGoogleLoaded(true);
            return;
        }

        const scriptId = "google-maps-script";
        if (!document.getElementById(scriptId)) {
            const script = document.createElement("script");
            script.id = scriptId;
            script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_MAPS_API_Key}&libraries=places,marker`;
            script.async = true;
            script.defer = true;
            script.onload = () => setGoogleLoaded(true);
            document.head.appendChild(script);
        } else {
            // Script is already loading, just wait a bit (or could use an interval/event listener, but standard map loads fast)
            const interval = setInterval(() => {
                if ((window as any).google) {
                    setGoogleLoaded(true);
                    clearInterval(interval);
                }
            }, 500);
            return () => clearInterval(interval);
        }
    }, []);

    useEffect(() => {
        if (!googleLoaded || !containerRef.current) return;
        if (!report.location?.latitude || !report.location?.longitude) return;

        const google = (window as any).google;
        const center = { lat: report.location.latitude, lng: report.location.longitude };

        if (!mapRef.current) {
            mapRef.current = new google.maps.Map(containerRef.current, {
                center,
                zoom: 16,
                disableDefaultUI: true,
                zoomControl: true,
                mapTypeId: "roadmap",
                styles: [
                    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                    { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
                    { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
                    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
                    { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
                    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
                ]
            });

            markerRef.current = new google.maps.Marker({
                position: center,
                map: mapRef.current,
                title: report.category,
            });
        } else {
            mapRef.current.panTo(center);
            if (markerRef.current) {
                markerRef.current.setPosition(center);
            }
        }
    }, [report, googleLoaded]);

    return (
        <div ref={containerRef} className="absolute inset-0 z-0" />
    );
}
