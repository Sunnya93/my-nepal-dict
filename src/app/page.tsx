'use client';

import { useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Form, ListGroup, Button, Card } from 'react-bootstrap';
import { fetchWords } from '@/lib/api';
import Header from '@/components/Header';
import type { WordEntry } from '@/types/word';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {

  const [search, setSearch] = useState('');
  const [wordEntries, setWordEntries] = useState<WordEntry[]>([]);
  const [envMessage, setEnvMessage] = useState<string>('');
  const [isClient, setIsClient] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    setIsClient(true);
    
    const loadWords = async () => {
      try {
        // 서버 API에서만 데이터 가져오기 (서버 캐시 사용)
        console.log('🌐 서버 API에서 데이터를 가져옵니다...');
        const wordEntries = await fetchWords(); // Now returns flattened WordEntry array
        setWordEntries(wordEntries);
      } catch (error) {
        console.error('데이터 로드 실패:', error);
        setWordEntries([]);
      }
    };

    loadWords();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (term.length === 0) return [];
    if (term.endsWith('!')) {
      const exactTerm = term.slice(0, -1).trim();
      if (!exactTerm) return [];
      return wordEntries.filter((w) =>
        [w.Nepali, w.Korean, w.Sound, w.English]
          .filter(Boolean)
          .some((t) => String(t).toLowerCase() === exactTerm)
      );
    }
    return wordEntries.filter((w) =>
      [w.Nepali, w.Korean, w.Sound, w.English]
        .filter(Boolean)
        .some((t) => String(t).toLowerCase().includes(term))
    );
  }, [search, wordEntries]);

  return (
    <>
      <Header />
      <Container fluid className="pt-3 pb-5">
      <Row className="justify-content-center">
        <Col lg={8}>
          {isClient && envMessage && (
            <div className="text-center text-muted small mb-3 p-2 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.05)' }}>
              {envMessage}
            </div>
          )}
          <Card className="glass-card border-0 rounded-4">
            <ListGroup variant="flush">
              {filtered.slice(0, 50).map((w, index) => (
                <ListGroup.Item key={`${w.Nepali}-${index}`} className="py-3 px-4 d-flex justify-content-between align-items-center">
                  <div>
                    <div className="fw-bold fs-5">{w.Nepali}</div>
                    <div className="text-muted">{w.Sound}</div>
                    <div className="text-muted">{w.Korean}</div>
                    {w.English && <div className="text-muted small">{w.English}</div>}
                    {w.Example && <div className="text-muted small">{w.Example}</div>}
                  </div>
                  {/* 비용 문제로 인하여 상세 페이지는 관리자만 제공 */}
                  {(isAuthenticated &&
                    <Button variant="outline-primary" href={`/words/${w.id}`} className="rounded-pill px-3">
                      상세
                    </Button>)}
                </ListGroup.Item>
              ))}
              {filtered.length === 0 && wordEntries.length > 0 && (
                <div className="text-center text-muted py-5">
                  검색 결과가 없습니다.<br/>
                  💡마지막에 !를 붙여 정확한 검색을 시도해보세요.
                </div>
              )}
              {wordEntries.length === 0 && (
                <div className="text-center text-muted py-5">
                  데이터를 불러오는 중입니다...
                </div>
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
