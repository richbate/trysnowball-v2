export default function Card({ children, className = '' }) {
 return (
  <section
   className={`rounded-card border bg-surface/80 backdrop-blur shadow-card p-6 ${className}`}
  >
   {children}
  </section>
 );
}