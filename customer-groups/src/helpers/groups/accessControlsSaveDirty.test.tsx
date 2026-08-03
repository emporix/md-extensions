/** @vitest-environment jsdom */
import { act, cleanup, render, screen } from '@testing-library/react'
import { useEffect, useRef } from 'react'
import {
  FormProvider,
  useController,
  useForm,
  useFormContext,
  useFormState,
} from 'react-hook-form'
import { afterEach, describe, expect, it } from 'vitest'
import type { GroupFormFields } from './groupForm.helpers'
import { createGroupForm, mapGroupToGroupForm } from './groupForm.helpers'
import type { Group } from '../../models/Groups.model'
import { GroupUserTypes } from '../../models/Groups.model'

afterEach(() => cleanup())

const sampleGroup = {
  id: 'g1',
  code: 'g1',
  name: { en: 'Customers' },
  description: { en: '' },
  accessControls: ['ac:existing'],
  templates: [],
  metadata: { version: 1 },
  userType: GroupUserTypes.CUSTOMER,
} as Group

const SaveButton = () => {
  const { control } = useFormContext<GroupFormFields>()
  const { isDirty, isValid, dirtyFields } = useFormState({ control })
  const accessControlsDirty = !!dirtyFields.accessControls
  const canSave = isValid && (isDirty || accessControlsDirty)
  return (
    <button type="button" disabled={!canSave}>
      Save:{String(isDirty)}:{String(!!dirtyFields.accessControls)}:
      {String(isValid)}
    </button>
  )
}

const AssignButton = () => {
  const { control } = useFormContext<GroupFormFields>()
  const { field } = useController({
    name: 'accessControls',
    control,
    defaultValue: [],
  })
  return (
    <button
      type="button"
      onClick={() => field.onChange([...(field.value ?? []), 'ac:new'])}
    >
      Assign
    </button>
  )
}

const DetailsSeed = ({ group }: { group: Group }) => {
  const {
    reset,
    trigger,
    formState: { isDirty },
  } = useFormContext<GroupFormFields>()
  const initializedGroupKeyRef = useRef<string | null>(null)

  useEffect(() => {
    if (!group) return
    const groupKey = group.id || 'new'
    if (initializedGroupKeyRef.current === groupKey) return
    if (isDirty) {
      initializedGroupKeyRef.current = groupKey
      return
    }
    initializedGroupKeyRef.current = groupKey
    reset(mapGroupToGroupForm(group))
    void trigger()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group, reset, trigger])

  return (
    <>
      <AssignButton />
    </>
  )
}

const Harness = () => {
  const methods = useForm<GroupFormFields>({
    defaultValues: createGroupForm(),
    mode: 'onChange',
  })
  methods.register('name', {
    required: true,
    validate: (value) =>
      Object.values(value ?? {}).some(
        (val) => val && String(val).trim() !== ''
      ),
  })

  return (
    <FormProvider {...methods}>
      <SaveButton />
      <DetailsSeed group={sampleGroup} />
    </FormProvider>
  )
}

describe('accessControls Save enablement via useController', () => {
  it('enables Save when only accessControls change', async () => {
    render(<Harness />)

    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })

    await act(async () => {
      screen.getByRole('button', { name: 'Assign' }).click()
    })

    const save = screen.getByRole('button', { name: /Save:/ })
    expect(save.textContent).toMatch(/Save:true:true:true/)
    expect(save).toHaveProperty('disabled', false)
  })
})
