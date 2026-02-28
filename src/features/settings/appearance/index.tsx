import { ContentSection } from '../components/content-section'
import { AppearanceForm } from './appearance-form'

export function SettingsAppearance() {
  return (
    <ContentSection
      title='外观'
      desc='自定义应用程序外观。自动在日间和夜间主题之间切换。'
    >
      <AppearanceForm />
    </ContentSection>
  )
}
