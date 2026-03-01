import type { SheetsSettingsPanelProps } from './types'

export function SheetsSettingsPanel({
  serviceAccountEmail,
  spreadsheetId,
  isEditing,
  onEditingChange,
  tempInputValue,
  onTempInputChange,
  onSave,
  isSaving = false,
  saveButtonText = 'Save & Initialize',
  savingButtonText = 'Initializing...',
  inputPlaceholder = 'Paste your Google Sheet ID here',
  connectedText = 'Connected',
  changeButtonText = 'Change Spreadsheet',
  status,
}: SheetsSettingsPanelProps) {
  const handleSave = async () => {
    await onSave()
  }

  const handleCancel = () => {
    onEditingChange(false)
    onTempInputChange('')
  }

  const handleStartEditing = () => {
    onTempInputChange(spreadsheetId)
    onEditingChange(true)
  }

  return (
    <div className="space-y-4">
      {isEditing ? (
        <>
          <p className="text-sm font-medium text-foreground">Change Spreadsheet</p>
          <p className="text-xs text-muted-foreground font-light">
            Make sure to share the new spreadsheet with:
            <br />
            <code className="block mt-2 p-3 bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.2)] rounded-lg text-xs break-all select-all text-[var(--accent-cyan)]">
              {serviceAccountEmail}
            </code>
          </p>
          <div>
            <input
              type="text"
              value={tempInputValue}
              onChange={(e) => onTempInputChange(e.target.value)}
              placeholder={inputPlaceholder}
              className="w-full px-4 py-3 rounded-lg bg-[rgba(18,24,33,0.5)] border border-[rgba(100,150,255,0.2)] text-sm text-foreground focus:outline-none focus:border-[var(--accent-cyan)] focus:shadow-[0_0_20px_rgba(0,212,255,0.1)] transition-all duration-300"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-3 bg-transparent border border-[rgba(167,139,250,0.5)] text-[var(--accent-purple)] rounded-lg hover:border-[var(--accent-purple)] hover:bg-[rgba(167,139,250,0.1)] transition-all duration-300 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !tempInputValue}
              className="flex-1 px-4 py-3 bg-[var(--accent-cyan)] text-[#0a0e14] rounded-lg hover:bg-[rgba(0,212,255,0.8)] hover:shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-all duration-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? savingButtonText : saveButtonText}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="p-4 bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.2)] rounded-lg">
            <p className="text-sm text-[var(--accent-cyan)] font-medium mb-2">
              {connectedText}
            </p>
            <a
              href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[var(--accent-purple)] hover:text-[var(--accent-cyan)] underline break-all transition-colors"
            >
              Open Spreadsheet
            </a>
          </div>
          <button
            type="button"
            onClick={handleStartEditing}
            className="w-full px-4 py-3 bg-transparent border border-[rgba(167,139,250,0.5)] text-[var(--accent-purple)] rounded-lg hover:border-[var(--accent-purple)] hover:bg-[rgba(167,139,250,0.1)] transition-all duration-300 text-sm font-medium"
          >
            {changeButtonText}
          </button>
        </>
      )}

      {status && <StatusMessage status={status} />}
    </div>
  )
}

function StatusMessage({ status }: { status: string }) {
  if (!status) return null

  const isError =
    status.includes('error') || status.includes('Error') || status.includes('failed')
  const isSuccess = status.includes('success') || status.includes('Success')

  const bgColor = isError
    ? 'bg-[rgba(236,72,153,0.1)] text-[var(--accent-pink)] border border-[rgba(236,72,153,0.2)]'
    : isSuccess
      ? 'bg-[rgba(0,212,255,0.1)] text-[var(--accent-cyan)] border border-[rgba(0,212,255,0.2)]'
      : 'bg-[rgba(167,139,250,0.1)] text-[var(--accent-purple)] border border-[rgba(167,139,250,0.2)]'

  return <div className={`p-3 rounded-lg text-sm font-medium ${bgColor}`}>{status}</div>
}
