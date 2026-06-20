import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext.jsx';
import { Button, Field, Input } from '../../components/ui.jsx';
import Recaptcha from '../../components/Recaptcha.jsx';
import { apiError } from '../../utils/format.js';
import AuthShell from './AuthShell.jsx';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [captcha, setCaptcha] = useState('');
  const from = location.state?.from?.pathname || '/dashboard';

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    try {
      const user = await login({ ...values, recaptchaToken: captcha });
      toast.success('Welcome back!');
      navigate(user.role === 'admin' || user.role === 'staff' ? '/admin' : from, { replace: true });
    } catch (err) {
      toast.error(apiError(err, 'Login failed'));
    }
  };

  return (
    <AuthShell
      title="Sign in"
      subtitle="Access your bookings and events."
      footer={<>New here? <Link to="/register" className="font-semibold text-turf-300">Create an account</Link></>}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Email" error={errors.email?.message} required>
          <Input type="email" placeholder="you@example.com" error={errors.email} {...register('email')} />
        </Field>
        <Field label="Password" error={errors.password?.message} required>
          <Input type="password" placeholder="••••••••" error={errors.password} {...register('password')} />
        </Field>
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm text-ink-400 hover:text-turf-300">Forgot password?</Link>
        </div>
        <Recaptcha onToken={setCaptcha} />
        <Button type="submit" className="w-full" loading={isSubmitting}>Sign in</Button>
      </form>
    </AuthShell>
  );
}
