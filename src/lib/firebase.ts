import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDocFromServer, getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const PRIMARY_ADMIN_EMAIL = 'zen.saifulhere@gmail.com';
export const SUPER_ADMIN_EMAILS = [
  'zen.saifulhere@gmail.com',
  'n8n.cloud.26@gmail.com',
];

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase());
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function extractReadableError(error: unknown, fallback: string): string {
  let raw = error instanceof Error ? error.message : typeof error === 'string' ? error : fallback;
  let metaDetail = '';
  try {
    const parsed = JSON.parse(raw) as Partial<FirestoreErrorInfo>;
    if (parsed && typeof parsed.error === 'string' && parsed.error.trim().length > 0) {
      raw = parsed.error;
      const op = parsed.operationType ? `${parsed.operationType} ` : '';
      const path = parsed.path ? `on ${parsed.path}` : '';
      const email = parsed.authInfo?.email ? ` · account: ${parsed.authInfo.email}` : ' · not signed in';
      const verified =
        parsed.authInfo?.email !== undefined
          ? ` (verified: ${String(Boolean(parsed.authInfo?.emailVerified))})`
          : '';
      if (op || path) {
        metaDetail = ` [${op}${path}${email}${verified}]`;
      }
    }
  } catch {
    // Keep non-JSON error message
  }

  const lower = raw.toLowerCase();
  if (lower.includes('exceeds the maximum allowed size')) {
    return 'Content exceeds Firestore 1 MB document limit. Upload photos individually or remove oversized items before publishing.';
  }
  if (lower.includes('permission-denied') || lower.includes('missing or insufficient permissions')) {
    return `Missing or insufficient permissions${metaDetail}. Verify you are signed in with an authorized verified Admin Google account.`;
  }
  if (lower.includes('the client is offline') || lower.includes('network')) {
    return 'Database connection appears offline. Please check your internet connection and retry.';
  }
  if (lower.includes('quota exceeded')) {
    return 'Daily database quota limit reached. Please retry after the daily reset.';
  }
  return raw || fallback;
}

export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'siteContent', 'main'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Firebase configuration check: Firestore client appears offline.');
      return false;
    }
    return true;
  }
}
