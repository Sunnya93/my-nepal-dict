'use client';

import { useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Form, ListGroup, Button, Card } from 'react-bootstrap';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { COLLECTIONS } from '@/constants/collections';
import Header from '@/components/Header';
import type { Word } from '@/types/word';

export default function HomePage() {

  const [search, setSearch] = useState('');
  const [words, setWords] = useState<Word[]>([]);

  useEffect(() => {
    const coll = collection(db, COLLECTIONS.WORDS);
    const q = query(coll, orderBy('Nepali'));
    
    const unsub = onSnapshot(q, (snap) => {
      const items: Word[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setWords(items.filter((w) => w.DeleteFlag !== 'Y'));
    });
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (term.length === 0) return [];
    if (term.endsWith('!')) {
      const exactTerm = term.slice(0, -1).trim();
      if (!exactTerm) return [];
      return words.filter((w) =>
        [w.Nepali, w.Korean, w.Sound, (w as any).English]
          .filter(Boolean)
          .some((t) => String(t).toLowerCase() === exactTerm)
      );
    }
    return words.filter((w) =>
      [w.Nepali, w.Korean, w.Sound, (w as any).English]
        .filter(Boolean)
        .some((t) => String(t).toLowerCase().includes(term))
    );
  }, [search, words]);

  return (
    <>
      <Header />
      <Container fluid className="pt-3 pb-5">
      <div className="text-end text-muted">
        <p><a href="/admin">관리자</a></p>
      </div>
      <Row className="justify-content-center">
        <Col lg={8}>
          <Card className="glass-card border-0 rounded-4 mb-3 hover-lift">
            <Card.Body className="p-4">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="display-nepali">네팔어 단어장</div>
                  <div className="muted-small">단어를 검색해보세요.</div>
                </div>
                <div className="d-none d-md-block">
                  <span className="badge badge-soft px-3 py-2 rounded-pill">실시간 검색</span>
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card className="glass-card border-0 rounded-4">
            <ListGroup variant="flush">
              {filtered.slice(0, 50).map((w) => (
                <ListGroup.Item key={w.id} className="py-3 px-4 d-flex justify-content-between align-items-center">
                  <div>
                    <div className="fw-bold fs-5">{w.Nepali}</div>
                    <div className="text-muted">{w.Sound}</div>
                    <div className="text-muted">{w.Korean}</div>
                  </div>
                  <Button variant="outline-primary" href={`/words/${w.id}`} className="rounded-pill px-3">
                    상세
                  </Button>
                </ListGroup.Item>
              ))}
              {filtered.length === 0 && (
                <div className="text-center text-muted py-5">검색 결과가 없습니다.<br></br>💡마지막에 !를 붙여 정확한 검색을 시도해보세요.</div>
              )}
            </ListGroup>
          </Card>
        </Col>
      </Row>
      <div className="search-dock">
        <div className="glass search-dock-inner p-2">
          <Form>
            <Form.Control
              type="search"
              placeholder="단어를 검색하세요..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0"
            />
          </Form>
        </div>
      </div>  
    </Container>
    </>
  );
}


