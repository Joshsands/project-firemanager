import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function ChangeOrder() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  // Tab 1: Materials
  const [csvText, setCsvText] = useState('');
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [csvPreviewRows, setCsvPreviewRows] = useState([]);
  const [csvLoading, setCsvLoading] = useState(false);
  const [materials, setMaterials] = useState([]);

  // Tab 2: Internal Labor
  const [internalLabor, setInternalLabor] = useState({
    design_cost: '',
    cad_cost: '',
    pm_cost: '',
    prep_cost: '',
    tech_cost: '',
    install_cost: ''
  });

  // Tab 3: Subcontractor
  const [subcontractor, setSubcontractor] = useState({
    fire_alarm_labor: '',
    subcontractor_labor: '',
    permit_fees: '',
    rental_fees: ''
  });

  // Tab 4: Margin
  const [margin, setMargin] = useState(0);

  // Customer info for tab 5
  const [customerInfo, setCustomerInfo] = useState({
    customerName: '',
    customerPhone: '',
    contactName: ''
  });

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
    // Reset form on project change
    setMaterials([]);
    setInternalLabor({ design_cost: '', cad_cost: '', pm_cost: '', prep_cost: '', tech_cost: '', install_cost: '' });
    setSubcontractor({ fire_alarm_labor: '', subcontractor_labor: '', permit_fees: '', rental_fees: '' });
    setMargin(0);
  }

  function parseCsvText(text) {
    const rows = [];
    let cur = '';
    let row = [];
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const next = text[i + 1];
      if (ch === '"') {
        if (inQuotes && next === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        row.push(cur);
        cur = '';
      } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
        if (ch === '\r' && next === '\n') continue;
        if (cur !== '' || row.length > 0) {
          row.push(cur);
          rows.push(row);
          row = [];
          cur = '';
        }
      } else {
        cur += ch;
      }
    }
    if (cur !== '' || row.length > 0) {
      row.push(cur);
      rows.push(row);
    }
    if (rows.length > 0 && rows[rows.length - 1].length === 1 && rows[rows.length - 1][0] === '') rows.pop();
    if (rows.length === 0) return { headers: [], rows: [] };
    const headers = rows[0].map(h => h.trim());
    const dataRows = rows.slice(1).map(r => {
      const obj = {};
      for (let i = 0; i < headers.length; i++) obj[headers[i]] = (r[i] ?? '').trim();
      return obj;
    });
    return { headers, rows: dataRows };
  }

  function handleFileChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setCsvText(String(ev.target.result || ''));
    };
    reader.readAsText(file);
  }

  function loadCsvPreview() {
    if (!csvText) return;
    setCsvLoading(true);
    try {
      const parsed = parseCsvText(csvText);
      setCsvHeaders(parsed.headers);
      setCsvPreviewRows(parsed.rows);
    } catch (err) {
      alert('Failed to parse CSV: ' + String(err));
    } finally {
      setCsvLoading(false);
    }
  }

  function importCsvMaterials() {
    if (!csvPreviewRows || csvPreviewRows.length === 0) return alert('No CSV data');
    const imported = csvPreviewRows.map((r, idx) => ({
      id: idx,
      qty: r.Qty ? parseInt(r.Qty) : 0,
      description: r.Description || '',
      unitPrice: r['Unit Price'] ? parseFloat(r['Unit Price'].replace(/[$,]/g, '')) : 0
    }));
    setMaterials(imported);
    setCsvText('');
    setCsvHeaders([]);
    setCsvPreviewRows([]);
  }

  const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

  // Calculate totals
  const materialsTotal = materials.reduce((sum, m) => sum + (m.qty * m.unitPrice), 0);
  const internalLaborTotal = Object.values(internalLabor).reduce((sum, v) => sum + (v ? parseFloat(v) : 0), 0);
  const subcontractorTotal = Object.values(subcontractor).reduce((sum, v) => sum + (v ? parseFloat(v) : 0), 0);
  const subtotal = materialsTotal + internalLaborTotal + subcontractorTotal;
  const marginAmount = (subtotal * margin) / 100;
  const finalPrice = subtotal + marginAmount;

  return (
    <div style={{ background: '#f5f5f5', minHeight: '100vh', padding: '16px' }}>
      <div style={{ maxWidth: '100%', width: '100%', margin: '0 auto' }}>
        <h2>Change Order</h2>

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

        {selectedProject && (
          <div style={{ background: '#fff', borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '2px solid #ddd', background: '#f9f9f9' }}>
              {['Materials', 'Internal Labor', 'Subcontractor', 'Summary', 'Document'].map((tab, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveTab(idx)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: activeTab === idx ? '#fff' : 'transparent',
                    border: activeTab === idx ? '2px solid var(--color-primary, #ff6b35)' : 'none',
                    borderBottom: activeTab === idx ? 'none' : '',
                    borderRadius: activeTab === idx ? '6px 6px 0 0' : '0',
                    cursor: 'pointer',
                    fontWeight: activeTab === idx ? 'bold' : 'normal',
                    color: activeTab === idx ? 'var(--color-primary, #ff6b35)' : '#333'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div style={{ padding: 24 }}>
              {/* Tab 0: Materials */}
              {activeTab === 0 && (
                <div>
                  <h3>Materials</h3>
                  <div style={{ marginBottom: 16, padding: 12, background: '#fff8f2', border: '1px solid #ffe6d5', borderRadius: 6 }}>
                    <strong>Upload Materials CSV</strong>
                    <p style={{ fontSize: 12, color: '#666', margin: '6px 0 8px 0' }}>Headers: Qty, Description, Unit Price</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input type="file" accept="text/csv" onChange={e => handleFileChange(e)} />
                      <button onClick={loadCsvPreview} disabled={csvLoading || !csvText}>{csvLoading ? 'Loading…' : 'Preview'}</button>
                      <button onClick={importCsvMaterials} disabled={csvPreviewRows.length === 0}>Import</button>
                    </div>
                  </div>
                  {materials.length > 0 && (
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
                      <thead>
                        <tr style={{ background: '#f5f5f5' }}>
                          <th style={{ padding: 8, textAlign: 'left', borderBottom: '1px solid #ddd' }}>Qty</th>
                          <th style={{ padding: 8, textAlign: 'left', borderBottom: '1px solid #ddd' }}>Description</th>
                          <th style={{ padding: 8, textAlign: 'right', borderBottom: '1px solid #ddd' }}>Unit Price</th>
                          <th style={{ padding: 8, textAlign: 'right', borderBottom: '1px solid #ddd' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {materials.map(m => (
                          <tr key={m.id}>
                            <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{m.qty}</td>
                            <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{m.description}</td>
                            <td style={{ padding: 8, textAlign: 'right', borderBottom: '1px solid #eee' }}>{currencyFormatter.format(m.unitPrice)}</td>
                            <td style={{ padding: 8, textAlign: 'right', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>{currencyFormatter.format(m.qty * m.unitPrice)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  <p style={{ textAlign: 'right', fontWeight: 'bold', fontSize: 14 }}>Materials Total: {currencyFormatter.format(materialsTotal)}</p>
                </div>
              )}

              {/* Tab 1: Internal Labor */}
              {activeTab === 1 && (
                <div>
                  <h3>Internal Labor</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    {['design_cost', 'cad_cost', 'pm_cost', 'prep_cost', 'tech_cost', 'install_cost'].map(field => {
                      const labels = {
                        design_cost: 'Design Labor',
                        cad_cost: 'CAD Labor',
                        pm_cost: 'PM Labor',
                        prep_cost: 'Prep Labor',
                        tech_cost: 'Tech Labor',
                        install_cost: 'Install Labor'
                      };
                      return (
                        <label key={field}>
                          <strong>{labels[field]}:</strong>
                          <input
                            type="number"
                            step="0.01"
                            value={internalLabor[field]}
                            onChange={e => setInternalLabor(prev => ({ ...prev, [field]: e.target.value }))}
                            placeholder="0.00"
                            style={{ width: '100%', marginTop: 4 }}
                          />
                        </label>
                      );
                    })}
                  </div>
                  <p style={{ textAlign: 'right', fontWeight: 'bold', fontSize: 14, marginTop: 16 }}>Internal Labor Total: {currencyFormatter.format(internalLaborTotal)}</p>
                </div>
              )}

              {/* Tab 2: Subcontractor */}
              {activeTab === 2 && (
                <div>
                  <h3>Subcontractor Costs</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    {['fire_alarm_labor', 'subcontractor_labor', 'permit_fees', 'rental_fees'].map(field => {
                      const labels = {
                        fire_alarm_labor: 'Fire Alarm Install Labor',
                        subcontractor_labor: 'Subcontractor Labor',
                        permit_fees: 'Permit Fees',
                        rental_fees: 'Rental Fees'
                      };
                      return (
                        <label key={field}>
                          <strong>{labels[field]}:</strong>
                          <input
                            type="number"
                            step="0.01"
                            value={subcontractor[field]}
                            onChange={e => setSubcontractor(prev => ({ ...prev, [field]: e.target.value }))}
                            placeholder="0.00"
                            style={{ width: '100%', marginTop: 4 }}
                          />
                        </label>
                      );
                    })}
                  </div>
                  <p style={{ textAlign: 'right', fontWeight: 'bold', fontSize: 14, marginTop: 16 }}>Subcontractor Total: {currencyFormatter.format(subcontractorTotal)}</p>
                </div>
              )}

              {/* Tab 3: Summary */}
              {activeTab === 3 && (
                <div>
                  <h3>Summary</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #ddd' }}>
                        <td style={{ padding: 12, textAlign: 'right', fontWeight: 'bold' }}>Materials:</td>
                        <td style={{ padding: 12, textAlign: 'right' }}>{currencyFormatter.format(materialsTotal)}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #ddd' }}>
                        <td style={{ padding: 12, textAlign: 'right', fontWeight: 'bold' }}>Internal Labor:</td>
                        <td style={{ padding: 12, textAlign: 'right' }}>{currencyFormatter.format(internalLaborTotal)}</td>
                      </tr>
                      <tr style={{ borderBottom: '2px solid #333' }}>
                        <td style={{ padding: 12, textAlign: 'right', fontWeight: 'bold' }}>Subcontractor:</td>
                        <td style={{ padding: 12, textAlign: 'right' }}>{currencyFormatter.format(subcontractorTotal)}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #ddd' }}>
                        <td style={{ padding: 12, textAlign: 'right', fontWeight: 'bold' }}>Subtotal:</td>
                        <td style={{ padding: 12, textAlign: 'right' }}>{currencyFormatter.format(subtotal)}</td>
                      </tr>
                    </tbody>
                  </table>
                  <label style={{ display: 'block', marginBottom: 16 }}>
                    <strong>Margin (%):</strong>
                    <input
                      type="number"
                      step="0.01"
                      value={margin}
                      onChange={e => setMargin(parseFloat(e.target.value) || 0)}
                      style={{ width: '100%', marginTop: 4 }}
                    />
                  </label>
                  <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 4, textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: 12, color: '#666' }}>Margin Amount: {currencyFormatter.format(marginAmount)}</p>
                    <p style={{ margin: '8px 0 0 0', fontSize: 18, fontWeight: 'bold', color: 'var(--color-primary, #ff6b35)' }}>Final Price: {currencyFormatter.format(finalPrice)}</p>
                  </div>
                </div>
              )}

              {/* Tab 4: Document */}
              {activeTab === 4 && (
                <div>
                  <h3>Customer-Facing Document</h3>
                  <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 6 }}>
                    <label style={{ display: 'block', marginBottom: 8 }}>
                      <strong>Customer Name:</strong>
                      <input
                        type="text"
                        value={customerInfo.customerName}
                        onChange={e => setCustomerInfo(prev => ({ ...prev, customerName: e.target.value }))}
                        placeholder="Customer name"
                        style={{ width: '100%', marginTop: 4 }}
                      />
                    </label>
                    <label style={{ display: 'block', marginBottom: 8 }}>
                      <strong>Customer Phone:</strong>
                      <input
                        type="text"
                        value={customerInfo.customerPhone}
                        onChange={e => setCustomerInfo(prev => ({ ...prev, customerPhone: e.target.value }))}
                        placeholder="Phone number"
                        style={{ width: '100%', marginTop: 4 }}
                      />
                    </label>
                    <label style={{ display: 'block' }}>
                      <strong>Contact Name:</strong>
                      <input
                        type="text"
                        value={customerInfo.contactName}
                        onChange={e => setCustomerInfo(prev => ({ ...prev, contactName: e.target.value }))}
                        placeholder="Contact name"
                        style={{ width: '100%', marginTop: 4 }}
                      />
                    </label>
                  </div>

                  {/* Preview Document */}
                  <div style={{ background: '#fff', padding: 32, borderRadius: 6, border: '1px solid #ddd', marginBottom: 16 }}>
                    <div style={{ textAlign: 'center', marginBottom: 24, borderBottom: '2px solid #333', paddingBottom: 12 }}>
                      <h1 style={{ margin: 0, fontSize: 24 }}>CHANGE ORDER</h1>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                      <div>
                        <p style={{ margin: 0, fontSize: 11, color: '#666' }}><strong>PROJECT:</strong></p>
                        <p style={{ margin: '4px 0 0 0' }}>{selectedProject.name}</p>
                        <p style={{ margin: '12px 0 0 0', fontSize: 11, color: '#666' }}><strong>CUSTOMER:</strong></p>
                        <p style={{ margin: '4px 0' }}>{customerInfo.customerName}</p>
                        <p style={{ margin: '12px 0 0 0', fontSize: 11, color: '#666' }}><strong>PHONE:</strong></p>
                        <p style={{ margin: '4px 0' }}>{customerInfo.customerPhone}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontSize: 11, color: '#666' }}><strong>CHANGE ORDER #:</strong></p>
                        <p style={{ margin: '4px 0 0 0', fontSize: 16, fontWeight: 'bold' }}>CO-001</p>
                        <p style={{ margin: '12px 0 0 0', fontSize: 11, color: '#666' }}><strong>DATE:</strong></p>
                        <p style={{ margin: '4px 0' }}>{new Date().toLocaleDateString()}</p>
                      </div>
                    </div>

                    {/* Itemized Costs */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
                      <thead>
                        <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #333' }}>
                          <th style={{ padding: 8, textAlign: 'left' }}>Description</th>
                          <th style={{ padding: 8, textAlign: 'right' }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {materials.length > 0 && (
                          <>
                            {materials.map(m => (
                              <tr key={m.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: 8 }}>{m.qty}x {m.description}</td>
                                <td style={{ padding: 8, textAlign: 'right' }}>{currencyFormatter.format(m.qty * m.unitPrice)}</td>
                              </tr>
                            ))}
                            <tr style={{ borderBottom: '1px solid #ddd' }}>
                              <td style={{ padding: 8, fontWeight: 'bold' }}>Materials Subtotal</td>
                              <td style={{ padding: 8, textAlign: 'right', fontWeight: 'bold' }}>{currencyFormatter.format(materialsTotal)}</td>
                            </tr>
                          </>
                        )}
                        {internalLaborTotal > 0 && (
                          <tr style={{ borderBottom: '1px solid #ddd' }}>
                            <td style={{ padding: 8, fontWeight: 'bold' }}>Internal Labor</td>
                            <td style={{ padding: 8, textAlign: 'right', fontWeight: 'bold' }}>{currencyFormatter.format(internalLaborTotal)}</td>
                          </tr>
                        )}
                        {subcontractorTotal > 0 && (
                          <tr style={{ borderBottom: '1px solid #ddd' }}>
                            <td style={{ padding: 8, fontWeight: 'bold' }}>Subcontractor</td>
                            <td style={{ padding: 8, textAlign: 'right', fontWeight: 'bold' }}>{currencyFormatter.format(subcontractorTotal)}</td>
                          </tr>
                        )}
                        <tr style={{ borderBottom: '1px solid #ddd' }}>
                          <td style={{ padding: 8, fontWeight: 'bold' }}>Subtotal</td>
                          <td style={{ padding: 8, textAlign: 'right', fontWeight: 'bold' }}>{currencyFormatter.format(subtotal)}</td>
                        </tr>
                        {margin > 0 && (
                          <tr style={{ borderBottom: '1px solid #ddd' }}>
                            <td style={{ padding: 8, fontWeight: 'bold' }}>Margin ({margin}%)</td>
                            <td style={{ padding: 8, textAlign: 'right', fontWeight: 'bold' }}>{currencyFormatter.format(marginAmount)}</td>
                          </tr>
                        )}
                        <tr style={{ borderBottom: '2px solid #333' }}>
                          <td style={{ padding: 12, fontWeight: 'bold', fontSize: 14 }}>TOTAL</td>
                          <td style={{ padding: 12, textAlign: 'right', fontWeight: 'bold', fontSize: 14 }}>{currencyFormatter.format(finalPrice)}</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Signature Line */}
                    <div style={{ marginTop: 40 }}>
                      <p style={{ margin: 0, borderTop: '1px solid #333', paddingTop: 8 }}>Authorized Signature</p>
                      <p style={{ margin: '20px 0 0 0', fontSize: 11, color: '#666' }}>Company Name: ___________________________________</p>
                      <p style={{ margin: '12px 0 0 0', fontSize: 11, color: '#666' }}>Print Name: ___________________________________</p>
                    </div>
                  </div>

                  {/* Print Button */}
                  <button onClick={() => window.print()} style={{ background: 'var(--color-primary, #ff6b35)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 4, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                    Print to PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {!selectedProject && (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
            <p>Select a project to create a change order</p>
          </div>
        )}
      </div>
    </div>
  );
}
