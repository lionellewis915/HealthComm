'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Heart, UserPlus, LogIn, Shield, Lock, FileCheck } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import Link from 'next/link';

export default function Home() {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && profile) {
      switch (profile.role) {
        case 'medical_professional':
          router.push('/dashboard/doctor');
          break;
        case 'patient':
          router.push('/dashboard/patient');
          break;
        case 'caretaker':
          router.push('/dashboard/caretaker');
          break;
      }
    }
  }, [profile, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-primary text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">HealthComm</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="outline" size="sm">
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <Heart className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Advanced Health Monitoring Platform
          </h1>
          <p className="text-xl text-muted-foreground">
            Monitor glucose, hypertension, and vital signs with real-time data for patients, medical professionals, and caretakers.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="border-border hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserPlus className="h-5 w-5 text-primary" />
                <span>Medical Professional</span>
              </CardTitle>
              <CardDescription>
                Monitor and care for multiple patients with comprehensive health data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/signup/doctor">
                <Button className="w-full" size="lg">
                  Sign Up as Doctor
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-border hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-primary" />
                <span>Patient</span>
              </CardTitle>
              <CardDescription>
                Track your vital signs and connect with healthcare providers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/signup/patient">
                <Button className="w-full" size="lg">
                  Sign Up as Patient
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-border hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Heart className="h-5 w-5 text-primary" />
                <span>Caretaker</span>
              </CardTitle>
              <CardDescription>
                Stay informed about your loved ones' health status in real-time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/signup/caretaker">
                <Button className="w-full" size="lg">
                  Sign Up as Caretaker
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <section className="mt-20 mb-16 max-w-6xl mx-auto">
          <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 rounded-2xl border border-primary/20 p-8 md:p-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">About HealthComm</h2>
              <div className="w-24 h-1 bg-primary mx-auto rounded-full"></div>
            </div>

            <div className="space-y-6 text-foreground/90 leading-relaxed">
              <p className="text-lg">
                HealthComm modernizes how healthcare data moves across hospitals, clinics, and individuals by placing control where it belongs, with the patient. We've built an ecosystem that transforms healthcare data management through patient portals, unified appointment and medical record management, and secure document storage.
              </p>

              <p>
                Every feature is engineered around a simple principle: patients own their data and should always know exactly how it's being used. Operating in full compliance with the Data Protection Act, GDPR, and global privacy frameworks, we've made patient rights practical and easy to exercise whether accessing records, requesting corrections, or managing who sees their information.
              </p>

              <p>
                HealthComm represents more than software it's a foundation of digital trust that empowers patients with agency while supporting healthcare providers in meeting the evolving demands of data protection legislation. We believe privacy is not just a legal requirement, but a moral one, and we're committed to ensuring compliance is effortless, transparency is automatic, and security is uncompromising.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <div className="flex flex-col items-center text-center p-6 bg-background/50 rounded-xl border border-border">
                <Shield className="h-12 w-12 text-primary mb-4" />
                <h3 className="font-semibold text-lg mb-2">Data Protection</h3>
                <p className="text-sm text-muted-foreground">Full compliance with GDPR and global privacy frameworks</p>
              </div>

              <div className="flex flex-col items-center text-center p-6 bg-background/50 rounded-xl border border-border">
                <Lock className="h-12 w-12 text-primary mb-4" />
                <h3 className="font-semibold text-lg mb-2">Patient Control</h3>
                <p className="text-sm text-muted-foreground">You own your data and control who sees it</p>
              </div>

              <div className="flex flex-col items-center text-center p-6 bg-background/50 rounded-xl border border-border">
                <FileCheck className="h-12 w-12 text-primary mb-4" />
                <h3 className="font-semibold text-lg mb-2">Transparent Access</h3>
                <p className="text-sm text-muted-foreground">Always know how your information is being used</p>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-4">Already have an account?</p>
          <Link href="/login">
            <Button variant="outline" size="lg">
              <LogIn className="mr-2 h-4 w-4" />
              Login to Your Account
            </Button>
          </Link>
        </div>
      </main>

      <footer className="border-t border-border py-6">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>&copy; 2025 HealthComm. Advanced patient monitoring for better healthcare outcomes.</p>
        </div>
      </footer>
    </div>
  );
}
