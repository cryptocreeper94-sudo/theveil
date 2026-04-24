import { createPortal } from "react-dom";

const ARCADE_GAMES = [
  { name: "Minesweeper", icon: "💣", desc: "Classic puzzle game" },
  { name: "Solitaire", icon: "🃏", desc: "Card game classic" },
  { name: "Spades", icon: "♠️", desc: "Trick-taking card game" },
  { name: "Crash", icon: "📈", desc: "Provably fair betting" },
  { name: "Slots", icon: "🎰", desc: "Spin to win" },
  { name: "Coin Flip", icon: "🪙", desc: "50/50 chance" },
  { name: "Dice", icon: "🎲", desc: "Roll the dice" },
  { name: "Blackjack", icon: "🂡", desc: "Beat the dealer" },
];

export function GamesComingSoonModal({ onClose }: { onClose: () => void }) {
  return createPortal(
    <>
      <div 
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.9)',
          backdropFilter: 'blur(8px)',
          zIndex: 10001,
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: '400px',
          maxHeight: '80vh',
          overflowY: 'auto',
          backgroundColor: '#0f172a',
          borderRadius: '20px',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          boxShadow: '0 0 60px rgba(168, 85, 247, 0.2), 0 0 100px rgba(6, 182, 212, 0.1)',
          zIndex: 10002,
          padding: '24px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎮</div>
          <h2 style={{ 
            fontSize: '24px', 
            fontWeight: 700, 
            background: 'linear-gradient(135deg, #a855f7, #06b6d4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px',
            fontFamily: 'Space Grotesk, sans-serif'
          }}>
            The Arcade
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
            Classic & Casino Games Coming Soon
          </p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: '10px',
          marginBottom: '20px'
        }}>
          {ARCADE_GAMES.map((game) => (
            <div
              key={game.name}
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderRadius: '12px',
                padding: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '6px' }}>{game.icon}</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: '2px' }}>{game.name}</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>{game.desc}</div>
            </div>
          ))}
        </div>

        <div style={{
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center',
          border: '1px solid rgba(168, 85, 247, 0.2)',
          marginBottom: '16px'
        }}>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>
            Play with SIG tokens or Shells
          </p>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
            Provably fair • Instant payouts • Low house edge
          </p>
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '12px',
            border: 'none',
            background: 'linear-gradient(135deg, #a855f7, #06b6d4)',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
          data-testid="close-games-modal"
        >
          Got it!
        </button>
      </div>
    </>,
    document.body
  );
}
