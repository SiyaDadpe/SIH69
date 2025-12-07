import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

/**
 * LCA Prompt Modal
 * Simple modal asking user if they want to visit LCA reports and analytics
 */
const LCAPromptModal = ({ isOpen, onClose, reportId }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleYes = () => {
    // Navigate to analytics with reportId
    if (reportId) {
      navigate(`/analytics?reportId=${reportId}`);
    } else {
      navigate('/analytics');
    }
    onClose();
  };

  const handleNo = () => {
    // Just close modal and continue with wizard
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-linear-to-r from-[#BA7967] to-[#a86b5c] p-6 text-white text-center">
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-block mb-3"
          >
            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
            </svg>
          </motion.div>
          <h2 className="text-2xl font-bold">LCA Reports Generated!</h2>
        </div>

        {/* Content */}
        <div className="p-8">
          <p className="text-center text-gray-700 text-lg mb-8">
            LCA reports and analytics are generated. Would you like to visit them?
          </p>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleYes}
              className="flex-1 bg-linear-to-r from-[#BA7967] to-[#a86b5c] hover:from-[#a86b5c] hover:to-[#967359] text-white font-semibold py-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Yes, View Reports
            </Button>
            <Button
              onClick={handleNo}
              variant="outline"
              className="flex-1 px-6 py-6 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-medium rounded-lg transition-all duration-200"
            >
              No, Continue
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LCAPromptModal;
