import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useAppDispatch } from '@/hooks/redux';
import { setCredentials } from '@/features/auth/authSlice';
import { register } from '@/features/auth/api';

export function RegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    organizationName: '',
  });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => register(form),
    onSuccess: (data) => {
      dispatch(setCredentials(data));
      navigate('/dashboard');
    },
    onError: () => setError('Registration failed. Email may already exist.'),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    mutation.mutate();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Create account</h1>
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</div>
          )}
          {(['firstName', 'lastName', 'email', 'organizationName', 'password'] as const).map(
            (field) => (
              <div key={field}>
                <label className="block text-sm font-medium text-slate-700 mb-1 capitalize">
                  {field === 'organizationName' ? 'Organization' : field.replace(/([A-Z])/, ' $1')}
                </label>
                <input
                  type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
                  value={form[field]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-cyan-500"
                  required={field !== 'organizationName'}
                />
              </div>
            )
          )}
          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full bg-cyan-600 text-white py-2.5 rounded-lg font-medium hover:bg-cyan-700 disabled:opacity-50"
          >
            {mutation.isPending ? 'Creating...' : 'Register'}
          </button>
        </form>
        <p className="text-center text-sm text-slate-500 mt-4">
          <Link to="/login" className="text-cyan-600 hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
