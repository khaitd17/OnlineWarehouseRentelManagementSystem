import React from 'react';
import OWRMSLogo from '../components/OWRMSLogo';

/* ── Small reusable helpers ─────────────────────────────────── */
const Tag = ({ children }) => (
  <span style={{
    display: 'inline-block',
    padding: '4px 14px',
    borderRadius: 999,
    fontSize: '0.72rem',
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    background: 'linear-gradient(135deg,#e0f2fe,#bae6fd)',
    color: '#0369a1',
    marginBottom: 12,
  }}>{children}</span>
);

const SectionHeading = ({ en, vi, light = false }) => (
  <div style={{ marginBottom: 32 }}>
    <p style={{
      margin: '0 0 4px',
      fontSize: '0.8rem',
      fontWeight: 700,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: light ? 'rgba(255,255,255,0.55)' : '#0ea5e9',
    }}>{en}</p>
    <h2 style={{
      margin: 0,
      fontSize: 'clamp(1.6rem,3vw,2.4rem)',
      fontWeight: 800,
      color: light ? '#fff' : '#0f172a',
      lineHeight: 1.2,
    }}>{vi}</h2>
  </div>
);

const MissionItem = ({ icon, label, text }) => (
  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
    <div style={{
      flexShrink: 0, width: 44, height: 44, borderRadius: 12,
      background: 'linear-gradient(135deg,#0ea5e9,#0284c7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#fff' }}>{icon}</span>
    </div>
    <div>
      <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>{label}</p>
      <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b', lineHeight: 1.65 }}>{text}</p>
    </div>
  </div>
);

const CoreValueCard = ({ icon, title, desc }) => (
  <div style={{
    background: '#fff',
    borderRadius: 16,
    padding: '28px 24px',
    border: '1px solid #f1f5f9',
    boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'default',
  }}
    onMouseEnter={e => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 12px 36px rgba(14,165,233,0.12)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.04)';
    }}
  >
    <div style={{
      width: 52, height: 52, borderRadius: 14,
      background: 'linear-gradient(135deg,#e0f2fe,#7dd3fc)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      marginBottom: 16,
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: 26, color: '#0369a1' }}>{icon}</span>
    </div>
    <h4 style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>{title}</h4>
    <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b', lineHeight: 1.65 }}>{desc}</p>
  </div>
);

const StatBox = ({ value, label }) => (
  <div style={{ textAlign: 'center', padding: '20px 24px' }}>
    <div style={{
      fontSize: 'clamp(2rem,4vw,3rem)',
      fontWeight: 900,
      background: 'linear-gradient(135deg,#38bdf8,#0ea5e9)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      lineHeight: 1,
      marginBottom: 6,
    }}>{value}</div>
    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
      {label}
    </div>
  </div>
);

/* ── Main Page ─────────────────────────────────────────────── */
const AboutUsPage = () => {
  return (
    <div style={{ width: '100%', overflowX: 'hidden', fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      {/* ── HERO ───────────────────────────────────────────── */}
      <section style={{
        position: 'relative',
        background: 'linear-gradient(135deg, #0c1a2e 0%, #0f2d4a 50%, #0c3857 100%)',
        padding: '7rem 2rem 5rem',
        color: '#fff',
        textAlign: 'center',
        overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position:'absolute', top:-120, left:-120, width:380, height:380, borderRadius:'50%', background:'rgba(14,165,233,0.08)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-80, right:-80, width:320, height:320, borderRadius:'50%', background:'rgba(56,189,248,0.07)', pointerEvents:'none' }} />

        <div style={{ position: 'relative', maxWidth: 760, margin: '0 auto' }}>
          <Tag>Về chúng tôi</Tag>
          <h1 style={{
            fontSize: 'clamp(2.2rem,5vw,3.6rem)',
            fontWeight: 900,
            margin: '12px 0 20px',
            lineHeight: 1.12,
            letterSpacing: '-0.02em',
          }}>
            OWRMS – Đối tác logistics<br />
            <span style={{ color: '#38bdf8' }}>tin cậy của bạn</span>
          </h1>
          <p style={{
            fontSize: '1.1rem',
            color: 'rgba(255,255,255,0.7)',
            lineHeight: 1.75,
            margin: 0,
          }}>
            Doanh nghiệp uy tín hàng đầu về cung cấp chuỗi dịch vụ logistics Việt Nam —<br />
            Kết nối kho bãi thông minh, phục vụ tối đa nhu cầu của Quý khách.
          </p>
        </div>
      </section>

      {/* ── STATS BAR ──────────────────────────────────────── */}
      <section style={{
        background: '#080f1d',
        borderTop: '3px solid #0ea5e9',
        padding: '0 2rem',
      }}>
        <div style={{
          maxWidth: 1100,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        }}>
          {[
            { value: '5,000+', label: 'Kho bãi',    icon: 'warehouse' },
            { value: '12K+',   label: 'Khách hàng', icon: 'groups' },
            { value: '63',     label: 'Tỉnh thành', icon: 'location_on' },
            { value: '24/7',   label: 'Hỗ trợ',     icon: 'support_agent' },
          ].map((s, i) => (
            <div
              key={s.label}
              style={{
                padding: '36px 28px',
                textAlign: 'center',
                borderRight: i < 3 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                transition: 'background 0.25s',
                cursor: 'default',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(14,165,233,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {/* Icon */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 44, height: 44,
                borderRadius: 12,
                background: 'rgba(14,165,233,0.15)',
                marginBottom: 14,
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 22, color: '#38bdf8' }}>
                  {s.icon}
                </span>
              </div>
              {/* Value */}
              <div style={{
                fontSize: 'clamp(2rem, 3.5vw, 2.8rem)',
                fontWeight: 900,
                color: '#fff',
                letterSpacing: '-0.02em',
                lineHeight: 1,
                marginBottom: 8,
                textShadow: '0 0 30px rgba(56,189,248,0.3)',
              }}>
                {s.value}
              </div>
              {/* Label */}
              <div style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#38bdf8',
              }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── OVERVIEW ───────────────────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '6rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))', gap: '4rem', alignItems: 'center' }}>
          <div>
            <SectionHeading en="Overview" vi="Tổng quan" />
            <p style={{ fontSize: '1rem', color: '#475569', lineHeight: 1.85, marginBottom: '1.2rem' }}>
              OWRMS là doanh nghiệp uy tín hàng đầu về cung cấp chuỗi dịch vụ của ngành Logistics Việt Nam. Với hệ thống kho vận rộng khắp, gần cảng biển, cảng hàng không, cảng thủy nội địa, cửa khẩu,… OWRMS có thể phục vụ tối đa nhu cầu của Quý khách.
            </p>
            <p style={{ fontSize: '1rem', color: '#475569', lineHeight: 1.85, marginBottom: '1.2rem' }}>
              Với tiềm lực tài chính bền vững, đội ngũ chuyên gia trong nước và quốc tế có trình độ chuyên môn cao, chúng tôi nỗ lực không ngừng nhằm cung cấp cho Quý khách hàng những sản phẩm dịch vụ chất lượng cao trong ngành Logistics.
            </p>
            <p style={{ fontSize: '1rem', color: '#475569', lineHeight: 1.85, margin: 0 }}>
              OWRMS đang từng bước áp dụng <strong style={{ color: '#0ea5e9' }}>CÔNG NGHỆ</strong> tiên tiến nhất để nâng cao hiệu quả quản lý về chuỗi dịch vụ Logistics phục vụ Quý khách!
            </p>
          </div>

          {/* Visual card */}
          <div style={{
            background: 'linear-gradient(135deg,#f0f9ff 0%,#e0f2fe 100%)',
            borderRadius: 24,
            padding: '40px 36px',
            border: '1px solid #bae6fd',
            display: 'flex', flexDirection: 'column', gap: 20,
          }}>
            {[
              { icon: 'warehouse', label: 'Hệ thống kho vận rộng khắp', sub: 'Gần cảng biển, hàng không, thủy nội địa, cửa khẩu' },
              { icon: 'groups',    label: 'Đội ngũ chuyên gia hàng đầu',   sub: 'Chuyên môn cao, trong nước & quốc tế' },
              { icon: 'memory',    label: 'Công nghệ tiên tiến',             sub: 'Ứng dụng AI & IoT vào quản lý chuỗi logistics' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                  background: '#fff', border: '1px solid #bae6fd',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(14,165,233,0.1)',
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 24, color: '#0ea5e9' }}>{item.icon}</span>
                </div>
                <div>
                  <p style={{ margin: '0 0 2px', fontWeight: 700, fontSize: '0.9rem', color: '#0c4a6e' }}>{item.label}</p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#0369a1' }}>{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VISION ─────────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(135deg,#0c1a2e 0%,#0f2d4a 100%)',
        padding: '6rem 2rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position:'absolute', top:-100, right:-100, width:400, height:400, borderRadius:'50%', background:'rgba(14,165,233,0.06)', pointerEvents:'none' }} />
        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <SectionHeading en="Vision" vi="Tầm nhìn" light />
          <p style={{
            fontSize: '1.15rem', color: 'rgba(255,255,255,0.78)',
            lineHeight: 1.85, margin: '0 auto', maxWidth: 760,
          }}>
            Trở thành một trong những doanh nghiệp logistics hàng đầu khu vực <strong style={{ color: '#38bdf8' }}>châu Á</strong>, là đối tác tin cậy của khách hàng trên toàn cầu trong việc cung cấp các giải pháp về chuỗi dịch vụ logistics toàn diện, liên tục đổi mới để tạo ra sự khác biệt vượt trội trong từng sản phẩm dịch vụ.
          </p>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            marginTop: 36, background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 999, padding: '12px 28px',
          }}>
            <span className="material-symbols-outlined" style={{ color: '#38bdf8', fontSize: 20 }}>public</span>
            <span style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>
              Kết nối Việt Nam – Châu Á – Thế giới
            </span>
          </div>
        </div>
      </section>

      {/* ── LOGO MEANING ───────────────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '6rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '4rem', alignItems: 'center' }}>
          {/* Logo display — new OWRMSLogo component */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              width: 240, height: 240,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              filter: 'drop-shadow(0 20px 60px rgba(0,180,255,0.25))',
            }}>
              <OWRMSLogo size={220} variant="full" />
            </div>
          </div>

          <div>
            <SectionHeading en="The Meaning of Logo" vi="Ý nghĩa Logo" />

            {/* Silhouette */}
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: '1.2rem' }}>
              <div style={{
                flexShrink: 0, width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg,#00c8f0,#0052d4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#fff' }}>factory</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.93rem', color: '#475569', lineHeight: 1.75 }}>
                <strong style={{ color: '#0c4a6e' }}>Biểu tượng mái răng cưa (Sawtooth)</strong> mang đặc trưng của
                kiến trúc công nghiệp hiện đại, thể hiện cốt lõi về một hệ thống
                quản lý kho logistics chuyên nghiệp, quy mô và bài bản.
              </p>
            </div>

            {/* Squircle Base */}
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: '1.2rem' }}>
              <div style={{
                flexShrink: 0, width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg,#3a7bd5,#00d2ff)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#fff' }}>dataset</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.93rem', color: '#475569', lineHeight: 1.75 }}>
                <strong style={{ color: '#0c4a6e' }}>Nền tảng App-Icon xanh dương</strong> tượng trưng cho thế mạnh
                <strong style={{ color: '#0ea5e9' }}> nền tảng số hóa (SaaS)</strong> vững chắc. Cổng kho mở rộng
                biểu thị tính sẵn sàng, minh bạch và khả năng kết nối không giới hạn.
              </p>
            </div>

            {/* Typography & Line-Art */}
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div style={{
                flexShrink: 0, width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg,#0ea5e9,#0052d4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#fff' }}>design_services</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.93rem', color: '#475569', lineHeight: 1.75 }}>
                <strong style={{ color: '#0c4a6e' }}>Phong cách định tuyến phẳng (Minimalist)</strong> lược bỏ chi tiết thừa thãi,
                tập trung tuyệt đối vào <strong style={{ color: '#0ea5e9' }}>tính hiệu quả</strong> —
                đây chính là triết lý vận hành chuỗi cung ứng của OWRMS: Nhanh chóng & Chính xác.
              </p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {[
                'Kiến trúc Logistics',
                'Nền tảng Số (SaaS)',
                'Tối giản & Hiệu quả',
                'Minh bạch & Kết nối',
              ].map(tag => (
                <span key={tag} style={{
                  padding: '6px 16px', borderRadius: 999,
                  background: 'linear-gradient(135deg,#e0f2fe,#bae6fd)',
                  border: '1px solid #7dd3fc', color: '#0369a1',
                  fontSize: '0.8rem', fontWeight: 600,
                }}>{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── MISSION ────────────────────────────────────────── */}
      <section style={{ background: '#f8fafc', padding: '6rem 2rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <SectionHeading en="Mission" vi="Sứ mệnh" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 24 }}>
            <MissionItem
              icon="handshake"
              label="Đối với khách hàng & đối tác"
              text="Cung cấp chuỗi dịch vụ logistics tốt nhất với giá cả phù hợp nhất."
            />
            <MissionItem
              icon="people"
              label="Đối với nhân viên"
              text="Xây dựng môi trường làm việc chuyên nghiệp, năng động, sáng tạo và nhân văn, không ngừng nâng cao đời sống vật chất và tinh thần."
            />
            <MissionItem
              icon="volunteer_activism"
              label="Đối với xã hội"
              text="Đóng góp tích cực vào các hoạt động hướng về cộng đồng, hài hòa lợi ích công ty với lợi ích xã hội."
            />
          </div>
        </div>
      </section>

      {/* ── CORE VALUES ────────────────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '6rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <SectionHeading en="Core Values" vi="Giá trị cốt lõi" />
          <p style={{ color: '#64748b', fontSize: '1rem', marginTop: 8 }}>
            Tôn chỉ hành động: <strong style={{ color: '#0ea5e9' }}>"Tận tâm – Chuyên nghiệp"</strong>
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 24 }}>
          <CoreValueCard
            icon="favorite"
            title="Tận tâm"
            desc="Sự hài lòng của khách hàng là mục tiêu hàng đầu. Luôn đặt lợi ích khách hàng làm trọng tâm trong mọi hoạt động."
          />
          <CoreValueCard
            icon="verified"
            title="Uy tín"
            desc="Uy tín công ty và chất lượng dịch vụ là kim chỉ nam cho mọi hoạt động của toàn thể OWRMS."
          />
          <CoreValueCard
            icon="groups"
            title="Chuyên nghiệp"
            desc="Đội ngũ chuyên nghiệp, đoàn kết, tận tâm phục vụ khách hàng — lực lượng nòng cốt để phát triển bền vững."
          />
          <CoreValueCard
            icon="trending_up"
            title="Phát triển bền vững"
            desc="Xây dựng lợi ích dài hạn cho khách hàng, nhân viên và xã hội thông qua những giá trị thiết thực."
          />
        </div>
      </section>

      {/* ── CTA BANNER ─────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(135deg,#0ea5e9,#0284c7)',
        padding: '5rem 2rem',
        textAlign: 'center',
      }}>
        <h2 style={{ color: '#fff', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 800, margin: '0 0 12px' }}>
          Sẵn sàng hợp tác cùng OWRMS?
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem', margin: '0 0 32px' }}>
          Liên hệ ngay để được tư vấn giải pháp logistics phù hợp nhất cho doanh nghiệp của bạn.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/search" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '14px 32px', borderRadius: 12,
            background: '#fff', color: '#0284c7',
            fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>search</span>
            Tìm kho ngay
          </a>
          <a href="mailto:support@owrms.vn" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '14px 32px', borderRadius: 12,
            background: 'rgba(255,255,255,0.15)', color: '#fff',
            border: '1px solid rgba(255,255,255,0.35)',
            fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>mail</span>
            Liên hệ chúng tôi
          </a>
        </div>
      </section>

    </div>
  );
};

export default AboutUsPage;
