import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { COLLECTIONS } from '@/constants/collections';
import { updateCacheWord } from '@/lib/api';
import type { Word, WordEntry } from '@/types/word';

// 특정 문서 ID로 모든 단어 항목 가져오기
export async function getWordDocument(docId: string): Promise<Word | null> {
  try {
    const docRef = doc(db, COLLECTIONS.WORDS, docId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    return { id: docSnap.id, ...docSnap.data() } as Word;
  } catch (error) {
    console.error('Error getting word document:', error);
    return null;
  }
}

export async function findWordEntryById(id: string): Promise<{
  wordEntry: WordEntry;
  docId: string;
  index: number;
} | null> {
  try {
    // 캐시된 데이터에서 검색
    const response = await fetch('/api/words');
    const data = await response.json();
    
    if (data.words) {
      const foundEntry = data.words.find((entry: any) => 
        entry.id === id && entry.DeleteFlag !== 'Y'
      );
      
      if (foundEntry) {
        return {
          wordEntry: foundEntry,
          docId: foundEntry.docId,
          index: -1 // 캐시에서는 인덱스를 모르므로 별도 조회 필요
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error finding word entry:', error);
    return null;
  }
}

// 문서 내에서 특정 단어 항목의 인덱스 찾기
// Firebase: reads a single document to resolve the index of a word entry by its id
export async function findWordIndexInDocument(docId: string, entryId: string): Promise<number> {
  try {
    const wordDoc = await getWordDocument(docId);
    
    if (!wordDoc || !wordDoc.words) {
      return -1;
    }
    
    return wordDoc.words.findIndex(entry => entry.id === entryId && entry.DeleteFlag !== 'Y');
  } catch (error) {
    console.error('Error finding word index:', error);
    return -1;
  }
}

// =============================================================================
// 개별 단어 쓰기 작업
// =============================================================================

// 특정 단어 항목 수정 (네팔어로 찾아서)
export async function updateWordEntryById(
  id: string, 
  updates: Partial<WordEntry>
): Promise<boolean> {
  try {
    // 1. 단어 찾기
    const foundWord = await findWordEntryById(id);
    if (!foundWord) {
      console.error('Word not found:', id);
      return false;
    }
    
    // 2. 문서에서 정확한 인덱스 찾기
    const wordIndex = await findWordIndexInDocument(foundWord.docId, id);
    if (wordIndex === -1) {
      console.error('Word index not found in document');
      return false;
    }
    
    // 3. Firebase 문서 업데이트
    const docRef = doc(db, COLLECTIONS.WORDS, foundWord.docId);
    const wordDoc = await getWordDocument(foundWord.docId);
    
    if (!wordDoc || !wordDoc.words) {
      return false;
    }
    
    // 단어 항목 업데이트
    const updatedWords = [...wordDoc.words];
    updatedWords[wordIndex] = {
      ...updatedWords[wordIndex],
      ...updates,
      UpdateDate: new Date()
    };
    
    await updateDoc(docRef, {
      words: updatedWords,
      UpdateDate: new Date()
    });
    
    // 4. 서버 캐시 업데이트
    const updatedEntry = { ...updatedWords[wordIndex], docId: foundWord.docId };
    await updateCacheWord('update', updatedEntry, updatedEntry.id as string);
    
    console.log('✏️ 단어 업데이트 완료:', id);
    return true;
    
  } catch (error) {
    console.error('Error updating word entry:', error);
    return false;
  }
}

// 특정 단어 항목 삭제 (네팔어로 찾아서)
export async function deleteWordEntryById(id: string): Promise<boolean> {
  try {
    return await updateWordEntryById(id, { 
      DeleteFlag: 'Y',
      UpdateDate: new Date() as any
    });
  } catch (error) {
    console.error('Error deleting word entry:', error);
    return false;
  }
}

// 특정 문서 ID + 인덱스로 직접 수정 (더 효율적)
export async function updateWordEntryByIndex(
  docId: string, 
  wordIndex: number, 
  updates: Partial<WordEntry>
): Promise<boolean> {
  try {
    const docRef = doc(db, COLLECTIONS.WORDS, docId);
    const wordDoc = await getWordDocument(docId);
    
    if (!wordDoc || !wordDoc.words || wordIndex < 0 || wordIndex >= wordDoc.words.length) {
      return false;
    }
    
    // 단어 항목 업데이트
    const updatedWords = [...wordDoc.words];
    updatedWords[wordIndex] = {
      ...updatedWords[wordIndex],
      ...updates,
      UpdateDate: new Date()
    };
    
    await updateDoc(docRef, {
      words: updatedWords,
      UpdateDate: new Date()
    });
    
    // 서버 캐시 업데이트
    const updatedEntry = { ...updatedWords[wordIndex], docId };
    await updateCacheWord('update', updatedEntry, updatedEntry.id as string);
    
    console.log('✏️ 단어 인덱스 업데이트 완료:', wordIndex);
    return true;
    
  } catch (error) {
    console.error('Error updating word by index:', error);
    return false;
  }
}
