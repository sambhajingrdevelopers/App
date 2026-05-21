'use client';

import AuthGuard from '../../components/AuthGuard';
import SocialAppShell from '../../components/SocialAppShell';
import DynamicProfile from '../../components/profile/DynamicProfile';

export default function ProfilePage() {
  return (
    <AuthGuard>
      <SocialAppShell
        active="profile"
        title="Profile"
        subtitle="Your complete dynamic creator profile."
      >
        <DynamicProfile username="@you" />
      </SocialAppShell>
    </AuthGuard>
  );
}
