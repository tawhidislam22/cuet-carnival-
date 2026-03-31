import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-background mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About Section */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">CUET Carnival</h3>
            <p className="text-sm text-muted-foreground">
              Your premier event management platform for university festivities
              and campus activities.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/home"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/contract"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Events */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Events</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/home"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Upcoming Events
                </Link>
              </li>
              <li>
                <Link
                  href="/home"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Past Events
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Register Event
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Contact</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>CUET, Chattogram</li>
              <li>Bangladesh</li>
              <li>info@cuetcarnival.edu.bd</li>
              <li>+880 1234-567890</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t mt-8 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} CUET Carnival. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <Link
              href="/contract"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/contract"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
