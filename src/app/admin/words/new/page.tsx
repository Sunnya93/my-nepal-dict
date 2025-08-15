'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Row, Col, Form, Button, Card } from 'react-bootstrap';
import { createWordEntry } from '@/lib/words';
import AdminGuard from '@/components/AdminGuard';

export default function NewWordPage() {
  const router = useRouter();
  const [nepali, setNepali] = useState('');
  const [korean, setKorean] = useState('');
  const [english, setEnglish] = useState('');
  const [sound, setSound] = useState('');
  const [example, setExample] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const entryId = await createWordEntry({
      Nepali: nepali,
      Korean: korean,
      English: english,
      Sound: sound,
      Example: example,
      DeleteFlag: 'N',
    });
    router.push(`/words/${entryId}`);
  };

  return (
    <AdminGuard>
      <Container className="py-4">
        <Row className="justify-content-center">
          <Col md={8}>
            <Card className="glass-card border-0 rounded-4">
              <Card.Body className="p-4">
                <h4 className="mb-3">신규 단어 추가</h4>
                <Form onSubmit={handleSubmit}>
                                  <Form.Group className="mb-3">
                  <Form.Label>네팔어</Form.Label>
                  <Form.Control value={nepali} onChange={(e) => setNepali(e.target.value)} required />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>한국어</Form.Label>
                  <Form.Control value={korean} onChange={(e) => setKorean(e.target.value)} required />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>영어 (선택)</Form.Label>
                  <Form.Control value={english} onChange={(e) => setEnglish(e.target.value)} />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>발음 (선택)</Form.Label>
                  <Form.Control value={sound} onChange={(e) => setSound(e.target.value)} />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>예문 (선택)</Form.Label>
                  <Form.Control as="textarea" rows={4} value={example} onChange={(e) => setExample(e.target.value)} />
                </Form.Group>
                  <Button type="submit" className="rounded-pill">추가</Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </AdminGuard>
  );
}


