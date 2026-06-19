'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { 
  Cloud, 
  Lock, 
  FolderTree, 
  Share2, 
  Shield, 
  Search,
  ArrowRight,
  Sparkles,
  Zap,
  Database,
  Users,
  Clock,
  Star,
  LogIn,
  UserPlus,
  CheckCircle,
  Image,
  Activity,
  Crown,
  GraduationCap,
  Menu,
  X
} from 'lucide-react';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    getUser();
  }, [supabase]);

  const features = [
    {
      icon: Lock,
      title: 'Secure Uploads',
      description: 'End-to-end encryption keeps your files safe',
      color: 'from-blue-500 to-blue-600',
      gradient: 'bg-gradient-to-br from-blue-500/10 to-blue-600/5'
    },
    {
      icon: FolderTree,
      title: 'Folder Organization',
      description: 'Organize files with nested folders',
      color: 'from-emerald-500 to-emerald-600',
      gradient: 'bg-gradient-to-br from-emerald-500/10 to-emerald-600/5'
    },
    {
      icon: Search,
      title: 'Content Search',
      description: 'Search inside documents and files',
      color: 'from-purple-500 to-purple-600',
      gradient: 'bg-gradient-to-br from-purple-500/10 to-purple-600/5'
    },
    {
      icon: Image,
      title: 'Image Search by Tags',
      description: 'Find images by colors and tags',
      color: 'from-pink-500 to-pink-600',
      gradient: 'bg-gradient-to-br from-pink-500/10 to-pink-600/5'
    },
    {
      icon: Share2,
      title: 'Sharing & Permissions',
      description: 'Share files with granular controls',
      color: 'from-orange-500 to-orange-600',
      gradient: 'bg-gradient-to-br from-orange-500/10 to-orange-600/5'
    },
    {
      icon: Activity,
      title: 'Activity Tracking',
      description: 'Track file views and downloads',
      color: 'from-cyan-500 to-cyan-600',
      gradient: 'bg-gradient-to-br from-cyan-500/10 to-cyan-600/5'
    },
  ];

  const pricingPlans = [
    {
      name: 'Free',
      price: '$0',
      description: 'Perfect for getting started',
      features: ['5 GB Storage', 'Basic Search', 'Folder Organization', 'File Upload/Download'],
      icon: Star,
      color: 'from-slate-500 to-slate-600'
    },
    {
      name: 'Student',
      price: '$4.99',
      description: 'For students and educators',
      features: ['50 GB Storage', 'Content Search', 'Image Search', 'Priority Support'],
      icon: GraduationCap,
      color: 'from-blue-500 to-indigo-600',
      popular: true
    },
    {
      name: 'Team',
      price: '$9.99',
      description: 'For teams and businesses',
      features: ['200 GB Storage', 'Advanced Search', 'Team Sharing', 'Analytics Dashboard'],
      icon: Users,
      color: 'from-purple-500 to-pink-600'
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
        </div>
        
        {/* Navigation */}
        <nav className="relative container mx-auto px-6 py-6 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Cloud className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">SafeCloud</span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8">
            <a href="#features" className="text-white/80 hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="text-white/80 hover:text-white transition-colors">Pricing</a>
            <a href="#security" className="text-white/80 hover:text-white transition-colors">Security</a>
          </div>
          
          <div className="hidden md:flex space-x-4">
            <Link
              href="/auth/login"
              className="px-4 py-2 text-white/90 hover:text-white transition-colors flex items-center"
            >
              <LogIn className="h-4 w-4 mr-1" />
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="px-6 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center"
            >
              <UserPlus className="h-4 w-4 mr-1" />
              Get Started
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </nav>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/10 backdrop-blur-md mx-4 rounded-xl p-4 mb-4">
            <div className="flex flex-col space-y-3">
              <a href="#features" className="text-white/80 hover:text-white py-2">Features</a>
              <a href="#pricing" className="text-white/80 hover:text-white py-2">Pricing</a>
              <a href="#security" className="text-white/80 hover:text-white py-2">Security</a>
              <div className="pt-2 border-t border-white/20 flex space-x-3">
                <Link href="/auth/login" className="flex-1 text-center px-4 py-2 text-white/90 border border-white/20 rounded-lg">Sign In</Link>
                <Link href="/auth/signup" className="flex-1 text-center px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold">Sign Up</Link>
              </div>
            </div>
          </div>
        )}

        {/* Hero Content */}
        <div className="relative container mx-auto px-6 py-24 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
              <Sparkles className="h-4 w-4 text-yellow-400 mr-2" />
              <span className="text-sm text-white/90">Secure Cloud Storage</span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Secure Cloud Storage<br />
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">With Smart Search</span>
            </h1>
            
            <p className="text-xl text-white/70 mb-12 max-w-2xl mx-auto">
              Store, organize, search and share your files securely with enterprise-grade encryption and intelligent discovery.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all group"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center px-8 py-3 bg-white/10 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-white/20 transition-all border border-white/20"
              >
                Sign In
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="bg-white py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Everything You Need in a{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Cloud Storage</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Powerful features that make file management effortless and secure
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className={`group p-6 rounded-2xl ${feature.gradient} border border-slate-200 hover:shadow-xl transition-all duration-300`}
                >
                  <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-slate-600">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="bg-gradient-to-br from-slate-50 to-indigo-50/30 py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Choose the plan that works best for you
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => {
              const Icon = plan.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className={`relative bg-white rounded-2xl shadow-lg overflow-hidden ${
                    plan.popular ? 'ring-2 ring-blue-600' : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 right-0 bg-blue-600 text-white px-3 py-1 text-sm font-medium">
                      Popular
                    </div>
                  )}
                  <div className="p-8">
                    <div className={`w-12 h-12 bg-gradient-to-r ${plan.color} rounded-xl flex items-center justify-center mb-4`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                    <p className="text-slate-500 mb-4">{plan.description}</p>
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                      <span className="text-slate-500">/month</span>
                    </div>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center text-sm text-slate-600">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/auth/signup"
                      className={`block text-center px-6 py-2 rounded-lg font-semibold transition-all ${
                        plan.popular
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Get Started
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div id="security" className="bg-white py-24">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-4">
                <Shield className="h-4 w-4 mr-2" />
                Enterprise Security
              </div>
              <h2 className="text-4xl font-bold text-slate-900 mb-4">
                Your Files Are Safe With Us
              </h2>
              <p className="text-lg text-slate-600 mb-6">
                SafeCloud uses industry-standard encryption and security practices to protect your data.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <Lock className="h-5 w-5 text-blue-600 mr-3" />
                  <span className="text-slate-700">AES-256 Encryption for all files</span>
                </li>
                <li className="flex items-center">
                  <Shield className="h-5 w-5 text-blue-600 mr-3" />
                  <span className="text-slate-700">Supabase Authentication</span>
                </li>
                <li className="flex items-center">
                  <Database className="h-5 w-5 text-blue-600 mr-3" />
                  <span className="text-slate-700">Secure private storage server</span>
                </li>
                <li className="flex items-center">
                  <Users className="h-5 w-5 text-blue-600 mr-3" />
                  <span className="text-slate-700">Granular permission controls</span>
                </li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-slate-100 to-indigo-50 rounded-2xl p-8 text-center">
              <Shield className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <p className="text-slate-600 italic">
                "SafeCloud provides the security I need for my sensitive documents"
              </p>
              <div className="mt-4">
                <div className="font-semibold text-slate-900">- Verified User</div>
                <div className="text-sm text-slate-500">SafeCloud Customer</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join users who trust SafeCloud for their secure storage needs
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:shadow-xl transition-all group"
          >
            Start Your Free Trial
            <Star className="ml-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Cloud className="h-8 w-8 text-blue-400" />
                <span className="text-xl font-bold">SafeCloud</span>
              </div>
              <p className="text-slate-400 text-sm">
                Secure cloud storage with smart search.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#features">Features</a></li>
                <li><a href="#pricing">Pricing</a></li>
                <li><a href="#security">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>About</li>
                <li>Blog</li>
                <li>Contact</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>Cookie Policy</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-sm text-slate-400">
            <p>&copy; 2025 SafeCloud. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}