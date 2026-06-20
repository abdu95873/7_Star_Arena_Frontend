import { Link } from 'react-router-dom';
import { Button } from '../../components/ui.jsx';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink-950 px-6 text-center">
      <div className="text-7xl">🥅</div>
      <h1 className="text-3xl font-extrabold text-white">404 — Off target</h1>
      <p className="text-ink-400">The page you're looking for went out of bounds.</p>
      <Button as={Link} to="/">Back to home</Button>
    </div>
  );
}
