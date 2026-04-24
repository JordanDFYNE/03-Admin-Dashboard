import { motion } from 'framer-motion';
import { Camera } from 'lucide-react';
import Header from '../components/common/Header.jsx';

const ScanPage = () => {
  return (
    <div className="relative z-10">
      <Header title="Scan" />

      <main className="mx-auto flex min-h-[calc(100vh-160px)] max-w-7xl items-center justify-center px-4 py-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xl rounded-3xl border border-slate-700 bg-slate-800/60 p-8 text-center shadow-2xl backdrop-blur-md"
        >
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-slate-900/70">
            <Camera size={34} className="text-emerald-400" />
          </div>

          <h2 className="text-2xl font-semibold text-white">Ready to scan</h2>
          <p className="mt-3 text-sm text-slate-400">
            Open the phone camera to scan a barcode and start a stock movement flow.
          </p>

          <button
            type="button"
            className="mt-8 inline-flex min-h-14 items-center justify-center rounded-2xl bg-emerald-500 px-8 py-4 text-base font-semibold text-slate-950 transition hover:bg-emerald-400"
          >
            Open camera
          </button>
        </motion.div>
      </main>
    </div>
  );
};

export default ScanPage;
