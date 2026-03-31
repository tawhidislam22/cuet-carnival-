"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type CertificateItem = {
  id: string;
  eventId: string;
  eventTitle: string;
  category: string;
  completedAt: string;
  certificateCode: string;
};

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch(`${API_BASE_URL}/dashboard/certificates`, {
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          setError(response.status === 401 ? "Please login first." : "Failed to load certificates.");
          return;
        }

        const payload = await response.json();
        setCertificates(Array.isArray(payload.data) ? payload.data : []);
      } catch {
        setError("Unable to connect to backend.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Certificates</h1>
          <p className="text-muted-foreground">Certificates earned from completed events.</p>
        </div>

        {loading ? <p className="text-muted-foreground">Loading...</p> : null}
        {error ? <p className="text-destructive">{error}</p> : null}

        <div className="grid gap-4 md:grid-cols-2">
          {certificates.map((certificate) => (
            <Card key={certificate.id}>
              <CardHeader>
                <CardTitle>{certificate.eventTitle}</CardTitle>
                <CardDescription>{certificate.category}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                <p>Completed: {new Date(certificate.completedAt).toLocaleDateString()}</p>
                <p>
                  Certificate Code:{" "}
                  <span className="font-medium text-foreground">{certificate.certificateCode}</span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {!loading && !error && certificates.length === 0 ? (
          <p className="text-muted-foreground">No certificates available yet.</p>
        ) : null}
      </div>
    </div>
  );
}
