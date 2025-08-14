'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Row, Col, Form, Button, Card } from 'react-bootstrap';
import { createWord } from '@/lib/words';

export default function NewWordPage() {
  const router = useRouter();
  const [nepali, setNepali] = useState('');
  const [korean, setKorean] = useState('');
  const [example, setExample] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = await createWord({
      id: '',
      Nepali: nepali,
      Korean: korean,
      Example: example,
      DeleteFlag: 'N',
    } as any);
    router.push(`/words/${id}`);
  };

  return (
    <Container className="py-4">
      <Row>
        <Col md={8}>
          <Card className="glass-card border-0 rounded-4">
            <Card.Body className="p-4">
              <h4 className="mb-3">신규 단어 추가</h4>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>네팔어</Form.Label>
                  <Form.Control value={nepali} onChange={(e) => setNepali(e.target.value)} />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>한국어</Form.Label>
                  <Form.Control value={korean} onChange={(e) => setKorean(e.target.value)} />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>예문</Form.Label>
                  <Form.Control as="textarea" rows={4} value={example} onChange={(e) => setExample(e.target.value)} />
                </Form.Group>
                <Button type="submit" className="rounded-pill">추가</Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}


