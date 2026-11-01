import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

import { type BillLine, type BillMeta } from "./estimate-store";

const MM = 72 / 25.4;
const PAGE_W = 176 * MM; // B5 portrait: 176mm x 250mm
const PAGE_H = 250 * MM;
const MARGIN = 10 * MM;
const CONTENT_W = PAGE_W - MARGIN * 2;
const ROW_H = 15;
const BLACK = rgb(0, 0, 0);
const GREY_BG = rgb(0.92, 0.92, 0.92);

function sanitize(input: string): string {
  return input
    .replace(/[—–]/g, "-")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\u00A0/g, " ")
    .split("")
    .filter((ch) => ch.charCodeAt(0) <= 255)
    .join("");
}

function fmt(value: number): string {
  return new Intl.NumberFormat("en-PK", { maximumFractionDigits: 2 }).format(value);
}

function fit(text: string, font: PDFFont, size: number, maxWidth: number): string {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
  let out = text;
  while (out.length > 1 && font.widthOfTextAtSize(`${out}…`, size) > maxWidth) {
    out = out.slice(0, -1);
  }
  return `${out}…`;
}

export type BillPdfInput = {
  meta: BillMeta;
  lines: BillLine[];
  subtotal: number;
  discount: number;
  discountLabel: string | null;
  total: number;
  received: number;
  balance: number;
};

export async function buildBillPdf(input: BillPdfInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(sanitize(`Estimate Bill ${input.meta.billNo}`));
  doc.setAuthor("Plaza Steel & Crockery");

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let logo: Awaited<ReturnType<typeof doc.embedPng>> | null = null;
  try {
    const res = await fetch("/logo-plaza.png");
    if (res.ok) logo = await doc.embedPng(await res.arrayBuffer());
  } catch {
    /* logo optional */
  }

  const draw = (
    page: PDFPage,
    text: string,
    x: number,
    y: number,
    size: number,
    f: PDFFont = font,
    align: "left" | "right" | "center" = "left",
  ) => {
    const clean = sanitize(text);
    const width = f.widthOfTextAtSize(clean, size);
    const px = align === "right" ? x - width : align === "center" ? x - width / 2 : x;
    page.drawText(clean, { x: px, y, size, font: f, color: BLACK });
  };

  let page = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  const drawSheetHeader = () => {
    const leftX = logo ? MARGIN + 44 : MARGIN;
    if (logo) {
      page.drawImage(logo, { x: MARGIN, y: y - 42, width: 38, height: 38 });
    }
    draw(page, "PLAZA STEEL & CROCKERY", leftX, y - 14, 14, bold);
    draw(page, "WhatsApp: +92 546501637", leftX, y - 27, 8);
    draw(page, "ESTIMATE BILL", MARGIN + CONTENT_W, y - 12, 12, bold, "right");
    draw(page, `Bill No: ${input.meta.billNo || "-"}`, MARGIN + CONTENT_W, y - 25, 8, font, "right");
    draw(page, `Date: ${input.meta.date || "-"}`, MARGIN + CONTENT_W, y - 36, 8, font, "right");
    y -= 48;
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: MARGIN + CONTENT_W, y },
      thickness: 1.2,
      color: BLACK,
    });
    y -= 10;
  };

  drawSheetHeader();

  // Customer block
  const customer = input.meta;
  const customerLines = [
    customer.customerName ? `Customer: ${customer.customerName}` : null,
    customer.customerPhone ? `Number: ${customer.customerPhone}` : null,
    customer.customerAddress ? `Address: ${customer.customerAddress}` : null,
  ].filter(Boolean) as string[];
  if (customerLines.length > 0) {
    customerLines.forEach((line, index) => {
      draw(page, line, MARGIN, y - index * 11, 8.5, index === 0 ? bold : font);
    });
    y -= customerLines.length * 11 + 4;
  }

  // Table geometry
  const wHash = 16;
  const wUnit = 38;
  const wQty = 44;
  const wRate = 58;
  const wAmount = 68;
  const wItem = CONTENT_W - (wHash + wUnit + wQty + wRate + wAmount);
  const xItem = MARGIN + wHash;
  const xUnit = xItem + wItem;
  const xQty = xUnit + wUnit;
  const xRate = xQty + wQty;
  const xAmount = xRate + wRate;
  const xEnd = MARGIN + CONTENT_W;

  const drawTableHeader = () => {
    page.drawRectangle({
      x: MARGIN,
      y: y - ROW_H,
      width: CONTENT_W,
      height: ROW_H,
      color: GREY_BG,
      borderColor: BLACK,
      borderWidth: 0.6,
    });
    draw(page, "#", MARGIN + wHash / 2, y - 11, 7.5, bold, "center");
    draw(page, "ITEM", xItem + 3, y - 11, 7.5, bold);
    draw(page, "UNIT", xUnit + wUnit / 2, y - 11, 7.5, bold, "center");
    draw(page, "QTY", xQty + wQty / 2, y - 11, 7.5, bold, "center");
    draw(page, "RATE", xRate + wRate / 2, y - 11, 7.5, bold, "center");
    draw(page, "AMOUNT", xAmount + wAmount / 2, y - 11, 7.5, bold, "center");
    y -= ROW_H;
  };

  drawTableHeader();

  input.lines.forEach((line, index) => {
    if (y - ROW_H < MARGIN + 70) {
      // close off current page and start a new one
      page.drawLine({
        start: { x: MARGIN, y },
        end: { x: xEnd, y },
        thickness: 0.6,
        color: BLACK,
      });
      page = doc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
      draw(page, "PLAZA STEEL & CROCKERY (continued)", MARGIN, y - 10, 10, bold);
      draw(
        page,
        `Bill No: ${input.meta.billNo || "-"}`,
        xEnd,
        y - 10,
        8,
        font,
        "right",
      );
      y -= 20;
      drawTableHeader();
    }

    page.drawRectangle({
      x: MARGIN,
      y: y - ROW_H,
      width: CONTENT_W,
      height: ROW_H,
      borderColor: BLACK,
      borderWidth: 0.4,
    });
    draw(page, String(index + 1), MARGIN + wHash / 2, y - 10.5, 8, font, "center");
    draw(
      page,
      fit(`${line.name}${line.code ? ` (${line.code})` : ""}`, font, 8, wItem - 6),
      xItem + 3,
      y - 10.5,
      8,
    );
    draw(page, line.unit || "Pcs", xUnit + wUnit / 2, y - 10.5, 8, font, "center");
    draw(page, fmt(line.qty), xQty + wQty / 2, y - 10.5, 8, font, "center");
    draw(page, fmt(line.unitPrice), xRate + wRate - 3, y - 10.5, 8, font, "right");
    draw(page, fmt(line.unitPrice * line.qty), xAmount + wAmount - 3, y - 10.5, 8, font, "right");
    y -= ROW_H;
  });
  page.drawLine({ start: { x: MARGIN, y }, end: { x: xEnd, y }, thickness: 0.6, color: BLACK });

  // Totals block, right aligned
  y -= 14;
  const totalsX = xEnd - 190;
  const totalRow = (label: string, value: string, opts: { bold?: boolean; size?: number } = {}) => {
    draw(page, label, totalsX, y, opts.size ?? 8.5, opts.bold ? bold : font);
    draw(page, value, xEnd, y, opts.size ?? 8.5, opts.bold ? bold : font, "right");
    y -= 13;
  };
  totalRow("Subtotal", `Rs ${fmt(input.subtotal)}`);
  if (input.discount > 0 && input.discountLabel) {
    totalRow(input.discountLabel, `- Rs ${fmt(input.discount)}`);
  }
  page.drawLine({ start: { x: totalsX, y: y + 6 }, end: { x: xEnd, y: y + 6 }, thickness: 1, color: BLACK });
  totalRow("TOTAL", `Rs ${fmt(input.total)}`, { bold: true, size: 11 });
  if (input.received > 0) {
    totalRow("Received", `Rs ${fmt(input.received)}`);
    totalRow("Balance", `Rs ${fmt(input.balance)}`);
  }

  if (input.meta.notes) {
    y -= 4;
    draw(page, fit(`Note: ${input.meta.notes}`, font, 8.5, CONTENT_W), MARGIN, y, 8.5);
  }

  // Footer pinned to the bottom of the last page
  const footerY = MARGIN + 14;
  page.drawLine({
    start: { x: MARGIN, y: footerY + 12 },
    end: { x: xEnd, y: footerY + 12 },
    thickness: 0.5,
    color: BLACK,
  });
  draw(
    page,
    "Shukriya! Plaza Steel & Crockery - WhatsApp +92 546501637",
    PAGE_W / 2,
    footerY,
    7.5,
    font,
    "center",
  );

  return doc.save();
}
