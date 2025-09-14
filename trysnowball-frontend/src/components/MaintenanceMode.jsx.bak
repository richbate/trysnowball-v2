import React, { useState } from 'react';

const MaintenanceMode = () => {
 const [email, setEmail] = useState('');
 const [submitted, setSubmitted] = useState(false);

 const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Simple email validation
  if (!email || !email.includes('@')) return;
  
  try {
   // Store email locally for now - you can add proper backend later
   const waitlist = JSON.parse(localStorage.getItem('waitlist') || '[]');
   if (!waitlist.includes(email)) {
    waitlist.push(email);
    localStorage.setItem('waitlist', JSON.stringify(waitlist));
   }
   setSubmitted(true);
  } catch (error) {
   console.error('Failed to join waitlist:', error);
  }
 };

 return (
  <div style={{
   margin: 0,
   fontFamily: 'system-ui, -apple-system, sans-serif',
   display: 'flex',
   flexDirection: 'column',
   justifyContent: 'center',
   alignItems: 'center',
   minHeight: '100vh',
   background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
   color: 'white',
   textAlign: 'center',
   padding: '2rem'
  }}>
   {/* Logo/Brand */}
   <div style={{ marginBottom: '2rem' }}>
    <div style={{ 
     fontSize: '3rem', 
     fontWeight: 'bold',
     marginBottom: '0.5rem'
    }}>
     ❄️ TrySnowball
    </div>
    <div style={{ 
     fontSize: '1.2rem', 
     opacity: 0.9
    }}>
     Smart UK Debt Payoff
    </div>
   </div>

   {/* Main Message */}
   <div style={{ maxWidth: '600px', marginBottom: '3rem' }}>
    <h1 style={{ 
     fontSize: '2.5rem', 
     fontWeight: '600',
     marginBottom: '1rem',
     lineHeight: '1.2'
    }}>
     We're upgrading TrySnowball
    </h1>
    <p style={{ 
     fontSize: '1.1rem', 
     marginBottom: '2rem',
     opacity: 0.9,
     lineHeight: '1.6'
    }}>
     Making it faster, smarter, and more reliable. We'll be back soon with a better debt-free journey for you.
    </p>
   </div>

   {/* Waitlist Form */}
   {!submitted ? (
    <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
     <div style={{ 
      display: 'flex', 
      gap: '0.5rem',
      flexDirection: window.innerWidth > 480 ? 'row' : 'column',
      alignItems: 'center'
     }}>
      <input
       type="email"
       placeholder="your@email.com"
       value={email}
       onChange={(e) => setEmail(e.target.value)}
       required
       style={{
        padding: '0.75rem 1rem',
        fontSize: '1rem',
        border: 'none',
        borderRadius: '8px',
        minWidth: '280px',
        outline: 'none'
       }}
      />
      <button
       type="submit"
       style={{
        background: 'rgba(255, 255, 255, 0.2)',
        color: 'white',
        border: '2px solid white',
        padding: '0.75rem 1.5rem',
        fontSize: '1rem',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        fontWeight: '600'
       }}
       onMouseOver={(e) => {
        e.target.style.background = 'white';
        e.target.style.color = '#667eea';
       }}
       onMouseOut={(e) => {
        e.target.style.background = 'rgba(255, 255, 255, 0.2)';
        e.target.style.color = 'white';
       }}
      >
       Get notified
      </button>
     </div>
    </form>
   ) : (
    <div style={{ 
     background: 'rgba(255, 255, 255, 0.2)',
     padding: '1rem 2rem',
     borderRadius: '8px',
     marginBottom: '2rem'
    }}>
     <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>
      ✅ Thanks! We'll notify you when we're back
     </div>
    </div>
   )}

   {/* Status */}
   <div style={{ 
    fontSize: '0.9rem', 
    opacity: 0.7,
    marginBottom: '1rem'
   }}>
    Expected downtime: ~2-4 hours
   </div>

   {/* Footer */}
   <div style={{ 
    fontSize: '0.8rem', 
    opacity: 0.6
   }}>
    Having issues? Email us at help@trysnowball.co.uk
   </div>
  </div>
 );
};

export default MaintenanceMode;