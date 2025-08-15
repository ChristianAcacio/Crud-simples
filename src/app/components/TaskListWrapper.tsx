import TaskList from './TaskList';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

async function getInitialData() {
  try {
    const tasksRes = await fetch(`${API_URL}/tasks`, {
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
