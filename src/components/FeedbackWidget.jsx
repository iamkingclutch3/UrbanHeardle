import { useState } from "react";
import FeedbackForm from "./FeedbackForm.jsx";
import { MessageCircle } from "lucide-react";

const FeedbackWidget = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg focus:outline-none"
        title="Enviar feedback"
      >
        <MessageCircle className="w-5 h-5" />
      </button>

      {/* Floating Feedback Box */}
      {isOpen && (
        <div className="mt-2 w-80 bg-gray-900 text-white rounded-lg shadow-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Feedback</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white"
              title="Cerrar"
            >
              ✕
            </button>
          </div>
          <FeedbackForm />
        </div>
      )}
    </div>
  );
};

export default FeedbackWidget;
