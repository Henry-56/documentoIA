import React, { useState, useEffect } from 'react';
import { db, seedAdmin } from './services/db';
import { User, Role, AppRoute } from './types';
import { Layout } from './components/Layout';
import { AdminPanel } from './components/AdminPanel';
import { ClientChat } from './components/ClientChat';
import { Button } from './components/Button';

// Auth Layout Wrapper - defined outside App to prevent re-creation on each render
const AuthLayout: React.FC<React.PropsWithChildren<{ title: string }>> = ({ children, title }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
      <div className="text-center">
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">{title}</h2>
        <p className="mt-2 text-sm text-gray-600">Plataforma Segura de Conocimiento</p>
      </div>
      {children}
    </div>
  </div>
);

const App: React.FC = () => {
  const [route, setRoute] = useState<AppRoute>(AppRoute.ROLE_SELECTION);
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<'admin' | 'client' | null>(null);

  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');

  const [error, setError] = useState('');

  // Initial DB Seeding & Session Check
  useEffect(() => {
    const init = async () => {
      try {
        await seedAdmin();
        const storedUserId = localStorage.getItem('session_user_id');
        if (storedUserId) {
          const u = await db.users.get(parseInt(storedUserId));
          if (u) handleLoginSuccess(u);
        }
      } catch (e) {
        console.error("DB Init failed", e);
      }
    };
    init();
  }, []);

  const handleLoginSuccess = (u: User) => {
    setUser(u);
    localStorage.setItem('session_user_id', u.id?.toString() || '');
    if (u.role === Role.ADMIN) setRoute(AppRoute.ADMIN_DASHBOARD);
    else setRoute(AppRoute.CLIENT_DASHBOARD);
  };

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const u = await db.users.where('email').equals(email).first();
    if (u && u.passwordHash === password) {
      handleLoginSuccess(u);
    } else {
      setError('Credenciales inválidas. Para demo admin use: admin@test.com / admin');
    }
  };

  const register = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const existing = await db.users.where('email').equals(regEmail).first();
    if (existing) {
      setError('El correo electrónico ya existe');
      return;
    }

    const id = await db.users.add({
      name: regName,
      email: regEmail,
      passwordHash: regPass,
      role: Role.CLIENT,
      createdAt: Date.now()
    });

    const newUser = await db.users.get(id);
    if (newUser) handleLoginSuccess(newUser);
  };

  const logout = () => {
    localStorage.removeItem('session_user_id');
    setUser(null);
    setUserType(null);
    setRoute(AppRoute.ROLE_SELECTION);
    setEmail('');
    setPassword('');
  };

  // --- Views ---

  if (route === AppRoute.ADMIN_DASHBOARD && user?.role === Role.ADMIN) {
    return (
      <Layout title="Administrador">
        <AdminPanel onLogout={logout} />
      </Layout>
    );
  }

  if (route === AppRoute.CLIENT_DASHBOARD && user?.role === Role.CLIENT) {
    return (
      <Layout title="Panel del cliente">
        <ClientChat user={user} onLogout={logout} />
      </Layout>
    );
  }

  // Role Selection View
  if (route === AppRoute.ROLE_SELECTION && !user) {
    return (
      <AuthLayout title="Bienvenido">
        <div className="mt-8 space-y-4">
          <p className="text-center text-gray-700 mb-6">Selecciona tu tipo de acceso:</p>
          <Button
            onClick={() => {
              setUserType('admin');
              setRoute(AppRoute.LOGIN);
            }}
            className="w-full justify-center bg-blue-600 hover:bg-blue-700"
          >
            🔐 Administrador
          </Button>
          <Button
            onClick={() => {
              setUserType('client');
              setRoute(AppRoute.LOGIN);
            }}
            className="w-full justify-center bg-green-600 hover:bg-green-700"
          >
            👤 Usuario
          </Button>
        </div>
      </AuthLayout>
    );
  }

  if (route === AppRoute.REGISTER) {
    return (
      <AuthLayout title="Crear Cuenta">
        <form className="mt-8 space-y-6" onSubmit={register}>
          <div className="rounded-md shadow-sm space-y-4">
            <input
              required className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Nombre Completo" value={regName} onChange={e => setRegName(e.target.value)}
            />
            <input
              required type="email" className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Correo Electrónico" value={regEmail} onChange={e => setRegEmail(e.target.value)}
            />
            <input
              required type="password" className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Contraseña" value={regPass} onChange={e => setRegPass(e.target.value)}
            />
          </div>
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          <Button type="submit" className="w-full justify-center">Registrarse</Button>
          <div className="text-center space-y-2">
            <button type="button" onClick={() => setRoute(AppRoute.LOGIN)} className="block w-full text-sm text-blue-600 hover:text-blue-500">
              ¿Ya tienes una cuenta? Iniciar sesión
            </button>
            <button type="button" onClick={() => setRoute(AppRoute.ROLE_SELECTION)} className="block w-full text-sm text-gray-600 hover:text-gray-500">
              ← Volver a selección de rol
            </button>
          </div>
        </form>
      </AuthLayout>
    );
  }

  // Default: Login
  return (
    <AuthLayout title={userType === 'admin' ? 'Login Administrador' : 'Iniciar Sesión'}>
      <form className="mt-8 space-y-6" onSubmit={login}>
        <div className="rounded-md shadow-sm space-y-4">
          <input
            required
            type="email"
            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Correo Electrónico"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input
            required
            type="password"
            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>
        {error && <div className="text-red-500 text-sm text-center">{error}</div>}
        <Button type="submit" className="w-full justify-center">Iniciar Sesión</Button>

        <div className="text-center space-y-2">
          {userType === 'client' && (
            <button
              type="button"
              onClick={() => setRoute(AppRoute.REGISTER)}
              className="block w-full text-sm text-blue-600 hover:text-blue-500"
            >
              ¿Necesitas una cuenta? Regístrate
            </button>
          )}
          <button
            type="button"
            onClick={() => setRoute(AppRoute.ROLE_SELECTION)}
            className="block w-full text-sm text-gray-600 hover:text-gray-500"
          >
            ← Volver a selección de rol
          </button>
        </div>

        {userType === 'admin' && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-800">
            <p className="font-semibold">Credenciales Demo:</p>
            <p>Admin: admin@test.com / admin</p>
          </div>
        )}
      </form>
    </AuthLayout>
  );
};

export default App;