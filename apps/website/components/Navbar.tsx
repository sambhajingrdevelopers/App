import LogoutButton from './LogoutButton';

export default function Navbar() {
  return (
    <nav className="nav">
      <div className="brand">
        <div className="brandMark">V</div>
        <span>VibeLoop</span>
      </div>

      <div className="navLinks">
        <a href="#feed">Feed</a>
        <a href="#reels">Reels</a>
        <a href="#explore">Explore</a>
        <a href="#creators">Creators</a>
        <a href="#business">Business</a>
      </div>

      <LogoutButton />
    </nav>
  );
}
