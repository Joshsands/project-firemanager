import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Inventory() {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [csvText, setCsvText] = useState('');
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [csvPreviewRows, setCsvPreviewRows] = useState([]);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvImporting, setCsvImporting] = useState(false);
  const [qty, setQty] = useState('');
  const [modelNo, setModelNo] = useState('');
  const [description, setDescription] = useState('');
  const [projectName, setProjectName] = useState('');
  const [price, setPrice] = useState('');
  const [editingId, setEditingId] = useState(null);

  async function loadInventory() {
    const { data, error } = await supabase.from('inventory').select('*').order('created_at', { ascending: false });
    if (error) console.error(error);
    else setInventoryItems(data ?? []);
  }

  async function loadProjects() {
    const { data, error } = await supabase.from('projects').select('id, name').order('name');
    if (error) console.error(error);
    else setProjects(data ?? []);
  }

  useEffect(() => {
    loadInventory();
    loadProjects();
  }, []);

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

  async function importCsv() {
    if (!csvPreviewRows || csvPreviewRows.length === 0) return alert('No CSV data to import');
    if (!window.confirm(`Import ${csvPreviewRows.length} rows?`)) return;
    setCsvImporting(true);
    try {
      const payload = csvPreviewRows.map(r => ({
        qty: r.Qty ? parseInt(r.Qty) : null,
        model_no: r['Model No.'] || null,
        description: r.Description || null,
        project_name: r['Project Name'] || null,
        price: r.Price ? parseFloat(r.Price.replace(/[$,]/g, '')) : null
      }));
      const { error } = await supabase.from('inventory').insert(payload);
      if (error) return alert('Import failed: ' + error.message);
      alert(`Imported ${payload.length} items`);
      loadInventory();
      setCsvText('');
      setCsvHeaders([]);
      setCsvPreviewRows([]);
    } catch (err) {
      alert('Import failed: ' + String(err));
    } finally {
      setCsvImporting(false);
    }
  }

  async function addItem(e) {
    e.preventDefault();
    if (!qty || !modelNo || !projectName) return alert('Qty, Model No., and Project Name are required');
    const { error } = await supabase.from('inventory').insert({
      qty: parseInt(qty),
      model_no: modelNo,
      description: description || null,
      project_name: projectName,
      price: price ? parseFloat(price) : null
    });
    if (error) return alert(error.message);
    setQty('');
    setModelNo('');
    setDescription('');
    setProjectName('');
    setPrice('');
    loadInventory();
  }

  async function deleteItem(id) {
    if (!window.confirm('Delete this item?')) return;
    const { error } = await supabase.from('inventory').delete().eq('id', id);
    if (error) return alert(error.message);
    setInventoryItems(prev => prev.filter(p => p.id !== id));
  }

  const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

  return (
    <div style={{ background: '#f5f5f5', minHeight: '100vh', padding: '16px' }}>
      <div style={{ maxWidth: '100%', width: '100%', margin: '0 auto' }}>
        <h2>Inventory</h2>

        {/* Add Item Form */}
        <form onSubmit={addItem}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
            <label>
              Qty: <input type="number" value={qty} onChange={e => setQty(e.target.value)} placeholder="Qty" />
            </label>
            <label>
              Model No.: <input value={modelNo} onChange={e => setModelNo(e.target.value)} placeholder="Model No." />
            </label>
            <label>
              Description: <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" />
            </label>
            <label>
              Project: 
              <select value={projectName} onChange={e => setProjectName(e.target.value)}>
                <option value="">Select project</option>
                {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </label>
            <label>
              Price: <input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="Price" />
            </label>
            <button type="submit">Add</button>
          </div>
        </form>

        {/* CSV Import */}
        <div style={{ marginBottom: 16, padding: 12, background: '#fff8f2', border: '1px solid #ffe6d5', borderRadius: 6 }}>
          <strong>Bulk CSV import</strong>
          <p style={{ margin: '6px 0 8px 0', fontSize: 13 }}>Headers: Qty, Model No., Description, Project Name, Price</p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="file" accept="text/csv" onChange={e => handleFileChange(e)} />
            <button onClick={loadCsvPreview} disabled={csvLoading || !csvText}>{csvLoading ? 'Loading…' : 'Load preview'}</button>
            <button onClick={importCsv} disabled={csvImporting || csvPreviewRows.length === 0}>{csvImporting ? 'Importing…' : 'Import'}</button>
          </div>
          {csvHeaders.length > 0 && (
            <div style={{ marginTop: 12, overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', background: '#fff' }}>
                <thead>
                  <tr>
                    {csvHeaders.map((h, i) => <th key={i} style={{ padding: 6, borderBottom: '1px solid #eee', textAlign: 'left' }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {csvPreviewRows.slice(0, 5).map((row, rIdx) => (
                    <tr key={rIdx}>
                      {csvHeaders.map((h, cIdx) => <td key={cIdx} style={{ padding: 6, borderBottom: '1px solid #faf0ea' }}>{row[h] ?? ''}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Inventory Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Qty</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Model No.</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Description</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Project Name</th>
                <th style={{ textAlign: 'right', borderBottom: '1px solid #ddd', padding: 8 }}>Price</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventoryItems.map(item => (
                <tr key={item.id}>
                  <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{item.qty}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{item.model_no}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{item.description || '-'}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{item.project_name || '-'}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #eee', textAlign: 'right' }}>{item.price != null ? currencyFormatter.format(Number(item.price)) : '-'}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                    <button onClick={() => deleteItem(item.id)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
