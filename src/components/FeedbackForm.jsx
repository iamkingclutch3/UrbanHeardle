import { useState } from "react";

const FeedbackForm = () => {
  const [category, setCategory] = useState("bug");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    try {
      const hostname = window.location.hostname;
      const baseURL = `http${hostname == "localhost" ? "" : "s"}://${hostname}${
        hostname == "localhost" ? ":5240" : ""
      }${hostname == "localhost" ? "" : "/api"}`;

      // Send to your backend (adjust URL accordingly)
      await fetch(`${baseURL}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: category || "general", // Default fallback
          message: message || "", // Default fallback
        }),
      });

      setSubmitted(true);
      setMessage("");
    } catch (error) {
      console.error("Error sending feedback:", error);
      alert("Error sending feedback. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-4 bg-green-700/20 border border-green-500 text-green-200 rounded-md">
        ¡Gracias por tu feedback! ✨
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-800 p-4 rounded-lg border border-gray-600 shadow-md"
    >
      <h2 className="text-lg font-semibold text-white mb-3">Enviar feedback</h2>

      <label className="block text-sm text-gray-300 mb-1" htmlFor="category">
        Tipo
      </label>
      <select
        id="category"
        className="w-full p-2 mb-3 bg-gray-700 text-white rounded-md"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      >
        <option value="bug">Reportar un error</option>
        <option value="suggestion">Sugerir una canción</option>
      </select>

      <label className="block text-sm text-gray-300 mb-1" htmlFor="message">
        Mensaje
      </label>
      <textarea
        id="message"
        className="w-full p-2 h-24 bg-gray-700 text-white rounded-md resize-none"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Describe el error o tu sugerencia..."
      ></textarea>

      <button
        type="submit"
        className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition disabled:opacity-50"
        disabled={loading}
      >
        {loading ? "Enviando..." : "Enviar"}
      </button>
    </form>
  );
};

export default FeedbackForm;
