'use client';

import { useParams } from 'next/navigation';
import AuthGuard from '../../../components/AuthGuard';
import SocialAppShell from '../../../components/SocialAppShell';
import DynamicProfile from '../../../components/profile/DynamicProfile';

export default function PublicProfilePage() {
  const params = useParams();
  const rawUsername = String(params.username || '');
  const username = rawUsername.startsWith('@') ? rawUsername : `@${decodeURIComponent(rawUsername)}`;

  return (
    <AuthGuard>
      <SocialAppShell
        active="profile"
        title="Public Profile"
        subtitle={`Viewing ${username}`}
      >
        <DynamicProfile username={username} publicMode />
      </SocialAppShell>
    </AuthGuard>
  );
}
