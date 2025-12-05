import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../integrations/supabase/client';
import { Mail, User, BookOpen } from 'lucide-react'; // Keep icons for custom styling if needed

export const Login: React.FC = () => {
  // The Auth component handles its own state and redirects via onAuthStateChange in SessionContextProvider
  // We just need to render it.

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-emerald-400 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
           <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500 mb-2">
             Avaluació<span className="font-light text-slate-600">AI</span>
           </h1>
           <p className="text-slate-500">
             Inicia sessió o registra't
           </p>
        </div>

        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#2563eb', // blue-600
                  brandAccent: '#1d4ed8', // blue-700
                },
              },
            },
          }}
          providers={[]} // No third-party providers for now
          redirectTo={window.location.origin} // Redirect to root after auth
          localization={{
            variables: {
              sign_in: {
                email_label: 'Correu electrònic',
                password_label: 'Contrasenya',
                email_input_placeholder: 'El teu correu electrònic',
                password_input_placeholder: 'La teva contrasenya',
                button_label: 'Iniciar sessió',
                social_provider_text: 'Inicia sessió amb {{provider}}',
                link_text: 'Ja tens un compte? Inicia sessió',
                no_account_text: 'No tens un compte?',
              },
              sign_up: {
                email_label: 'Correu electrònic',
                password_label: 'Contrasenya',
                email_input_placeholder: 'El teu correu electrònic',
                password_input_placeholder: 'Crea una contrasenya',
                button_label: 'Registrar-se',
                social_provider_text: 'Registra\'t amb {{provider}}',
                link_text: 'No tens un compte? Registra\'t',
                have_account_text: 'Ja tens un compte?',
              },
              forgotten_password: {
                email_label: 'Correu electrònic',
                email_input_placeholder: 'El teu correu electrònic',
                button_label: 'Enviar instruccions de recuperació',
                link_text: 'Has oblidat la teva contrasenya?',
              },
              update_password: {
                password_label: 'Nova contrasenya',
                password_input_placeholder: 'La teva nova contrasenya',
                button_label: 'Actualitzar contrasenya',
                link_text: 'Actualitzar contrasenya',
              },
              magic_link: {
                email_input_placeholder: 'El teu correu electrònic',
                button_label: 'Enviar enllaç màgic',
                link_text: 'Enviar un enllaç màgic',
                email_link_sent: 'Enllaç màgic enviat! Revisa el teu correu.',
              },
              verify_otp: {
                email_input_placeholder: 'El teu correu electrònic',
                phone_input_placeholder: 'El teu número de telèfon',
                email_label: 'Correu electrònic',
                phone_label: 'Número de telèfon',
                token_label: 'Codi OTP',
                token_input_placeholder: 'El teu codi OTP',
                button_label: 'Verificar OTP',
                link_text: 'Verificar OTP',
              },
            },
          }}
        />
      </div>
    </div>
  );
};