import jsPDF from "jspdf";
import { supabase } from "@/integrations/supabase/client";

export interface CertInput {
  recipientName: string;
  eventTitle: string;
  eventDate: string;
  certificateType: "participant" | "winner" | "organizer" | "volunteer";
  organizerName?: string;
}

export function generateCertificatePdf(input: CertInput): Blob {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  // Background border
  doc.setDrawColor(108, 123, 255);
  doc.setLineWidth(8);
  doc.rect(20, 20, w - 40, h - 40);
  doc.setLineWidth(2);
  doc.rect(35, 35, w - 70, h - 70);

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(36);
  doc.setTextColor(40, 40, 60);
  doc.text("Certificate of " + capitalize(input.certificateType), w / 2, 130, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(120);
  doc.text("This is proudly presented to", w / 2, 175, { align: "center" });

  // Recipient
  doc.setFont("helvetica", "bold");
  doc.setFontSize(40);
  doc.setTextColor(108, 123, 255);
  doc.text(input.recipientName, w / 2, 240, { align: "center" });

  // Description
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(80);
  const desc = `for ${input.certificateType === "winner" ? "winning" : "successfully participating in"}`;
  doc.text(desc, w / 2, 285, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(40, 40, 60);
  doc.text(input.eventTitle, w / 2, 325, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(120);
  doc.text(`held on ${new Date(input.eventDate).toLocaleDateString("en-US", { dateStyle: "long" })}`, w / 2, 355, { align: "center" });

  // Footer
  doc.setFontSize(11);
  doc.text(input.organizerName || "Collabio", w / 2, h - 70, { align: "center" });
  doc.setFontSize(9);
  doc.setTextColor(160);
  doc.text("Issued via Collabio Events", w / 2, h - 55, { align: "center" });

  return doc.output("blob");
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export async function uploadAndRecordCertificate(opts: {
  eventId: string;
  userId: string;
  type: CertInput["certificateType"];
  blob: Blob;
  issuedBy: string;
}) {
  const path = `${opts.eventId}/${opts.userId}-${opts.type}-${Date.now()}.pdf`;
  const { error: upErr } = await supabase.storage.from("certificates").upload(path, opts.blob, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (upErr) throw upErr;
  const { data: pub } = supabase.storage.from("certificates").getPublicUrl(path);
  const { error: dbErr } = await supabase.from("event_certificates").insert({
    event_id: opts.eventId,
    user_id: opts.userId,
    certificate_type: opts.type,
    certificate_url: pub.publicUrl,
    issued_by: opts.issuedBy,
  });
  if (dbErr) throw dbErr;
  return pub.publicUrl;
}
