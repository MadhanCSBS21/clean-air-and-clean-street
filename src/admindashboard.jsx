import React, { useState, useEffect } from 'react';

const DEPARTMENTS = [
  'Garbage Management',
  'Air Quality Control',
  'Water Resources',
  'Urban Infrastructure',
  'All'
];

export default function AdminDashboard({ onBack }) {
  const [activeDept, setActiveDept] = useState('Garbage Management');
  const [reports, setReports] = useState([]);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [proofImage, setProofImage] = useState('');
  const [notes, setNotes] = useState('');

  const fetchReports = async () => {
    try {
      const url = activeDept === 'All'
        ? 'http://localhost:5001/api/reports'
        : `http://localhost:5001/api/reports?department=${encodeURIComponent(activeDept)}`;
      const res = await fetch(url);
      const data = await res.json();
      setReports(data.reports || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [activeDept]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProofImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!proofImage) return alert('Please upload completion proof image!');

    await fetch(`http://localhost:5001/api/reports/${selectedReportId}/resolve`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolutionImage: proofImage, notes }),
    });

    setSelectedReportId(null);
    setProofImage('');
    setNotes('');
    fetchReports();
  };

  return (
    <div style={{ width: '100vw', minHeight: '100vh', background: '#0f172a', color: '#f8fafc', fontFamily: 'Inter, sans-serif', padding: '24px', boxSizing: 'border-box' }}>
      
      {/* Top Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#34d399', margin: 0 }}>🏢 I Keep My Terra Clean — Control Center</h1>
          <p style={{ color: '#94a3b8', margin: '4px 0 0 0', fontSize: '13px' }}>Department Action & Verification Dashboard</p>
        </div>
        <button onClick={onBack} style={{ padding: '10px 20px', background: '#34d399', color: '#022c22', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
          ← Back to Citizen Hub
        </button>
      </div>

      {/* Department Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', overflowX: 'auto' }}>
        {DEPARTMENTS.map((dept) => (
          <button
            key={dept}
            onClick={() => setActiveDept(dept)}
            style={{
              padding: '12px 20px',
              borderRadius: '10px',
              border: '1px solid #334155',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '13px',
              background: activeDept === dept ? '#10b981' : '#1e293b',
              color: activeDept === dept ? '#022c22' : '#94a3b8',
            }}
          >
            {dept === 'All' ? '🌐 All Departments' : dept}
          </button>
        ))}
      </div>

      {/* Incident List */}
      <div style={{ background: '#1e293b', borderRadius: '16px', border: '1px solid #334155', padding: '20px' }}>
        <h3 style={{ marginTop: 0, color: '#f8fafc' }}>{activeDept} Operations ({reports.length} Tickets)</h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {reports.map((rep) => (
            <div key={rep.id} style={{ border: '1px solid #334155', borderRadius: '12px', padding: '16px', background: '#0f172a' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontWeight: 'bold', color: '#f8fafc' }}>#{rep.id} - {rep.pollution_type}</span>
                <span style={{ fontSize: '12px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '6px', background: rep.status === 'Resolved' ? '#064e3b' : '#78350f', color: rep.status === 'Resolved' ? '#6ee7b7' : '#fde68a' }}>
                  {rep.status}
                </span>
              </div>

              {/* Photos Comparison */}
              <div style={{ display: 'grid', gridTemplateColumns: rep.resolution_image ? '1fr 1fr' : '1fr', gap: '8px', marginBottom: '12px' }}>
                <div>
                  <small style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold' }}>ISSUE PHOTO</small>
                  {rep.incident_image ? (
                    <img src={rep.incident_image} alt="Reported" style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '8px' }} />
                  ) : (
                    <div style={{ height: '110px', background: '#1e293b', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '12px' }}>No Photo</div>
                  )}
                </div>

                {rep.resolution_image && (
                  <div>
                    <small style={{ fontSize: '10px', color: '#34d399', fontWeight: 'bold' }}>WORKER PROOF</small>
                    <img src={rep.resolution_image} alt="Resolved" style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #10b981' }} />
                  </div>
                )}
              </div>

              <p style={{ fontSize: '12px', color: '#cbd5e1', margin: '0 0 8px 0' }}>{rep.description}</p>
              <small style={{ color: '#64748b' }}>📍 {rep.location_name}</small>

              <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {rep.status !== 'Resolved' ? (
                  <button
                    onClick={() => setSelectedReportId(rep.id)}
                    style={{ padding: '8px 14px', background: '#10b981', color: '#022c22', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}
                  >
                    👷 Complete & Upload Proof
                  </button>
                ) : (
                  <span style={{ fontSize: '12px', color: '#34d399', fontWeight: 'bold' }}>✅ Resolution Verified</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Completion Modal */}
      {selectedReportId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <form onSubmit={handleResolveSubmit} style={{ background: '#1e293b', padding: '24px', borderRadius: '16px', border: '1px solid #334155', width: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: 0, color: '#f8fafc' }}>👷 Submit Resolution Proof</h3>
            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>Upload completed site image for Ticket #{selectedReportId}</p>

            <input type="file" accept="image/*" capture="environment" required onChange={handleImageUpload} style={{ padding: '8px', border: '1px dashed #475569', borderRadius: '8px', color: '#cbd5e1' }} />

            {proofImage && <img src={proofImage} alt="Preview" style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px' }} />}

            <textarea placeholder="Worker Notes / Work performed" value={notes} onChange={(e) => setNotes(e.target.value)} style={{ padding: '10px', borderRadius: '8px', background: '#0f172a', border: '1px solid #334155', color: '#fff' }} />

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setSelectedReportId(null)} style={{ padding: '10px 16px', background: '#334155', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}>Cancel</button>
              <button type="submit" style={{ padding: '10px 16px', background: '#10b981', color: '#022c22', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Mark Resolved</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}