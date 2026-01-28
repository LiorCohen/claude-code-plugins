// Page: Home
// Welcome page with project overview
export const HomePage = (): JSX.Element => {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Welcome to {'{{PROJECT_NAME}}'}
      </h2>
      <p className="text-gray-600 mb-4">
        This is a full-stack application built with spec-driven development.
      </p>
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-2">Architecture</h3>
        <ul className="list-disc list-inside text-gray-600 space-y-1">
          <li><strong>Contract:</strong> OpenAPI specification</li>
          <li><strong>Server:</strong> Express with layered architecture (Controller → Model → DAL)</li>
          <li><strong>Webapp:</strong> React with MVVM pattern (View → ViewModel → Model)</li>
        </ul>
      </div>
    </div>
  );
};
