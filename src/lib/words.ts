import { collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, serverTimestamp, setDoc, updateDoc, addDoc, limit } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { COLLECTIONS } from '@/constants/collections';
import { updateCacheWord } from '@/lib/api';
import { generateEntryId } from '@/lib/id';
import type { Word, WordEntry } from '@/types/word';

export async function listWords(): Promise<Word[]> {
  const coll = collection(db, COLLECTIONS.WORDS);
  const q = query(coll, orderBy('id'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
}

export async function getWord(id: string): Promise<Word | null> {
  const ref = doc(db, COLLECTIONS.WORDS, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as any) };
}

// Firebase: writes a new WordEntry into the top Word document
export async function createWordEntry(payload: Omit<WordEntry, 'id' | 'CreatedDate' | 'UpdateDate'>): Promise<string> {
  // Check if top Word document exists (limit to 1)
  const coll = collection(db, COLLECTIONS.WORDS);
  const q = query(coll, orderBy('CreatedDate'), limit(1));
  const snap = await getDocs(q);
  
  let wordDoc: Word;
  let docRef;
  
  if (snap.empty) {
    // Create the top document if it doesn't exist (only 1 document allowed)
    docRef = await addDoc(coll, {
      words: [],
      CreatedDate: serverTimestamp(),
      UpdateDate: serverTimestamp()
    });
    wordDoc = { id: docRef.id, words: [] };
    console.log('📄 새 최상위 문서가 생성되었습니다: ' + docRef.id);
  } else {
    // Use the existing top document
    docRef = doc(db, COLLECTIONS.WORDS, snap.docs[0].id);
    wordDoc = { id: snap.docs[0].id, ...(snap.docs[0].data() as any) };
  }
  
  // Add new word entry to the words array of the top document
  const newWordEntry: WordEntry = {
    id: generateEntryId(),
    ...payload,
    CreatedDate: serverTimestamp(),
    UpdateDate: serverTimestamp()
  };
  
  const updatedWords = [...(wordDoc.words || []), newWordEntry];
  
  // Firebase: update the words array on the single top-level document
  await updateDoc(docRef, {
    words: updatedWords,
    UpdateDate: serverTimestamp()
  });
  
  // Add to server cache
  const cacheEntry = { ...newWordEntry, docId: wordDoc.id };
  await updateCacheWord('add', cacheEntry);
  console.log('➕ 새 단어 항목이 최상위 문서의 WordEntry 배열에 추가되었습니다: ' + payload.Nepali);
  
  // return the newly created entry id for routing
  return newWordEntry.id as string;
}

export async function updateWordEntry(docId: string, wordIndex: number, payload: Partial<WordEntry>) {
  const ref = doc(db, COLLECTIONS.WORDS, docId);
  const wordDoc = await getDoc(ref);
  
  if (!wordDoc.exists()) {
    throw new Error('Word document not found');
  }
  
  const data = wordDoc.data() as Word;
  const words = data.words || [];
  
  if (wordIndex < 0 || wordIndex >= words.length) {
    throw new Error('Word entry index out of range');
  }
  
  // Update specific word entry
  words[wordIndex] = {
    ...words[wordIndex],
    ...payload,
    UpdateDate: serverTimestamp()
  };
  
  await updateDoc(ref, {
    words: words,
    UpdateDate: serverTimestamp()
  });
  
  // Update server cache
  const updatedEntry = { ...words[wordIndex], docId };
  await updateCacheWord('update', updatedEntry, docId);
  console.log('✏️ 단어 항목이 서버 캐시에서 업데이트되었습니다: ' + payload.Nepali);
}

export async function softDeleteWordEntry(docId: string, wordIndex: number) {
  const ref = doc(db, COLLECTIONS.WORDS, docId);
  const wordDoc = await getDoc(ref);
  
  if (!wordDoc.exists()) {
    throw new Error('Word document not found');
  }
  
  const data = wordDoc.data() as Word;
  const words = data.words || [];
  
  if (wordIndex < 0 || wordIndex >= words.length) {
    throw new Error('Word entry index out of range');
  }
  
  // Mark word entry as deleted
  words[wordIndex] = {
    ...words[wordIndex],
    DeleteFlag: 'Y',
    UpdateDate: serverTimestamp()
  };
  
  await updateDoc(ref, {
    words: words,
    UpdateDate: serverTimestamp()
  });
  
  // Update server cache (will be removed from cache due to DeleteFlag)
  const deletedEntry = { ...words[wordIndex], docId };
  await updateCacheWord('update', deletedEntry, docId);
  console.log('🗑️ 단어 항목이 삭제 표시되었습니다: ' + words[wordIndex].Nepali);
}

export async function deleteWordDocument(id: string) {
  const ref = doc(db, COLLECTIONS.WORDS, id);
  await deleteDoc(ref);
}

// WordEntry 배열을 하나의 Document에 bulk로 저장
export async function createWordEntriesBulk(wordEntries: Omit<WordEntry, 'CreatedDate' | 'UpdateDate'>[]): Promise<string> {
  try {
    if (!wordEntries || wordEntries.length === 0) {
      throw new Error('WordEntry 배열이 비어있습니다.');
    }

    // 새로운 Word 문서 생성
    const newWordDoc: Omit<Word, 'id'> = {
      words: wordEntries.map(entry => ({
        id: entry.id || generateEntryId(),
        ...entry,
        DeleteFlag: entry.DeleteFlag || 'N',
        CreatedDate: serverTimestamp(),
        UpdateDate: serverTimestamp()
      }))
    };

    // Firebase에 새 문서 추가
    const coll = collection(db, COLLECTIONS.WORDS);
    const docRef = await addDoc(coll, {
      ...newWordDoc,
      CreatedDate: serverTimestamp(),
      UpdateDate: serverTimestamp()
    });

    // 서버 캐시에 모든 단어 항목 추가
    for (const entry of newWordDoc.words) {
      const cacheEntry = { 
        ...entry, 
        docId: docRef.id,
        CreatedDate: serverTimestamp(),
        UpdateDate: serverTimestamp()
      };
      await updateCacheWord('add', cacheEntry);
    }

    console.log(`🚀 ${wordEntries.length}개의 단어 항목이 문서 ${docRef.id}에 bulk로 추가되었습니다.`);
    
    return docRef.id;
  } catch (error) {
    console.error('Bulk word entries creation failed:', error);
    throw error;
  }
}

// 기존 Word 문서에 WordEntry 배열 추가
export async function addWordEntriesToDocument(docId: string, newWordEntries: Omit<WordEntry, 'CreatedDate' | 'UpdateDate'>[]): Promise<boolean> {
  try {
    if (!newWordEntries || newWordEntries.length === 0) {
      throw new Error('추가할 WordEntry 배열이 비어있습니다.');
    }

    // 기존 문서 가져오기
    const wordDoc = await getWord(docId);
    if (!wordDoc) {
      throw new Error('문서를 찾을 수 없습니다: ' + docId);
    }

    // 기존 단어들과 새 단어들 합치기
    const existingWords = wordDoc.words || [];
    const processedNewEntries = newWordEntries.map(entry => ({
      id: entry.id || generateEntryId(),
      ...entry,
      DeleteFlag: entry.DeleteFlag || 'N',
      CreatedDate: serverTimestamp(),
      UpdateDate: serverTimestamp()
    }));

    const combinedWords = [...existingWords, ...processedNewEntries];

    // Firebase 문서 업데이트
    const docRef = doc(db, COLLECTIONS.WORDS, docId);
    await updateDoc(docRef, {
      words: combinedWords,
      UpdateDate: serverTimestamp()
    });

    // 서버 캐시에 새 단어들만 추가
    for (const entry of processedNewEntries) {
      const cacheEntry = { 
        ...entry, 
        docId: docId,
        CreatedDate: serverTimestamp(),
        UpdateDate: serverTimestamp()
      };
      await updateCacheWord('add', cacheEntry);
    }

    console.log(`➕ ${newWordEntries.length}개의 단어 항목이 문서 ${docId}에 추가되었습니다.`);
    
    return true;
  } catch (error) {
    console.error('Adding word entries to document failed:', error);
    return false;
  }
}
