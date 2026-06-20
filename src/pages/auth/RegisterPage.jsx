import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  name: z.string().min(2, 'Name is too short'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().regex(/^(?:\+?880|0)1[3-9]\d{8}$/, 'Enter a valid BD phone (e.g. 017XXXXXXXX)'),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Za-z]/, 'Must contain a letter')
    .regex(/\d/, 'Must contain a number'),
});

export default function RegisterPage() {
  const { register: signup } = useAuth();
  const navigate = useNavigate();
  const [captcha, setCaptcha] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    try {
      await signup({ ...values, recaptchaToken: captcha });
      toast.success('Account created!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(apiError(err, 'Registration failed'));
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join 7 Star Arena and reserve your first slot."
      footer={<>Already have an account? <Link to="/login" className="font-semibold text-turf-300">Sign in</Link></>}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Full name" error={errors.name?.message} required>
          <Input placeholder="Mohammad Rahim" error={errors.name} {...register('name')} />
        </Field>
        <Field label="Email" error={errors.email?.message} required>
          <Input type="email" placeholder="you@example.com" error={errors.email} {...register('email')} />
        </Field>
        <Field label="Phone" error={errors.phone?.message} required hint="Bangladeshi mobile number">
          <Input placeholder="017XXXXXXXX" error={errors.phone} {...register('phone')} />
        </Field>
        <Field label="Password" error={errors.password?.message} required hint="Min 8 chars, with a letter and a number">
          <Input type="password" placeholder="••••••••" error={errors.password} {...register('password')} />
        </Field>
        <Recaptcha onToken={setCaptcha} />
        <Button type="submit" className="w-full" loading={isSubmitting}>Create account</Button>
      </form>
    </AuthShell>
  );
}
