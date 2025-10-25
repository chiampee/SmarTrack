import React from 'react';
import { LoginButton } from '../components/auth/LoginButton';
import { BookOpen, Shield, Cloud, Zap } from 'lucide-react';

export const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full grid md:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding */}
        <div className="text-center md:text-left">
          <div className="inline-block p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-6">
            <BookOpen className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Smart Research Tracker
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Organize your research with AI-powered insights. Sign in to access your personal research library from anywhere.
          </p>

          <div className="space-y-4">
            <Feature
              icon={<Cloud className="w-6 h-6" />}
              title="Cloud Sync"
              description="Access your research from any device"
            />
            <Feature
              icon={<Shield className="w-6 h-6" />}
              title="Secure & Private"
              description="Your data is encrypted and protected"
            />
            <Feature
              icon={<Zap className="w-6 h-6" />}
              title="AI-Powered"
              description="Get intelligent summaries and insights"
            />
          </div>
        </div>

        {/* Right side - Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-600">
              Sign in to continue your research journey
            </p>
          </div>

          <div className="space-y-6">
            <LoginButton />

            <div className="text-center">
              <p className="text-sm text-gray-500">
                By signing in, you agree to our{' '}
                <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                  Privacy Policy
                </a>
              </p>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <p className="text-center text-sm text-gray-600">
                New to Smart Research Tracker?
              </p>
              <p className="text-center text-sm text-gray-500 mt-1">
                Signing in will automatically create your account
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Feature: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({
  icon,
  title,
  description,
}) => {
  return (
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg text-blue-600">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
};

