import { useState } from 'react'
import './App.css'

function App() {
  const [form, setForm] = useState({ fullName: '', location: '', wasteCategory: 'plastic', district: 'Tiruchirappalli', priority: 'Medium', description: '' })
  const [userImage, setUserImage] = useState(null)
  const [fileName, setFileName] = useState('')
  const [status, setStatus] = useState({ type: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return setStatus({ type: 'error', message: 'Please choose an image file.' })
    if (file.size > 8 * 1024 * 1024) return setStatus({ type: 'error', message: 'Please choose an image smaller than 8 MB.' })
    const reader = new FileReader()
    reader.onload = () => { setUserImage(reader.result); setFileName(file.name); setStatus({ type: '', message: '' }) }
    reader.onerror = () => setStatus({ type: 'error', message: 'The image could not be read. Please try again.' })
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setStatus({ type: '', message: '' })
    const incident = { id: Date.now(), ...form, department: 'sanitation', userImage, upvotes: 1, status: 'Not Started', progressPct: 0, assignedTeam: 'Unassigned', coords: { lat: '10.7905', lng: '78.7047' }, createdAt: new Date().toISOString() }
    try {
      const response = await fetch('http://localhost:5001/api/incidents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(incident) })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || 'The report could not be submitted.')
      setForm({ fullName: '', location: '', wasteCategory: 'plastic', district: 'Tiruchirappalli', priority: 'Medium', description: '' })
      setUserImage(null)
      setFileName('')
      setStatus({ type: 'success', message: 'Report submitted successfully.' })
    } catch (error) {
      setStatus({ type: 'error', message: error.message.includes('fetch') ? 'Cannot reach the server. Start the backend and try again.' : error.message })
    } finally { setIsSubmitting(false) }
  }

  return (
    <main className="report-page">
      <section className="intro"><p className="eyebrow">CLEAN STREET / PUBLIC DESK</p><h1>Report a hazard.<br /><em>Start the cleanup.</em></h1><p className="intro-copy">Send a location, a short description, and optional photo evidence to the response team.</p></section>
      <form className="report-form" onSubmit={handleSubmit}>
        <div className="form-heading"><div><p className="eyebrow">NEW REPORT</p><h2>Tell us what needs attention</h2></div><span className="form-mark">01</span></div>
        <div className="field-grid">
          <label>Reporter name<input name="fullName" value={form.fullName} onChange={updateField} required placeholder="Your name" /></label>
          <label>Street or landmark<input name="location" value={form.location} onChange={updateField} required placeholder="Where is it?" /></label>
          <label>What is happening<select name="wasteCategory" value={form.wasteCategory} onChange={updateField}><option value="plastic">Plastic and street waste</option><option value="illegal_dumping">Illegal garbage dumping</option><option value="toxic_burning">Open trash burning</option><option value="water_pollution">Drain or canal pollution</option></select></label>
          <label>District<select name="district" value={form.district} onChange={updateField}><option>Tiruchirappalli</option><option>Chennai</option><option>Coimbatore</option><option>Madurai</option><option>Salem</option><option>Thanjavur</option></select></label>
          <label>Priority<select name="priority" value={form.priority} onChange={updateField}><option>Low</option><option>Medium</option><option>High</option><option>Critical Clean Hazard</option></select></label>
          <label className="wide">Details<textarea name="description" value={form.description} onChange={updateField} rows="4" placeholder="Add useful details for the response team" /></label>
        </div>
        <label className="upload-field"><span className="upload-icon">+</span><span><strong>{fileName || 'Add photo evidence'}</strong><small>JPG, PNG, or WEBP up to 8 MB</small></span><input type="file" accept="image/*" onChange={handleFileChange} /></label>
        {userImage && <img className="preview" src={userImage} alt="Selected report evidence" />}
        {status.message && <p className={`status ${status.type}`}>{status.message}</p>}
        <button className="submit-button" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Submitting report...' : 'Submit report'}</button>
      </form>
    </main>
  )
}

export default App
