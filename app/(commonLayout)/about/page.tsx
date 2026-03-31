import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">About CUET Carnival</h1>
          <p className="text-xl text-muted-foreground">
            Your premier event management platform for university festivities
          </p>
        </div>

        {/* Mission Section */}
        <Card>
          <CardHeader>
            <CardTitle>Our Mission</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              CUET Carnival is dedicated to providing a seamless and efficient platform for managing 
              university events. We aim to connect students, organizers, and participants in one 
              unified digital space, making event planning and participation easier than ever.
            </p>
          </CardContent>
        </Card>

        {/* Features Section */}
        <Card>
          <CardHeader>
            <CardTitle>What We Offer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Event Registration</h3>
                <p className="text-muted-foreground text-sm">
                  Easy registration process for all university events and activities.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Event Management</h3>
                <p className="text-muted-foreground text-sm">
                  Comprehensive tools for event organizers to manage their events.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Real-time Updates</h3>
                <p className="text-muted-foreground text-sm">
                  Stay informed with instant notifications about event changes.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Community Building</h3>
                <p className="text-muted-foreground text-sm">
                  Connect with fellow students and build lasting memories.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Section */}
        <Card>
          <CardHeader>
            <CardTitle>Our Vision</CardTitle>
            <CardDescription>Building the future of university event management</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              We envision a future where organizing and participating in university events is 
              effortless, engaging, and accessible to everyone. Through technology and innovation, 
              we're making this vision a reality at CUET and beyond.
            </p>
          </CardContent>
        </Card>

        {/* Contact CTA */}
        <div className="text-center space-y-4 pt-8">
          <h2 className="text-2xl font-semibold">Want to Learn More?</h2>
          <p className="text-muted-foreground">
            Get in touch with us to see how CUET Carnival can help your event succeed.
          </p>
        </div>
      </div>
    </div>
  );
}
