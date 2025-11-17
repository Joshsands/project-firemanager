import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Billing() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    const { data, error } = await supabase.from('projects').select('*').order('name');
    if (error) console.error(error);
    else setProjects(data ?? []);
  }

  function handleProjectChange(e) {
    const projectId = e.target.value;
    setSelectedProjectId(projectId);
    const project = projects.find(p => p.id === projectId);
    setSelectedProject(project || null);
  }

  const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

  const billingSections = [
    { label: 'Design', percent: 14 },
    { label: 'Material', percent: 46 },
    { label: 'Install Labor', percent: 20 },
    { label: 'Tech Labor', percent: 10 },
    { label: 'Commissioning', percent: 10 }
  ];

  const contractAmount = selectedProject?.contract_amount ? Number(selectedProject.contract_amount) : 0;

  return (
    <div style={{ background: '#f5f5f5', minHeight: '100vh', padding: '16px' }}>
      <div style={{ maxWidth: '100%', width: '100%', margin: '0 auto' }}>
        <h2>Billing</h2>

        {/* Project Selector */}
        <div style={{ marginBottom: 16, padding: 12, background: '#fff', borderRadius: 6, border: '1px solid #ddd' }}>
          <label>
            <strong>Select Project:</strong>
            <select value={selectedProjectId} onChange={handleProjectChange} style={{ marginLeft: 8, padding: '6px 8px', borderRadius: 4, border: '1px solid #ccc' }}>
              <option value="">-- Choose a project --</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
        </div>

        {/* AIA Billing Document */}
        {selectedProject && (
          <div style={{ background: '#fff', padding: 24, borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', maxWidth: 800, marginLeft: 'auto', marginRight: 'auto' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 24, borderBottom: '2px solid #333', paddingBottom: 12 }}>
              <h1 style={{ margin: 0, fontSize: 24, color: '#333' }}>AIA Application for Payment</h1>
              <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: 12 }}>Application for Payment and Continuation Sheet</p>
            </div>

            {/* Project Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
              <div>
                <p style={{ margin: 0, fontSize: 11, color: '#666' }}><strong>PROJECT:</strong></p>
                <p style={{ margin: '4px 0 0 0', fontSize: 13 }}>{selectedProject.name}</p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 11, color: '#666' }}><strong>CONTRACT AMOUNT:</strong></p>
                <p style={{ margin: '4px 0 0 0', fontSize: 13 }}>{currencyFormatter.format(contractAmount)}</p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 11, color: '#666' }}><strong>CUSTOMER:</strong></p>
                <p style={{ margin: '4px 0 0 0', fontSize: 13 }}>{selectedProject.customer || '-'}</p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 11, color: '#666' }}><strong>PM:</strong></p>
                <p style={{ margin: '4px 0 0 0', fontSize: 13 }}>{selectedProject.pm_name || '-'}</p>
              </div>
            </div>

            {/* Billing Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
              <thead>
                <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #333' }}>
                  <th style={{ textAlign: 'left', padding: 12, fontSize: 12, fontWeight: 600 }}>Billing Category</th>
                  <th style={{ textAlign: 'center', padding: 12, fontSize: 12, fontWeight: 600 }}>Percentage</th>
                  <th style={{ textAlign: 'right', padding: 12, fontSize: 12, fontWeight: 600 }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {billingSections.map((section, idx) => {
                  const amount = (contractAmount * section.percent) / 100;
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #ddd' }}>
                      <td style={{ padding: 12, fontSize: 12 }}>{section.label}</td>
                      <td style={{ textAlign: 'center', padding: 12, fontSize: 12 }}>{section.percent}%</td>
                      <td style={{ textAlign: 'right', padding: 12, fontSize: 12, fontWeight: 500 }}>{currencyFormatter.format(amount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Total */}
            <div style={{ textAlign: 'right', fontSize: 14, fontWeight: 'bold', paddingTop: 12, borderTop: '2px solid #333' }}>
              <p style={{ margin: '12px 0' }}>
                <strong>Total Billing Amount:</strong> {currencyFormatter.format(contractAmount)}
              </p>
            </div>

            {/* Print Button */}
            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <button onClick={() => window.print()} style={{ background: 'var(--color-primary, #ff6b35)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 4, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                Print to PDF
              </button>
            </div>
          </div>
        )}

        {!selectedProject && (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
            <p>Select a project to view billing information</p>
          </div>
        )}
      </div>
    </div>
  );
}
