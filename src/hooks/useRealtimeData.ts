// 일반 사용자용 실시간 알림 훅
import { useEffect, useState } from 'react';

export function useRealtimeNotification() {
  const [shouldRefresh, setShouldRefresh] = useState(false);

  useEffect(() => {
    // Server-Sent Events로 실시간 알림 받기
    const eventSource = new EventSource('/api/words/notify');
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'data_changed') {
          console.log('📢 관리자가 데이터를 변경했습니다. 새로고침을 권장합니다.');
          setShouldRefresh(true);
        }
      } catch (error) {
        console.error('실시간 알림 파싱 오류:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.log('실시간 알림 연결 오류:', error);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const clearRefreshFlag = () => {
    setShouldRefresh(false);
  };

  return { shouldRefresh, clearRefreshFlag };
}
