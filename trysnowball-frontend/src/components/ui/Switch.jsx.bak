export default function Switch({ checked, onChange }) {
 return (
  <button
   type="button"
   onClick={() => onChange({ target: { checked: !checked } })}
   aria-pressed={checked}
   className={`flex-shrink-0 h-6 w-11 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-300'} relative overflow-hidden`}
  >
   <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transform transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
  </button>
 );
}