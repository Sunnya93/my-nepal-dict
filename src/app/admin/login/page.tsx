'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Row, Col, Form, Button, Alert, Card } from 'react-bootstrap';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminLoginPage() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  // 이미 로그인된 상태라면 admin 홈으로 리다이렉트
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/admin');
    }
  }, [isAuthenticated, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!userId || !password) {
      setError('ID와 비밀번호를 입력하세요.');
      setIsLoading(false);
      return;
    }

    try {
      const success = await login(userId, password);
      if (success) {
        router.push('/admin');
      } else {
        setError('ID 또는 비밀번호가 올바르지 않습니다.');
      }
    } catch (error) {
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={6} lg={4}>
          <Card className="glass-card border-0 rounded-4">
            <Card.Body className="p-4">
              <h4 className="mb-3">관리자 로그인</h4>
              {error && <Alert variant="danger">{error}</Alert>}
              <Form onSubmit={handleLogin}>
                <Form.Group className="mb-3">
                  <Form.Label>ID</Form.Label>
                  <Form.Control value={userId} onChange={(e) => setUserId(e.target.value)} />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>비밀번호</Form.Label>
                  <Form.Control type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </Form.Group>
                <Button type="submit" className="w-100 rounded-pill" disabled={isLoading}>
                  {isLoading ? '로그인 중...' : '로그인'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}


