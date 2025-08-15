"use client";

import { Navbar, Container, Nav, Button, Dropdown } from 'react-bootstrap';
import { useAuth } from '@/contexts/AuthContext';
import { refreshCache } from '@/lib/api';

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const handleClearCache = async () => {
    try {
      // 서버 캐시 삭제 (관리자인 경우)
      if (isAuthenticated) {
        await refreshCache(process.env.NEXT_PUBLIC_ADMIN_API_KEY || '');
        console.log('🔄 서버 캐시가 갱신되었습니다.');
      }
      
      window.location.reload();
    } catch (error) {
      console.error('캐시 갱신 실패:', error);
      window.location.reload(); // 실패해도 새로고침
    }
  };

  return (
    <div className="py-3">
      <Navbar expand="sm" className="glass rounded-4 px-2" style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Container fluid>
          <Navbar.Brand href="/" className="fw-bold">
            네팔어 단어장 <span className="badge badge-soft ms-2">Web</span>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto d-flex align-items-center gap-2">
              {isAuthenticated ? (
                <Dropdown align="end">
                  <Dropdown.Toggle variant="outline-primary" className="rounded-pill">
                    {user?.UserName} 님
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item href="/admin">관리자 홈</Dropdown.Item>
                    <Dropdown.Item href="/admin/words/new">새 단어 추가</Dropdown.Item>
                    <Dropdown.Item href="/admin/excelupload">엑셀 업로드</Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={handleLogout}>로그아웃</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              ) : (
                <Button 
                  href="/admin/login" 
                  variant="outline-primary" 
                  size="sm" 
                  className="rounded-pill"
                >
                  관리자 로그인
                </Button>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </div>
  );
}


