// 개별 단어 읽기/쓰기 사용 예시

import {
  getWordDocument,
  findWordEntryById,
  updateWordEntryById,
  deleteWordEntryById,
  updateWordEntryByIndex
} from './word-operations';
import { createWordEntriesBulk, addWordEntriesToDocument } from './words';
import type { WordEntry } from '@/types/word';

// =============================================================================
// 읽기 예시
// =============================================================================

// 예시 1: 특정 네팔어 단어 찾기
export async function searchWordExample() {
  const id = crypto.randomUUID(); // Generate UUID for primary key
  const result = await findWordEntryById(id);
  
  if (result) {
    console.log('Found word:', result.wordEntry);
    console.log('In document:', result.docId);
    console.log('Korean meaning:', result.wordEntry.Korean);
  } else {
    console.log('Word not found');
  }
}

// 예시 2: 문서 전체 단어 목록 가져오기
export async function getDocumentWordsExample() {
  const wordDoc = await getWordDocument('top_doc_id_here');
  
  if (wordDoc && wordDoc.words) {
    console.log('Document contains', wordDoc.words.length, 'words:');
    wordDoc.words.forEach((entry, index) => {
      if (entry.DeleteFlag !== 'Y') {
        console.log(`${index}: ${entry.Nepali} = ${entry.Korean}`);
      }
    });
  }
}

// =============================================================================
// 쓰기 예시
// =============================================================================

// 예시 3: 특정 단어 수정
export async function updateWordExample() {
  const id = crypto.randomUUID(); // Generate UUID for primary key
  const success = await updateWordEntryById(id, {
    Nepali: 'नमस्कार',
    Korean: '안녕하세요 (수정됨)',
    English: 'Hello (updated)',
    Sound: 'namaskaar'
  });
  
  if (success) {
    console.log('Word updated successfully');
  } else {
    console.log('Failed to update word');
  }
}

// 예시 4: 특정 단어 삭제
export async function deleteWordExample() {
  const id = crypto.randomUUID(); // Generate UUID for primary key
  const success = await deleteWordEntryById(id);
  
  if (success) {
    console.log('Word deleted successfully');
  } else {
    console.log('Failed to delete word');
  }
}

// 예시 5: 인덱스로 직접 수정 (더 효율적)
export async function updateByIndexExample() {
  const id = crypto.randomUUID(); // Generate UUID for primary key
  const success = await updateWordEntryByIndex(id, 0, {
    Korean: '새로운 의미',
    Example: '새로운 예문'
  });
  
  if (success) {
    console.log('Word updated by index');
  }
}

// =============================================================================
// 복합 작업 예시
// =============================================================================

// 예시 6: 단어 찾아서 상세 정보 표시
export async function getWordDetailsExample(nepali: string) {
  const id = crypto.randomUUID(); // Generate UUID for primary key
  const result = await findWordEntryById(id);
  
  if (!result) {
    return {
      found: false,
      message: '단어를 찾을 수 없습니다.'
    };
  }
  
  return {
    found: true,
    word: result.wordEntry,
    location: {
      docId: result.docId,
      index: result.index
    },
    details: {
      nepali: result.wordEntry.Nepali,
      korean: result.wordEntry.Korean,
      english: result.wordEntry.English || '없음',
      sound: result.wordEntry.Sound || '없음',
      example: result.wordEntry.Example || '없음'
    }
  };
}

// 예시 7: 단어 일괄 업데이트
export async function bulkUpdateWordsExample(updates: Array<{
  nepali: string;
  changes: Partial<WordEntry>;
}>) {
  const results = [];
  
  for (const update of updates) {
    const id = crypto.randomUUID(); // Generate UUID for primary key
    const success = await updateWordEntryById(id, update.changes);
    results.push({
      nepali: update.nepali,
      success
    });
    
    // 연속 요청 시 약간의 지연
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}

// =============================================================================
// Bulk 작업 예시
// =============================================================================

// 예시 8: WordEntry 배열을 새 문서에 bulk로 저장
export async function bulkCreateWordsExample() {
  const wordEntries: Omit<WordEntry, 'CreatedDate' | 'UpdateDate'>[] = [
    {
      id: crypto.randomUUID(),
      Nepali: 'नमस्कार',
      Korean: '안녕하세요',
      English: 'Hello',
      Sound: 'namaskaar',
      Example: 'नमस्कार, तपाईं कस्तो हुनुहुन्छ?',
      DeleteFlag: 'N'
    },
    { 
      id: crypto.randomUUID(),
      Nepali: 'धन्यवाद',
      Korean: '감사합니다',
      English: 'Thank you',
      Sound: 'dhanyabad',
      Example: 'तपाईंको सहयोगको लागि धन्यवाद।',
      DeleteFlag: 'N'
    },
    {
      id: crypto.randomUUID(),
      Nepali: 'माफ गर्नुहोस्',
      Korean: '죄송합니다',
      English: 'Sorry',
      Sound: 'maaf garnuhos',
      Example: 'ढिलो भएकोमा माफ गर्नुहोस्।',
      DeleteFlag: 'N'
    }
  ];

  try {
    const docId = await createWordEntriesBulk(wordEntries);
    console.log('✅ Bulk 생성 성공! 문서 ID:', docId);
    return docId;
  } catch (error) {
    console.error('❌ Bulk 생성 실패:', error);
    return null;
  }
}

// 예시 9: 기존 문서에 WordEntry 배열 추가
export async function addWordsToBulkExample() {
  const existingDocId = 'existing_top_doc_id_here';
  
  const newWordEntries: Omit<WordEntry, 'CreatedDate' | 'UpdateDate'>[] = [
    {
      id: crypto.randomUUID(),
      Nepali: 'पानी',
      Korean: '물',
      English: 'Water',
      Sound: 'paani',
      DeleteFlag: 'N'
    },
    {
      id: crypto.randomUUID(),
      Nepali: 'खाना',
      Korean: '음식',
      English: 'Food',
      Sound: 'khaana',
      DeleteFlag: 'N'
    }
  ];

  try {
    const success = await addWordEntriesToDocument(existingDocId, newWordEntries);
    if (success) {
      console.log('✅ 기존 문서에 단어들 추가 성공!');
    }
    return success;
  } catch (error) {
    console.error('❌ 기존 문서에 추가 실패:', error);
    return false;
  }
}
