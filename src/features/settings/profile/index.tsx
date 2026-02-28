import { ContentSection } from '../components/content-section'
import { ProfileForm } from './profile-form'

export function SettingsProfile() {
  return (
    <ContentSection
      title='个人资料'
      desc='这将决定其他人如何在网站上看到您'
    >
      <ProfileForm />
    </ContentSection>
  )
}
