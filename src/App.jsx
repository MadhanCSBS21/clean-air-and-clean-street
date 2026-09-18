import React, { useState, useEffect } from 'react';
import { 
  Sun, Moon, ShieldAlert, Award, FileText, 
  Navigation, Users, CheckCircle, Clock, 
  MapPin, Wind, Sparkles, Trash2, UploadCloud,
  ThumbsUp, Eye, Sparkle, X, ImagePlus, RefreshCw
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie,
  LineChart, Line, CartesianGrid
} from 'recharts';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const TAMIL_NADU_DISTRICTS = [
  "All Districts", "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri",
  "Dindigul", "Erode", "Kallakurichi", "Kanchipuram", "Kanyakumari", "Karur",
  "Krishnagiri", "Madurai", "Mayiladuthurai", "Nagapattinam", "Namakkal", "Nilgiris",
  "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet", "Salem", "Sivaganga",
  "Tenkasi", "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli",
  "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore",
  "Viluppuram", "Virudhunagar"
];

const WASTE_CATEGORIES = [
  { id: "plastic", label: "Plastic & Street Waste" },
  { id: "illegal_dumping", label: "Illegal Garbage Dumping" },
  { id: "toxic_burning", label: "Open Plastic / Trash Burning" },
  { id: "water_pollution", label: "Street Drain & Canal Pollution" }
];

const DEPARTMENTS = [
  { 
    id: "sanitation", 
    name: "Clean Street & Waste Management", 
    teams: ["Street Patrol Alpha", "Rapid Garbage Clearance", "Night Clean Unit"]
  },
  { 
    id: "pollution_control", 
    name: "Clean Air & Anti-Pollution Squad", 
    teams: ["Air Quality Patrol", "Anti-Smoke Patrol"]
  },
  { 
    id: "water_conservation", 
    name: "Drainage & Water Protection", 
    teams: ["Drainage Patrol", "Water Quality Unit"]
  }
];

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState("client");
  const [selectedAdminDistrict, setSelectedAdminDistrict] = useState("All Districts");
  const [selectedDepartmentTab, setSelectedDepartmentTab] = useState("all");
  const [selectedDistrict, setSelectedDistrict] = useState("Tiruchirappalli");
  
  const [ecoPoints, setEcoPoints] = useState(145);
  const [cleanedAreaSqFt, setCleanedAreaSqFt] = useState(0);

  const [fullName, setFullName] = useState("");
  const [wasteCategory, setWasteCategory] = useState("plastic");
  const [department, setDepartment] = useState("sanitation");
  const [priority, setPriority] = useState("Medium");
  const [location, setLocation] = useState("");
  const [liveCoords, setLiveCoords] = useState({ lat: 10.7905, lng: 78.7047 });
  const [isLocating, setIsLocating] = useState(false);
  const [description, setDescription] = useState("");
  const [userImage, setUserImage] = useState(null);
  const [fileName, setFileName] = useState("");

  const [incidents, setIncidents] = useState([]);
  const [completionTargetId, setCompletionTargetId] = useState(null);
  const [completionImage, setCompletionImage] = useState(null);
  const [completionFileName, setCompletionFileName] = useState("");
  const [completionNotes, setCompletionNotes] = useState("");
  const [completionError, setCompletionError] = useState("");
  const [isCompleting, setIsCompleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      const response = await fetch(`${API_BASE}/incidents`);
      if (response.ok) {
        const data = await response.json();
        const formattedData = data.map(item => ({
          ...item,
          upvotes: item.upvotes || 1,
          userImage: item.userImage || null,
          coords: { lat: parseFloat(item.lat) || 10.7905, lng: parseFloat(item.lng) || 78.7047 }
        }));
        setIncidents(formattedData);
      }
    } catch (err) {
      console.error("Error fetching incidents:", err);
    }
  };

  const refreshPatrolHub = async () => {
    setIsRefreshing(true);
    await fetchIncidents();
    setIsRefreshing(false);
  };

  const updateDistrictFromCoords = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      
      if (data && data.address) {
        const detectedDistrict = data.address.state_district || data.address.county || data.address.city || "";
        const matched = TAMIL_NADU_DISTRICTS.find(d => 
          detectedDistrict.toLowerCase().includes(d.toLowerCase()) || d.toLowerCase().includes(detectedDistrict.toLowerCase())
        );
        if (matched && matched !== "All Districts") {
          setSelectedDistrict(matched);
        }
        const landmark = data.address.suburb || data.address.neighbourhood || data.address.road || data.display_name.split(",")[0];
        if (landmark) setLocation(landmark);
      }
    } catch (err) {
      console.error("Reverse geocoding error:", err);
    }
  };

  function LocationMarker() {
    useMapEvents({
      click(e) {
        const newCoords = { lat: e.latlng.lat, lng: e.latlng.lng };
        setLiveCoords(newCoords);
        updateDistrictFromCoords(e.latlng.lat, e.latlng.lng);
      },
    });

    return liveCoords ? <Marker position={[liveCoords.lat, liveCoords.lng]} /> : null;
  }

  function MapLocationUpdater({ coords }) {
    const map = useMap();

    useEffect(() => {
      map.setView([coords.lat, coords.lng], Math.max(map.getZoom(), 14), { animate: true });
    }, [map, coords.lat, coords.lng]);

    return null;
  }

  const captureLiveLocation = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setLiveCoords(coords);
          updateDistrictFromCoords(coords.lat, coords.lng);
          setIsLocating(false);
        },
        () => {
          alert("Unable to retrieve live location.");
          setIsLocating(false);
        }
      );
    } else {
      alert("Geolocation is not supported.");
      setIsLocating(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !location.trim() || isSubmitting) return;

    setIsSubmitting(true);

    const newIncident = {
      id: Date.now(),
      fullName,
      wasteCategory,
      department,
      priority,
      location,
      district: selectedDistrict,
      description,
      userImage: userImage,
      upvotes: 1,
      status: "Not Started",
      progressPct: 0,
      assignedTeam: "Unassigned",
      coords: { lat: liveCoords.lat.toFixed(4), lng: liveCoords.lng.toFixed(4) },
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    try {
      const response = await fetch(`${API_BASE}/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIncident)
      });

      if (!response.ok) throw new Error('Unable to submit the report. Please try again.');
      await fetchIncidents();
      setEcoPoints(prev => prev + 25);
      setFullName("");
      setLocation("");
      setDescription("");
      setUserImage(null);
      setFileName("");
    } catch (err) {
      console.error("Error submitting incident:", err);
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpvote = async (id) => {
    const inc = incidents.find(i => i.id === id);
    if (!inc) return;

    const newVotes = (inc.upvotes || 1) + 1;
    const autoEscalate = newVotes >= 5 ? "Critical Clean Hazard" : inc.priority;

    try {
      await fetch(`${API_BASE}/incidents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ upvotes: newVotes, priority: autoEscalate })
      });
      fetchIncidents();
    } catch (err) {
      console.error("Error logging upvote:", err);
    }
  };

  const handleCompletionImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setCompletionError('Please select an image file.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setCompletionError('Completion images must be smaller than 8 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setCompletionImage(reader.result);
      setCompletionFileName(file.name);
      setCompletionError("");
    };
    reader.readAsDataURL(file);
  };

  const openCompletionModal = (id) => {
    setCompletionTargetId(id);
    setCompletionImage(null);
    setCompletionFileName("");
    setCompletionNotes("");
    setCompletionError("");
  };

  const closeCompletionModal = () => {
    if (isCompleting) return;
    setCompletionTargetId(null);
    setCompletionImage(null);
    setCompletionFileName("");
    setCompletionNotes("");
    setCompletionError("");
  };

  const submitCompletion = async (e) => {
    e.preventDefault();
    if (!completionImage) {
      setCompletionError('Upload a work-completed image before marking this issue resolved.');
      return;
    }

    setIsCompleting(true);
    setCompletionError("");
    const saved = await updateIncidentStatus(completionTargetId, "Resolved", 100, completionImage, completionNotes);
    if (saved) {
      const deleted = await handleDeleteIncident(completionTargetId);
      if (!deleted) {
        setCompletionError('Work proof was saved, but the completed report could not be removed. Please try again.');
      } else {
        closeCompletionModal();
      }
    }
    setIsCompleting(false);
  };

  const handleAssignTeam = async (id, teamName) => {
    const incident = incidents.find(i => i.id === id);
    if (!incident) return;

    const updatedData = {
      assignedTeam: teamName,
      status: incident.status === "Not Started" ? "In Progress" : incident.status,
      progressPct: incident.status === "Not Started" ? 35 : incident.progressPct,
    };

    try {
      await fetch(`${API_BASE}/incidents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      fetchIncidents();
    } catch (err) {
      console.error("Error updating assigned team:", err);
    }
  };

  const updateIncidentStatus = async (id, newStatus, progress, proofUrl = null, resolutionNotes = "") => {
    const incident = incidents.find(i => i.id === id);
    if (!incident) return;
    if (newStatus === "Resolved" && !proofUrl && !incident.adminProofUrl) {
      setCompletionError('A completed-work image is required before resolving an issue.');
      return;
    }

    const updatedData = {
      status: newStatus,
      progressPct: progress,
      adminProofUrl: proofUrl || incident.adminProofUrl,
      resolutionNotes
    };

    try {
      const response = await fetch(`${API_BASE}/incidents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      if (!response.ok) throw new Error('Unable to update the issue.');
      if (newStatus === "Resolved" && incident.status !== "Resolved") {
        setCleanedAreaSqFt(prev => prev + 150);
        setEcoPoints(prev => prev + 50);
      }
      await fetchIncidents();
      return true;
    } catch (err) {
      console.error("Error updating incident status:", err);
      setCompletionError(err.message);
      return false;
    }
  };

  const handleDeleteIncident = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/incidents/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await fetchIncidents();
        return true;
      }
    } catch (err) {
      console.error("Error deleting record:", err);
    }
    return false;
  };

  const adminFilteredIncidents = incidents.filter(i => {
    const matchesDistrict = selectedAdminDistrict === "All Districts" || i.district === selectedAdminDistrict;
    const matchesDept = selectedDepartmentTab === "all" || i.department === selectedDepartmentTab;
    return matchesDistrict && matchesDept;
  });

  const districtChartData = TAMIL_NADU_DISTRICTS.filter(d => d !== "All Districts").map(dist => ({
    name: dist,
    count: incidents.filter(i => i.district === dist).length
  })).filter(d => d.count > 0);

  const statusPieData = [
    { name: "Active Hazards", value: adminFilteredIncidents.filter(i => i.status === "Not Started").length, color: "#f59e0b" },
    { name: "Work In Progress", value: adminFilteredIncidents.filter(i => i.status === "In Progress").length, color: "#6366f1" },
    { name: "Cleaned & Restored", value: adminFilteredIncidents.filter(i => i.status === "Resolved").length, color: "#10b981" }
  ].filter(d => d.value > 0);

  const seriousnessChartData = [...adminFilteredIncidents]
    .sort((a, b) => (b.upvotes || 1) - (a.upvotes || 1))
    .slice(0, 6)
    .map(incident => ({
      name: incident.location?.slice(0, 16) || `#${incident.id}`,
      votes: incident.upvotes || 1
    }));

  const patrolMetrics = {
    total: adminFilteredIncidents.length,
    unresolved: adminFilteredIncidents.filter(i => i.status !== "Resolved").length,
    critical: adminFilteredIncidents.filter(i => (i.upvotes || 1) >= 5 || i.priority === "Critical Clean Hazard").length,
    completionRate: adminFilteredIncidents.length
      ? Math.round((adminFilteredIncidents.filter(i => i.status === "Resolved").length / adminFilteredIncidents.length) * 100)
      : 0
  };

  const themeClass = darkMode ? "bg-[#101820] text-[#e6f4f0]" : "bg-[#f4fbf7] text-[#10231c]";
  const cardBg = darkMode ? "bg-[#18272d] border-[#30464d]" : "bg-white border-emerald-100 shadow-sm";
  const inputBg = darkMode ? "bg-[#0d1820] border-[#36515a] text-slate-100 placeholder:text-slate-500 focus:border-teal-400" : "bg-emerald-50/50 border-emerald-200 text-slate-900";

  return (
    <div className={`air-ambience min-h-screen w-full font-sans antialiased selection:bg-emerald-500 selection:text-white transition-colors duration-200 ${themeClass}`}>
      
      {/* Header */}
      <header className={`px-6 py-3.5 flex flex-wrap justify-between items-center border-b ${darkMode ? 'border-[#30464d] bg-[#111d27]/90 backdrop-blur-md' : 'border-emerald-100 bg-white/85 backdrop-blur-md'} sticky top-0 z-50`}>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-teal-400/10 border border-teal-300/25 flex items-center justify-center text-teal-300">
            <Sparkle size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`font-bold text-sm tracking-tight flex items-center gap-1.5 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                CLEAN AIR <span className="text-slate-600">&amp;</span> CLEAN STREET
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center bg-[#111d27] p-1 rounded-lg border border-[#30464d]">
          <button 
            onClick={() => setActiveTab("client")}
            className={`px-3.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${activeTab === 'client' ? 'bg-[#245b5b] text-white border border-[#4a9990] shadow-sm' : 'text-slate-300 hover:text-white'}`}
          >
            Report Hub
          </button>
          <button 
            onClick={() => setActiveTab("admin_hub")}
            className={`px-3.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${activeTab === 'admin_hub' ? 'bg-[#245b5b] text-white border border-[#4a9990] shadow-sm' : 'text-slate-300 hover:text-white'}`}
          >
            Patrol Hub
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#18272d] border border-[#30464d] px-3 py-1.5 rounded-lg text-xs font-mono">
            <Award size={14} className="text-amber-400" />
            <span className="text-slate-400">ECO:</span>
            <span className="text-amber-400 font-bold">{ecoPoints}</span>
          </div>

          <div className="flex items-center gap-2 bg-[#18272d] border border-[#30464d] px-3 py-1.5 rounded-lg text-xs font-mono">
            <Sparkles size={14} className="text-indigo-400" />
            <span className="text-slate-400">RESTORED:</span>
            <span className="text-indigo-400 font-bold">{cleanedAreaSqFt} sq ft</span>
          </div>

          <button 
            onClick={() => setDarkMode(!darkMode)}
            className={`p-1.5 rounded-lg border transition cursor-pointer ${darkMode ? 'border-[#30464d] bg-[#18272d] text-slate-300 hover:text-white' : 'border-emerald-200 hover:bg-emerald-50'}`}
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {activeTab === "client" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Form */}
            <div className={`lg:col-span-5 p-5 rounded-xl border ${cardBg}`}>
              <div className="flex items-center justify-between mb-5 border-b border-[#1f2128] pb-3">
                <h2 className="text-xs font-mono uppercase tracking-wider font-semibold text-indigo-400 flex items-center gap-2">
                  <FileText size={15} /> Create Incident Report
                </h2>
                <span className="text-[10px] text-slate-500">Form ID: #TN-REG</span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1"><MapPin size={13} className="text-indigo-400" /> Pin Incident Coordinates</span>
                    <span className="text-[10px] text-slate-500 font-mono">{liveCoords.lat.toFixed(3)}, {liveCoords.lng.toFixed(3)}</span>
                  </label>
                  
                  <div className="h-36 w-full rounded-lg overflow-hidden border border-[#232631]">
                    <MapContainer 
                      center={[liveCoords.lat, liveCoords.lng]} 
                      zoom={11} 
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; OpenStreetMap'
                      />
                      <MapLocationUpdater coords={liveCoords} />
                      <LocationMarker />
                    </MapContainer>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Street / Landmark Location *</label>
                  <div className="relative flex items-center">
                    <input 
                      type="text" 
                      required
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Main Street, West Bus Stand" 
                      className={`w-full p-2.5 pr-24 rounded-lg border outline-none font-medium transition ${inputBg}`}
                    />
                    <button
                      type="button"
                      onClick={captureLiveLocation}
                      className="absolute right-1 px-2.5 py-1 bg-[#1b3940] hover:bg-teal-600 text-teal-200 hover:text-white rounded-md text-[11px] font-semibold transition cursor-pointer flex items-center gap-1 border border-[#396a70]"
                    >
                      <Navigation size={11} /> {isLocating ? "Locating..." : "GPS"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Pollution Category *</label>
                  <select 
                    value={wasteCategory}
                    onChange={(e) => setWasteCategory(e.target.value)}
                    className={`w-full p-2.5 rounded-lg border outline-none font-medium ${inputBg}`}
                  >
                    {WASTE_CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">District *</label>
                    <select 
                      value={selectedDistrict}
                      onChange={(e) => setSelectedDistrict(e.target.value)}
                      className={`w-full p-2.5 rounded-lg border outline-none font-medium ${inputBg}`}
                    >
                      {TAMIL_NADU_DISTRICTS.filter(d => d !== "All Districts").map(dist => (
                        <option key={dist} value={dist}>{dist}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Department *</label>
                    <select 
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className={`w-full p-2.5 rounded-lg border outline-none font-medium ${inputBg}`}
                    >
                      {DEPARTMENTS.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Reporter Name *</label>
                    <input 
                      type="text" 
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your full name" 
                      className={`w-full p-2.5 rounded-lg border outline-none font-medium ${inputBg}`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Priority Level</label>
                    <select 
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className={`w-full p-2.5 rounded-lg border outline-none font-medium ${inputBg}`}
                    >
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                      <option>Critical Clean Hazard</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Photo Evidence (Visible to Admin)</label>
                  <label className={`flex flex-col items-center justify-center p-3.5 border border-dashed rounded-lg cursor-pointer transition ${
                    darkMode ? 'border-[#282c3a] bg-[#0b0c0f] hover:border-indigo-500/50' : 'border-slate-300 bg-slate-50'
                  }`}>
                    <UploadCloud size={20} className="text-indigo-400 mb-1" />
                    <span className="text-[11px] font-medium text-slate-300">
                      {fileName ? fileName : "Click or drag photo evidence"}
                    </span>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  {userImage && (
                    <div className="mt-2 flex items-center gap-2 bg-[#0d0e12] p-1.5 rounded border border-[#212431]">
                      <img src={userImage} alt="Preview" className="h-8 w-8 object-cover rounded" />
                      <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                        <CheckCircle size={12} /> Image ready
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Details / Notes</label>
                  <textarea 
                    rows="2"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide additional details regarding the hazard..." 
                    className={`w-full p-2.5 rounded-lg border outline-none font-medium ${inputBg}`}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900/60 disabled:cursor-wait text-white font-medium rounded-lg transition cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                >
                  <Wind size={15} className={isSubmitting ? "animate-pulse" : ""} /> {isSubmitting ? "Sending report..." : "Submit Report (+25 Eco Points)"}
                </button>
              </form>
            </div>

            {/* Feed List */}
            <div className={`lg:col-span-7 p-5 rounded-xl border ${cardBg}`}>
              <div className="flex items-center justify-between mb-5 border-b border-[#1f2128] pb-3">
                <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-300 flex items-center gap-2">
                  <Clock size={15} className="text-indigo-400" /> Live Feed Issues ({incidents.length})
                </h3>
              </div>

              <div className="space-y-3">
                {incidents.length === 0 ? (
                  <div className="text-center py-20 text-slate-600 text-xs font-mono">
                    // NO ACTIVE HAZARDS LOGGED IN SYSTEM
                  </div>
                ) : (
                  incidents.map(incident => (
                    <div key={incident.id} className={`p-4 rounded-lg border ${darkMode ? 'border-[#1e212b] bg-[#0b0c0f]' : 'border-slate-200 bg-slate-50'} space-y-3`}>
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#181a22] text-indigo-300 border border-[#272b38]">
                              {WASTE_CATEGORIES.find(w => w.id === incident.wasteCategory)?.label || "Hazard"}
                            </span>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                              incident.priority.includes('Critical') ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                              incident.priority === 'High' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-[#181a22] text-slate-400'
                            }`}>
                              {incident.priority}
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-slate-200">{incident.location} <span className="text-slate-500 font-normal">({incident.district})</span></h4>
                          <p className="text-[11px] text-slate-500 font-mono">By {incident.fullName} • {incident.createdAt}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleUpvote(incident.id)}
                            title="Upvote this issue's seriousness"
                            className="flex items-center gap-1 bg-[#151720] hover:bg-[#1f2332] text-indigo-300 border border-[#282c3e] px-2 py-1 rounded text-xs font-mono transition cursor-pointer"
                          >
                            <ThumbsUp size={11} /> Seriousness {incident.upvotes || 1}
                          </button>

                          <span className={`text-[11px] font-mono px-2 py-1 rounded ${
                            incident.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            incident.status === 'In Progress' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                            'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {incident.status}
                          </span>
                        </div>
                      </div>

                      {incident.userImage && (
                        <div className="p-2 bg-[#08080a] rounded border border-[#1b1e28]">
                          <p className="text-[10px] font-mono text-slate-500 mb-1 flex items-center gap-1">
                            <Eye size={11} className="text-indigo-400" /> Evidence Photo:
                          </p>
                          <img 
                            src={incident.userImage} 
                            alt="User upload" 
                            className="h-28 w-full object-cover rounded border border-[#232734]" 
                          />
                        </div>
                      )}

                      <div className="p-2 rounded bg-[#08080a] border border-[#1b1e28] text-xs flex items-center justify-between font-mono">
                        <div className="flex items-center gap-2">
                          <Users size={13} className="text-indigo-400" />
                          <span className="text-slate-400">Unit: <strong className="text-slate-200">{incident.assignedTeam}</strong></span>
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          GPS: {incident.coords.lat}, {incident.coords.lng}
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] font-mono mb-1 text-slate-400">
                          <span>Resolution Progress</span>
                          <span className="text-slate-200 font-bold">{incident.progressPct}%</span>
                        </div>
                        <div className="w-full bg-[#181a22] h-1.5 rounded-full overflow-hidden border border-[#242735]">
                          <div 
                            className={`h-full transition-all duration-300 ${
                              incident.status === 'Resolved' ? 'bg-emerald-500' :
                              incident.status === 'In Progress' ? 'bg-indigo-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${incident.progressPct}%` }}
                          />
                        </div>
                      </div>

                      {incident.adminProofUrl && (
                        <div className="pt-2">
                          <p className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 mb-1">
                            <CheckCircle size={12} /> Cleaned Proof Verified:
                          </p>
                          <img src={incident.adminProofUrl} alt="Proof" className="h-28 w-44 object-cover rounded border border-emerald-500/30" />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Patrol Hub View */}
        {activeTab === "admin_hub" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total reports", value: patrolMetrics.total, color: "text-indigo-400" },
                { label: "Open patrol queue", value: patrolMetrics.unresolved, color: "text-amber-400" },
                { label: "Critical attention", value: patrolMetrics.critical, color: "text-rose-400" },
                { label: "Resolution rate", value: `${patrolMetrics.completionRate}%`, color: "text-emerald-400" }
              ].map(metric => (
                <div key={metric.label} className={`p-4 rounded-xl border ${cardBg}`}>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">{metric.label}</p>
                  <p className={`text-2xl font-display font-bold mt-2 ${metric.color}`}>{metric.value}</p>
                </div>
              ))}
            </div>
            <div className={`p-4 rounded-xl border ${cardBg} flex flex-wrap gap-4 justify-between items-center`}>
              <div className="flex items-center gap-4 flex-wrap">
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Filter District</label>
                  <select 
                    value={selectedAdminDistrict}
                    onChange={(e) => setSelectedAdminDistrict(e.target.value)}
                    className={`px-3 py-1.5 rounded-lg border text-xs outline-none ${inputBg}`}
                  >
                    {TAMIL_NADU_DISTRICTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Filter Department</label>
                  <select 
                    value={selectedDepartmentTab}
                    onChange={(e) => setSelectedDepartmentTab(e.target.value)}
                    className={`px-3 py-1.5 rounded-lg border text-xs outline-none ${inputBg}`}
                  >
                    <option value="all">All Departments</option>
                    {DEPARTMENTS.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="text-xs font-mono text-slate-400">
                Active Filter Count: <span className="text-indigo-400 font-bold">{adminFilteredIncidents.length}</span>
              </div>
              <button onClick={refreshPatrolHub} disabled={isRefreshing} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 disabled:opacity-50 text-xs font-medium">
                <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
                {isRefreshing ? "Refreshing" : "Refresh queue"}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className={`p-5 rounded-xl border ${cardBg}`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-300">Issue Status</h3>
                    <p className="text-[11px] text-slate-500 mt-1">Current workload across the filtered view</p>
                  </div>
                  <BarChart size={17} className="text-indigo-400" />
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={statusPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={58} outerRadius={84} paddingAngle={3} label={({ name, value }) => `${name}: ${value}`}>
                      {statusPieData.map(entry => <Cell key={entry.name} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#18272d', border: '1px solid #30464d', borderRadius: '8px', color: '#f8fafc' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className={`p-5 rounded-xl border ${cardBg}`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-300">Most Serious Issues</h3>
                    <p className="text-[11px] text-slate-500 mt-1">Community upvotes prioritize response</p>
                  </div>
                  <ThumbsUp size={17} className="text-amber-400" />
                </div>
                {seriousnessChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={seriousnessChartData} margin={{ left: 0, right: 12, bottom: 22 }}>
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} angle={-25} textAnchor="end" interval={0} />
                      <YAxis allowDecimals={false} stroke="#64748b" fontSize={11} />
                      <CartesianGrid stroke="#30464d" strokeDasharray="3 3" vertical={false} />
                      <Tooltip contentStyle={{ background: '#18272d', border: '1px solid #30464d', borderRadius: '8px', color: '#f8fafc' }} />
                      <Line type="monotone" dataKey="votes" name="Seriousness votes" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[220px] flex items-center justify-center text-xs text-slate-600 font-mono">No issue data yet</div>
                )}
              </div>
            </div>

            {/* Incident Operations Table */}
            <div className={`p-5 rounded-xl border ${cardBg} overflow-x-auto`}>
              <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-300 mb-4 flex items-center gap-2">
                <ShieldAlert size={15} className="text-indigo-400" /> Operational Dispatch Control
              </h3>

              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#1f2128] text-slate-400 font-mono text-[11px]">
                    <th className="pb-3 px-2">Location</th>
                    <th className="pb-3 px-2">Evidence</th>
                    <th className="pb-3 px-2">Category</th>
                    <th className="pb-3 px-2">Priority</th>
                    <th className="pb-3 px-2">Assigned Unit</th>
                    <th className="pb-3 px-2">Status</th>
                    <th className="pb-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#181a22]">
                  {adminFilteredIncidents.map(inc => {
                    const deptObj = DEPARTMENTS.find(d => d.id === inc.department);
                    return (
                      <tr key={inc.id} className="hover:bg-[#14161f]">
                        <td className="py-3 px-2">
                          <div className="font-bold text-slate-200">{inc.location}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{inc.district}</div>
                        </td>
                        <td className="py-3 px-2">
                          {inc.userImage ? (
                            <a href={inc.userImage} target="_blank" rel="noreferrer" title="Open uploaded evidence">
                              <img
                                src={inc.userImage}
                                alt={`Evidence uploaded for ${inc.location}`}
                                className="h-12 w-16 rounded-md border border-teal-400/30 object-cover transition hover:border-teal-300 hover:opacity-80"
                              />
                            </a>
                          ) : (
                            <span className="text-[10px] text-slate-500">No image</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-slate-400">
                          {WASTE_CATEGORIES.find(w => w.id === inc.wasteCategory)?.label}
                        </td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                            inc.priority.includes('Critical') ? 'bg-red-500/10 text-red-400' : 'bg-[#181a22] text-slate-300'
                          }`}>
                            {inc.priority}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <select 
                            value={inc.assignedTeam}
                            onChange={(e) => handleAssignTeam(inc.id, e.target.value)}
                            className={`p-1.5 rounded border text-[11px] outline-none ${inputBg}`}
                          >
                            <option value="Unassigned">Unassigned</option>
                            {deptObj?.teams.map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 px-2">
                          <span className="font-mono text-[11px] text-indigo-400">{inc.status} ({inc.progressPct}%)</span>
                        </td>
                        <td className="py-3 px-2 text-right space-x-2">
                          {inc.status !== "Resolved" && (
                            <button 
                              onClick={() => openCompletionModal(inc.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-medium transition cursor-pointer"
                            >
                              Upload Proof & Complete
                            </button>
                          )}
                          <button 
                            onClick={() => handleDeleteIncident(inc.id)}
                            className="p-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {completionTargetId && (
          <div className="fixed inset-0 z-[70] bg-black/75 flex items-center justify-center p-4">
            <form onSubmit={submitCompletion} className={`w-full max-w-md p-6 rounded-xl border ${cardBg} shadow-2xl space-y-4`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">Completion verification</p>
                  <h2 className="text-lg font-bold text-slate-100 mt-1">Upload work-done proof</h2>
                  <p className="text-xs text-slate-400 mt-2">After the image is verified, this completed report will be removed from the patrol queue.</p>
                </div>
                <button type="button" onClick={closeCompletionModal} className="p-1 text-slate-400 hover:text-white cursor-pointer" title="Close completion dialog"><X size={17} /></button>
              </div>

              <label className="flex items-center gap-3 p-4 border border-dashed border-emerald-500/40 rounded-lg bg-emerald-500/5 cursor-pointer">
                <ImagePlus size={22} className="text-emerald-400" />
                <span className="text-xs text-slate-300"><strong className="block text-slate-100">{completionFileName || 'Choose completed-work image'}</strong><span className="text-slate-500">JPG, PNG, or WEBP up to 8 MB</span></span>
                <input type="file" accept="image/*" required={!completionImage} onChange={handleCompletionImageChange} className="hidden" />
              </label>
              {completionImage && <img src={completionImage} alt="Completed work preview" className="w-full h-44 object-cover rounded-lg border border-emerald-500/30" />}
              {completionError && <p className="text-xs text-red-400">{completionError}</p>}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={closeCompletionModal} className="px-3 py-2 rounded-lg bg-[#252936] text-slate-300 text-xs cursor-pointer">Cancel</button>
                <button type="submit" disabled={isCompleting || !completionImage} className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold cursor-pointer">{isCompleting ? 'Uploading & Removing...' : 'Upload Proof & Remove Report'}</button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}