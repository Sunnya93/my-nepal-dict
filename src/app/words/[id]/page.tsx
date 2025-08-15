'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { findWordEntryById } from '@/lib/word-operations';
import type { WordEntry } from '@/types/word';
import { useAuth } from '@/contexts/AuthContext';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';

export default function WordDetailPage() {
  const params = useParams();
  const id = params?.id as string; // id는 WordEntry.id
  const [wordEntry, setWordEntry] = useState<WordEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!id) return;
    
    const loadWordEntry = async () => {
      try {
        setLoading(true);
        // Firebase: fetch via API cache by WordEntry.id
        const result = await findWordEntryById(id);
        
        if (result) {
          setWordEntry(result.wordEntry);
        } else {
          setWordEntry(null);
        }
      } catch (error) {
        console.error('Error loading word entry:', error);
        setWordEntry(null);
      } finally {
        setLoading(false);
      }
    };

    loadWordEntry();
  }, [id]);

  if (loading) {
    return (
      <Container className="py-4">
        <Row className="justify-content-center">
          <Col lg={8}>
            <Card className="glass-card border-0 rounded-4">
              <Card.Body className="p-4 text-center">
                <div>로딩 중...</div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  if (!wordEntry) {
    return (
      <Container className="py-4">
        <Row className="justify-content-center">
          <Col lg={8}>
            <Card className="glass-card border-0 rounded-4">
              <Card.Body className="p-4 text-center">
                <div>단어를 찾을 수 없습니다.</div>
                <Button variant="outline-secondary" href="/" className="rounded-pill px-3 mt-3">목록</Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col lg={8}>
          <Card className="glass-card border-0 rounded-4">
            <Card.Body className="p-4">
              <div className="display-nepali mb-1">{wordEntry.Nepali}</div>
              <div className="muted-small mb-3">{wordEntry.Sound}</div>
              <div className="muted-medium mb-3">{wordEntry.Korean}</div>
              {wordEntry.Example && (
                <div className="p-3 rounded-3 bg-light border">{wordEntry.Example}</div>
              )}
              <div className="d-flex gap-2 mt-4">
                {isAuthenticated && wordEntry.id && (
                  <Button variant="primary" href={`/admin/words/${encodeURIComponent(wordEntry.id)}/edit`} className="rounded-pill px-3">수정</Button>
                )}
                <Button variant="outline-secondary" href="/" className="rounded-pill px-3">목록</Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
