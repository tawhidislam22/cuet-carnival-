"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthSession } from "@/lib/auth-client";

type CertificateItem = {
  id: string;
  eventId: string;
  eventTitle: string;
  category: string;
  location: string;
  issuedAt: string;
  certificateCode: string;
  organizerName: string;
};

function printCertificate(cert: CertificateItem, studentName: string) {
  const issuedDate = new Date(cert.issuedAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Certificate – ${cert.eventTitle}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Georgia', serif;
      background: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .cert {
      width: 900px;
      padding: 60px 80px;
      border: 2px solid #c8a84b;
      outline: 6px solid #c8a84b;
      outline-offset: -16px;
      position: relative;
      text-align: center;
    }
    .org {
      font-size: 13px;
      letter-spacing: 4px;
      text-transform: uppercase;
      color: #888;
      margin-bottom: 8px;
    }
    .title {
      font-size: 42px;
      font-weight: bold;
      color: #1a1a2e;
      margin-bottom: 4px;
      letter-spacing: 2px;
    }
    .subtitle {
      font-size: 14px;
      color: #888;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 32px;
    }
    .divider {
      width: 80px;
      height: 2px;
      background: #c8a84b;
      margin: 0 auto 32px;
    }
    .presented {
      font-size: 14px;
      color: #555;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 12px;
    }
    .student {
      font-size: 40px;
      color: #1a1a2e;
      font-style: italic;
      margin-bottom: 24px;
      border-bottom: 1px solid #ddd;
      padding-bottom: 16px;
    }
    .body-text {
      font-size: 16px;
      color: #444;
      line-height: 1.8;
      margin-bottom: 32px;
    }
    .event-name {
      font-size: 22px;
      font-weight: bold;
      color: #1a1a2e;
    }
    .meta {
      display: flex;
      justify-content: space-between;
      margin-top: 48px;
      font-size: 13px;
      color: #666;
    }
    .meta div { text-align: center; }
    .meta .line { border-top: 1px solid #999; padding-top: 8px; margin-top: 8px; min-width: 160px; }
    .code {
      margin-top: 24px;
      font-size: 12px;
      color: #aaa;
      letter-spacing: 2px;
    }
    @media print {
      body { background: white; }
      .cert { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="cert">
    <div class="org">CUET Carnival · Chittagong University of Engineering &amp; Technology</div>
    <div class="title">Certificate</div>
    <div class="subtitle">of Participation</div>
    <div class="divider"></div>
    <div class="presented">This is to certify that</div>
    <div class="student">${studentName}</div>
    <div class="body-text">
      has successfully participated in<br />
      <span class="event-name">${cert.eventTitle}</span><br />
      Category: ${cert.category} &nbsp;·&nbsp; Venue: ${cert.location}
    </div>
    <div class="meta">
      <div>
        <div class="line">${issuedDate}</div>
        <div>Date of Issue</div>
      </div>
      <div>
        <div class="line">${cert.organizerName}</div>
        <div>Event Organizer</div>
      </div>
    </div>
    <div class="code">${cert.certificateCode}</div>
  </div>
  <script>window.onload = function() { window.print(); }<\/script>
</body>
</html>`;

  const win = window.open("", "_blank", "width=960,height=720");
  if (!win) {
    alert("Please allow popups to download the certificate.");
    return;
  }
  win.document.write(html);
  win.document.close();
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentName, setStudentName] = useState("Student");

  useEffect(() => {
    async function load() {
      try {
        const [certRes, session] = await Promise.all([
          fetch(`${API_BASE_URL}/dashboard/certificates`, {
            credentials: "include",
            cache: "no-store",
          }),
          getAuthSession(),
        ]);

        if (session?.user?.name) setStudentName(session.user.name);

        if (!certRes.ok) {
          setError(certRes.status === 401 ? "Please login first." : "Failed to load certificates.");
          return;
        }
        const payload = await certRes.json();
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
          <h1 className="text-3xl font-bold">My Certificates</h1>
          <p className="text-muted-foreground">
            Certificates given to you by event organizers.
          </p>
        </div>

        {loading && <p className="text-muted-foreground">Loading…</p>}
        {error && <p className="text-destructive">{error}</p>}

        {!loading && !error && certificates.length === 0 && (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              <svg
                className="mx-auto mb-4 h-12 w-12 opacity-30"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                />
              </svg>
              <p className="font-medium">No certificates yet</p>
              <p className="mt-1 text-sm">
                Certificates are given by event organizers after you participate in an event.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {certificates.map((cert) => (
            <Card key={cert.id} className="overflow-hidden border-l-4 border-l-amber-500">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-snug">{cert.eventTitle}</CardTitle>
                  <span className="shrink-0 rounded-full bg-green-600 px-2 py-0.5 text-xs font-medium text-white dark:bg-green-500">
                    Given
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex gap-4 text-muted-foreground">
                  <span>{cert.category}</span>
                  <span>·</span>
                  <span>{cert.location}</span>
                </div>
                <div className="text-muted-foreground">
                  Given:{" "}
                  {new Date(cert.issuedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}{" "}
                  by{" "}
                  <span className="text-foreground font-medium">{cert.organizerName}</span>
                </div>
                <div className="font-mono text-xs text-muted-foreground">{cert.certificateCode}</div>
                <div className="pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => printCertificate(cert, studentName)}
                    className="gap-1.5"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Download PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

