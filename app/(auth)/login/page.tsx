import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Sign In</h1>
        <p className="text-gray-600 mt-2">Access your CRM dashboard</p>
      </div>
      <LoginForm />
    </div>
  )
}
