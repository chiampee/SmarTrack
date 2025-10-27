import React from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { Shield, Cloud, Zap } from 'lucide-react'

const Feature: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({
  icon,
  title,
  description,
}) => (
  <div className="flex items-start gap-4">
    <div className="p-3 bg-blue-100 rounded-full text-blue-600">{icon}</div>
    <div>
      <h3 className="font-semibold text-gray-800">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  </div>
)

export const LoginPage: React.FC = () => {
  const { loginWithRedirect } = useAuth0()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full grid md:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding */}
        <div className="text-center md:text-left">
          <img 
            src="/logo.svg" 
            alt="SmarTrack" 
            className="h-16 w-auto mx-auto md:mx-0 mb-6"
          />
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
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Welcome Back!</h2>
          <p className="text-gray-600 mb-8 text-center">
            Sign in to continue your research journey.
          </p>
          <button
            onClick={() => loginWithRedirect()}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <img src="https://cdn.auth0.com/styleguide/components/1.0.0/img/badge.png" alt="Auth0" className="h-5 w-5" />
            Log In with Auth0
          </button>
          <p className="text-sm text-gray-500 mt-8 text-center">
            By logging in, you agree to our <a href="#" className="text-blue-600 hover:underline">Terms of Service</a> and <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  )
}
