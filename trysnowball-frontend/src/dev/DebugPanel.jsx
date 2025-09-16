import React from 'react';
export default function DebugPanel() {
  if (process.env.NODE_ENV !== 'development') return null;
  const nuke = () => {
    const req = indexedDB.deleteDatabase('trysnowball');
    req.onsuccess = () => alert('IndexedDB deleted. Refresh.');
    req.onerror = () => alert('Failed to delete IndexedDB');
  };
  return (
    <div style={{position:'fixed',bottom:8,right:8,background:'#111',color:'#fff',padding:'8px 12px',borderRadius:8,opacity:0.8,zIndex:9999}}>
      <button onClick={nuke} style={{background:'#e11',color:'#fff',border:'none',padding:'6px 10px',borderRadius:6,cursor:'pointer'}}>Nuke IDB</button>
    </div>
  );
}