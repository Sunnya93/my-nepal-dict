"use client";

import { Navbar, Container, Nav, Button, Dropdown } from 'react-bootstrap';
import { useAuth } from '@/contexts/AuthContext';

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = () => {
    logout();
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
            <Nav className="ms-auto">
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


