'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Container, Row, Col, Form, Button, Card } from 'react-bootstrap';
import { getWord, updateWord } from '@/lib/words';
import AdminGuard from '@/components/AdminGuard';
import type { Word } from '@/types/word';

export default function EditWordPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const [word, setWord] = useState<Word | null>(null);

  useEffect(() => {
    if (!id) return;
    getWord(id).then(setWord);
  }, [id]);

  if (!word) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateWord(word.id, {
      Nepali: word.Nepali,
      Korean: word.Korean,
      Example: word.Example,
    });
    router.push(`/words/${word.id}`);
  };

  return (
    <AdminGuard>
      <Container className="py-4">
        <Row className="justify-content-center">
          <Col md={8}>
            <Card className="glass-card border-0 rounded-4">
              <Card.Body className="p-4">
                <h4 className="mb-3">단어 수정</h4>
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>네팔어</Form.Label>
                    <Form.Control value={word.Nepali} onChange={(e) => setWord({ ...word, Nepali: e.target.value })} />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>한국어</Form.Label>
                    <Form.Control value={word.Korean} onChange={(e) => setWord({ ...word, Korean: e.target.value })} />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>예문</Form.Label>
                    <Form.Control as="textarea" rows={4} value={word.Example || ''} onChange={(e) => setWord({ ...word, Example: e.target.value })} />
                  </Form.Group>
                  <div className="d-flex gap-2">
                    <Button type="submit" className="rounded-pill">저장</Button>
                    <Button variant="secondary" onClick={() => router.back()} className="rounded-pill">취소</Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </AdminGuard>
  );
}


