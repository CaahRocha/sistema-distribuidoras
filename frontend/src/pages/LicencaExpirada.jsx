export default function LicencaExpirada() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#07101d',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: '20px', padding: '20px', textAlign: 'center'
    }}>
      {/* Ícone */}
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100" height="100">
        <defs>
          <filter id="gR" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="3" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <rect width="120" height="120" fill="#0d1a2b" rx="22"/>
        {/* Cadeado */}
        <rect x="34" y="58" width="52" height="38" rx="6" fill="none" stroke="#ff4444" stroke-width="3" filter="url(#gR)"/>
        <path d="M44 58 V44 Q44 24 60 24 Q76 24 76 44 V58" fill="none" stroke="#ff4444" stroke-width="3" stroke-linecap="round" filter="url(#gR)"/>
        <circle cx="60" cy="77" r="6" fill="#ff4444" filter="url(#gR)"/>
        <line x1="60" y1="77" x2="60" y2="88" stroke="#ff4444" stroke-width="3" stroke-linecap="round" filter="url(#gR)"/>
      </svg>

      <div>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#ff4444', marginBottom: '8px' }}>
          Licença Expirada
        </h1>
        <p style={{ color: '#7a9ab8', fontSize: '15px', maxWidth: '380px', margin: '0 auto' }}>
          Seu período de uso encerrou. Para continuar utilizando o sistema, entre em contato e renove sua licença.
        </p>
      </div>

      <a
        href="https://wa.me/5511985079997?text=Oi!%20Preciso%20renovar%20a%20licen%C3%A7a%20do%20sistema."
        target="_blank"
        rel="noreferrer"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '10px',
          background: '#25D366', color: 'white',
          padding: '14px 32px', borderRadius: '12px',
          fontSize: '16px', fontWeight: 800, textDecoration: 'none',
          boxShadow: '0 0 20px rgba(37,211,102,.4)'
        }}
      >
        💬 Renovar pelo WhatsApp
      </a>

      <p style={{ color: '#7a9ab8', fontSize: '12px' }}>
        Após o pagamento você receberá um código para reativar.
      </p>
    </div>
  );
}
