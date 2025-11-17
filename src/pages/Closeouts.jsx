import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Closeouts() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [formData, setFormData] = useState({
    inspectionDate: '',
    inspectorName: '',
    systemOperational: false,
    batteryBackup: false,
    audioAudible: false,
    visualFlashing: false,
    devicesTested: false,
    manualPullTested: false,
    mainPowerVoltage: '',
    batteryVoltage: '',
    notes: ''
  });

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    const { data, error } = await supabase.from('projects').select('id, name').order('name');
    if (error) console.error(error);
    else setProjects(data ?? []);
  }

  function handleInputChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }

  async function saveForm() {
    if (!selectedProjectId) return alert('Please select a project');
    try {
      const { error } = await supabase.from('closeout_forms').upsert({
        project_id: selectedProjectId,
        form_data: formData,
        updated_at: new Date().toISOString()
      }, { onConflict: 'project_id' });
      if (error) return alert('Save failed: ' + error.message);
      alert('Form saved successfully');
    } catch (err) {
      alert('Save failed: ' + String(err));
    }
  }

  async function loadForm() {
    if (!selectedProjectId) return;
    try {
      const { data, error } = await supabase.from('closeout_forms').select('form_data').eq('project_id', selectedProjectId).single();
      if (data && data.form_data) {
        setFormData(data.form_data);
      }
    } catch (err) {
      // No existing form found
    }
  }

  useEffect(() => {
    loadForm();
  }, [selectedProjectId]);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div style={{ background: '#f5f5f5', minHeight: '100vh', padding: '16px' }}>
      <div style={{ maxWidth: '100%', width: '100%', margin: '0 auto' }}>
        <h2>Closeouts - Fire Alarm Inspection Form</h2>

        {/* Project Selector */}
        <div style={{ marginBottom: 16, padding: 12, background: '#fff', borderRadius: 6, border: '1px solid #ddd' }}>
          <label>
            <strong>Select Project:</strong>
            <select value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)} style={{ marginLeft: 8, padding: '6px 8px', borderRadius: 4, border: '1px solid #ccc' }}>
              <option value="">-- Choose a project --</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
        </div>

        {selectedProject && (
          <div style={{ background: '#fff', padding: 24, borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', maxWidth: 900 }}>
            {/* Header */}
            <div style={{ marginBottom: 24, borderBottom: '2px solid #333', paddingBottom: 12 }}>
              <h3 style={{ margin: '0 0 8px 0', color: '#333' }}>Simplex Fire Alarm System Inspection</h3>
              <p style={{ margin: 0, color: '#666', fontSize: 12 }}>Project: {selectedProject.name}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
              {/* Left Column */}
              <div>
                <label style={{ display: 'block', marginBottom: 12 }}>
                  <strong>Inspection Date:</strong>
                  <input type="date" name="inspectionDate" value={formData.inspectionDate} onChange={handleInputChange} style={{ width: '100%', marginTop: 4 }} />
                </label>
                <label style={{ display: 'block', marginBottom: 12 }}>
                  <strong>Inspector Name:</strong>
                  <input type="text" name="inspectorName" value={formData.inspectorName} onChange={handleInputChange} placeholder="Inspector name" style={{ width: '100%', marginTop: 4 }} />
                </label>
                <label style={{ display: 'block', marginBottom: 12 }}>
                  <strong>Main Power Voltage:</strong>
                  <input type="text" name="mainPowerVoltage" value={formData.mainPowerVoltage} onChange={handleInputChange} placeholder="e.g., 120V" style={{ width: '100%', marginTop: 4 }} />
                </label>
                <label style={{ display: 'block', marginBottom: 12 }}>
                  <strong>Battery Voltage:</strong>
                  <input type="text" name="batteryVoltage" value={formData.batteryVoltage} onChange={handleInputChange} placeholder="e.g., 24V" style={{ width: '100%', marginTop: 4 }} />
                </label>
              </div>

              {/* Right Column - Checkboxes */}
              <div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" name="systemOperational" checked={formData.systemOperational} onChange={handleInputChange} />
                    <span>System Operational</span>
                  </label>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" name="batteryBackup" checked={formData.batteryBackup} onChange={handleInputChange} />
                    <span>Battery Backup Functional</span>
                  </label>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" name="audioAudible" checked={formData.audioAudible} onChange={handleInputChange} />
                    <span>Audio Alarm Audible</span>
                  </label>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" name="visualFlashing" checked={formData.visualFlashing} onChange={handleInputChange} />
                    <span>Visual Strobe Flashing</span>
                  </label>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" name="devicesTested" checked={formData.devicesTested} onChange={handleInputChange} />
                    <span>All Devices Tested</span>
                  </label>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" name="manualPullTested" checked={formData.manualPullTested} onChange={handleInputChange} />
                    <span>Manual Pull Station Tested</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: 24 }}>
              <label>
                <strong>Inspection Notes:</strong>
                <textarea name="notes" value={formData.notes} onChange={handleInputChange} placeholder="Add any inspection notes here..." style={{ width: '100%', marginTop: 8, padding: 8, borderRadius: 4, border: '1px solid #ccc', minHeight: 100 }} />
              </label>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={saveForm} style={{ background: 'var(--color-primary, #ff6b35)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 4, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                Save Form
              </button>
              <button onClick={() => window.print()} style={{ background: '#0066cc', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 4, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                Print to PDF
              </button>
            </div>
          </div>
        )}

        {!selectedProject && (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
            <p>Select a project to fill out the inspection form</p>
          </div>
        )}
      </div>
    </div>
  );
}
