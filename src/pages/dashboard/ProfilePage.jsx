import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../lib/apiClient.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Button, Card, Field, Input } from '../../components/ui.jsx';
import { apiError } from '../../utils/format.js';

export default function ProfilePage() {
  const { user, setUser } = useAuth();

  const profileForm = useForm({ defaultValues: { name: user?.name, phone: user?.phone } });
  const pwForm = useForm();

  const saveProfile = async (values) => {
    try {
      const { data } = await api.patch('/auth/me', values);
      setUser(data.data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  const changePassword = async (values) => {
    try {
      await api.post('/auth/change-password', values);
      toast.success('Password changed. Please log in again.');
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="p-6">
        <h3 className="text-lg font-bold text-white">Profile details</h3>
        <form onSubmit={profileForm.handleSubmit(saveProfile)} className="mt-4 space-y-4">
          <Field label="Email" hint="Email cannot be changed">
            <Input value={user?.email} disabled />
          </Field>
          <Field label="Full name">
            <Input {...profileForm.register('name')} />
          </Field>
          <Field label="Phone">
            <Input {...profileForm.register('phone')} />
          </Field>
          <Button type="submit" loading={profileForm.formState.isSubmitting}>Save changes</Button>
        </form>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-bold text-white">Change password</h3>
        <form onSubmit={pwForm.handleSubmit(changePassword)} className="mt-4 space-y-4">
          <Field label="Current password">
            <Input type="password" {...pwForm.register('currentPassword', { required: true })} />
          </Field>
          <Field label="New password" hint="Min 8 chars, with a letter and a number">
            <Input type="password" {...pwForm.register('newPassword', { required: true })} />
          </Field>
          <Button type="submit" loading={pwForm.formState.isSubmitting}>Update password</Button>
        </form>
      </Card>
    </div>
  );
}
