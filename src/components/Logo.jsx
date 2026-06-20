import { Link } from 'react-router-dom';

export default function Logo({ to = '/', light = false }) {
  return (
    <Link to={to} className="flex items-center gap-2">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-turf-500 text-lg shadow-glow">⚽</span>
      <span className={`text-xl font-extrabold tracking-tight ${light ? 'text-white' : 'text-white'}`}>
        7 Star<span className="text-turf-400"> Arena</span>
      </span>
    </Link>
  );
}
