import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import Chatbot from "./chatbot/chatbot";

function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-9997 text-white rounded-full p-0 shadow-2xl transition-all duration-300 hover:scale-110 overflow-visible group"
          aria-label="Open Chatbot"
        >
          {/* Robot/Chatbot Icon SVG */}
          <div className="relative w-16 h-16">
            {/* Main body circle with gradient */}
            <div 
              className="absolute inset-0 rounded-full transition-all duration-300 group-hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #BA7967 0%, #6B5B59 100%)'
              }}
            >
              {/* Chat bubble inside */}
              <svg 
                viewBox="0 0 64 64" 
                className="w-full h-full p-3"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Speech bubble */}
                <path
                  d="M32 15c-9.389 0-17 6.268-17 14 0 4.411 2.511 8.359 6.5 11.035V46l7.5-5.25C30.292 41.583 31.126 41.667 32 41.667c9.389 0 17-6.268 17-14S41.389 15 32 15z"
                  fill="white"
                  opacity="0.9"
                />
                {/* Eyes */}
                <circle cx="26" cy="26" r="2.5" fill="#BA7967" />
                <circle cx="38" cy="26" r="2.5" fill="#BA7967" />
                {/* Smile */}
                <path
                  d="M26 32c0 0 2 3 6 3s6-3 6-3"
                  stroke="#BA7967"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </div>
            
            {/* Antenna */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-[#D4956F]"></div>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#D4956F] rounded-full animate-pulse"></div>
            
            {/* Notification badge */}
            <span className="absolute top-0 right-0 w-4 h-4 bg-[#D4956F] text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse shadow-lg">
              AI
            </span>
          </div>
        </button>
      )}

      {/* Chatbot Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-9997 w-[420px] max-w-[calc(100vw-24px)] h-[500px] shadow-2xl rounded-2xl overflow-hidden"
          style={{
            animation: 'slideInFromBottom 0.3s ease-out'
          }}
        >
          {/* Close Button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 z-10 bg-[#6B5B59] hover:bg-[#BA7967] text-white rounded-full p-2 transition-all duration-200 shadow-lg"
            aria-label="Close Chatbot"
          >
            <X className="w-5 h-5" />
          </button>
          
          {/* Chatbot Component */}
          <div className="w-full h-full">
            <Chatbot />
          </div>
        </div>
      )}
    </>
  );
}

export default FloatingChatbot;
