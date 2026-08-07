import { notificationOptions } from '@/modules/settings/settings.data'
import { Section, Switch } from '@/modules/settings/settings/ui'

export type NotificationState = {
  generation: boolean
  failures: boolean
  releases: boolean
  digest: boolean
}

export function NotificationsSection({
  notifications,
  setNotifications,
}: {
  notifications: NotificationState
  setNotifications: (value: NotificationState) => void
}) {
  return (
    <div className="space-y-6">
      <Section title="Email notifications" description="Choose which updates you receive by email.">
        <ul className="divide-y divide-border">
          {notificationOptions.map((item) => (
            <li key={item.key} className="flex items-center justify-between gap-4 py-4">
              <div>
                <div className="text-sm font-medium">{item.label}</div>
                <div className="text-xs text-muted-foreground">{item.desc}</div>
              </div>
              <Switch
                checked={notifications[item.key]}
                onChange={(value) => setNotifications({ ...notifications, [item.key]: value })}
              />
            </li>
          ))}
        </ul>
      </Section>
    </div>
  )
}
