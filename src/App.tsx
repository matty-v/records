import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HomePage } from '@/pages/home'
import { SheetsSetupWizard } from '@/components/sheets'
import { AnimatedBackground } from '@/components/animated-background'
import { BlockingOverlayProvider } from '@/components/blocking-overlay'

import { useSources } from '@/hooks/use-sources'
import { useSettings } from '@/hooks/use-settings'
import { SERVICE_ACCOUNT_EMAIL } from '@/config/constants'

document.documentElement.classList.add('dark')

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

function AppContent() {
  const { sources, addSource, setActiveSourceId } = useSources()
  const { initializeSheets, isInitializing } = useSettings()
  const [inputValue, setInputValue] = useState('')

  const handleConnect = async () => {
    const success = await initializeSheets(inputValue)
    if (success) {
      const source = addSource('Primary Records', inputValue)
      setActiveSourceId(source.id)
    }
  }

  if (sources.length === 0) {
    return (
      <div className="min-h-screen relative">
        <AnimatedBackground />
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <SheetsSetupWizard
            serviceAccountEmail={SERVICE_ACCOUNT_EMAIL}
            inputValue={inputValue}
            onInputChange={setInputValue}
            onConnect={handleConnect}
            isConnecting={isInitializing}
            title="Records Setup"
            additionalInstructions={
              <p>
                This app uses a <code className="text-[var(--accent-cyan)]">_config</code> sheet
                to define your data structure. It will be created automatically.
              </p>
            }
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <div className="relative z-10">
        <HomePage />
      </div>
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BlockingOverlayProvider>
        <AppContent />
      </BlockingOverlayProvider>
    </QueryClientProvider>
  )
}

export default App
