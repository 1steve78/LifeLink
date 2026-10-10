"use client";

import React, { useState } from "react";
import { X, ArrowRight, CheckCircle2, Droplet, ShieldCheck, FileCheck, Cpu, Building2, AlertTriangle } from "lucide-react";

interface RequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RequestModal: React.FC<RequestModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [bloodGroup, setBloodGroup] = useState<string>("B+");
  const [patientName, setPatientName] = useState<string>("");
  const [hospital, setHospital] = useState<string>("");
  const [units, setUnits] = useState<number>(2);
  const [urgency, setUrgency] = useState<"critical" | "urgent" | "planned">("urgent");
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  if (!isOpen) return null;

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  const handleStartVerification = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setStep(4); // Success screen
    }, 2200);
  };

  const resetAndClose = () => {
    setStep(1);
    setPatientName("");
    setHospital("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-neutral-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-50 text-[#C81E1E] flex items-center justify-center">
              <Droplet className="w-4 h-4 fill-[#C81E1E]" />
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 text-base">
                Create Emergency Blood Request
              </h3>
              <p className="text-xs text-neutral-500">
                Step {step} of 3 • 3-Gate Clinical Protocol
              </p>
            </div>
          </div>

          <button
            onClick={resetAndClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 overflow-y-auto">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                  Select Required Blood Group *
                </label>
                <div className="grid grid-cols-4 gap-2.5">
                  {bloodGroups.map((bg) => (
                    <button
                      key={bg}
                      type="button"
                      onClick={() => setBloodGroup(bg)}
                      className={`py-3 rounded-xl font-bold text-sm transition-all ${
                        bloodGroup === bg
                          ? "bg-[#C81E1E] text-white shadow-md shadow-red-500/25"
                          : "bg-neutral-50 text-neutral-700 hover:bg-neutral-100 border border-neutral-200"
                      }`}
                    >
                      {bg}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                  Patient Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Chandra (ICU Bed 12)"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-[#C81E1E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                    Units Needed
                  </label>
                  <select
                    value={units}
                    onChange={(e) => setUnits(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30"
                  >
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? "Unit" : "Units"}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                    Urgency Level
                  </label>
                  <select
                    value={urgency}
                    onChange={(e) =>
                      setUrgency(
                        e.target.value as "critical" | "urgent" | "planned"
                      )
                    }
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 font-semibold text-neutral-800"
                  >
                    <option value="critical">Critical (&lt; 2 hours)</option>
                    <option value="urgent">Urgent (Within 6 hours)</option>
                    <option value="planned">Planned Replacement</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full py-3.5 bg-[#C81E1E] hover:bg-[#B01A1A] text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-4"
              >
                Continue to Hospital Details
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                  Hospital Name & Location *
                </label>
                <div className="relative">
                  <Building2 className="w-5 h-5 text-neutral-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    placeholder="e.g. City Care Hospital, Main Block"
                    value={hospital}
                    onChange={(e) => setHospital(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-[#C81E1E]"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 leading-relaxed">
                  <strong>Verification Notice:</strong> In the next step, our automated system will perform Aadhaar OTP check and hospital requisition validation before broadcasting to donors within 5 km.
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-3 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex-1 py-3 bg-[#C81E1E] hover:bg-[#B01A1A] text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  Proceed to 3-Gate Verification
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 text-center">
              <div className="max-w-md mx-auto">
                <h4 className="text-lg font-bold text-neutral-900">
                  Execute 3-Gate Clinical Verification
                </h4>
                <p className="text-xs text-neutral-500 mt-1">
                  AI will cross-check patient identity, hospital admitting doctor, and trafficking indicators.
                </p>
              </div>

              <div className="space-y-3 text-left">
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/80">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-neutral-900 block">Gate 1: UIDAI Aadhaar Verification</span>
                    <span className="text-neutral-500">OTP verified via registered mobile number</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/80">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-neutral-900 block">Gate 2: Hospital Requisition Form OCR</span>
                    <span className="text-neutral-500">Doctor prescription & hospital stamp match verified</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/80">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-neutral-900 block">Gate 3: Claude AI Anti-Trafficking Safety Filter</span>
                    <span className="text-neutral-500">Behavioral anomaly & commercial fraud check: CLEAR</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={isVerifying}
                onClick={handleStartVerification}
                className="w-full py-4 bg-[#C81E1E] hover:bg-[#B01A1A] disabled:bg-neutral-300 text-white font-bold text-sm rounded-xl shadow-lg shadow-red-500/25 transition-all flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Running 3-Gate AI Verification...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>Authorize & Broadcast Emergency Pulse</span>
                  </>
                )}
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h4 className="text-xl font-extrabold text-neutral-900">
                  Emergency Pulse Broadcasted!
                </h4>
                <p className="text-sm text-neutral-600 mt-2 max-w-sm mx-auto">
                  Your request for <span className="font-bold text-[#C81E1E]">{units} Units of {bloodGroup}</span> at {hospital || "City Care Hospital"} has passed 3-gate verification and was dispatched to <span className="font-bold text-neutral-900">12 verified donors</span> within 5 km.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-600 text-left max-w-sm mx-auto space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Request ID:</span>
                  <span className="font-mono font-bold text-neutral-900">LL-REQ-89421</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Hospital:</span>
                  <span className="font-medium text-neutral-800">{hospital || "City Care Hospital"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Live Status:</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    Active Pulse Dispatching
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={resetAndClose}
                className="w-full py-3.5 bg-neutral-900 hover:bg-black text-white font-bold text-sm rounded-xl transition-colors mt-4"
              >
                Close & Track Live Pledges
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestModal;
