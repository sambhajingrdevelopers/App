const navItems = ['Dashboard', 'Users', 'Posts', 'Reels', 'Stories', 'Reports', 'Verification', 'Ads', 'Analytics', 'Settings'];
const cards = [
  ['Total Users', '0'],
  ['Posts', '0'],
  ['Reports', '0'],
  ['Revenue', '₹0']
];

export default function Page() {
  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="logo">VibeLoop</div>
        <nav className="nav">
          {navItems.map((item) => <span key={item}>{item}</span>)}
        </nav>
      </aside>
      <main className="main">
        <h1>Admin Dashboard</h1>
        <p>Control users, posts, reels, reports, ads, and app settings.</p>
        <section className="cards">
          {cards.map(([title, value]) => (
            <div className="card" key={title}>
              <h3>{title}</h3>
              <p>{value}</p>
            </div>
          ))}
        </section>
        <section className="table">
          <h2>Recent Activity</h2>
          <div className="row"><strong>User</strong><strong>Action</strong><strong>Status</strong></div>
          <div className="row"><span>demo_user</span><span>Uploaded post</span><span>Active</span></div>
          <div className="row"><span>creator_1</span><span>Verification request</span><span>Pending</span></div>
        </section>
      </main>
    </div>
  );
}
