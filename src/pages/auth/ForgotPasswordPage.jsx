import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import api from '../../lib/apiClient.js';
import { Button, Field, Input } from '../../components/ui.jsx';
import { apiError } from '../../utils/format.js';
import AuthShell from './AuthShell.jsx';

const schema = z.object({ email: z.string().email('Enter a valid email') });

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async ({ email }) => {
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('If the account exists, a reset code was emailed.');
      navigate(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  return (
    <AuthShell
      title="Forgot password"
      subtitle="We'll email you a one-time code to reset it."
      footer={<>Remembered it? <Link to="/login" className="font-semibold text-turf-300">Back to login</Link></>}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Email" error={errors.email?.message} required>
          <Input type="email" placeholder="you@example.com" error={errors.email} {...register('email')} />
        </Field>
        <Button type="submit" className="w-full" loading={isSubmitting}>Send reset code</Button>
      </form>
    </AuthShell>
  );
}
