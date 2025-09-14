import { cn } from '../../utils/cn';

export default function CardTitle({ icon=null, title, subtitle, right=null, className='' }) {
 return (
  <div className={cn('flex items-start justify-between gap-3', className)}>
   <div className="flex items-start gap-3">
    {icon && <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-400 to-rose-400 grid place-items-center text-white shadow-sm">{icon}</div>}
    <div>
     <h2 className="text-lg font-semibold leading-6">{title}</h2>
     {subtitle && <p className="text-sm text-gray-600 mt-0.5">{subtitle}</p>}
    </div>
   </div>
   {right}
  </div>
 );
}