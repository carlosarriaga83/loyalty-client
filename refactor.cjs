const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'ClientDashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace header
content = content.replace(
  '<header className="client-header">\n        <h2 className="client-header-title">Postreland</h2>\n      </header>',
  '{/* Header removed, now dynamic in tabs */}'
);

const oldCardRegex = /\{\/\* ==================== TAB 1: LOYALTY CARD ==================== \*\/\}[\s\S]*?(?=\{\/\* ==================== TAB 2: PRODUCT MENU ==================== \*\/)/;

const newCardTab = `        {/* ==================== TAB 1: HOME (STARBUCKS STYLE) ==================== */}
        {activeTab === 'card' && profile && (
          <div>
            <div className="home-header">
              <div className="home-greeting">
                {lang === 'es' ? 'Buenas tardes,' : 'Good afternoon,'} <br/> {profile.full_name?.split(' ')[0] || 'Cliente'}
              </div>
              <User size={28} style={{ color: '#1C1917' }} onClick={() => setActiveTab('profile')} />
            </div>

            <div className="linear-progress-card">
              <div className="linear-progress-header">
                <div className="linear-progress-value">
                  {profile.visits} <Sparkles size={24} style={{ color: '#00623B', marginTop: '6px' }} />
                </div>
                <button onClick={() => setActiveTab('rewards')} className="btn-secondary" style={{ width: 'auto', padding: '6px 16px', borderRadius: '20px', borderColor: '#00623B', color: '#00623B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {lang === 'es' ? 'Premios' : 'Rewards'} <Sparkles size={14} />
                </button>
              </div>

              <div className="linear-progress-container">
                <div className="linear-progress-fill" style={{ width: (Math.min(100, (profile.visits / 200) * 100)) + '%' }}></div>
                <div className="linear-progress-milestones">
                  {[25, 50, 100, 150, 200].map(m => (
                    <div key={m} className={"milestone-dot " + (profile.visits >= m ? 'active' : '')}>
                      <span className="milestone-label">{m}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: '40px' }}>
                <button onClick={() => setActiveTab('rewards')} className="btn-secondary" style={{ width: 'auto', padding: '8px 16px', borderRadius: '20px', fontSize: '0.8rem' }}>
                  {lang === 'es' ? 'Detalles de premios' : 'Rewards details'}
                </button>
              </div>
            </div>

            <div className="promo-scroll-container">
              {/* Featured Promo Cards */}
              {products.slice(0, 3).map((prod, idx) => (
                <div key={idx} className="promo-card">
                  <img src={prod.image_url || 'https://images.unsplash.com/photo-1563805042-7684c8e9e9cb?auto=format&fit=crop&q=80&w=400'} alt={prod.name} className="promo-image" />
                  <div className="promo-content">
                    <h4 className="promo-title">{prod.name}</h4>
                    <p className="promo-desc">{prod.description}</p>
                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <button onClick={() => setActiveTab('menu')} className="btn-primary" style={{ backgroundColor: '#00623B', width: 'auto', padding: '8px 20px', borderRadius: '20px', margin: 0 }}>
                        {lang === 'es' ? 'Detalles' : 'Details'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== TAB: REWARDS ==================== */}
        {activeTab === 'rewards' && profile && (
          <div style={{ padding: '0 20px' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontWeight: 800, color: 'var(--brand-gold)', marginBottom: '24px' }}>
              {lang === 'es' ? 'Premios y Cupones' : 'Rewards & Coupons'}
            </h2>

            {/* Collapsible active coupons section */}
            {coupons.filter(c => c.status === 'active').length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <h3 className="section-title" style={{ marginTop: 0 }}>
                  <Gift size={20} style={{ color: '#D1A153' }} />
                  {t.activeCoupons}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {coupons.filter(c => c.status === 'active').map(c => (
                    <div 
                      key={c.id} 
                      onClick={() => setShowCouponModal(c)}
                      style={{
                        background: 'white',
                        padding: '16px',
                        borderRadius: '16px',
                        border: '1px solid rgba(209, 161, 83, 0.25)',
                        boxShadow: 'var(--shadow-sm)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#1C1917', fontSize: '1rem' }}>{c.title}</div>
                        <div style={{ fontSize: '0.75rem', color: '#2ECC71', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                          <CheckCircle2 size={14} />
                          {t.readyToRedeem}
                        </div>
                      </div>
                      <ChevronRight size={20} style={{ color: '#D1A153' }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rewards Catalog */}
            <h3 className="section-title" style={{ marginTop: 0 }}>
              <Award size={20} style={{ color: '#D1A153' }} />
              {t.rewardsCatalog}
            </h3>
            <div className="rewards-grid">
              {rewards.length === 0 ? (
                <p style={{ color: '#78716C', fontStyle: 'italic', fontSize: '0.9rem', textAlign: 'center', padding: '20px' }}>
                  {t.loadingRewards}
                </p>
              ) : (
                rewards.map(rew => {
                  const canRedeem = profile.visits >= rew.visits_cost;
                  return (
                    <div key={rew.id} className="reward-card">
                      <div className="reward-info">
                        <h4 className="reward-name">{rew.title}</h4>
                        <p className="reward-desc">{rew.description}</p>
                        <span className="reward-cost">{rew.visits_cost} {t.visitsCostSuffix}</span>
                      </div>
                      <button
                        onClick={() => handleRedeemReward(rew)}
                        disabled={!canRedeem}
                        className="btn-primary"
                        style={{
                          width: 'auto',
                          padding: '8px 16px',
                          fontSize: '0.8rem',
                          margin: 0,
                          backgroundColor: canRedeem ? 'var(--brand-gold)' : '#E2E8F0',
                          color: canRedeem ? 'white' : '#A0AEC0',
                          boxShadow: canRedeem ? '0 4px 10px rgba(209, 161, 83, 0.15)' : 'none',
                          cursor: canRedeem ? 'pointer' : 'not-allowed'
                        }}
                      >
                        {t.btnRedeem}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
            <div style={{ height: '80px' }}></div>
          </div>
        )}

        `;

content = content.replace(oldCardRegex, newCardTab);

// Nav Bar replacement
content = content.replace(
  '<UtensilsCrossed size={20} />\n          {t.navFlavors}\n        </button>',
  '<UtensilsCrossed size={20} />\n          {t.navFlavors}\n        </button>\n        <button onClick={() => { setActiveTab(\'rewards\'); setErrorMsg(null); setSuccessMsg(null); }} className={"bottom-nav-item " + (activeTab === \'rewards\' ? \'active\' : \'\')}>\n          <Gift size={20} />\n          {lang === \'es\' ? \'Premios\' : \'Rewards\'}\n        </button>'
);

// End of container
const endTarget = '    </div>\n  );\n};';
const newEndTarget = `      {/* Floating Action Button for Scan */}
      {profile && (
        <button 
          className="fab-scan"
          onClick={() => { setShowScannerModal(true); startScanner(); }}
        >
          <QrCode size={20} />
          {lang === 'es' ? 'Scan' : 'Scan'}
        </button>
      )}
    </div>
  );
};`;
content = content.replace(endTarget, newEndTarget);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Script updated successfully!');
