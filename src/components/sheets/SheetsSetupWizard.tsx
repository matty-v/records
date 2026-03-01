import type { SheetsSetupWizardProps } from './types'

export function SheetsSetupWizard({
  serviceAccountEmail,
  inputValue,
  onInputChange,
  onConnect,
  isConnecting = false,
  title = 'Setup Required',
  connectButtonText = 'Connect',
  connectingButtonText = 'Initializing...',
  inputPlaceholder = 'Paste your Google Sheet ID here',
  additionalInstructions,
}: SheetsSetupWizardProps) {
  const handleConnect = async () => {
    await onConnect()
  }

  return (
    <div className="mb-6 p-6 bg-[rgba(18,24,33,0.7)] backdrop-blur-[10px] border border-[rgba(100,150,255,0.2)] rounded-xl shadow-[0_0_40px_rgba(0,212,255,0.05)]">
      <p className="text-base text-foreground font-semibold mb-4">
        <span className="glow-cyan">{title}</span>
      </p>
      <ol className="list-decimal list-inside space-y-3 text-sm text-muted-foreground font-light">
        <li>Create a new Google Sheet</li>
        <li>
          Share it with:
          <br />
          <code className="block mt-2 p-3 bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.2)] rounded-lg text-xs break-all select-all text-[var(--accent-cyan)]">
            {serviceAccountEmail}
          </code>
          <span className="text-muted-foreground">(Editor access)</span>
        </li>
        <li>Copy the Sheet ID from the URL</li>
        <li>Paste below and click "{connectButtonText}"</li>
      </ol>
      {additionalInstructions && (
        <div className="mt-4 text-sm text-muted-foreground font-light">
          {additionalInstructions}
        </div>
      )}
      <div className="mt-6">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={inputPlaceholder}
          className="w-full px-4 py-3 rounded-lg bg-[rgba(18,24,33,0.5)] border border-[rgba(100,150,255,0.2)] text-sm text-foreground focus:outline-none focus:border-[var(--accent-cyan)] focus:shadow-[0_0_20px_rgba(0,212,255,0.1)] transition-all duration-300"
        />
        <button
          type="button"
          onClick={handleConnect}
          disabled={!inputValue || isConnecting}
          className="w-full mt-3 px-4 py-3 bg-[var(--accent-cyan)] text-[#0a0e14] rounded-lg text-sm font-medium hover:bg-[rgba(0,212,255,0.8)] hover:shadow-[0_0_20px_rgba(0,212,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
        >
          {isConnecting ? connectingButtonText : connectButtonText}
        </button>
      </div>
    </div>
  )
}
