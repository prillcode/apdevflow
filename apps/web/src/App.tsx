// APDevFlow Web App
import { APP_NAME, APP_VERSION } from '@apdevflow/shared';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          {APP_NAME}
        </h1>
        <p className="text-gray-600">
          Version {APP_VERSION} - Coming Soon
        </p>
      </div>
    </div>
  );
}

export default App;
