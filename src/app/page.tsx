'use client';

import { useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Form, ListGroup, Button, Card } from 'react-bootstrap';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { COLLECTIONS } from '@/constants/collections';
import type { Word } from '@/types/word';

export default function HomePage() {
  // 네, 맞습니다! 정확히 이해하셨습니다.

  // 1. search라는 변수를 담는 setSearch() 함수를 이 화면에서 전역 변수로 사용하겠다.
  // 단, setSearch() 를 타면 search에 값이 담기고, 화면은 다시 리렌더링한다.
  // ✅ 정확함: useState는 상태 변수와 setter 함수를 제공하며, setter 호출 시 리렌더링 발생

  // 2. words라는 변수를 담는 setWords() 함수를 이 화면에서 전역 변수로 사용하겠다.
  // 마찬가지로 setWords()를 실행하면 () 안의 값이 words로 할당되고, 이 words를 [](array) 형태이다.
  // ✅ 정확함: words는 Word[] 타입의 배열이며, setWords로 새 배열을 할당하면 리렌더링 발생

  // useState('') 안의 값은 search 또는 words의 type이다. 맞니?
  // ✅ 정확함: useState() 안의 값은 초기값(initial value)이며, 해당 상태 변수의 타입을 결정합니다.
  // 
  // useState('') → search는 string 타입, 초기값은 빈 문자열 ''
  // useState<Word[]>([]) → words는 Word[] 타입, 초기값은 빈 배열 []
  // 
  // TypeScript에서는 초기값으로 타입을 추론하거나, 제네릭 <Type>으로 명시적 타입 지정 가능

  // 제네릭 <Type>은 array도 포함되니?
  // ✅ 네, 당연히 포함됩니다! 제네릭은 모든 타입을 지원합니다:
  // 
  // 기본 타입: useState<string>(''), useState<number>(0), useState<boolean>(false)
  // 배열 타입: useState<string[]>([]), useState<number[]>([]), useState<Word[]>([])
  // 객체 타입: useState<User>({}), useState<{name: string}>({name: ''})
  // 유니온 타입: useState<string | null>(null), useState<Word | undefined>(undefined)
  // 
  // 제네릭 <Type>은 타입의 "틀"이므로 어떤 타입이든 넣을 수 있습니다!
  const [search, setSearch] = useState('');
  const [words, setWords] = useState<Word[]>([]);

  // onSnapshot의 내부 동작 원리:
  // 1. WebSocket 기반의 실시간 연결을 Firebase 서버와 유지
  // 2. 서버는 해당 컬렉션/문서의 변경사항을 실시간으로 모니터링
  // 3. 변경 감지 시 WebSocket을 통해 클라이언트에 즉시 알림 전송
  // 4. 클라이언트는 알림을 받으면 콜백 함수를 자동 실행
  
  // onSnapshot의 lifecycle:
  // 1. onSnapshot 호출 → Firebase 서버와 WebSocket 연결 생성
  // 2. 서버에서 쿼리 결과의 초기 데이터를 즉시 전송 (첫 번째 콜백 실행)
  // 3. 이후 DB 변경 시마다 diff(차이점)만 전송하여 콜백 실행
  // 4. unsub() 호출 시 WebSocket 연결 해제 및 리스너 정리
  
  // 네트워크 효율성:
  // - 전체 데이터가 아닌 변경된 부분(added/modified/removed)만 전송
  // - 네트워크 연결이 끊어져도 자동 재연결 및 누락된 변경사항 동기화
  // - 여러 클라이언트가 같은 데이터를 구독해도 서버에서 효율적으로 관리
  
  // 즉, DB와 "항상 연결"되어 있으며, 변경 시 "즉시 콜백 실행"이 맞습니다!

  // 궁금증에 대한 답변:
  // onSnapshot의 콜백 함수가 실행되어도 useEffect 자체는 다시 실행되지 않습니다!
  // 
  // 실제 동작 과정:
  // 1. useEffect는 컴포넌트 마운트 시점에 딱 한 번만 실행됩니다 (의존성 배열이 []이므로)
  // 2. useEffect 내부에서 onSnapshot이 Firebase 서버와 실시간 연결을 생성합니다
  // 3. 이후 DB 변경이 발생하면 onSnapshot의 콜백 함수만 실행됩니다
  // 4. 콜백 함수에서 setWords()를 호출하면 words 상태가 업데이트됩니다
  // 5. 상태 업데이트로 인해 컴포넌트가 리렌더링됩니다
  // 6. 하지만 useEffect는 다시 실행되지 않습니다 (의존성 배열이 변경되지 않았으므로)
  // 
  // 즉, useEffect(한 번 실행) → onSnapshot 구독 설정 → 콜백만 반복 실행 → 리렌더링
  // 
  // 만약 useEffect가 매번 다시 실행된다면:
  // - 기존 onSnapshot 연결이 정리되지 않아 메모리 누수 발생
  // - 새로운 연결이 계속 생성되어 중복 구독 문제 발생
  // - 성능상 매우 비효율적
  // 
  // 그래서 cleanup 함수 (return () => unsub())가 중요합니다:
  // - 컴포넌트 언마운트 시에만 실행되어 연결을 정리합니다
  useEffect(() => {
    const coll = collection(db, COLLECTIONS.WORDS);
    const q = query(coll, orderBy('Nepali'));
    // return () => unsub()는 C#의 using문과 매우 유사한 역할을 합니다!
    // 
    // C# using문의 역할:
    // using (var resource = new DisposableResource()) {
    //   // 리소스 사용
    // } // 블록 종료 시 자동으로 resource.Dispose() 호출
    // 
    // React useEffect cleanup의 역할:
    // useEffect(() => {
    //   const resource = createResource(); // 리소스 생성
    //   return () => resource.cleanup();   // 컴포넌트 언마운트 시 자동으로 cleanup() 호출
    // }, []);
    // 
    // 둘 다 "RAII(Resource Acquisition Is Initialization)" 패턴을 구현합니다:
    // - 리소스 획득과 해제를 자동화
    // - 메모리 누수 방지
    // - 예외 발생 시에도 안전한 리소스 정리
    
    // TypeScript에서 using 키워드:
    // TypeScript 5.2+에서 using 키워드가 도입되었습니다!
    // 
    // using 사용 예시:
    // function example() {
    //   using file = openFile("data.txt"); // Symbol.dispose 메서드가 있는 객체
    //   // 함수 종료 시 자동으로 file[Symbol.dispose]() 호출
    // }
    // 
    // async using 사용 예시:
    // async function example() {
    //   await using connection = await openConnection(); // Symbol.asyncDispose 메서드가 있는 객체
    //   // 함수 종료 시 자동으로 await connection[Symbol.asyncDispose]() 호출
    // }
    // 
    // 하지만 React에서는 여전히 useEffect cleanup이 표준입니다:
    // 1. React의 컴포넌트 생명주기와 잘 맞음
    // 2. 의존성 배열에 따른 재실행 제어 가능
    // 3. 브라우저 호환성 (using 키워드는 최신 기능)
    // 4. React 커뮤니티의 표준 패턴
    
    const unsub = onSnapshot(q, (snap) => {
      const items: Word[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setWords(items.filter((w) => w.DeleteFlag !== 'Y'));
    });
    return () => unsub();
  }, []);

  // useMemo vs useEffect 차이점:
  // useMemo: 계산된 값을 메모이제이션하여 리턴. 의존성 배열이 변경될 때만 재계산
  // useEffect: 사이드 이펙트 실행용. 렌더링 후 실행되며 값을 리턴하지 않음
  
  // 여기서 useMemo를 사용한 이유:
  // 1. 필터링은 순수한 계산 작업 (사이드 이펙트 없음)
  // 2. search나 words가 변경될 때만 재계산이 필요
  // 3. 계산 결과를 직접 렌더링에 사용 (리턴값 필요)
  // 4. useEffect를 사용하면 state 업데이트로 인한 추가 리렌더링 발생
  
  // setWords가 useEffect 안에 있는 이유:
  // 1. Firebase onSnapshot은 사이드 이펙트 (외부 데이터 구독)
  // 2. 컴포넌트 마운트 시점에 한 번만 구독 설정 필요
  // 3. cleanup 함수로 언마운트 시 구독 해제 필요
  // 4. 데이터 fetching/구독은 useEffect의 전형적인 사용 사례

  // 네, 맞습니다! 아주 정확하게 이해하셨네요.
  // 
  // 1. useMemo() 함수는 search, words가 변경되면 실행된다. ✅
  //    - 의존성 배열 [search, words]에 있는 값들이 변경될 때만 재계산
  //    - React가 이전 값과 현재 값을 얕은 비교(shallow comparison)로 확인
  //    - 변경이 없으면 이전에 계산된 값을 재사용 (메모이제이션)
  // 
  // 2. search, words는 setSearch(), setWords()에 의해 변경된다. ✅
  //    - setSearch: 사용자가 검색어를 입력할 때 호출
  //    - setWords: Firebase onSnapshot에서 새 데이터를 받을 때 호출
  //    - useState로 관리되는 state이므로 setter 함수로만 변경 가능
  // 
  // 3. filtered가 업데이트되면 DOM이 re-render된다. ✅
  //    - filtered는 JSX에서 map()으로 렌더링되는 데이터
  //    - useMemo가 새 배열을 반환하면 React가 변경을 감지
  //    - Virtual DOM diffing 후 실제 DOM 업데이트
  //    - 성능 최적화: 동일한 결과라면 불필요한 re-render 방지
  // 
  // 추가 설명:
  // - React의 렌더링 흐름: State 변경 → 컴포넌트 리렌더 → useMemo 재계산 → DOM 업데이트
  // - 메모이제이션의 이점: 비싼 계산(여기서는 필터링)을 캐시하여 성능 향상
  // - 의존성 배열이 중요한 이유: 올바른 의존성을 지정해야 최신 데이터 반영
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return words;
    return words.filter((w) =>
      [w.Nepali, w.Korean, w.Sound, (w as any).English]
        .filter(Boolean)
        .some((t) => String(t).toLowerCase().includes(term))
    );
  }, [search, words]);

  return (
    <Container fluid className="pt-3 pb-5">
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
              {filtered.slice(0, 15).map((w) => (
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
                <div className="text-center text-muted py-5">검색 결과가 없습니다.</div>
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
  );
}


