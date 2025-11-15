import React from "react";

const TapToPayMock = () => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-4">
      <div className="flex-1">
        <h2 className="text-sm font-semibold text-slate-900 mb-1">
          Tap &amp; Pay (Prototype)
        </h2>
        <p className="text-xs text-slate-500 mb-3">
          On mobile, this would show a live QR or NFC token to pay on campus
          terminals. For now, it&apos;s a static preview.
        </p>
        <div className="rounded-2xl bg-slate-900 text-white p-4 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[0.65rem] uppercase tracking-wide text-slate-400">
                Smart Campus Wallet
              </p>
              <p className="text-sm font-semibold">Campus Card</p>
            </div>
            <div className="h-8 w-8 bg-emerald-400 rounded-xl flex items-center justify-center text-xs font-bold text-slate-900">
              SC
            </div>
          </div>
          <div className="flex justify-between items-end gap-4">
            <div>
              <p className="text-[0.65rem] text-slate-400">Student</p>
              <p className="text-sm font-medium">Alex Johnson</p>
              <p className="text-[0.65rem] text-slate-500 mt-1">
                ID: 2025-09342
              </p>
            </div>
            <div className="text-right">
              <p className="text-[0.65rem] text-slate-400">Default wallet</p>
              <p className="text-base font-semibold">USD 126.50</p>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full md:w-40 flex flex-col items-center justify-center gap-2">
        <div className="w-28 h-28 border border-dashed border-slate-300 rounded-xl flex items-center justify-center text-[0.6rem] text-slate-400">
          QR CODE
        </div>
        <p className="text-[0.7rem] text-slate-500 text-center">
          In the real app this would refresh every few seconds with a secure
          payment token.
        </p>
      </div>
    </div>
  );
};

export default TapToPayMock;
