import { collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { COLLECTIONS } from '@/constants/collections';
import type { Word } from '@/types/word';

export async function listWords(): Promise<Word[]> {
  const coll = collection(db, COLLECTIONS.WORDS);
  const q = query(coll, orderBy('Nepali'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
}

export async function getWord(id: string): Promise<Word | null> {
  const ref = doc(db, COLLECTIONS.WORDS, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as any) };
}

export async function createWord(payload: Omit<Word, 'id' | 'CreatedDate' | 'UpdateDate'>) {
  const ref = doc(collection(db, COLLECTIONS.WORDS));
  await setDoc(ref, { ...payload, CreatedDate: serverTimestamp(), UpdateDate: serverTimestamp() });
  return ref.id;
}

export async function updateWord(id: string, payload: Partial<Word>) {
  const ref = doc(db, COLLECTIONS.WORDS, id);
  await updateDoc(ref, { ...payload, UpdateDate: serverTimestamp() });
}

export async function softDeleteWord(id: string) {
  const ref = doc(db, COLLECTIONS.WORDS, id);
  await updateDoc(ref, { DeleteFlag: 'Y', UpdateDate: serverTimestamp() });
}

export async function deleteWord(id: string) {
  const ref = doc(db, COLLECTIONS.WORDS, id);
  await deleteDoc(ref);
}


