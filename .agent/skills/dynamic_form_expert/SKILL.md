---
name: Dynamic Form Expert
description: Complete guide to implementing forms using the DynamicFormContent component and FieldConfig arrays without localization dependencies for easy portability.
---

# Dynamic Form Expert Skill

This skill provides comprehensive instructions on how to create, validate, and manage forms using the custom `DynamicFormContent` component. This architecture leverages `react-hook-form`, `zod` schema validation, and a declarative `FieldConfig` array to generate responsive and fully typed dynamic forms.

## 🏛️ Architecture & Principles

Following the application's Screaming Architecture rules:

1. **Feature Separation**: Form logic (Schemas, API mutations, form steps configurations, and drawers/modals) MUST reside inside the respective feature folder.
2. **Schema & Types**: Define your `zod` schema and TypeScript types in the feature's `types/` directory.
3. **Form Fields Definition**: Separate the form fields definition (the array of `FieldConfig` objects) into its own file (e.g., `<feature>-fields.ts`) to keep the UI component clean.
4. **No Direct Localization**: To ensure component portability across projects, use literal strings for labels and placeholders. Do NOT use `useTranslation` or `t` functions within the core form logic or field definitions.

---

## 🛠️ Step-by-Step Implementation Guide

### 1. Define the Schema and Types

Create a `zod` schema representing the data the form collects, and export its inferred TypeScript type. Use plain strings for validation error messages.

**Path:** `src/features/example/types/example-schema.ts`

```typescript
import { z } from 'zod'

export const exampleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  role_id: z.string().min(1, 'Role is required'),
  avatar: z.any().optional(),
})

export type ExampleFormData = z.infer<typeof exampleSchema>
```

### 2. Define the Form Fields (FieldConfig)

Define your fields as a constant or a simple function. Use literal strings for all human-readable text to maintain portability.

**Path:** `src/features/example/components/example-fields.ts`

```typescript
import { type FieldConfig } from '@/types/'

/**
 * Returns the field configurations.
 * Note: Labels and placeholders use literal strings for portability.
 * @param roles - List of roles for the select input
 * @returns An array of FieldConfig
 */
export const getExampleFields = (
  roles: { id: string; name: string }[]
): FieldConfig[] => {
  return [
    {
      name: 'avatar',
      label: 'Profile Picture',
      type: 'image',
      fileFormats: ['.png', '.jpg', '.jpeg'],
    },
    {
      name: 'name',
      label: 'Full Name',
      placeholder: 'Enter your full name',
      type: 'text',
      required: true,
    },
    {
      name: 'role_id',
      label: 'User Role',
      placeholder: 'Select a role',
      type: 'select',
      options: roles.map((role) => ({
        label: role.name,
        value: role.id,
      })),
      // Optional: hide field based on other values
      condition: (formValues) => !!formValues.name,
    },
  ]
}
```

### 3. Implement the Form UI

Wire up the schema, field configurations, and `DynamicFormContent` inside your component.

**Path:** `src/features/example/components/example-form.tsx`

```tsx
import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { DynamicFormContent } from '@/components/dynamic-form'
import { exampleSchema, type ExampleFormData } from '../types/example-schema'
import { getExampleFields } from './example-fields'

export function ExampleForm({ initialData, onSubmit, isLoading }: any) {
  // 1. Prepare options for fields (if any)
  const roles = [
    { id: '1', name: 'Admin' },
    { id: '2', name: 'User' },
  ]

  // 2. Set Default Values
  const defaultValues = useMemo(() => {
    return {
      name: initialData?.name || '',
      role_id: initialData?.role_id || '',
      avatar: initialData?.avatar || null,
    }
  }, [initialData])

  // 3. Get the form fields configuration
  const fields = getExampleFields(roles)

  return (
    <div className='p-6'>
      <DynamicFormContent
        fields={fields}
        formSchema={exampleSchema}
        defaultValues={defaultValues}
        onSubmit={onSubmit}
      >
        <Button type='submit' className='w-full' disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </DynamicFormContent>
    </div>
  )
}
```

---

## 🔍 Supported Field Types

The `type` inside a `FieldConfig` dictates how the input will render:

- `text`: Regular standard input.
- `textarea`: Resizable or fixed text area.
- `select`: Uses a `DynamicCombobox` implementation. Requires an `options` array `{ label: string, value: string }[]`.
- `checkbox`: Boolean input toggles.
- `date`: Opens a Date Calendar picking Popover.
- `number`: Numeric input specifically allowing integers/floats based on `step`.
- `money`: Specialized masked `MoneyInput` for currency.
- `percentage`: Formats and restricts visually to 0-100 values.
- `image`: Provides an Image Dropzone.
- `file`: General document Dropzone (e.g., pdf file formats).
- `stepper`: Plus/minus incrementable counter input.
- `custom`: Use a completely generic React Element using `customComponent` field.

## 💡 Pro Tips

1. **Portability**: By avoiding `useTranslation`, this field configuration structure can be easily copied to other projects using the same `DynamicFormContent` component.
2. **Conditional Logic**: Use `condition: (values) => boolean` to drive dynamic UI behavior without adding extra logic to the main component.
3. **Resets**: Use `resetDependencies` if a field's value should be cleared when another field changes.
4. **Validation Messages**: Ensure your Zod schema includes clear, literal string error messages since they won't be translated.
