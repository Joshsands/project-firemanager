import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/Auth';

export default function ProjectTasks() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');

  async function loadTasks() {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (error) console.error(error);
    else setTasks(data ?? []);
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

  return (
    <div>
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