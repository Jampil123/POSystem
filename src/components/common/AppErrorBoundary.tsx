import { Component, type ReactNode } from 'react'
import { CrashScreen } from '@/components/common/CrashScreen'

type State = { hasError: boolean }

// Catches crashes outside the pages (the pages have their own error screen in the router).
// React needs a class component for this.
export class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.error(error)
  }

  render() {
    return this.state.hasError ? <CrashScreen /> : this.props.children
  }
}
