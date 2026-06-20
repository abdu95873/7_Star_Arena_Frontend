import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import api from '../../lib/apiClient.js';
import { Button, Field, Input } from '../../components/ui.jsx';
import { apiError } from '../../utils/format.js';
import AuthShell from './AuthShell.jsx';

const schema = z.object({
  email: z.string().email(),
  otp: z.string().min(4, 'Enter the code'),
  password: z.string().min(8, 'At least 8 characters').regex(/[A-Za-z]/, 'Need a letter').regex(/\d/, 'Need a number'),
});

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: params.get('email') || '' },
  });

  const onSubmit = async (values) => {
    try {
      await api.post('/auth/reset-password', values);
      toast.success('Password reset! Please log in.');
      navigate('/login');
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  return (
    <AuthShell
      title="Reset password"
      subtitle="Enter the code we emailed and your new password."
      footer={<Link to="/login" className="font-semibold text-turf-300">Back to login</Link>}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Email" error={errors.email?.message} required>
          <Input type="email" error={errors.email} {...register('email')} />
        </Field>
        <Field label="Reset code (OTP)" error={errors.otp?.message} required>
          <Input placeholder="6-digit code" error={errors.otp} {...register('otp')} />
        </Field>
        <Field label="New password" error={errors.password?.message} required>
          <Input type="password" placeholder="••••••••" error={errors.password} {...register('password')} />
        </Field>
        <Button type="submit" className="w-full" loading={isSubmitting}>Reset password</Button>
      </form>
    </AuthShell>
  );
}
