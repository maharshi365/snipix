export function WelcomeCard({ name, projects }) {
  return (
    <section className="welcome-card">
      <h1>Hello, {name}!</h1>
      <p>Ready to build something great?</p>
      <ul>
        {projects.map((project) => (
          <li key={project.id}>{project.name}</li>
        ))}
      </ul>
    </section>
  );
}
