'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Row, Col, Card, Spinner } from 'react-bootstrap';
import { useAuth } from '@/contexts/AuthContext';

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={6} className="text-center">
            <Card className="glass-card border-0 rounded-4">
              <Card.Body className="p-4">
                <Spinner animation="border" className="mb-3" />
                <p>인증 확인 중...</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
