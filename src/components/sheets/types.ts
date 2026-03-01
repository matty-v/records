export interface SheetsSetupWizardProps {
  serviceAccountEmail: string
  inputValue: string
  onInputChange: (value: string) => void
  onConnect: () => void | Promise<void>
  isConnecting?: boolean
  title?: string
  connectButtonText?: string
  connectingButtonText?: string
  inputPlaceholder?: string
  additionalInstructions?: React.ReactNode
}

export interface SheetsSettingsPanelProps {
  serviceAccountEmail: string
  spreadsheetId: string
  isEditing: boolean
  onEditingChange: (editing: boolean) => void
  tempInputValue: string
  onTempInputChange: (value: string) => void
  onSave: () => void | Promise<void>
  isSaving?: boolean
  saveButtonText?: string
  savingButtonText?: string
  inputPlaceholder?: string
  connectedText?: string
  changeButtonText?: string
  status?: string
}
