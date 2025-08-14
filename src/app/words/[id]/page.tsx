'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { COLLECTIONS } from '@/constants/collections';
import type { Word } from '@/types/word';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';

export default function WordDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [word, setWord] = useState<Word | null>(null);

  useEffect(() => {
    if (!id) return;
    const ref = doc(db, COLLECTIONS.WORDS, id);
    // 1. ref는 Firestore의 특정 문서를 가리키는 참조입니다
    //    doc(db, COLLECTIONS.WORDS, id) = /words/{id} 경로의 문서
    // 
    // 2. onSnapshot이 작동하려면:
    //    - URL의 id 값 = Firestore 문서의 실제 ID가 일치해야 합니다
    //    - 예: URL이 /words/abc123 이면, Firestore에 ID가 'abc123'인 문서가 존재해야 함
    // 
    // 3. snap.exists()가 true가 되려면:
    //    - Firestore에 해당 ID의 문서가 실제로 존재해야 합니다
    //    - 문서가 없으면 snap.exists()는 false를 반환
    // 
    // 4. 문서 ID와 URL 파라미터가 다르면:
    //    - 존재하지 않는 문서를 참조하게 되어 snap.exists()가 false
    //    - setWord가 호출되지 않아 word는 null 상태 유지
    //    - 결과적으로 "return null"로 빈 화면 렌더링
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
                <Button variant="primary" href={`/admin/words/${word.id}/edit`} className="rounded-pill px-3">수정</Button>
                <Button variant="outline-secondary" href="/" className="rounded-pill px-3">목록</Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}


