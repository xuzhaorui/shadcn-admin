import { ContentSection } from '../components/content-section'
import { ApiModeSwitcher } from './api-mode-switcher'
import { DisplayForm } from './display-form'

export function SettingsDisplay() {
  return (
    <ContentSection
      title='显示'
      desc='在这里配置界面显示项和数据来源模式。'
    >
      <div className='space-y-6'>
        <ApiModeSwitcher />
        <DisplayForm />
      </div>
    </ContentSection>
  )
}
