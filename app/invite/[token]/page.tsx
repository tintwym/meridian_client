'use client';

import { useParams } from 'next/navigation';
import InvitePage from '@/components/InvitePage';

export default function InviteRoutePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  if (!token) return null;
  return <InvitePage token={token} />;
}
