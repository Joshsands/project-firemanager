import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/Auth';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [booked, setBooked] = useState('');
  const [closed, setClosed] = useState('');
  const [contractAmount, setContractAmount] = useState('');
  const [marginStart, setMarginStart] = useState('');
  const [marginEnd, setMarginEnd] = useState('');
  const [pmName, setPmName] = useState('');
  const [customer, setCustomer] = useState('');
  const [projectType, setProjectType] = useState('');
  const [pmFilter, setPmFilter] = useState('');
  const [projectTypeFilter, setProjectTypeFilter] = useState('');
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [csvPreviewRows, setCsvPreviewRows] = useState([]);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvImporting, setCsvImporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editBooked, setEditBooked] = useState('');
  const [editClosed, setEditClosed] = useState('');
  const [editContractAmount, setEditContractAmount] = useState('');
  const [editMarginStart, setEditMarginStart] = useState('');
  const [editMarginEnd, setEditMarginEnd] = useState('');
  const [editPmName, setEditPmName] = useState('');
  const [editCustomer, setEditCustomer] = useState('');
  const [editProjectType, setEditProjectType] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [internalSaving, setInternalSaving] = useState(false);
  const [timelineSaving, setTimelineSaving] = useState(false);
  const [designReviewDays, setDesignReviewDays] = useState('');
  const [ahjApprovalDays, setAhjApprovalDays] = useState('');
  const [roughInWalkDays, setRoughInWalkDays] = useState('');
  const [wireRunsDays, setWireRunsDays] = useState('');
  const [deviceTrimOutDays, setDeviceTrimOutDays] = useState('');
  const [programmingTestingDays, setProgrammingTestingDays] = useState('');
  const [finalTestingDays, setFinalTestingDays] = useState('');
  const [closeoutsDays, setCloseoutsDays] = useState('');
  const [completedPhases, setCompletedPhases] = useState({});
  const [laborMatrix, setLaborMatrix] = useState({
    design_quoted: '', design_estimated: '', design_actual: '',
    cad_quoted: '', cad_estimated: '', cad_actual: '',
    pm_quoted: '', pm_estimated: '', pm_actual: '',
    prep_quoted: '', prep_estimated: '', prep_actual: '',
    tech_quoted: '', tech_estimated: '', tech_actual: '',
    install_quoted: '', install_estimated: '', install_actual: '',
    material_quoted: '', material_estimated: '', material_actual: '',
    sub_labor_quoted: '', sub_labor_estimated: '', sub_labor_actual: '',
    permit_fee_quoted: '', permit_fee_estimated: '', permit_fee_actual: ''
  });

  async function loadProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) console.error(error);
    else setProjects(data ?? []);
  }

  // Logout moved to Navbar component

  // CSV parsing helpers
  function parseCsvText(text) {
    // Basic CSV parser supporting quoted fields and newlines
    const rows = [];
    let cur = '';
    let row = [];
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const next = text[i + 1];
      if (ch === '"') {
        if (inQuotes && next === '"') { // escaped quote
          cur += '"';
          i++; // skip next
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        row.push(cur);
        cur = '';
      } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
        // handle CRLF by peeking ahead
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

    // Trim possible empty trailing row
    if (rows.length > 0 && rows[rows.length - 1].length === 1 && rows[rows.length - 1][0] === '') rows.pop();

    // First row headers
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
    
    // Validate required fields
    const errors = [];
    csvPreviewRows.forEach((r, idx) => {
      const rowNum = idx + 2; // +2 because header is row 1, data starts at row 2
      if (!r.name || r.name.trim() === '') {
        errors.push(`Row ${rowNum}: missing or empty "name" column`);
      }
    });
    
    if (errors.length > 0) {
      return alert(`Validation failed:\n${errors.slice(0, 10).join('\n')}${errors.length > 10 ? `\n... and ${errors.length - 10} more` : ''}`);
    }
    
    if (!window.confirm(`Import ${csvPreviewRows.length} rows to Supabase projects?`)) return;
    setCsvImporting(true);
    try {
      // Map rows - attempt basic coercion for known fields
      const payload = csvPreviewRows.map(r => {
        const out = {};
        Object.keys(r).forEach(k => {
          const key = k.trim();
          const val = r[k] === '' ? null : r[k];
          if (val === null) { out[key] = null; return; }
          // Known numeric fields
          if (['contract_amount', 'margin_start', 'margin_end'].includes(key)) {
            const n = parseFloat(val.replace(/[$,]/g, ''));
            out[key] = Number.isNaN(n) ? null : n;
            return;
          }
          // Known integer/day fields
          if (key.match(/_days$/)) {
            const n = parseInt(val);
            out[key] = Number.isNaN(n) ? null : n;
            return;
          }
          // Known boolean completed fields
          if (key.match(/_completed$/)) {
            const lowered = String(val).toLowerCase();
            out[key] = lowered === 'true' || lowered === '1' || lowered === 'yes';
            return;
          }
          // Dates: try ISO / MM/DD/YYYY common formats
          if (['booked', 'closed'].includes(key)) {
            const d = new Date(val);
            out[key] = isNaN(d.getTime()) ? null : d.toISOString().slice(0,10);
            return;
          }
          // Default: pass through
          out[key] = val;
        });
        // Attach owner if user exists
        if (user && user.id) out.owner_id = user.id;
        return out;
      });

      console.log('CSV import payload (first row):', payload[0]);
      console.log('Total rows to insert:', payload.length);

      // Insert in one batch (Supabase supports arrays). If very large, batching may be needed.
      const { data, error } = await supabase.from('projects').insert(payload);
      console.log('Insert response - data:', data, 'error:', error);
      
      if (error) {
        console.error('Import error', error);
        return alert('Import failed: ' + (error.message || JSON.stringify(error)));
      }
      if (!data) {
        console.error('No data returned from insert. Payload was:', payload);
        alert('Import failed: No response from database. Check console and verify:\n1. SQL migration has been run in Supabase\n2. RLS policies allow inserts\n3. All CSV fields match DB column names/types');
        return;
      }
      const count = Array.isArray(data) ? data.length : 1;
      alert(`Imported ${count} projects`);
      // Refresh projects list
      loadProjects();
      // clear preview
      setCsvText(''); setCsvHeaders([]); setCsvPreviewRows([]);
    } catch (err) {
      console.error(err);
      alert('Import failed: ' + String(err));
    } finally {
      setCsvImporting(false);
    }
  }

  async function createProject(e) {
    e.preventDefault();
    if (!name || !name.trim()) return alert('Project name is required');
    setCreating(true);
    const { error } = await supabase.from('projects').insert({
      name,
      description,
      booked: booked || null,
      closed: closed || null,
      contract_amount: contractAmount ? parseFloat(contractAmount) : null,
      margin_start: marginStart ? parseFloat(marginStart) : null,
      margin_end: marginEnd ? parseFloat(marginEnd) : null,
      pm_name: pmName || null,
      customer: customer || null,
      project_type: projectType || null,
      owner_id: user.id
    });
    setCreating(false);
    if (error) return alert(error.message);
    setName(''); setDescription('');
    setBooked(''); setClosed(''); setContractAmount(''); setMarginStart(''); setMarginEnd(''); setPmName(''); setCustomer(''); setProjectType('');
    loadProjects();
  }

  async function deleteProject(id) {
    if (!window.confirm('Delete this project? This cannot be undone.')) return;
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) return alert(error.message);
    // remove locally for immediate UI update
    setProjects(prev => prev.filter(p => p.id !== id));
  }

  // Stats calculation helpers
  function getMedian(arr) {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  function calculatePmStats(selectedPm) {
    if (!selectedPm) return null;
    
    const pmProjects = projects.filter(p => p.pm_name === selectedPm);
    if (pmProjects.length === 0) return null;

    // Total projects
    const totalProjects = pmProjects.length;

    // Total contract amount
    const totalContractAmount = pmProjects.reduce((sum, p) => sum + (p.contract_amount ? Number(p.contract_amount) : 0), 0);

    // Margin improvements
    const marginImprovements = pmProjects
      .filter(p => p.margin_start != null && p.margin_end != null)
      .map(p => Number(p.margin_end) - Number(p.margin_start));
    const avgMarginImprovement = marginImprovements.length > 0 
      ? marginImprovements.reduce((a, b) => a + b, 0) / marginImprovements.length 
      : 0;
    const medianMarginImprovement = getMedian(marginImprovements);

    // Duration calculations (booked to closed)
    const calcDuration = (p) => {
      if (!p.booked || !p.closed) return null;
      const booked = new Date(p.booked);
      const closed = new Date(p.closed);
      const days = Math.ceil((closed - booked) / (1000 * 60 * 60 * 24));
      return days >= 0 ? days : null;
    };

    // PRIME projects (assuming project_type includes "Prime" or "PRIME")
    const primeProjects = pmProjects.filter(p => p.project_type && p.project_type.toLowerCase().includes('prime'));
    const primeDurations = primeProjects.map(calcDuration).filter(d => d !== null);
    const avgPrimeDuration = primeDurations.length > 0 
      ? primeDurations.reduce((a, b) => a + b, 0) / primeDurations.length 
      : 0;
    const medianPrimeDuration = getMedian(primeDurations);

    // RETROFIT projects (assuming project_type includes "Retrofit" or "RETROFIT")
    const retrofitProjects = pmProjects.filter(p => p.project_type && p.project_type.toLowerCase().includes('retrofit'));
    const retrofitDurations = retrofitProjects.map(calcDuration).filter(d => d !== null);
    const avgRetrofitDuration = retrofitDurations.length > 0 
      ? retrofitDurations.reduce((a, b) => a + b, 0) / retrofitDurations.length 
      : 0;
    const medianRetrofitDuration = getMedian(retrofitDurations);

    return {
      totalProjects,
      totalContractAmount,
      avgMarginImprovement,
      medianMarginImprovement,
      avgPrimeDuration,
      medianPrimeDuration,
      avgRetrofitDuration,
      medianRetrofitDuration
    };
  }

  const pmStats = calculatePmStats(pmFilter);

  // Calculate stats for all projects (all PMs combined)
  const allPmStats = calculatePmStats(pmFilter ? projects.find(p => p.pm_name)?.pm_name : null) ? (() => {
    // Get unique PMs and calculate aggregate
    const allProjects = projects;
    if (allProjects.length === 0) return null;

    const totalProjects = allProjects.length;
    const totalContractAmount = allProjects.reduce((sum, p) => sum + (p.contract_amount ? Number(p.contract_amount) : 0), 0);

    const marginImprovements = allProjects
      .filter(p => p.margin_start != null && p.margin_end != null)
      .map(p => Number(p.margin_end) - Number(p.margin_start));
    const avgMarginImprovement = marginImprovements.length > 0 
      ? marginImprovements.reduce((a, b) => a + b, 0) / marginImprovements.length 
      : 0;
    const medianMarginImprovement = getMedian(marginImprovements);

    const calcDuration = (p) => {
      if (!p.booked || !p.closed) return null;
      const booked = new Date(p.booked);
      const closed = new Date(p.closed);
      const days = Math.ceil((closed - booked) / (1000 * 60 * 60 * 24));
      return days >= 0 ? days : null;
    };

    const primeProjects = allProjects.filter(p => p.project_type && p.project_type.toLowerCase().includes('prime'));
    const primeDurations = primeProjects.map(calcDuration).filter(d => d !== null);
    const avgPrimeDuration = primeDurations.length > 0 
      ? primeDurations.reduce((a, b) => a + b, 0) / primeDurations.length 
      : 0;
    const medianPrimeDuration = getMedian(primeDurations);

    const retrofitProjects = allProjects.filter(p => p.project_type && p.project_type.toLowerCase().includes('retrofit'));
    const retrofitDurations = retrofitProjects.map(calcDuration).filter(d => d !== null);
    const avgRetrofitDuration = retrofitDurations.length > 0 
      ? retrofitDurations.reduce((a, b) => a + b, 0) / retrofitDurations.length 
      : 0;
    const medianRetrofitDuration = getMedian(retrofitDurations);

    return {
      totalProjects,
      totalContractAmount,
      avgMarginImprovement,
      medianMarginImprovement,
      avgPrimeDuration,
      medianPrimeDuration,
      avgRetrofitDuration,
      medianRetrofitDuration
    };
  })() : null;

  function startEdit(p) {
    setEditingId(p.id);
    setEditName(p.name || '');
    setEditDescription(p.description || '');
    setEditBooked(p.booked || '');
    setEditClosed(p.closed || '');
    setEditContractAmount(p.contract_amount ?? '');
    setEditMarginStart(p.margin_start ?? '');
    setEditMarginEnd(p.margin_end ?? '');
    setEditPmName(p.pm_name || '');
    setEditCustomer(p.customer || '');
    setEditProjectType(p.project_type || '');
  }

  function toggleInternal(p) {
    if (expandedId === p.id) {
      setExpandedId(null);
      setLaborMatrix({
        design_quoted: '', design_estimated: '', design_actual: '',
        cad_quoted: '', cad_estimated: '', cad_actual: '',
        pm_quoted: '', pm_estimated: '', pm_actual: '',
        prep_quoted: '', prep_estimated: '', prep_actual: '',
        tech_quoted: '', tech_estimated: '', tech_actual: '',
        install_quoted: '', install_estimated: '', install_actual: '',
        material_quoted: '', material_estimated: '', material_actual: '',
        sub_labor_quoted: '', sub_labor_estimated: '', sub_labor_actual: '',
        permit_fee_quoted: '', permit_fee_estimated: '', permit_fee_actual: ''
      });
      return;
    }
    setExpandedId(p.id);
    setLaborMatrix({
      design_quoted: p.design_quoted ?? '', design_estimated: p.design_estimated ?? '', design_actual: p.design_actual ?? '',
      cad_quoted: p.cad_quoted ?? '', cad_estimated: p.cad_estimated ?? '', cad_actual: p.cad_actual ?? '',
      pm_quoted: p.pm_quoted ?? '', pm_estimated: p.pm_estimated ?? '', pm_actual: p.pm_actual ?? '',
      prep_quoted: p.prep_quoted ?? '', prep_estimated: p.prep_estimated ?? '', prep_actual: p.prep_actual ?? '',
      tech_quoted: p.tech_quoted ?? '', tech_estimated: p.tech_estimated ?? '', tech_actual: p.tech_actual ?? '',
      install_quoted: p.install_quoted ?? '', install_estimated: p.install_estimated ?? '', install_actual: p.install_actual ?? '',
      material_quoted: p.material_quoted ?? '', material_estimated: p.material_estimated ?? '', material_actual: p.material_actual ?? '',
      sub_labor_quoted: p.sub_labor_quoted ?? '', sub_labor_estimated: p.sub_labor_estimated ?? '', sub_labor_actual: p.sub_labor_actual ?? '',
      permit_fee_quoted: p.permit_fee_quoted ?? '', permit_fee_estimated: p.permit_fee_estimated ?? '', permit_fee_actual: p.permit_fee_actual ?? ''
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName('');
    setEditDescription('');
    setEditBooked('');
    setEditClosed('');
    setEditContractAmount('');
    setEditMarginStart('');
    setEditMarginEnd('');
    setEditPmName('');
    setEditCustomer('');
    setEditProjectType('');
  }

  async function saveEdit(id) {
    if (!editName || !editName.trim()) return alert('Project name is required');
    setSaving(true);
    const { error } = await supabase.from('projects').update({
      name: editName,
      description: editDescription,
      booked: editBooked || null,
      closed: editClosed || null,
      contract_amount: editContractAmount ? parseFloat(editContractAmount) : null,
      margin_start: editMarginStart ? parseFloat(editMarginStart) : null,
      margin_end: editMarginEnd ? parseFloat(editMarginEnd) : null,
      pm_name: editPmName || null,
      customer: editCustomer || null,
      project_type: editProjectType || null
    }).eq('id', id);
    setSaving(false);
    if (error) return alert(error.message);
    setProjects(prev => prev.map(p => p.id === id ? { ...p, name: editName, description: editDescription, booked: editBooked, closed: editClosed, contract_amount: editContractAmount, margin_start: editMarginStart, margin_end: editMarginEnd, pm_name: editPmName, customer: editCustomer, project_type: editProjectType } : p));
    cancelEdit();
  }

  async function saveInternal(id) {
    // Parse all labor matrix values, allow empty to set null
    const payload = {};
    Object.keys(laborMatrix).forEach(key => {
      const val = laborMatrix[key];
      payload[key] = val === '' ? null : parseFloat(val);
    });
    
    setInternalSaving(true);
    const { error } = await supabase.from('projects').update(payload).eq('id', id);
    setInternalSaving(false);
    if (error) return alert(error.message);
    
    // Update local projects state with new labor matrix values
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...payload } : p));
    setExpandedId(null);
    setLaborMatrix({
      design_quoted: '', design_estimated: '', design_actual: '',
      cad_quoted: '', cad_estimated: '', cad_actual: '',
      pm_quoted: '', pm_estimated: '', pm_actual: '',
      prep_quoted: '', prep_estimated: '', prep_actual: '',
      tech_quoted: '', tech_estimated: '', tech_actual: '',
      install_quoted: '', install_estimated: '', install_actual: '',
      material_quoted: '', material_estimated: '', material_actual: '',
      sub_labor_quoted: '', sub_labor_estimated: '', sub_labor_actual: '',
      permit_fee_quoted: '', permit_fee_estimated: '', permit_fee_actual: ''
    });
  }

  function selectProject(p) {
    setSelectedProjectId(selectedProjectId === p.id ? null : p.id);
    if (selectedProjectId !== p.id) {
      // Load milestone durations from project or set defaults
      setDesignReviewDays(p.design_review_days?.toString() || '30');
      setAhjApprovalDays(p.ahj_approval_days?.toString() || '14');
      setRoughInWalkDays(p.rough_in_walk_days?.toString() || '14');
      setWireRunsDays(p.wire_runs_days?.toString() || '14');
      setDeviceTrimOutDays(p.device_trim_out_days?.toString() || '5');
      setProgrammingTestingDays(p.programming_testing_days?.toString() || '3');
      setFinalTestingDays(p.final_testing_days?.toString() || '5');
      setCloseoutsDays(p.closeouts_days?.toString() || '2');
      // Load completed phases from project
      setCompletedPhases({
        'Design Review': p.design_review_completed || false,
        'AHJ Approval': p.ahj_approval_completed || false,
        'Rough-in Walk': p.rough_in_walk_completed || false,
        'Wire Runs': p.wire_runs_completed || false,
        'Device Trim-out': p.device_trim_out_completed || false,
        'Programming & Testing': p.programming_testing_completed || false,
        'Final Testing': p.final_testing_completed || false,
        'Closeouts': p.closeouts_completed || false
      });
    } else {
      setDesignReviewDays('');
      setAhjApprovalDays('');
      setRoughInWalkDays('');
      setWireRunsDays('');
      setDeviceTrimOutDays('');
      setProgrammingTestingDays('');
      setFinalTestingDays('');
      setCloseoutsDays('');
      setCompletedPhases({});
    }
  }

  async function saveTimeline(projectId) {
    setTimelineSaving(true);
    const updatePayload = {
      design_review_days: designReviewDays ? parseInt(designReviewDays) : null,
      ahj_approval_days: ahjApprovalDays ? parseInt(ahjApprovalDays) : null,
      rough_in_walk_days: roughInWalkDays ? parseInt(roughInWalkDays) : null,
      wire_runs_days: wireRunsDays ? parseInt(wireRunsDays) : null,
      device_trim_out_days: deviceTrimOutDays ? parseInt(deviceTrimOutDays) : null,
      programming_testing_days: programmingTestingDays ? parseInt(programmingTestingDays) : null,
      final_testing_days: finalTestingDays ? parseInt(finalTestingDays) : null,
      closeouts_days: closeoutsDays ? parseInt(closeoutsDays) : null,
      design_review_completed: completedPhases['Design Review'] || false,
      ahj_approval_completed: completedPhases['AHJ Approval'] || false,
      rough_in_walk_completed: completedPhases['Rough-in Walk'] || false,
      wire_runs_completed: completedPhases['Wire Runs'] || false,
      device_trim_out_completed: completedPhases['Device Trim-out'] || false,
      programming_testing_completed: completedPhases['Programming & Testing'] || false,
      final_testing_completed: completedPhases['Final Testing'] || false,
      closeouts_completed: completedPhases['Closeouts'] || false
    };
    const { error } = await supabase.from('projects').update(updatePayload).eq('id', projectId);
    setTimelineSaving(false);
    if (error) return alert(error.message);
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...updatePayload } : p));
  }

  useEffect(() => { loadProjects(); }, []);

  // Compute unique PM names and project types for filter dropdowns
  const uniquePms = [...new Set(projects.filter(p => p.pm_name).map(p => p.pm_name))].sort();
  const uniqueProjectTypes = [...new Set(projects.filter(p => p.project_type).map(p => p.project_type))].sort();
  
  // Filter projects based on selected filters
  const filteredProjects = projects.filter(p => {
    if (pmFilter && p.pm_name !== pmFilter) return false;
    if (projectTypeFilter && p.project_type !== projectTypeFilter) return false;
    return true;
  });

  const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
  function formatPct(v) {
    if (v === null || v === undefined || v === '') return '-';
    const n = Number(v);
    if (Number.isNaN(n)) return '-';
    return `${n.toFixed(2)}%`;
  }
  function formatDate(d) {
    if (!d) return '-';
    try { return new Date(d).toLocaleDateString(); } catch { return d; }
  }

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') cancelEdit(); }
    if (editingId) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editingId]);

  return (
    <div style={{ }}>
      <div style={{ maxWidth: '100%', width: '100%', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>Your projects</h2>
      </div>

      {/* Create New Project Button */}
      <button 
        onClick={() => setShowCreateForm(!showCreateForm)}
        style={{ 
          marginBottom: 16, 
          padding: '10px 16px', 
          background: 'var(--color-primary, #ff6b35)', 
          color: '#fff', 
          border: 'none', 
          borderRadius: 4, 
          cursor: 'pointer', 
          fontSize: 14, 
          fontWeight: 600 
        }}
      >
        {showCreateForm ? '✕ Close' : '+ Create New Project'}
      </button>

      {/* Collapsible Form */}
      {showCreateForm && (
        <div style={{ padding: 16, marginBottom: 16, background: '#fff8f2', border: '1px solid #ffe6d5', borderRadius: 6 }}>
          <form onSubmit={createProject}>
            <label style={{ display: 'block' }}>
              Project name: <input placeholder="Project name" value={name} onChange={e => setName(e.target.value)} />
            </label>
            <label style={{ display: 'block' }}>
              Description: <input placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
            </label>
            <label style={{ display: 'block' }}>
              Booked: <input type="date" value={booked} onChange={e => setBooked(e.target.value)} />
            </label>
            <label style={{ display: 'block' }}>
              Closed: <input type="date" value={closed} onChange={e => setClosed(e.target.value)} />
            </label>
            <label style={{ display: 'block' }}>
              Contract Amount: <input type="number" step="0.01" value={contractAmount} onChange={e => setContractAmount(e.target.value)} />
            </label>
            <label style={{ display: 'block' }}>
              Margin Start (%): <input type="number" step="0.01" value={marginStart} onChange={e => setMarginStart(e.target.value)} />
            </label>
            <label style={{ display: 'block' }}>
              Margin End (%): <input type="number" step="0.01" value={marginEnd} onChange={e => setMarginEnd(e.target.value)} />
            </label>
            <label style={{ display: 'block' }}>
              PM Name: <input placeholder="PM Name" value={pmName} onChange={e => setPmName(e.target.value)} />
            </label>
            <label style={{ display: 'block' }}>
              Customer: <input placeholder="Customer" value={customer} onChange={e => setCustomer(e.target.value)} />
            </label>
            <label style={{ display: 'block' }}>
              Project Type: 
              <select value={projectType} onChange={e => setProjectType(e.target.value)}>
                <option value="">Select type</option>
                <option value="New Construction">New Construction</option>
                <option value="Existing Construction">Existing Construction</option>
                <option value="Owner Direct">Owner Direct</option>
              </select>
            </label>
            <button type="submit" disabled={creating || !name.trim()}>{creating ? 'Creating…' : 'Create'}</button>
          </form>
        </div>
      )}
      {/* CSV Bulk Import UI */}
      <div style={{ marginTop: 12, padding: 12, background: '#fff8f2', border: '1px solid #ffe6d5', borderRadius: 6 }}>
        <strong>Bulk CSV import</strong>
        <p style={{ margin: '6px 0 8px 0', fontSize: 13 }}>Upload a CSV with a header row. Expected headers include: <code>name,description,booked,closed,contract_amount,margin_start,margin_end,pm_name,customer,project_type</code> and others from the migration.</p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="file" accept="text/csv,text/plain" onChange={e => handleFileChange(e)} />
          <button onClick={() => loadCsvPreview()} disabled={csvLoading || !csvText} style={{ padding: '6px 10px' }}>{csvLoading ? 'Loading…' : 'Load preview'}</button>
          <button onClick={() => importCsv()} disabled={csvImporting || csvPreviewRows.length === 0} style={{ padding: '6px 10px' }}>{csvImporting ? 'Importing…' : 'Import to Supabase'}</button>
        </div>
        {csvHeaders.length > 0 && (
          <div style={{ marginTop: 12, overflowX: 'auto' }}>
            <div style={{ fontSize: 13, marginBottom: 6 }}>Detected headers: {csvHeaders.join(', ')}</div>
            <table style={{ borderCollapse: 'collapse', width: '100%', background: '#fff' }}>
              <thead>
                <tr>
                  {csvHeaders.map((h, i) => <th key={i} style={{ padding: 6, borderBottom: '1px solid #eee', textAlign: 'left' }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {csvPreviewRows.slice(0, 6).map((row, rIdx) => (
                  <tr key={rIdx}>
                    {csvHeaders.map((h, cIdx) => <td key={cIdx} style={{ padding: 6, borderBottom: '1px solid #faf0ea' }}>{row[h] ?? ''}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Filter section */}
      <div style={{ marginTop: 16, padding: 12, background: '#f9f9f9', borderRadius: 6, border: '1px solid #e0e0e0', display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <strong style={{ fontSize: 13 }}>Filter by PM:</strong>
          <select value={pmFilter} onChange={e => setPmFilter(e.target.value)} style={{ padding: '6px 8px', borderRadius: 4, border: '1px solid #ccc' }}>
            <option value="">All PMs</option>
            {uniquePms.map(pm => <option key={pm} value={pm}>{pm}</option>)}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <strong style={{ fontSize: 13 }}>Filter by Project Type:</strong>
          <select value={projectTypeFilter} onChange={e => setProjectTypeFilter(e.target.value)} style={{ padding: '6px 8px', borderRadius: 4, border: '1px solid #ccc' }}>
            <option value="">All Types</option>
            {uniqueProjectTypes.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>
        {(pmFilter || projectTypeFilter) && (
          <button onClick={() => { setPmFilter(''); setProjectTypeFilter(''); }} style={{ padding: '6px 12px', background: '#999', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>Clear filters</button>
        )}
        <div style={{ flex: 1 }}></div>
        <span style={{ fontSize: 12, color: '#666' }}>Showing {filteredProjects.length} of {projects.length} projects</span>
      </div>

      {/* Stats Cards - PM and All PMs */}
      {(pmFilter && pmStats) || allPmStats ? (
        <div style={{ marginTop: 16, display: 'flex', gap: 16 }}>
          {/* PM Stats Card */}
          {pmFilter && pmStats && (
            <div style={{ flex: 1, padding: 16, background: '#fff', border: '2px solid var(--color-primary, #ff6b35)', borderRadius: 8 }}>
              <h3 style={{ marginTop: 0, marginBottom: 12, color: 'var(--color-primary, #ff6b35)' }}>{pmFilter} - Stats</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ background: '#f9f9f9', padding: 10, borderRadius: 4, border: '1px solid #eee' }}>
                  <div style={{ fontSize: 11, color: '#666', fontWeight: 500 }}>Total Projects</div>
                  <div style={{ fontSize: 20, fontWeight: 'bold', color: '#333' }}>{pmStats.totalProjects}</div>
                </div>
                <div style={{ background: '#f9f9f9', padding: 10, borderRadius: 4, border: '1px solid #eee' }}>
                  <div style={{ fontSize: 11, color: '#666', fontWeight: 500 }}>Total Contract Amount</div>
                  <div style={{ fontSize: 14, fontWeight: 'bold', color: '#333' }}>{currencyFormatter.format(pmStats.totalContractAmount)}</div>
                </div>
                <div style={{ background: '#f9f9f9', padding: 10, borderRadius: 4, border: '1px solid #eee' }}>
                  <div style={{ fontSize: 11, color: '#666', fontWeight: 500 }}>Avg Margin Improve.</div>
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: pmStats.avgMarginImprovement >= 0 ? '#22c55e' : '#ef4444' }}>{pmStats.avgMarginImprovement.toFixed(2)}%</div>
                </div>
                <div style={{ background: '#f9f9f9', padding: 10, borderRadius: 4, border: '1px solid #eee' }}>
                  <div style={{ fontSize: 11, color: '#666', fontWeight: 500 }}>Median Margin Improve.</div>
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: pmStats.medianMarginImprovement >= 0 ? '#22c55e' : '#ef4444' }}>{pmStats.medianMarginImprovement.toFixed(2)}%</div>
                </div>
                <div style={{ background: '#f9f9f9', padding: 10, borderRadius: 4, border: '1px solid #eee' }}>
                  <div style={{ fontSize: 11, color: '#666', fontWeight: 500 }}>Avg Prime Duration</div>
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>{pmStats.avgPrimeDuration > 0 ? pmStats.avgPrimeDuration.toFixed(1) : '-'} days</div>
                </div>
                <div style={{ background: '#f9f9f9', padding: 10, borderRadius: 4, border: '1px solid #eee' }}>
                  <div style={{ fontSize: 11, color: '#666', fontWeight: 500 }}>Median Prime Duration</div>
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>{pmStats.medianPrimeDuration > 0 ? pmStats.medianPrimeDuration.toFixed(1) : '-'} days</div>
                </div>
                <div style={{ background: '#f9f9f9', padding: 10, borderRadius: 4, border: '1px solid #eee' }}>
                  <div style={{ fontSize: 11, color: '#666', fontWeight: 500 }}>Avg Retrofit Duration</div>
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>{pmStats.avgRetrofitDuration > 0 ? pmStats.avgRetrofitDuration.toFixed(1) : '-'} days</div>
                </div>
                <div style={{ background: '#f9f9f9', padding: 10, borderRadius: 4, border: '1px solid #eee' }}>
                  <div style={{ fontSize: 11, color: '#666', fontWeight: 500 }}>Median Retrofit Duration</div>
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>{pmStats.medianRetrofitDuration > 0 ? pmStats.medianRetrofitDuration.toFixed(1) : '-'} days</div>
                </div>
              </div>
            </div>
          )}

          {/* All PMs Stats Card */}
          {allPmStats && (
            <div style={{ flex: 1, padding: 16, background: '#fff', border: '2px solid #0066cc', borderRadius: 8 }}>
              <h3 style={{ marginTop: 0, marginBottom: 12, color: '#0066cc' }}>All PMs - Stats</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ background: '#f0f4ff', padding: 10, borderRadius: 4, border: '1px solid #cce5ff' }}>
                  <div style={{ fontSize: 11, color: '#666', fontWeight: 500 }}>Total Projects</div>
                  <div style={{ fontSize: 20, fontWeight: 'bold', color: '#333' }}>{allPmStats.totalProjects}</div>
                </div>
                <div style={{ background: '#f0f4ff', padding: 10, borderRadius: 4, border: '1px solid #cce5ff' }}>
                  <div style={{ fontSize: 11, color: '#666', fontWeight: 500 }}>Total Contract Amount</div>
                  <div style={{ fontSize: 14, fontWeight: 'bold', color: '#333' }}>{currencyFormatter.format(allPmStats.totalContractAmount)}</div>
                </div>
                <div style={{ background: '#f0f4ff', padding: 10, borderRadius: 4, border: '1px solid #cce5ff' }}>
                  <div style={{ fontSize: 11, color: '#666', fontWeight: 500 }}>Avg Margin Improve.</div>
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: allPmStats.avgMarginImprovement >= 0 ? '#22c55e' : '#ef4444' }}>{allPmStats.avgMarginImprovement.toFixed(2)}%</div>
                </div>
                <div style={{ background: '#f0f4ff', padding: 10, borderRadius: 4, border: '1px solid #cce5ff' }}>
                  <div style={{ fontSize: 11, color: '#666', fontWeight: 500 }}>Median Margin Improve.</div>
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: allPmStats.medianMarginImprovement >= 0 ? '#22c55e' : '#ef4444' }}>{allPmStats.medianMarginImprovement.toFixed(2)}%</div>
                </div>
                <div style={{ background: '#f0f4ff', padding: 10, borderRadius: 4, border: '1px solid #cce5ff' }}>
                  <div style={{ fontSize: 11, color: '#666', fontWeight: 500 }}>Avg Prime Duration</div>
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>{allPmStats.avgPrimeDuration > 0 ? allPmStats.avgPrimeDuration.toFixed(1) : '-'} days</div>
                </div>
                <div style={{ background: '#f0f4ff', padding: 10, borderRadius: 4, border: '1px solid #cce5ff' }}>
                  <div style={{ fontSize: 11, color: '#666', fontWeight: 500 }}>Median Prime Duration</div>
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>{allPmStats.medianPrimeDuration > 0 ? allPmStats.medianPrimeDuration.toFixed(1) : '-'} days</div>
                </div>
                <div style={{ background: '#f0f4ff', padding: 10, borderRadius: 4, border: '1px solid #cce5ff' }}>
                  <div style={{ fontSize: 11, color: '#666', fontWeight: 500 }}>Avg Retrofit Duration</div>
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>{allPmStats.avgRetrofitDuration > 0 ? allPmStats.avgRetrofitDuration.toFixed(1) : '-'} days</div>
                </div>
                <div style={{ background: '#f0f4ff', padding: 10, borderRadius: 4, border: '1px solid #cce5ff' }}>
                  <div style={{ fontSize: 11, color: '#666', fontWeight: 500 }}>Median Retrofit Duration</div>
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>{allPmStats.medianRetrofitDuration > 0 ? allPmStats.medianRetrofitDuration.toFixed(1) : '-'} days</div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}

      <div style={{ overflowX: 'auto', marginTop: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Name</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Description</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Booked</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Closed</th>
              <th style={{ textAlign: 'right', borderBottom: '1px solid #ddd', padding: 8 }}>Contract</th>
              <th style={{ textAlign: 'right', borderBottom: '1px solid #ddd', padding: 8 }}>Margin Start</th>
              <th style={{ textAlign: 'right', borderBottom: '1px solid #ddd', padding: 8 }}>Margin End</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>PM</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Customer</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Project Type</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.map(p => (
              <>
                <tr key={p.id} onClick={() => selectProject(p)} style={{ cursor: 'pointer', background: selectedProjectId === p.id ? 'rgba(255, 107, 53, 0.1)' : 'transparent' }}>
                  <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{p.name}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{p.description}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{formatDate(p.booked)}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{formatDate(p.closed)}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #eee', textAlign: 'right' }}>{p.contract_amount != null ? currencyFormatter.format(Number(p.contract_amount)) : '-'}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #eee', textAlign: 'right' }}>{formatPct(p.margin_start)}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #eee', textAlign: 'right' }}>{formatPct(p.margin_end)}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{p.pm_name || '-'}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{p.customer || '-'}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{p.project_type || '-'}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                    <button onClick={() => startEdit(p)}>Edit</button>
                    <button style={{ marginLeft: 8 }} onClick={() => deleteProject(p.id)}>Delete</button>
                    <button style={{ marginLeft: 8 }} onClick={() => toggleInternal(p)}>{expandedId === p.id ? 'Hide Costs' : 'Costs'}</button>
                  </td>
                </tr>

                {expandedId === p.id && (
                  <tr key={p.id + '-internal'}>
                    <td colSpan={11} style={{ padding: 12, background: '#fafafa', borderBottom: '1px solid #eee' }}>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                          <thead>
                            <tr>
                              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: 8 }}>Labor Type</th>
                              <th style={{ textAlign: 'center', borderBottom: '1px solid #ccc', padding: 8 }}>Quoted Hours</th>
                              <th style={{ textAlign: 'center', borderBottom: '1px solid #ccc', padding: 8 }}>Estimated Hours</th>
                              <th style={{ textAlign: 'center', borderBottom: '1px solid #ccc', padding: 8 }}>Actual Hours</th>
                              <th style={{ textAlign: 'center', borderBottom: '1px solid #ccc', padding: 8 }}>Remaining Hours</th>
                            </tr>
                          </thead>
                          <tbody>
                            {['design', 'cad', 'pm', 'prep', 'tech', 'install'].map(type => {
                              const quoted = parseFloat(laborMatrix[type + '_quoted']) || 0;
                              const actual = parseFloat(laborMatrix[type + '_actual']) || 0;
                              const remaining = quoted - actual;
                              return (
                                <tr key={type}>
                                  <td style={{ padding: 8, borderBottom: '1px solid #eee', textTransform: 'capitalize' }}>{type}</td>
                                  <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                                    <input
                                      type="number" step="0.01" style={{ width: '100%', padding: 4 }}
                                      value={laborMatrix[type + '_quoted']}
                                      onChange={e => setLaborMatrix(prev => ({ ...prev, [type + '_quoted']: e.target.value }))}
                                    />
                                  </td>
                                  <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                                    <input
                                      type="number" step="0.01" style={{ width: '100%', padding: 4 }}
                                      value={laborMatrix[type + '_estimated']}
                                      onChange={e => setLaborMatrix(prev => ({ ...prev, [type + '_estimated']: e.target.value }))}
                                    />
                                  </td>
                                  <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                                    <input
                                      type="number" step="0.01" style={{ width: '100%', padding: 4 }}
                                      value={laborMatrix[type + '_actual']}
                                      onChange={e => setLaborMatrix(prev => ({ ...prev, [type + '_actual']: e.target.value }))}
                                    />
                                  </td>
                                  <td style={{ padding: 8, borderBottom: '1px solid #eee', textAlign: 'center', fontWeight: remaining < 0 ? 'bold' : 'normal', color: remaining < 0 ? 'red' : 'inherit' }}>
                                    {remaining.toFixed(2)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      <div style={{ overflowX: 'auto', marginTop: 16 }}>
                        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                          <thead>
                            <tr>
                              <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: 8 }}>Cost Type</th>
                              <th style={{ textAlign: 'center', borderBottom: '1px solid #ccc', padding: 8 }}>Quoted</th>
                              <th style={{ textAlign: 'center', borderBottom: '1px solid #ccc', padding: 8 }}>Estimated</th>
                              <th style={{ textAlign: 'center', borderBottom: '1px solid #ccc', padding: 8 }}>Actual</th>
                              <th style={{ textAlign: 'center', borderBottom: '1px solid #ccc', padding: 8 }}>Remaining</th>
                            </tr>
                          </thead>
                          <tbody>
                            {['material', 'sub_labor', 'permit_fee'].map(type => {
                              const quoted = parseFloat(laborMatrix[type + '_quoted']) || 0;
                              const actual = parseFloat(laborMatrix[type + '_actual']) || 0;
                              const remaining = quoted - actual;
                              return (
                                <tr key={type}>
                                  <td style={{ padding: 8, borderBottom: '1px solid #eee', textTransform: 'capitalize' }}>{type === 'sub_labor' ? 'Sub Labor' : type === 'permit_fee' ? 'Permit Fee' : type}</td>
                                  <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                                    <input
                                      type="number" step="0.01" style={{ width: '100%', padding: 4 }}
                                      value={laborMatrix[type + '_quoted']}
                                      onChange={e => setLaborMatrix(prev => ({ ...prev, [type + '_quoted']: e.target.value }))}
                                    />
                                  </td>
                                  <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                                    <input
                                      type="number" step="0.01" style={{ width: '100%', padding: 4 }}
                                      value={laborMatrix[type + '_estimated']}
                                      onChange={e => setLaborMatrix(prev => ({ ...prev, [type + '_estimated']: e.target.value }))}
                                    />
                                  </td>
                                  <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                                    <input
                                      type="number" step="0.01" style={{ width: '100%', padding: 4 }}
                                      value={laborMatrix[type + '_actual']}
                                      onChange={e => setLaborMatrix(prev => ({ ...prev, [type + '_actual']: e.target.value }))}
                                    />
                                  </td>
                                  <td style={{ padding: 8, borderBottom: '1px solid #eee', textAlign: 'center', fontWeight: remaining < 0 ? 'bold' : 'normal', color: remaining < 0 ? 'red' : 'inherit' }}>
                                    {remaining.toFixed(2)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <button onClick={() => saveInternal(p.id)} disabled={internalSaving}>{internalSaving ? 'Saving…' : 'Save'}</button>
                        <button onClick={() => toggleInternal(p)} disabled={internalSaving}>Cancel</button>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {selectedProjectId && (
        <div style={{ marginTop: 24, padding: 16, background: 'white', borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3>Project Timeline</h3>
          {projects.find(p => p.id === selectedProjectId)?.booked && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <strong>Project Start (Booked Date):</strong>
                  <p style={{ margin: '4px 0' }}>{formatDate(projects.find(p => p.id === selectedProjectId)?.booked)}</p>
                </div>
              </div>

              {/* Milestone inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16, background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
                {[
                  { name: 'Design Review', state: designReviewDays, setState: setDesignReviewDays, defaultDays: 30 },
                  { name: 'AHJ Approval', state: ahjApprovalDays, setState: setAhjApprovalDays, defaultDays: 14 },
                  { name: 'Rough-in Walk', state: roughInWalkDays, setState: setRoughInWalkDays, defaultDays: 14 },
                  { name: 'Wire Runs', state: wireRunsDays, setState: setWireRunsDays, defaultDays: 14 },
                  { name: 'Device Trim-out', state: deviceTrimOutDays, setState: setDeviceTrimOutDays, defaultDays: 5 },
                  { name: 'Programming & Testing', state: programmingTestingDays, setState: setProgrammingTestingDays, defaultDays: 3 },
                  { name: 'Final Testing', state: finalTestingDays, setState: setFinalTestingDays, defaultDays: 5 },
                  { name: 'Closeouts', state: closeoutsDays, setState: setCloseoutsDays, defaultDays: 2 }
                ].map((milestone, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={completedPhases[milestone.name] || false}
                      onChange={e => setCompletedPhases(prev => ({ ...prev, [milestone.name]: e.target.checked }))}
                      style={{ cursor: 'pointer', width: 18, height: 18 }}
                    />
                    <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, fontSize: '14px', cursor: 'pointer' }}>
                      <span style={{ minWidth: '140px' }}>{milestone.name}:</span>
                      <input
                        type="number"
                        value={milestone.state}
                        onChange={e => milestone.setState(e.target.value)}
                        style={{ width: '60px', padding: 6, fontSize: '14px' }}
                      />
                      <span style={{ fontSize: '12px', color: '#666' }}>days</span>
                    </label>
                  </div>
                ))}
              </div>

              <button onClick={() => saveTimeline(selectedProjectId)} disabled={timelineSaving} style={{ marginBottom: 16, padding: '8px 16px' }}>
                {timelineSaving ? 'Saving…' : 'Save Timeline'}
              </button>

              {/* Timeline visualization */}
              <div style={{ marginTop: 16, padding: 12, background: '#fafafa', borderRadius: 4, border: '1px solid #ddd' }}>
                <strong style={{ display: 'block', marginBottom: 12 }}>Gantt Timeline</strong>
                {(() => {
                  // Calculate phase durations
                  const phases = [
                    { name: 'Design Review', duration: designReviewDays ? parseInt(designReviewDays) : 0 },
                    { name: 'AHJ Approval', duration: ahjApprovalDays ? parseInt(ahjApprovalDays) : 0 },
                    { name: 'Rough-in Walk', duration: roughInWalkDays ? parseInt(roughInWalkDays) : 0 },
                    { name: 'Wire Runs', duration: wireRunsDays ? parseInt(wireRunsDays) : 0 },
                    { name: 'Device Trim-out', duration: deviceTrimOutDays ? parseInt(deviceTrimOutDays) : 0 },
                    { name: 'Programming & Testing', duration: programmingTestingDays ? parseInt(programmingTestingDays) : 0 },
                    { name: 'Final Testing', duration: finalTestingDays ? parseInt(finalTestingDays) : 0 },
                    { name: 'Closeouts', duration: closeoutsDays ? parseInt(closeoutsDays) : 0 }
                  ];
                  
                  // Calculate start position for each phase
                  let cumulativeDays = 0;
                  const phasesWithPositions = phases.map(phase => {
                    const startDay = cumulativeDays;
                    cumulativeDays += phase.duration;
                    return { ...phase, startDay };
                  });
                  
                  const totalDays = cumulativeDays || 1;
                  const graphWidth = 800;
                  const barHeight = 24;
                  const bookedDate = projects.find(p => p.id === selectedProjectId)?.booked;
                  const bookedDateObj = new Date(bookedDate);

                  // Generate month markers
                  const months = [];
                  let currentDate = new Date(bookedDateObj);
                  let daysSinceStart = 0;
                  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  
                  while (daysSinceStart <= totalDays) {
                    const month = currentDate.getMonth();
                    const year = currentDate.getFullYear();
                    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
                    const daysUntilNextMonth = Math.ceil((nextMonth - currentDate) / (1000 * 60 * 60 * 24));
                    
                    months.push({
                      label: `${monthNames[month]} '${year.toString().slice(-2)}`,
                      startDay: daysSinceStart,
                      endDay: daysSinceStart + daysUntilNextMonth
                    });
                    
                    daysSinceStart += daysUntilNextMonth;
                    currentDate = nextMonth;
                  }

                  const colors = ['#ff6b35', '#ff8555', '#ffa375', '#ffc195', '#ff6b35', '#ff8555', '#ffa375', '#ffc195'];

                  return (
                    <div style={{ display: 'flex', gap: 24, overflowX: 'auto', width: '100%' }}>
                      {/* Left side: phase names */}
                      <div style={{ flex: 0, minWidth: 180 }}>
                        {phasesWithPositions.map((phase, idx) => (
                          <div
                            key={idx}
                            style={{
                              height: barHeight + 4,
                              display: 'flex',
                              alignItems: 'center',
                              paddingRight: 12,
                              fontSize: '13px',
                              fontWeight: '500',
                              color: '#333',
                              borderBottom: '1px solid #e0e0e0',
                              background: idx % 2 === 0 ? '#fff' : '#f9f9f9'
                            }}
                          >
                            {phase.name}
                          </div>
                        ))}
                      </div>

                      {/* Right side: Gantt bars */}
                      <div style={{ flex: 0, minWidth: graphWidth }}>
                        {/* Month header */}
                        <svg width={graphWidth} height={28} style={{ background: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: '4px 4px 0 0', display: 'block' }}>
                          {months.map((month, idx) => {
                            const startPos = (month.startDay / totalDays) * graphWidth;
                            const endPos = Math.min((month.endDay / totalDays) * graphWidth, graphWidth);
                            const midPos = (startPos + endPos) / 2;
                            
                            return (
                              <g key={idx}>
                                {/* Month divider line */}
                                <line
                                  x1={startPos}
                                  y1="4"
                                  x2={startPos}
                                  y2="24"
                                  stroke="#ccc"
                                  strokeWidth="1"
                                />
                                {/* Month label */}
                                <text
                                  x={midPos}
                                  y="17"
                                  textAnchor="middle"
                                  fontSize="12"
                                  fill="#666"
                                  fontWeight="500"
                                >
                                  {month.label}
                                </text>
                              </g>
                            );
                          })}
                          {/* Right border */}
                          <line
                            x1={graphWidth}
                            y1="4"
                            x2={graphWidth}
                            y2="24"
                            stroke="#ccc"
                            strokeWidth="1"
                          />
                        </svg>

                        {/* Gantt bars */}
                        <svg width={graphWidth} height={phasesWithPositions.length * (barHeight + 4)} style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: '0 0 4px 4px', display: 'block' }}>
                          {/* Grid lines for months */}
                          {months.map((month, idx) => {
                            const xPos = (month.startDay / totalDays) * graphWidth;
                            return (
                              <line
                                key={`grid-${idx}`}
                                x1={xPos}
                                y1="0"
                                x2={xPos}
                                y2={phasesWithPositions.length * (barHeight + 4)}
                                stroke="#f0f0f0"
                                strokeWidth="1"
                              />
                            );
                          })}

                          {/* Gantt bars for each phase */}
                          {phasesWithPositions.map((phase, idx) => {
                            const barStartX = (phase.startDay / totalDays) * graphWidth;
                            const barWidth = Math.max((phase.duration / totalDays) * graphWidth, 12);
                            const barY = idx * (barHeight + 4) + 2;
                            
                            return (
                              <g key={idx}>
                                {/* Background row */}
                                <rect
                                  x="0"
                                  y={barY}
                                  width={graphWidth}
                                  height={barHeight}
                                  fill={idx % 2 === 0 ? '#fff' : '#f9f9f9'}
                                />
                                {/* Phase bar */}
                                <rect
                                  x={barStartX}
                                  y={barY + 2}
                                  width={barWidth}
                                  height={barHeight - 4}
                                  fill={completedPhases[phase.name] ? '#22c55e' : colors[idx % colors.length]}
                                  stroke="#fff"
                                  strokeWidth="2"
                                  rx="3"
                                />
                                {/* Duration label - show if bar is wide enough */}
                                {barWidth > 40 && (
                                  <text
                                    x={barStartX + barWidth / 2}
                                    y={barY + barHeight / 2 + 4}
                                    textAnchor="middle"
                                    fontSize="12"
                                    fill="white"
                                    fontWeight="500"
                                  >
                                    {phase.duration}d
                                  </text>
                                )}
                              </g>
                            );
                          })}
                        </svg>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {editingId && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
          }}
          onClick={cancelEdit}
        >
          <div
            role="dialog"
            aria-modal="true"
            style={{ background: '#fff', padding: 20, borderRadius: 8, minWidth: 320 }}
            onClick={e => e.stopPropagation()}
          >
            <h3>Edit project</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input value={editName} onChange={e => setEditName(e.target.value)} />
              <input value={editDescription} onChange={e => setEditDescription(e.target.value)} />
              <label>
                Booked: <input type="date" value={editBooked || ''} onChange={e => setEditBooked(e.target.value)} />
              </label>
              <label>
                Closed: <input type="date" value={editClosed || ''} onChange={e => setEditClosed(e.target.value)} />
              </label>
              <label>
                Contract Amount: <input type="number" step="0.01" value={editContractAmount ?? ''} onChange={e => setEditContractAmount(e.target.value)} />
              </label>
              <label>
                Margin Start (%): <input type="number" step="0.01" value={editMarginStart ?? ''} onChange={e => setEditMarginStart(e.target.value)} />
              </label>
              <label>
                Margin End (%): <input type="number" step="0.01" value={editMarginEnd ?? ''} onChange={e => setEditMarginEnd(e.target.value)} />
              </label>
              <input placeholder="PM Name" value={editPmName} onChange={e => setEditPmName(e.target.value)} />
              <input placeholder="Customer" value={editCustomer} onChange={e => setEditCustomer(e.target.value)} />
              <label>
                Project Type:
                <select value={editProjectType} onChange={e => setEditProjectType(e.target.value)}>
                  <option value="">Select type</option>
                  <option value="New Construction">New Construction</option>
                  <option value="Existing Construction">Existing Construction</option>
                  <option value="Owner Direct">Owner Direct</option>
                </select>
              </label>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={() => saveEdit(editingId)} disabled={saving || !editName.trim()}>{saving ? 'Saving…' : 'Save'}</button>
                <button onClick={cancelEdit} disabled={saving}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}