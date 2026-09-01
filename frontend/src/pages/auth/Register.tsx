import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Input, Label, FieldError } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/hooks/useToast'
import { AlertTriangle } from 'lucide-react'

const schema = z
  .object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    phone: z
      .string()
      .min(10, 'Enter a valid 10-digit phone number')
      .max(10, 'Enter a valid 10-digit phone number')
      .regex(/^\d+$/, 'Digits only'),
    dob: z.string().min(1, 'Date of birth is required'),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
type FormValues = z.infer<typeof schema>

export default function Register() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmitForm = async (values: FormValues) => {
    setSubmitting(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            first_name: values.firstName,
            last_name: values.lastName,
            phone: values.phone,
            dob: values.dob,
          },
        },
      })
      if (error) throw error

      // Auto sign in if session wasn't created automatically
      if (!data.session) {
        await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        })
      }

      toast({
        title: 'Account created',
        description: "Welcome to NeoBank — let's verify your identity next.",
        variant: 'success',
      })
      navigate('/kyc')
    } catch (err) {
      toast({
        title: 'Sign up failed',
        description: err instanceof Error ? err.message : 'Something went wrong',
        variant: 'error',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>Open a simulated NeoBank account in minutes</CardDescription>
      </CardHeader>
      <CardContent>
        {!isSupabaseConfigured && (
          <div className="mb-4 flex items-start gap-2 rounded-lg bg-[var(--color-warning-bg)] p-3 text-xs text-[var(--color-warning)]">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>Supabase is not configured — registration is disabled until env vars are set.</span>
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" {...register('firstName')} />
              <FieldError>{errors.firstName?.message}</FieldError>
            </div>
            <div>
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" {...register('lastName')} />
              <FieldError>{errors.lastName?.message}</FieldError>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" placeholder="9876543210" {...register('phone')} />
              <FieldError>{errors.phone?.message}</FieldError>
            </div>
            <div>
              <Label htmlFor="dob">Date of birth</Label>
              <Input id="dob" type="date" {...register('dob')} />
              <FieldError>{errors.dob?.message}</FieldError>
            </div>
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" {...register('email')} />
            <FieldError>{errors.email?.message}</FieldError>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...register('password')} />
              <FieldError>{errors.password?.message}</FieldError>
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input id="confirmPassword" type="password" {...register('confirmPassword')} />
              <FieldError>{errors.confirmPassword?.message}</FieldError>
            </div>
          </div>
          <Button type="submit" className="w-full" loading={submitting} disabled={!isSupabaseConfigured}>
            Continue
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-[var(--color-primary)] hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
