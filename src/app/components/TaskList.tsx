'use client';
import { useMemo, useState } from 'react';

interface Task {
  id: number;
  title: string;
  completed: boolean;
}

interface TaskListProps {
  initialTasks: Task[];
}

// Use Next.js rewrite proxy by default; allow override via env
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

type Filter = 'all' | 'active' | 'completed';

export default function TaskList({ initialTasks }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [newTask, setNewTask] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const counts = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const active = total - completed;
    return { total, completed, active };
  }, [tasks]);

  const visibleTasks = useMemo(() => {
    switch (filter) {
      case 'active':
        return tasks.filter(t => !t.completed);
      case 'completed':
        return tasks.filter(t => t.completed);
      default:
        return tasks;
    }
  }, [tasks, filter]);

  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);
  const res = await fetch(`${API_BASE}/tasks`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Task[] = await res.json();
      setTasks(data);
    } catch (e: any) {
      setError('Não foi possível carregar as tarefas. Verifique se o backend está rodando.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTask.trim();
    if (!title) return;
    setError(null);
    try {
  const response = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data: Task = await response.json();
      setTasks(prev => [...prev, data]);
      setNewTask('');
    } catch (e: any) {
      setError('Erro ao adicionar tarefa.');
      console.error(e);
    }
  };

  const toggleTask = async (id: number) => {
    try {
      const current = tasks.find(t => t.id === id);
      if (!current) return;
  const response = await fetch(`${API_BASE}/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !current.completed }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data: Task = await response.json();
      setTasks(prev => prev.map(t => (t.id === id ? data : t)));
    } catch (e: any) {
      setError('Erro ao atualizar tarefa.');
      console.error(e);
    }
  };

  const deleteTask = async (id: number) => {
    try {
    const res = await fetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (e: any) {
      setError('Erro ao deletar tarefa.');
      console.error(e);
    }
  };

  const clearCompleted = async () => {
    const completedIds = tasks.filter(t => t.completed).map(t => t.id);
    if (completedIds.length === 0) return;
    setError(null);
    try {
      await Promise.all(
  completedIds.map(id => fetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE' }))
      );
      setTasks(prev => prev.filter(t => !t.completed));
    } catch (e: any) {
      setError('Erro ao limpar tarefas concluídas.');
      console.error(e);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-14 px-4">
      <div className="bg-white rounded-lg shadow p-10">
        <div className="flex items-center justify-between gap-8 mb-8">
      <h2 className="text-2xl font-semibold text-black">Minhas Tarefas</h2>
          <button
            onClick={refresh}
      className="text-sm px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
          >
            Atualizar
          </button>
        </div>

    <form onSubmit={addTask} className="flex items-center gap-4 mb-8">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Adicionar nova tarefa"
      className="flex-1 h-10 box-border px-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-black placeholder:text-black"
          />
          <button
            type="submit"
      className="inline-flex items-center justify-center h-10 text-sm px-4 rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
          >
            Adicionar
          </button>
        </form>

        <div className="flex items-center justify-between flex-wrap gap-6 mb-8">
          <div className="text-sm text-gray-600">
            {counts.active} pendentes • {counts.completed} concluídas • {counts.total} no total
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setFilter('all')}
        className={`text-sm px-3 py-1.5 rounded-md border ${
                filter === 'all'
          ? 'bg-emerald-600 text-white border-transparent'
          : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter('active')}
        className={`text-sm px-3 py-1.5 rounded-md border ${
                filter === 'active'
          ? 'bg-emerald-600 text-white border-transparent'
          : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              Ativas
            </button>
            <button
              onClick={() => setFilter('completed')}
        className={`text-sm px-3 py-1.5 rounded-md border ${
                filter === 'completed'
          ? 'bg-emerald-600 text-white border-transparent'
          : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              Concluídas
            </button>
            <button
              onClick={clearCompleted}
              disabled={counts.completed === 0}
        className="text-sm px-3 py-1.5 rounded-md border border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
            >
              Limpar concluídas
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded text-sm bg-red-50 text-red-700 border border-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-gray-500">Carregando…</div>
        ) : visibleTasks.length === 0 ? (
          <div className="py-12 text-center text-gray-500">Nada por aqui. Adicione uma tarefa para começar.</div>
        ) : (
          <ul className="space-y-4">
            {visibleTasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center justify-between p-5 bg-gray-50 rounded border"
              >
                <label className="flex items-center gap-4 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                    className="size-4"
                  />
                  <span className={task.completed ? 'line-through text-black' : 'text-black'}>
                    {task.title}
                  </span>
                </label>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="text-sm px-3 py-1.5 rounded-md border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
