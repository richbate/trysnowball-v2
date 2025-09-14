import React, { useState } from 'react';
import { X, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { parseHistoryTable } from '../../utils/import/parseHistoryTable';
import { LocalDebtStore } from '../../data/localDebtStore';
import { formatCurrency } from '../../utils/debtFormatting';

const HistoryImporterModal = ({ debt, isOpen, onClose, onImportComplete }) => {
 const [rawInput, setRawInput] = useState('');
 const [parsed, setParsed] = useState([]);
 const [error, setError] = useState('');
 const [importing, setImporting] = useState(false);
 const [importSuccess, setImportSuccess] = useState(false);

 const exampleFormat = `June 2024,2200
July 2024,2100
August 2024,1950
September 2024,1800`;

 const handleParse = () => {
  try {
   if (!rawInput.trim()) {
    setError('Please enter some data to import');
    return;
   }

   const result = parseHistoryTable(rawInput, debt.id);
   setParsed(result);
   setError('');
  } catch (err) {
   setError(err.message || 'Unable to parse. Please check your table format.');
   setParsed([]);
  }
 };

 const handleImport = async () => {
  if (parsed.length === 0) return;
  
  setImporting(true);
  setError('');

  try {
   const store = LocalDebtStore.getInstance();
   await store.bulkAddSnapshots(parsed);
   
   setImportSuccess(true);
   setTimeout(() => {
    onImportComplete && onImportComplete(parsed.length);
    handleClose();
   }, 1500);
  } catch (err) {
   setError('Failed to import snapshots. Please try again.');
   console.error('Import error:', err);
  } finally {
   setImporting(false);
  }
 };

 const handleClose = () => {
  setRawInput('');
  setParsed([]);
  setError('');
  setImportSuccess(false);
  onClose();
 };

 if (!isOpen) return null;

 return (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
   <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
    {/* Header */}
    <div className="flex items-center justify-between p-6 border-b border-gray-200 ">
     <div>
      <h2 className="text-xl font-semibold text-gray-900 ">
       Import Balance History
      </h2>
      <p className="text-sm text-gray-600 mt-1">
       Add historical balance data for {debt.name}
      </p>
     </div>
     <button
      onClick={handleClose}
      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
     >
      <X size={20} />
     </button>
    </div>

    {/* Content */}
    <div className="p-6 overflow-y-auto max-h-[60vh]">
     {importSuccess ? (
      <div className="text-center py-8">
       <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
       <h3 className="text-lg font-semibold mb-2">Import Successful!</h3>
       <p className="text-gray-600 ">
        {parsed.length} historical snapshots added
       </p>
      </div>
     ) : (
      <>
       {/* Instructions */}
       <div className="mb-6">
        <h3 className="font-medium text-gray-900 mb-2">
         Format Instructions
        </h3>
        <p className="text-sm text-gray-600 mb-3">
         Paste your balance history in a simple format with month and balance.
         Each line should have the month/date and balance separated by a comma.
        </p>
        <div className="bg-gray-50 p-3 rounded-lg">
         <p className="text-xs font-mono text-gray-600 mb-1">
          Example format:
         </p>
         <pre className="text-xs font-mono text-gray-800 ">
          {exampleFormat}
         </pre>
        </div>
       </div>

       {/* Input Area */}
       <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
         Paste your data here
        </label>
        <textarea
         value={rawInput}
         onChange={(e) => setRawInput(e.target.value)}
         placeholder="Month,Balance&#10;June 2024,2200&#10;July 2024,2100"
         className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg 
              bg-white text-gray-900 
              focus:ring-2 focus:ring-blue-500 focus:border-transparent
              font-mono text-sm"
        />
       </div>

       {/* Parse Button */}
       <button
        onClick={handleParse}
        disabled={!rawInput.trim()}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
             disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-4"
       >
        Preview Import
       </button>

       {/* Error Message */}
       {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 
               border border-red-200 rounded-lg mb-4">
         <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
         <p className="text-sm text-red-700 ">{error}</p>
        </div>
       )}

       {/* Preview */}
       {parsed.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
         <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 ">
          <h4 className="font-medium text-sm text-gray-900 ">
           Preview ({parsed.length} entries)
          </h4>
         </div>
         <div className="max-h-48 overflow-y-auto">
          <table className="w-full text-sm">
           <thead>
            <tr className="border-b border-gray-200 ">
             <th className="text-left px-4 py-2 font-medium text-gray-700 ">
              Date
             </th>
             <th className="text-right px-4 py-2 font-medium text-gray-700 ">
              Balance
             </th>
            </tr>
           </thead>
           <tbody>
            {parsed.map((snapshot, idx) => (
             <tr key={idx} className="border-b border-gray-100 ">
              <td className="px-4 py-2 text-gray-900 ">
               {new Date(snapshot.timestamp).toLocaleDateString('en-GB', {
                month: 'short',
                year: 'numeric'
               })}
              </td>
              <td className="px-4 py-2 text-right text-gray-900 ">
               {formatCurrency(snapshot.balance)}
              </td>
             </tr>
            ))}
           </tbody>
          </table>
         </div>
        </div>
       )}
      </>
     )}
    </div>

    {/* Footer */}
    {!importSuccess && (
     <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 ">
      <button
       onClick={handleClose}
       className="px-4 py-2 text-gray-700 hover:bg-gray-100 
            rounded-lg transition-colors"
      >
       Cancel
      </button>
      <button
       onClick={handleImport}
       disabled={parsed.length === 0 || importing}
       className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 
            disabled:opacity-50 disabled:cursor-not-allowed transition-colors
            flex items-center gap-2"
      >
       {importing ? (
        <>
         <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
         Importing...
        </>
       ) : (
        <>
         <Upload size={18} />
         Import {parsed.length} Snapshots
        </>
       )}
      </button>
     </div>
    )}
   </div>
  </div>
 );
};

export default HistoryImporterModal;