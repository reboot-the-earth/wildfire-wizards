import { motion } from 'framer-motion';

export default function TriageWarning({ message }) {
  if (!message) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-3 mt-3 p-3.5 rounded-xl bg-red-50 border border-red-200"
    >
      <div className="flex items-start gap-2.5">
        <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <div className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1">
            Triage Required
          </div>
          <p className="text-xs text-red-600/80 leading-relaxed">
            {message}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
