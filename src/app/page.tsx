import TaskListWrapper from './components/TaskListWrapper';
import GitHubUsers from './components/GitHubUsers';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto py-6 px-4">
          <h1 className="text-3xl font-bold text-black text-center">Gerenciador de Tarefas</h1>
        </div>
      </header>
      <TaskListWrapper />
  <GitHubUsers />
    </div>
  );
}
