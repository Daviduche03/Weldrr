import { TrashIcon } from '@heroicons/react/24/solid'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, SaveButton, Section } from '@/modules/settings/settings/ui'

export function WorkspaceSection({
  wsName,
  setWsName,
  wsSlug,
  setWsSlug,
  saved,
  onSave,
  onDelete,
}: {
  wsName: string
  setWsName: (value: string) => void
  wsSlug: string
  setWsSlug: (value: string) => void
  saved: boolean
  onSave: () => void
  onDelete: () => void
}) {
  return (
    <div className="space-y-6">
      <Section
        title="Workspace"
        description="This name and slug identify your workspace."
        footer={
          <SaveButton saved={saved} onClick={onSave}>
            Save changes
          </SaveButton>
        }
      >
        <div className="grid max-w-2xl gap-6 sm:grid-cols-2">
          <Field label="Name">
            <Input value={wsName} onChange={(e) => setWsName(e.target.value)} />
          </Field>
          <Field label="Slug" hint="Used in URLs like weldrr.app/acme.">
            <Input
              value={wsSlug}
              onChange={(e) => setWsSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
            />
          </Field>
        </div>
      </Section>

      <Section
        title="Danger zone"
        description="Permanently delete this workspace and all of its projects, SDKs, and docs."
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            There&apos;s no going back. This cannot be undone.
          </div>
          <Button
            size="sm"
            variant="outline"
            className="text-destructive hover:bg-destructive/10"
            onClick={onDelete}
          >
            <TrashIcon className="size-4" />
            Delete workspace
          </Button>
        </div>
      </Section>
    </div>
  )
}
