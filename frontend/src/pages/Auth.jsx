export default function Auth() {
  return (
    <div className="page">
      <h2>Login</h2>

      <form className="form">
        <input placeholder="Email" />
        <input type="password" placeholder="Password" />
        <button className="primary">Login</button>
      </form>

      <p className="muted">
        Don’t have an account? Sign up
      </p>
    </div>
  );
}
