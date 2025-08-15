'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { COLLECTIONS } from '@/constants/collections';
import type { Word } from '@/types/word';
import { useAuth } from '@/contexts/AuthContext';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';

export default function WordDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [word, setWord] = useState<Word | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!id) return;
    const ref = doc(db, COLLECTIONS.WORDS, id);

    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) setWord({ id: snap.id, ...(snap.data() as any) });
    });
    return () => unsub();
  }, [id]);

  if (!word) return null;

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col lg={8}>
          <Card className="glass-card border-0 rounded-4">
            <Card.Body className="p-4">
              <div className="display-nepali mb-1">{word.Nepali}</div>
              <div className="muted-small mb-3">{word.Sound}</div>
              <div className="muted-medium mb-3">{word.Korean}</div>
              {word.Example && (
                <div className="p-3 rounded-3 bg-light border">{word.Example}</div>
              )}
              <div className="d-flex gap-2 mt-4">
                {isAuthenticated && (
                  <Button variant="primary" href={`/admin/words/${word.id}/edit`} className="rounded-pill px-3">수정</Button>
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


