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

// ============================================================================
// Sharding helpers
// ============================================================================
const MAX_WORDS_PER_DOC = 4000;

function isShardId(baseId: string, candidateId: string): boolean {
  if (candidateId === baseId) return true;
  return candidateId.startsWith(baseId + '_');
}

function extractShardIndex(baseId: string, candidateId: string): number {
  if (candidateId === baseId) return 0;
  const suffix = candidateId.substring((baseId + '_').length);
  const n = parseInt(suffix, 10);
  return Number.isFinite(n) ? n : 0;
}

async function findLatestShard(baseId: string): Promise<{ id: string; words: WordEntry[] } | null> {
  const coll = collection(db, COLLECTIONS.WORDS);
  const snap = await getDocs(coll);
  const candidates = snap.docs
    .filter(d => isShardId(baseId, d.id))
    .map(d => ({ id: d.id, words: ((d.data() as any).words || []) as WordEntry[] }));
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => extractShardIndex(baseId, a.id) - extractShardIndex(baseId, b.id));
  return candidates[candidates.length - 1];
}

async function createNewShard(baseId: string, shardIndex: number, words: WordEntry[]) {
  const shardId = shardIndex === 0 ? baseId : `${baseId}_${shardIndex}`;
  const shardRef = doc(db, COLLECTIONS.WORDS, shardId);
  await setDoc(shardRef, {
    words,
    CreatedDate: serverTimestamp(),
    UpdateDate: serverTimestamp(),
  });
  return shardId;
}

async function getNextShardIndex(baseId: string): Promise<number> {
  const coll = collection(db, COLLECTIONS.WORDS);
  const snap = await getDocs(coll);
  const indices = snap.docs
    .filter(d => isShardId(baseId, d.id))
    .map(d => extractShardIndex(baseId, d.id));
  if (indices.length === 0) return 0;
  return Math.max(...indices) + 1;
}

// Firebase: writes a new WordEntry into the top Word document
export async function createWordEntry(payload: Omit<WordEntry, 'id' | 'CreatedDate' | 'UpdateDate'>): Promise<string> {
  // Resolve latest shard for base id 'Word'
  const baseId = 'Word';
  const latest = await findLatestShard(baseId);

  let targetDocId: string;
  let existingWords: WordEntry[] = [];
  if (!latest) {
    targetDocId = await createNewShard(baseId, 0, []);
  } else {
    targetDocId = latest.id;
    existingWords = latest.words || [];
  }

  // Add new word entry to the target shard
  const newWordEntry: WordEntry = {
    id: generateEntryId(),
    ...payload,
    CreatedDate: new Date(),
    UpdateDate: new Date()
  };
  
  // If target shard is full, create a new shard
  if (existingWords.length >= MAX_WORDS_PER_DOC) {
    const nextIndex = await getNextShardIndex(baseId);
    targetDocId = await createNewShard(baseId, nextIndex, [newWordEntry]);
  } else {
    const ref = doc(db, COLLECTIONS.WORDS, targetDocId);
    await updateDoc(ref, {
      words: [...existingWords, newWordEntry],
      UpdateDate: serverTimestamp()
    });
  }
  
  // Add to server cache
  const cacheEntry = { ...newWordEntry, docId: targetDocId };
  await updateCacheWord('add', cacheEntry);
  console.log('➕ 새 단어 항목이 샤드 문서에 추가되었습니다: ' + payload.Nepali);
  
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
    UpdateDate: new Date()
  };
  
  await updateDoc(ref, {
    words: words,
    UpdateDate: serverTimestamp()
  });
  
  // Update server cache
  const updatedEntry = { ...words[wordIndex], docId };
  await updateCacheWord('update', updatedEntry, updatedEntry.id as string);
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
    UpdateDate: new Date()
  };
  
  await updateDoc(ref, {
    words: words,
    UpdateDate: serverTimestamp()
  });
  
  // Update server cache (will be removed from cache due to DeleteFlag)
  const deletedEntry = { ...words[wordIndex], docId };
  await updateCacheWord('update', deletedEntry, deletedEntry.id as string);
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
        CreatedDate: new Date(),
        UpdateDate: new Date()
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

    // Prepare entries with timestamps and defaults
    const processedNewEntries = newWordEntries.map(entry => ({
      id: entry.id || generateEntryId(),
      ...entry,
      DeleteFlag: entry.DeleteFlag || 'N',
      CreatedDate: new Date(),
      UpdateDate: new Date()
    }));
    
    // Sharding: find latest shard for base docId
    const latest = await findLatestShard(docId);
    let targetDocId = docId;
    let existingWords: WordEntry[] = [];
    if (!latest) {
      // No shard exists yet: create base shard
      targetDocId = await createNewShard(docId, 0, []);
    } else {
      targetDocId = latest.id;
      existingWords = latest.words || [];
    }

    let remaining = [...processedNewEntries];
    let currentDocId = targetDocId;
    let currentWords = existingWords;

    while (remaining.length > 0) {
      const capacity = Math.max(0, MAX_WORDS_PER_DOC - (currentWords?.length || 0));
      if (capacity === 0) {
        const nextIndex = await getNextShardIndex(docId);
        currentDocId = await createNewShard(docId, nextIndex, []);
        currentWords = [];
      }

      const chunk = remaining.splice(0, Math.min(capacity || MAX_WORDS_PER_DOC, remaining.length));
      const ref = doc(db, COLLECTIONS.WORDS, currentDocId);
      await updateDoc(ref, {
        words: [...(currentWords || []), ...chunk],
        UpdateDate: serverTimestamp(),
      });
      
      // cache for this chunk
      for (const entry of chunk) {
        const cacheEntry = { ...entry, docId: currentDocId };
        await updateCacheWord('add', cacheEntry);
      }

      currentWords = [...(currentWords || []), ...chunk];
    }

    console.log(`➕ ${newWordEntries.length}개의 단어 항목이 샤드 문서들에 추가되었습니다 (base: ${docId}).`);
    
    return true;
  } catch (error) {
    console.error('Adding word entries to document failed:', error);
    return false;
  }
}
