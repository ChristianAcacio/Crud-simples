'use client';
import { useState, useEffect } from 'react';

interface Task {
  id: number;
  title: string;
  completed: boolean;
}

interface GithubUser {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
}

export default function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [githubUsers, setGithubUsers] = useState<GithubUser[]>([]);

  useEffect(() => {
    fetchTasks();
    fetchGithubUsers();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/tasks');
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
    }
  };

  const fetchGithubUsers = async () => {
    try {
      const response = await fetch('https://api.github.com/users?per_page=5');
      const data = await response.json();
      setGithubUsers(data);
    } catch (error) {
      console.error('Erro ao carregar usuários do GitHub:', error);
    }
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    try {
      const response = await fetch('http://localhost:3000/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newTask }),
      });
      const data = await response.json();
      setTasks([...tasks, data]);
      setNewTask('');
    } catch (error) {
      console.error('Erro ao adicionar tarefa:', error);
    }
  };

  const toggleTask = async (id: number) => {
    try {
      const task = tasks.find(t => t.id === id);
      const response = await fetch(`http://localhost:3000/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: !task?.completed }),
      });
      const data = await response.json();
      setTasks(tasks.map(task => task.id === id ? data : task));
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
    }
  };

  const deleteTask = async (id: number) => {
    try {
      await fetch(`http://localhost:3000/api/tasks/${id}`, {
        method: 'DELETE',
      });
      setTasks(tasks.filter(task => task.id !== id));
    } catch (error) {
      console.error('Erro ao deletar tarefa:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-8 p-4">
      {/* Lista de Tarefas */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Lista de Tarefas</h2>
        <form onSubmit={addTask} className="mb-4 flex">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Nova tarefa..."
            className="flex-1 p-2 border rounded-l"
          />
          <button 
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600"
          >
            Adicionar
          </button>
        </form>

        <ul className="space-y-2">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex items-center justify-between p-3 bg-white rounded shadow"
            >
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task.id)}
                  className="mr-3"
                />
                <span className={task.completed ? 'line-through text-gray-500' : ''}>
                  {task.title}
                </span>
              </div>
              <button
                onClick={() => deleteTask(task.id)}
                className="text-red-500 hover:text-red-700"
              >
                Deletar
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Lista de Usuários do GitHub */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Usuários do GitHub</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {githubUsers.map((user) => (
            <div key={user.id} className="bg-white p-4 rounded shadow">
              <img
                src={user.avatar_url}
                alt={user.login}
                className="w-16 h-16 rounded-full mx-auto mb-2"
              />
              <h3 className="text-lg font-semibold text-center">{user.login}</h3>
              <a
                href={user.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700 block text-center mt-2"
              >
                Ver Perfil
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
