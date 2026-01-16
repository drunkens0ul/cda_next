import { notFound } from 'next/navigation';

export default function CatchAll() {
  notFound();           // ← This triggers the closest not-found.tsx
}
