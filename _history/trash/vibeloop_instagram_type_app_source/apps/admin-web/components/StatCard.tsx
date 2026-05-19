export default function StatCard({ title, value }: { title: string; value: string }) {
  return <div className="card"><h3>{title}</h3><p>{value}</p></div>;
}
