import { SignupForm } from '@/components/auth/signup-form'

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Create Account</h1>
        <p className="text-gray-600 mt-2">Start managing your leads today</p>
      </div>
      <SignupForm />
    </div>
  )
}
