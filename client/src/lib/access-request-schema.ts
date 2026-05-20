import { z } from 'zod'

export const accessRequestItemSchema = z.object({
  folderPath: z.string().min(1, 'Folder path is required'),
  accessType: z.number().min(1, 'Access type is required'),
  confirmAccessTypeByHOD: z.number().default(0),
  reason: z.string().min(1, 'Reason is required'),
})

export const accessRequestSchema = z.object({
  empId: z.number().min(1, 'Employee ID is required'),
  isAgree: z.boolean().refine(val => val === true, 'You must agree to the terms'),
  items: z.array(accessRequestItemSchema).min(1, 'At least one access item is required'),
  itsrNo: z.string().optional(),
  reqTo: z.number().optional(),
  accessReqId: z.number().optional(),
})

export type AccessRequestPayload = z.infer<typeof accessRequestSchema>
export type AccessRequestItem = z.infer<typeof accessRequestItemSchema>