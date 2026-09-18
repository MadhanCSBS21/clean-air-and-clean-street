import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function MapView({ reports }) {
  const defaultLat = reports.length > 0 && reports[0].latitude ? reports[0].latitude : 13.0827;
  const defaultLng = reports.length > 0 && reports[0].longitude ? reports[0].longitude : 80.2707;

  return (
    <div style={{ height: '350px', width: '100%', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginBottom: '25px' }}>
      <MapContainer center={[defaultLat, defaultLng]} zoom={11} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {reports.map((rep) =>
          rep.latitude && rep.longitude ? (
            <Marker key={rep.id} position={[rep.latitude, rep.longitude]}>
              <Popup>
                <div style={{ fontFamily: 'sans-serif' }}>
                  <h4 style={{ margin: '0 0 5px 0', color: '#047857' }}>#{rep.id} - {rep.pollution_type}</h4>
                  <p style={{ margin: '0 0 5px 0', fontSize: '13px' }}>{rep.description}</p>
                  <small style={{ color: rep.severity === 'High' ? '#ef4444' : '#f59e0b', fontWeight: 'bold' }}>
                    Severity: {rep.severity}
                  </small>
                </div>
              </Popup>
            </Marker>
          ) : null
        )}
      </MapContainer>
    </div>
  );
}