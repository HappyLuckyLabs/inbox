'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mail, Hash, Linkedin, MessageCircle, Instagram, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Home() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    // In a real app, send to waitlist API
    setTimeout(() => setIsSubmitted(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <span className="font-bold text-xl">Kinso</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/about" className="text-sm text-gray-600 hover:text-gray-900">About</Link>
            <Link href="/features" className="text-sm text-gray-600 hover:text-gray-900">Features</Link>
            <Link href="/pricing" className="text-sm text-gray-600 hover:text-gray-900">Pricing</Link>
            <Link href="/inbox">
              <Button variant="outline" size="sm">Login</Button>
            </Link>
            <Button size="sm" className="bg-black hover:bg-gray-800">Get Started</Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-5xl mx-auto">
          {/* Main Content */}
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full text-sm font-medium text-blue-900 mb-8"
            >
              <Sparkles size={16} />
              AI-Powered Unified Inbox
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-7xl font-bold mb-6 leading-tight"
            >
              One inbox,<br />
              every conversation.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl text-gray-600 max-w-3xl mx-auto mb-12 leading-relaxed"
            >
              Kinso brings together all your messages, emails, and contacts. It intelligently learns your goals,
              understands what matters most, and drafts replies that sound like you.
            </motion.p>

            {/* Platform Icons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex items-center justify-center gap-4 mb-12"
            >
              {[
                { icon: Mail, color: 'text-red-500', label: 'Gmail' },
                { icon: Mail, color: 'text-blue-600', label: 'Outlook' },
                { icon: Hash, color: 'text-purple-600', label: 'Slack' },
                { icon: Linkedin, color: 'text-blue-700', label: 'LinkedIn' },
                { icon: MessageCircle, color: 'text-green-500', label: 'WhatsApp' },
                { icon: Instagram, color: 'text-pink-500', label: 'Instagram' },
              ].map((platform, i) => {
                const Icon = platform.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.4 + i * 0.1 }}
                    className="w-14 h-14 bg-white rounded-2xl shadow-md flex items-center justify-center hover:shadow-lg transition-shadow"
                    title={platform.label}
                  >
                    <Icon size={28} className={platform.color} />
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Waitlist Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.9 }}
              className="max-w-md mx-auto"
            >
              {!isSubmitted ? (
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
                  />
                  <Button type="submit" size="lg" className="bg-black hover:bg-gray-800 gap-2">
                    Join now
                    <ArrowRight size={18} />
                  </Button>
                </form>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-3 px-6 bg-green-100 text-green-900 rounded-lg font-medium"
                >
                  Thanks for joining the waitlist!
                </motion.div>
              )}

              <p className="text-sm text-gray-500 mt-4">
                Join <span className="font-bold text-gray-900">15,613</span> others on the waitlist.
              </p>
            </motion.div>
          </div>

          {/* Demo Section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.1 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl blur-3xl opacity-20"></div>
            <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden border">
              <div className="flex items-center gap-2 px-6 py-4 border-b bg-gray-50">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="flex-1 text-center text-sm text-gray-600">
                  kinso.ai
                </div>
              </div>
              <Link href="/inbox">
                <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center cursor-pointer hover:from-gray-200 hover:to-gray-300 transition-colors">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-black rounded-2xl mx-auto mb-4 flex items-center justify-center">
                      <Sparkles size={40} className="text-white" />
                    </div>
                    <p className="text-gray-600 font-medium">Click to view demo</p>
                  </div>
                </div>
              </Link>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 text-center text-sm text-gray-600">
        <p>&copy; 2026 Kinso. All rights reserved.</p>
      </footer>
    </div>
  );
}
