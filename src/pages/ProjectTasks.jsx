import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/Auth';

export default function ProjectTasks() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [project, setProject] = useState(null);
  const [activeTab, setActiveTab] = useState('main');

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

  async function loadTasks() {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (error) console.error(error);
    else setTasks(data ?? []);
  }

  async function loadProject() {
    const { data, error } = await supabase.from('projects').select('*').eq('id', projectId).single();
    if (error) console.error(error);
    else setProject(data ?? null);
  }

  async function createTask(e) {
    e.preventDefault();
    const { error } = await supabase.from('tasks').insert({
      project_id: projectId,
      assignee_id: user.id,
      title
    });
    if (error) return alert(error.message);
    setTitle('');
    loadTasks();
  }

  useEffect(() => { loadTasks(); }, [projectId]);
  useEffect(() => { loadProject(); }, [projectId]);

  return (
    <div>
      <h3>{project ? project.name : 'Project'}</h3>
      <div style={{ marginBottom: 12 }}>
        <button onClick={() => setActiveTab('main')} disabled={activeTab === 'main'}>Main</button>
        <button onClick={() => setActiveTab('internal')} style={{ marginLeft: 8 }} disabled={activeTab === 'internal'}>Internal Labor</button>
      </div>

      {activeTab === 'main' && (
        <div style={{ marginBottom: 20 }}>
          <h4>Main</h4>
          {project ? (
            <div>
              <p><strong>Description:</strong> {project.description}</p>
              <p><strong>Booked:</strong> {formatDate(project.booked)}</p>
              <p><strong>Closed:</strong> {formatDate(project.closed)}</p>
              <p><strong>Contract Amount:</strong> {project.contract_amount != null ? currencyFormatter.format(Number(project.contract_amount)) : '-'}</p>
              <p><strong>Margin Start:</strong> {formatPct(project.margin_start)}</p>
              <p><strong>Margin End:</strong> {formatPct(project.margin_end)}</p>
              <p><strong>PM Name:</strong> {project.pm_name || '-'}</p>
              <p><strong>Project Type:</strong> {project.project_type || '-'}</p>
              <p><strong>Customer:</strong> {project.customer || '-'}</p>
            </div>
          ) : (
            <p>Loading project...</p>
          )}
        </div>
      )}

      {activeTab === 'internal' && (
        <div>
          <h4>Internal Labor</h4>
          {project ? (
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
                    const quoted = Number(project[type + '_quoted']) || 0;
                    const actual = Number(project[type + '_actual']) || 0;
                    const remaining = quoted - actual;
                    return (
                      <tr key={type}>
                        <td style={{ padding: 8, borderBottom: '1px solid #eee', textTransform: 'capitalize' }}>{type}</td>
                        <td style={{ padding: 8, borderBottom: '1px solid #eee', textAlign: 'center' }}>{project[type + '_quoted'] != null ? Number(project[type + '_quoted']).toFixed(2) : '-'}</td>
                        <td style={{ padding: 8, borderBottom: '1px solid #eee', textAlign: 'center' }}>{project[type + '_estimated'] != null ? Number(project[type + '_estimated']).toFixed(2) : '-'}</td>
                        <td style={{ padding: 8, borderBottom: '1px solid #eee', textAlign: 'center' }}>{project[type + '_actual'] != null ? Number(project[type + '_actual']).toFixed(2) : '-'}</td>
                        <td style={{ padding: 8, borderBottom: '1px solid #eee', textAlign: 'center', fontWeight: remaining < 0 ? 'bold' : 'normal', color: remaining < 0 ? 'red' : 'inherit' }}>
                          {remaining.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div style={{ marginTop: 16, overflowX: 'auto' }}>
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
                      const quoted = Number(project[type + '_quoted']) || 0;
                      const actual = Number(project[type + '_actual']) || 0;
                      const remaining = quoted - actual;
                      return (
                        <tr key={type}>
                          <td style={{ padding: 8, borderBottom: '1px solid #eee', textTransform: 'capitalize' }}>{type === 'sub_labor' ? 'Sub Labor' : type === 'permit_fee' ? 'Permit Fee' : type}</td>
                          <td style={{ padding: 8, borderBottom: '1px solid #eee', textAlign: 'center' }}>{project[type + '_quoted'] != null ? Number(project[type + '_quoted']).toFixed(2) : '-'}</td>
                          <td style={{ padding: 8, borderBottom: '1px solid #eee', textAlign: 'center' }}>{project[type + '_estimated'] != null ? Number(project[type + '_estimated']).toFixed(2) : '-'}</td>
                          <td style={{ padding: 8, borderBottom: '1px solid #eee', textAlign: 'center' }}>{project[type + '_actual'] != null ? Number(project[type + '_actual']).toFixed(2) : '-'}</td>
                          <td style={{ padding: 8, borderBottom: '1px solid #eee', textAlign: 'center', fontWeight: remaining < 0 ? 'bold' : 'normal', color: remaining < 0 ? 'red' : 'inherit' }}>
                            {remaining.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p>Loading...</p>
          )}
        </div>
      )}

      <hr />

      <h3>Tasks</h3>
      <form onSubmit={createTask}>
        <input placeholder="Task title" value={title} onChange={e => setTitle(e.target.value)} />
        <button type="submit">Add</button>
      </form>
      <ul>
        {tasks.map(t => (
          <li key={t.id}>{t.title} — {t.status}</li>
        ))}
      </ul>
    </div>
  );
}