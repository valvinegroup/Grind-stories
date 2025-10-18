import React, { useState, useEffect } from 'react';

export const EmailCapture: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 5000); // Show after 5 seconds

    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => {
        setIsVisible(false);
    }, 2000);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 right-0 p-4 md:p-8 z-50">
      <div className="bg-white border border-stone-200 rounded-lg shadow-2xl p-6 w-full max-w-sm transform transition-all duration-500 ease-out translate-y-4 opacity-0 animate-slide-in">
        <button onClick={() => setIsVisible(false)} className="absolute top-2 right-2 text-stone-400 hover:text-stone-600">&times;</button>
        {isSubmitted ? (
            <div className="text-center">
                <h3 className="font-serif text-lg text-charcoal mb-2">Thank You</h3>
                <p className="text-stone-600 text-sm">You are now on the list.</p>
            </div>
        ) : (
            <>
                <h3 className="font-serif text-lg text-charcoal mb-2">Join Grind Stories</h3>
                <p className="text-stone-600 text-sm mb-4">Receive new articles directly to your inbox. Curated thoughts, delivered monthly.</p>
                <form onSubmit={handleSubmit}>
                    <input
                        type="email"
                        placeholder="your.email@address.com"
                        required
                        className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-gold"
                    />
                    <button type="submit" className="w-full mt-3 bg-charcoal text-white text-sm font-semibold py-2 rounded-md hover:bg-stone-700 transition-colors">
                        Subscribe
                    </button>
                </form>
            </>
        )}
        <style>{`
          @keyframes slide-in {
            from { transform: translateY(1rem); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          .animate-slide-in {
            animation: slide-in 0.5s forwards ease-out;
          }
        `}</style>
      </div>
    </div>
  );
};