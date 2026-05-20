'use client'

import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Checkbox } from '@/components/ui/checkbox'
import type { UseFormReturn } from 'react-hook-form'
import type { AccessRequestPayload } from '@/lib/access-request-schema'

interface AgreementCheckboxProps {
  form: UseFormReturn<AccessRequestPayload>
}

export function AgreementCheckbox({ form }: AgreementCheckboxProps) {
  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-5">
      <FormField
        control={form.control}
        name="isAgree"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
            <FormControl>
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
            <div className="space-y-1 leading-none">
              <label className="text-sm font-medium leading-relaxed text-foreground cursor-pointer">
                I agree to the terms and conditions{' '}
                <span className="text-destructive">*</span>
              </label>
              <p className="text-xs text-muted-foreground">
                By requesting access, you agree that you will use this access only for authorized
                purposes and comply with all company policies.
              </p>
            </div>
            <FormMessage className="text-xs" />
          </FormItem>
        )}
      />
    </div>
  )
}
