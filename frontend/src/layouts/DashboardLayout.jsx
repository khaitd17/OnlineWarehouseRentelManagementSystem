import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import Sidebar from '../components/Dashboard/Sidebar';
import notificationService from '../services/notificationService';
import authService from '../services/authService';

const DashboardLayout = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = (user.role || user.roleName || '').toUpperCase();
  const searchPlaceholder = userRole === 'OWNER'
    ? 'Search warehouses...'
    : userRole === 'RENTER'
      ? 'Tìm kiếm kho hàng, nhà kho...'
      : 'Tìm kiếm yêu cầu hoặc mặt hàng...';

  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const dropdownRef = useRef(null);
  const connectionRef = useRef(null);

  const isMobile = windowWidth < 900;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // SignalR real-time connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const connection = new HubConnectionBuilder()
      .withUrl('http://localhost:5276/hubs/notifications', {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    connection.on('ReceiveNotification', async (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // When payment is confirmed/rejected, refresh warehouse context to update role
      if (notification.type === 'PAYMENT_CONFIRMED' || notification.type === 'PAYMENT_REJECTED' || notification.type === 'SUBSCRIPTION_ACTIVE') {
        try {
          await authService.refreshWarehouseContext();
          // Trigger authChange event to refresh Sidebar menu
          window.dispatchEvent(new Event('authChange'));
        } catch (err) {
          console.warn('[DashboardLayout] Failed to refresh warehouse context:', err);
        }
      }
    });

    connection.start().catch(() => {});
    connectionRef.current = connection;

    return () => { connection.stop(); };
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await notificationService.getUnreadCountFromAPI();
      setUnreadCount(count);
    } catch (err) {
      const localCount = notificationService.getUnreadCount();
      setUnreadCount(localCount);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data.data || data || []);
    } catch (err) {
      setNotifications([]);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBellClick = () => {
    if (!showNotifications) fetchNotifications();
    setShowNotifications(!showNotifications);
  };

  const isNotificationRead = (notification) => {
    return Boolean(
      notification?.isRead ?? notification?.IsRead ?? notification?.read ?? false
    );
  };

  const handleNotificationClick = async (notification) => {
    const wasUnread = !isNotificationRead(notification);

    if (wasUnread) {
      setNotifications(prev =>
        prev.map(n =>
          n.notificationId === notification.notificationId
            ? { ...n, isRead: true, IsRead: true, read: true }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      try {
        await notificationService.markNotificationAsRead(notification.notificationId);
      } catch (err) {
        fetchUnreadCount();
      }
    }
    setShowNotifications(false);

    // Handle payment-related notifications - refresh context and navigate
    if (notification.type === 'PAYMENT_CONFIRMED' || notification.type === 'PAYMENT_REJECTED') {
      try {
        await authService.refreshWarehouseContext();
        window.dispatchEvent(new Event('authChange'));
      } catch (err) {
        console.warn('[DashboardLayout] Failed to refresh warehouse context:', err);
      }
      if (notification.referenceId) {
        navigate(`/contracts/${notification.referenceId}`);
      }
      return;
    }

    if (notification.referenceId) {
      if (notification.type === 'CONTRACT_APPROVED' ||
          notification.type === 'CONTRACT_SENT' ||
          notification.type === 'CONTRACT_SIGNED') {
        navigate(`/contracts/${notification.referenceId}`);
      } else if (notification.type === 'RENTAL_REQUEST_RECEIVED') {
        navigate(`/rental-request/${notification.referenceId}`);
      } else if (notification.type === 'CONTRACT_REJECTED') {
        navigate('/my-rental-requests');
      } else if (notification.type === 'EXTENSION_REQUEST_RECEIVED') {
        navigate('/contract-extensions');
      } else if (notification.type === 'EXTENSION_APPROVED' ||
                 notification.type === 'EXTENSION_REJECTED') {
        navigate('/contract-extensions-renter');
      } else if (notification.type === 'CONTRACT_EXTENSION_SIGNATURE_NEEDED') {
        // Navigate to appropriate signing page based on user role
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userRole = (user.role || user.roleName || '').toUpperCase();
        if (userRole === 'OWNER' || userRole === 'OPERATOR') {
          navigate(`/sign-contract-owner/${notification.referenceId}`);
        } else {
          navigate(`/sign-contract/${notification.referenceId}`);
        }
      }
    } else if (notification.type === 'CONTRACT_REJECTED') {
      navigate('/my-rental-requests');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('authChange'));
    navigate('/');
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <div className="font-display" style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="dashboard-main-area" style={{
        flex: 1,
        marginLeft: isMobile ? 0 : '240px',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        overflow: 'hidden',
      }}>
        {/* Topbar */}
        <header style={{
          height: '64px',
          backgroundColor: '#fff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1rem',
          position: 'sticky',
          top: 0,
          zIndex: 20,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          gap: '0.75rem',
        }}>
          {/* Left: Hamburger (mobile only) + Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
            {/* Hamburger — chỉ hiện ở mobile */}
            <button
              id="sidebar-toggle-btn"
              onClick={() => setSidebarOpen(true)}
              style={{
                display: isMobile ? 'flex' : 'none',
                width: '40px', height: '40px', borderRadius: '8px',
                border: 'none', backgroundColor: 'transparent',
                cursor: 'pointer', alignItems: 'center', justifyContent: 'center',
                color: '#475569', flexShrink: 0, padding: 0,
              }}
              className="hamburger-btn"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>

            {/* Search bar */}
            <div style={{ position: 'relative', flex: 1, maxWidth: '480px' }} className="topbar-search">
              <span className="material-symbols-outlined" style={{
                position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                color: '#94a3b8', fontSize: '18px',
              }}>search</span>
              <input
                style={{
                  width: '100%', paddingLeft: '40px', paddingRight: '16px',
                  paddingTop: '8px', paddingBottom: '8px',
                  borderRadius: '8px', border: '1px solid #e2e8f0',
                  backgroundColor: '#f8fafc', outline: 'none',
                  fontSize: '14px', color: '#374151',
                  fontFamily: 'Inter, sans-serif',
                }}
                placeholder={searchPlaceholder}
                type="text"
              />
            </div>
          </div>

          {/* Right: Bell + Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            {/* Notification Bell */}
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={handleBellClick}
                style={{
                  width: '40px', height: '40px', borderRadius: '8px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: 'none', backgroundColor: 'transparent', cursor: 'pointer',
                  position: 'relative', color: '#475569',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <span className="material-symbols-outlined">notifications</span>
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '4px', right: '4px',
                    minWidth: '18px', height: '18px', borderRadius: '9px',
                    backgroundColor: '#ef4444', color: '#fff', fontSize: '11px',
                    fontWeight: 600, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', border: '2px solid #fff',
                    padding: '0 4px', lineHeight: 1,
                  }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div style={{
                  position: 'fixed',
                  top: '68px',
                  right: '16px',
                  width: 'min(380px, calc(100vw - 32px))',
                  maxHeight: '480px',
                  overflowY: 'auto',
                  backgroundColor: '#fff',
                  borderRadius: '12px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                  border: '1px solid #e2e8f0',
                  zIndex: 50,
                }}>
                  <div style={{
                    padding: '16px 20px', borderBottom: '1px solid #e2e8f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <span style={{ fontWeight: 600, fontSize: '16px', color: '#1e293b' }}>Thông báo</span>
                    {unreadCount > 0 && (
                      <span style={{
                        backgroundColor: '#dbeafe', color: '#2563eb',
                        fontSize: '12px', fontWeight: 600, padding: '2px 8px',
                        borderRadius: '12px',
                      }}>
                        {unreadCount} mới
                      </span>
                    )}
                  </div>

                  {notifications.length === 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '40px', marginBottom: '8px', display: 'block' }}>
                        notifications_off
                      </span>
                      <p>Không có thông báo nào</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.notificationId}
                        onClick={() => handleNotificationClick(n)}
                        style={{
                          padding: '14px 20px', cursor: 'pointer',
                          borderBottom: '1px solid #f1f5f9',
                          backgroundColor: isNotificationRead(n) ? '#fff' : '#f0f9ff',
                          transition: 'background-color 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = isNotificationRead(n) ? '#f8fafc' : '#e0f2fe'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = isNotificationRead(n) ? '#fff' : '#f0f9ff'}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                          <div style={{
                            width: '36px', height: '36px', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                            backgroundColor: n.type === 'CONTRACT_APPROVED' || n.type === 'CONTRACT_SIGNED' ? '#dcfce7'
                              : n.type === 'CONTRACT_SENT' ? '#dbeafe'
                              : n.type === 'RENTAL_REQUEST_RECEIVED' ? '#fef3c7'
                              : '#fee2e2',
                          }}>
                            <span className="material-symbols-outlined" style={{
                              fontSize: '18px',
                              color: n.type === 'CONTRACT_APPROVED' || n.type === 'CONTRACT_SIGNED' ? '#16a34a'
                                : n.type === 'CONTRACT_SENT' ? '#2563eb'
                                : n.type === 'RENTAL_REQUEST_RECEIVED' ? '#d97706'
                                : '#dc2626',
                            }}>
                              {n.type === 'CONTRACT_APPROVED' || n.type === 'CONTRACT_SIGNED' ? 'check_circle'
                                : n.type === 'CONTRACT_SENT' ? 'description'
                                : n.type === 'RENTAL_REQUEST_RECEIVED' ? 'warehouse'
                                : 'cancel'}
                            </span>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontWeight: isNotificationRead(n) ? 400 : 600, fontSize: '13px',
                              color: '#1e293b', marginBottom: '4px',
                            }}>
                              {n.title}
                            </div>
                            <div style={{
                              fontSize: '12px', color: '#64748b',
                              overflow: 'hidden', textOverflow: 'ellipsis',
                              display: '-webkit-box', WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                            }}>
                              {n.message}
                            </div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                              {formatTime(n.createdAt)}
                            </div>
                          </div>
                          {!isNotificationRead(n) && (
                            <div style={{
                              width: '8px', height: '8px', borderRadius: '50%',
                              backgroundColor: '#3b82f6', flexShrink: 0, marginTop: '6px',
                            }} />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {userRole === 'RENTER' && (
              <button style={{
                width: '40px', height: '40px', borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: 'none', backgroundColor: 'transparent', cursor: 'pointer',
                color: '#475569', transition: 'background-color 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <span className="material-symbols-outlined">help</span>
              </button>
            )}

            <div className="nav-user-dropdown" style={{ marginLeft: '4px' }}>
              <div className="nav-user-trigger">
                <img
                  src={user.avatarUrl || user.AvatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.FullName || 'User')}&background=00b2d6&color=fff`}
                  alt="Avatar"
                  style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(0,178,214,0.3)' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="nav-user-trigger-name">
                    Xin chào, {(user.fullName || user.FullName || 'Bạn').split(' ').slice(-2).join(' ')}
                  </span>
                </div>
                <span className="nav-dropdown-caret">▾</span>
              </div>

              <div className="nav-dropdown-menu">
                <div className="nav-dropdown-user-header">
                  <img
                    src={user.avatarUrl || user.AvatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.FullName || 'User')}&background=00b2d6&color=fff`}
                    alt="Avatar"
                  />
                  <div style={{ overflow: 'hidden' }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.fullName || user.FullName || 'Người dùng'}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: '0.7rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.email || ''}
                    </p>
                  </div>
                </div>

                <Link to="/profile" className="nav-dropdown-item">Hồ sơ</Link>
                {userRole === 'RENTER' && (
                  <Link to="/my-favorites" className="nav-dropdown-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#f43f5e' }}>favorite</span>
                    Kho yêu thích
                  </Link>
                )}
                <div className="nav-dropdown-divider" />
                <button className="nav-dropdown-item logout" onClick={handleLogout}>Đăng xuất</button>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main style={{ flex: 1, padding: '2rem' }} className="dashboard-content">
          <Outlet />
        </main>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .dashboard-main-area {
            margin-left: 0 !important;
          }
          .hamburger-btn {
            display: flex !important;
          }
          .topbar-search {
            max-width: 100% !important;
          }
          .dashboard-content {
            padding: 1rem !important;
          }
        }
        @media (max-width: 480px) {
          .topbar-search {
            display: none !important;
          }
          .dashboard-content {
            padding: 0.75rem !important;
          }
        }
        
        /* Avatar Dropdown Styles for Light Theme */
        .nav-user-dropdown { position: relative; display: inline-flex; align-items: center; }
        .nav-user-dropdown::after { content: ''; position: absolute; top: 100%; left: -10px; right: -10px; height: 14px; }
        .nav-user-dropdown:hover .nav-dropdown-menu,
        .nav-user-dropdown:focus-within .nav-dropdown-menu {
          opacity: 1; visibility: visible; transform: translateY(0); pointer-events: all;
        }
        .nav-user-trigger {
          display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 4px;
          border-radius: 999px; transition: background 0.2s;
        }
        .nav-user-trigger:hover { background: #f1f5f9; }
        .nav-user-trigger-name {
          max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          font-size: 0.85rem; font-weight: 600; color: #1e293b; line-height: 1.1;
        }
        .nav-dropdown-caret { font-size: 0.65rem; color: #94a3b8; transition: transform 0.2s; margin-left: 2px; }
        .nav-user-dropdown:hover .nav-dropdown-caret { transform: rotate(180deg); }
        .nav-dropdown-menu {
          position: absolute; top: calc(100% + 14px); right: 0; min-width: 210px;
          background: #fff; border: 1px solid #e2e8f0; border-radius: 14px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.1);
          opacity: 0; visibility: hidden; transform: translateY(-6px);
          transition: opacity 0.2s, transform 0.2s, visibility 0.2s;
          z-index: 2000; overflow: hidden; pointer-events: none;
        }
        .nav-dropdown-user-header {
          padding: 14px 16px 12px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; gap: 10px;
        }
        .nav-dropdown-user-header img {
          width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 1px solid #e2e8f0; flex-shrink: 0;
        }
        .nav-dropdown-item {
          display: block; padding: 12px 16px; font-size: 0.875rem; font-weight: 500; color: #475569;
          text-decoration: none; transition: background 0.15s, color 0.15s; cursor: pointer;
          background: transparent; border: none; width: 100%; text-align: left; font-family: 'Inter', sans-serif;
        }
        .nav-dropdown-item:hover { background: #f8fafc; color: #0284c7; }
        .nav-dropdown-divider { height: 1px; background: #f1f5f9; margin: 4px 0; }
        .nav-dropdown-item.logout { color: #ef4444; }
        .nav-dropdown-item.logout:hover { background: #fef2f2; color: #dc2626; }
      `}</style>
    </div>
  );
};

export default DashboardLayout;
