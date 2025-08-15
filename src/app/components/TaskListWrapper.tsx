import TaskList from './TaskList';
// Use Next.js rewrite proxy by default to avoid CORS and host issues
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

async function getInitialData() {
  try {
  const tasksRes = await fetch(`${API_BASE}/tasks`, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!tasksRes.ok) {
      console.error('Tasks fetch failed:', await tasksRes.text());
      throw new Error('Failed to fetch tasks');
    }

    const tasks = await tasksRes.json();

    return { initialTasks: tasks };
  } catch (error) {
    console.error('Error fetching initial data:', error);
    return { initialTasks: [] };
  }
}

export default async function TaskListWrapper() {
  const { initialTasks } = await getInitialData();
  return <TaskList initialTasks={initialTasks} />;
}
