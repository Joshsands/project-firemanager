import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/Auth';

export default function Dashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  async function loadProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) console.error(error);
    else setProjects(data ?? []);
  }

  async function createProject(e) {
    e.preventDefault();
    const { error } = await supabase.from('projects').insert({
      name,
      description,
      owner_id: user.id
    });
    if (error) return alert(error.message);
    setName(''); setDescription('');
    loadProjects();
  }

  useEffect(() => { loadProjects(); }, []);

  return (
    <div>
      <h2>Your projects</h2>
      <form onSubmit={createProject}>
        <input placeholder="Project name" value={name} onChange={e => setName(e.target.value)} />
        <input placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
        <button type="submit">Create</button>
      </form>
      <ul>
        {projects.map(p => (
          <li key={p.id}>
            <strong>{p.name}</strong> — {p.description}
          </li>
        ))}
      </ul>
    </div>
  );
}