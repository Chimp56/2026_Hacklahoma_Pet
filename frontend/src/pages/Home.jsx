export default function Home() {
  return (
    <div className="page">
      <h2>Dashboard</h2>

      <div className="card-grid">
        <div className="card">
          <h3>Sleep</h3>
          <p>7h 42m</p>
        </div>

        <div className="card">
          <h3>Meals</h3>
          <p>2 today</p>
        </div>

        <div className="card">
          <h3>Activity</h3>
          <p>Normal</p>
        </div>
      </div>
    </div>
  );
}
