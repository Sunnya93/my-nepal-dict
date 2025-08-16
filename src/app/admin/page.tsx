'use client';

import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import AdminGuard from '@/components/AdminGuard';
import { useAuth } from '@/contexts/AuthContext';
import { clearServerCache } from '@/lib/api';

export default function AdminHomePage() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <AdminGuard>
      <Container className="py-4">
        <Row className="justify-content-center">
          <Col lg={8}>
            <Card className="glass-card border-0 rounded-4 mb-4">
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4 className="mb-0">관리자 홈</h4>
                  <Button 
                    variant="outline-danger" 
                    size="sm" 
                    className="rounded-pill"
                    onClick={handleLogout}
                  >
                    로그아웃
                  </Button>
                </div>
                <p className="text-muted mb-4">
                  안녕하세요, {user?.UserName || user?.UserId}님! 
                  네팔어 단어장 관리 시스템에 오신 것을 환영합니다.
                </p>
                
                
                <Row className="g-3">
                  <Col md={6}>
                    <Card className="h-100 border">
                      <Card.Body className="text-center">
                        <h5 className="mb-3">새 단어 추가</h5>
                        <p className="text-muted small mb-3">
                          개별 단어를 수동으로 추가합니다.
                        </p>
                        <Button 
                          href="/admin/words/new" 
                          variant="primary" 
                          className="rounded-pill"
                          onClick={() => window.location.href = '/admin/words/new'}
                        >
                          단어 추가하기
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>
                  
                  <Col md={6}>
                    <Card className="h-100 border">
                      <Card.Body className="text-center">
                        <h5 className="mb-3">엑셀 업로드</h5>
                        <p className="text-muted small mb-3">
                          엑셀 파일을 통해 대량의 단어를 한번에 추가합니다.
                        </p>
                        <Button 
                          href="/admin/excelupload" 
                          variant="success" 
                          className="rounded-pill"
                          onClick={() => window.location.href = '/admin/excelupload'}
                        >
                          엑셀 업로드
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>

                  <Col md={6}>
                    <Card className="h-100 border">
                      <Card.Body className="text-center">
                        <h5 className="mb-3">단어장 목록</h5>
                        <p className="text-muted small mb-3">
                          단어장 목록으로 이동합니다.
                        </p>
                        <Button 
                          href="/" 
                          variant="info" 
                          className="rounded-pill"
                          onClick={() => window.location.href = '/'}
                        >
                          단어장 이동
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="h-100 border">
                      <Card.Body className="text-center">
                        <h5 className="mb-3">서버 캐시 삭제</h5>
                        <p className="text-muted small mb-3">
                          서버 캐시를 삭제합니다.
                          <br></br>
                          비용이 발생할 수 있음으로 자주 사용하지 마세요.
                          <br></br>
                          신규 단어를 추가할 때 캐시를 삭제해야 최신 반영이 됩니다.
                          <br></br>
                          누르지 않으셔도 48시간 이후에는 자동으로 초기화 됩니다.                       
                        </p>
                        <Button 
                          variant="danger" 
                          className="rounded-pill"
                          onClick={async () => {
                            const key = process.env.NEXT_PUBLIC_ADMIN_API_KEY || '';
                            const ok = await clearServerCache(key);
                            if (ok) {
                              alert('서버 캐시가 초기화되었습니다.');
                            } else {
                              alert('서버 캐시 초기화에 실패했습니다.');
                            }
                          }}
                        >
                          서버 캐시 삭제
                        </Button>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </AdminGuard>
  );
}
