export default function StatPill({ label, value }) {
 return (
  <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs text-gray-700 bg-white/70">
   <strong className="font-medium">{value}</strong> {label}
  </span>
 );
}