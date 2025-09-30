export function Stepper({ step }: { step: number }) {
  const steps = ['Connect', 'Scan', 'Verify', 'Claim', 'Done']
  return (
    <div className="flex items-center justify-center gap-3 flex-wrap">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full grid place-items-center text-sm font-semibold ${i <= step ? 'bg-black text-white' : 'bg-gray-200 text-gray-500'}`}>{i + 1}</div>
          <span className={`text-sm ${i <= step ? 'text-gray-900' : 'text-gray-500'}`}>{label}</span>
          {i < steps.length - 1 && <div className="w-8 h-[2px] bg-gray-200" />}
        </div>
      ))}
    </div>
  )
}
