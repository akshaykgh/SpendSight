import fs from "fs";
import { Readable } from "stream";
import csv from "csv-parser";

const parseAmount = (raw) => {
  if (raw === undefined || raw === null) return NaN;
  const normalized = String(raw)
    .replace(/[$,\s]/g, "")
    .replace(/^\((.*)\)$/, "-$1");
  return Number(normalized);
};

const parseDate = (value) => {
  if (!value) return null;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeHeader = (header) =>
  String(header || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const getValue = (row, keys) => {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return undefined;
};

const decodeCsvBuffer = (buffer) => {
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return buffer.slice(2).toString("utf16le");
  }
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return buffer.slice(3).toString("utf8");
  }
  return buffer.toString("utf8");
};

export const parseTransactionsCsv = (filePath) =>
  new Promise((resolve, reject) => {
    const rows = [];
    const fileBuffer = fs.readFileSync(filePath);
    const csvText = decodeCsvBuffer(fileBuffer);
    const firstLine = (csvText.split(/\r?\n/, 1)[0] || "").trim();
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semicolonCount = (firstLine.match(/;/g) || []).length;
    const separator = semicolonCount > commaCount ? ";" : ",";

    Readable.from([csvText])
      .pipe(csv({ separator, mapHeaders: ({ header }) => normalizeHeader(header) }))
      .on("data", (row) => {
        const date = parseDate(
          getValue(row, [
            "date",
            "transaction_date",
            "transactions_date",
            "posted_date",
            "timestamp",
          ]),
        );
        const description = String(
          getValue(row, [
            "description",
            "transactions_description",
            "merchant",
            "memo",
            "name",
          ]) ?? "",
        ).trim();
        const amount = parseAmount(
          getValue(row, [
            "amount",
            "transaction_amount",
            "transactions_amount",
            "debit",
            "value",
          ]),
        );

        if (!date || !description || !Number.isFinite(amount)) {
          return;
        }

        rows.push({
          date: date.toISOString(),
          description,
          amount,
        });
      })
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
