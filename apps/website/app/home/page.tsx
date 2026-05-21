import AuthGuard from '../../components/AuthGuard';
import SocialHomeApp from '../../components/SocialHomeApp';

export default function HomePage() {
  return (
    <AuthGuard>
      <SocialHomeApp />
    </AuthGuard>
  );
}
