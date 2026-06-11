export default function OfflinePage() {
  return (
    <main className="offlinePage">
      <section className="offlineCard">
        <div className="offlineLogo">▶</div>
        <h1>You are offline</h1>
        <p>
          VibeLoop is installed and ready, but live posts, reels, stories and messages need internet.
        </p>
        <a href="/home">Try Again</a>
      </section>
    </main>
  );
}
