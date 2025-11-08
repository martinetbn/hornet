import { useState } from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Welcome to Hornet
        </h1>
        <p className="text-gray-600 mb-6">
          An Electron app with React and Tailwind CSS
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
            <span className="text-lg font-semibold text-gray-700">Count:</span>
            <span className="text-3xl font-bold text-indigo-600">{count}</span>
          </div>

          <button
            onClick={() => setCount(count + 1)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Increment
          </button>

          <button
            onClick={() => setCount(0)}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Reset
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Built with Electron, React, and Tailwind CSS 4
          </p>
        </div>
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
