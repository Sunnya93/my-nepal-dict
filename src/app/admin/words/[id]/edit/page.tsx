'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Container, Row, Col, Form, Button, Card } from 'react-bootstrap';
import { findWordEntryById, updateWordEntryById } from '@/lib/word-operations';
import AdminGuard from '@/components/AdminGuard';
import type { WordEntry } from '@/types/word';

export default function EditWordPage() {
  const params = useParams();
  const id = params?.id as string; // id는 WordEntry.id
  const router = useRouter();
  const [word, setWord] = useState<WordEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    
    const loadWordEntry = async () => {
      try {
        setLoading(true);
        // Firebase: WordEntry.id로 조회
        const decodedId = decodeURIComponent(id);
        const result = await findWordEntryById(decodedId);
        
        if (result) {
          setWord(result.wordEntry);
        } else {
          setWord(null);
        }
      } catch (error) {
        console.error('Error loading word entry:', error);
        setWord(null);
      } finally {
        setLoading(false);
      }
    };

    loadWordEntry();
  }, [id]);

  if (loading) {
    return (
      <AdminGuard>
        <Container className="py-4">
          <Row className="justify-content-center">
            <Col md={8}>
              <Card className="glass-card border-0 rounded-4">
                <Card.Body className="p-4 text-center">
                  <div>로딩 중...</div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </AdminGuard>
    );
  }

  if (!word) {
    return (
      <AdminGuard>
        <Container className="py-4">
          <Row className="justify-content-center">
            <Col md={8}>
              <Card className="glass-card border-0 rounded-4">
                <Card.Body className="p-4 text-center">
                  <div>단어를 찾을 수 없습니다.</div>
                  <Button variant="outline-secondary" onClick={() => router.back()} className="rounded-pill px-3 mt-3">뒤로</Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </AdminGuard>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const success = await updateWordEntryById(word.id || '', {
        Nepali: word.Nepali,
        Korean: word.Korean,
        English: word.English,
        Sound: word.Sound,
        Example: word.Example,
      });
      
      if (success) {
        router.push(`/words/${encodeURIComponent(word.id || '')}`);
      } else {
        alert('단어 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error updating word:', error);
      alert('단어 수정 중 오류가 발생했습니다.');
    }
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
                    <Form.Label>영어</Form.Label>
                    <Form.Control value={word.English || ''} onChange={(e) => setWord({ ...word, English: e.target.value })} />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>발음</Form.Label>
                    <Form.Control value={word.Sound || ''} onChange={(e) => setWord({ ...word, Sound: e.target.value })} />
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
