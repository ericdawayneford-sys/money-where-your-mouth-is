import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase (replace with your keys later or use environment variables in Vercel)
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function App() {
  const [session, setSession] = useState(null);
  const [matches, setMatches] = useState([]);
  const [stakeAmount, setStakeAmount] = useState('');
  const [gameTitle, setGameTitle] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Automatically calculate the 5% platform fee
  const numericStake = parseFloat(stakeAmount) || 0;
  const platformFee = (numericStake * 0.05).toFixed(2);
  const totalPayout = (numericStake * 2 - platformFee).toFixed(2);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    fetchMatches();
    return () => subscription.unsubscribe();
  }, []);

  async function fetchMatches() {
    const { data, error } = await supabase.from('matches').select('*').order('created_at', { ascending: false });
    if (!error && data) setMatches(data);
  }

  async function handleLogin(e) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
  }

  async function handleCreateMatch(e) {
    e.preventDefault();
    if (!session) return alert('Please log in first!');
    
    const { error } = await supabase.from('matches').insert([
      { 
        creator_id: session.user.id, 
        stake_amount: numericStake, 
        platform_fee: platformFee,
        match_status: 'pending_deposit',
        game_title: gameTitle || 'Custom Wager'
      }
    ]);

    if (error) {
      alert(error.message);
    } else {
      setStakeAmount('');
      setGameTitle('');
      fetchMatches();
    }
  }

  if (!session) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0c', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        <form onSubmit={handleLogin} style={{ background: '#141419', padding: '40px', borderRadius: '12px', width: '350px', border: '1px solid #27272a' }}>
          <h2 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: 'bold' }}>Money Where Your Mouth Is</h2>
          <p style={{ color: '#a1a1aa', fontSize: '14px', marginBottom: '20px' }}>Log in to access the wagering arena.</p>
          <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '12px', background: '#18181b', border: '1px solid #3f3f46', color: '#fff', borderRadius: '6px' }} />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '20px', background: '#18181b', border: '1px solid #3f3f46', color: '#fff', borderRadius: '6px' }} />
          <button type="submit" style={{ width: '100%', padding: '12px', background: '#22c55e', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Sign In</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0c', color: '#fff', padding: '40px', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '1px solid #27272a', paddingBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 'bold' }}>⚡ Money Where Your Mouth Is</h1>
        <button onClick={() => supabase.auth.signOut()} style={{ padding: '8px 16px', background: '#27272a', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Sign Out</button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
        <div style={{ background: '#141419', padding: '24px', borderRadius: '12px', border: '1px solid #27272a', height: 'fit-content' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>Create New Wager</h3>
          <form onSubmit={handleCreateMatch}>
            <input type="text" placeholder="Game / Event Title" value={gameTitle} onChange={e => setGameTitle(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '12px', background: '#18181b', border: '1px solid #3f3f46', color: '#fff', borderRadius: '6px' }} />
            <input type="number" placeholder="Stake Amount ($)" value={stakeAmount} onChange={e => setStakeAmount(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '16px', background: '#18181b', border: '1px solid #3f3f46', color: '#fff', borderRadius: '6px' }} />
            
            <div style={{ background: '#18181b', padding: '12px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px', color: '#a1a1aa' }}>
              <div>Platform Fee (5%): <span style={{ color: '#22c55e', fontWeight: 'bold' }}>${platformFee}</span></div>
              <div>Winner Payout: <span style={{ color: '#22c55e', fontWeight: 'bold' }}>${totalPayout}</span></div>
            </div>

            <button type="submit" style={{ width: '100%', padding: '12px', background: '#22c55e', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Publish Wager</button>
          </form>
        </div>

        <div style={{ background: '#141419', padding: '24px', borderRadius: '12px', border: '1px solid #27272a' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>Active Matchmaking Lobby</h3>
          {matches.length === 0 ? (
            <p style={{ color: '#a1a1aa' }}>No active wagers found in the arena. Create one to get started!</p>
          ) : (
            matches.map(m => (
              <div key={m.match_id} style={{ background: '#18181b', padding: '16px', borderRadius: '8px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #27272a' }}>
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{m.game_title || 'Wager Match'}</div>
                  <div style={{ fontSize: '13px', color: '#a1a1aa' }}>Stake: ${m.stake_amount} | Fee: ${m.platform_fee}</div>
                </div>
                <div style={{ background: '#27272a', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', color: '#22c55e' }}>{m.match_status}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
